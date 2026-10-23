const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
const acorn = require('acorn');
const walk = require('acorn-walk');

// Node.js standard built-in modules
const NODE_STDLIB = new Set([
  'assert', 'async_hooks', 'buffer', 'child_process', 'cluster', 'console',
  'constants', 'crypto', 'dgram', 'diagnostics_channel', 'dns', 'domain',
  'events', 'fs', 'fs/promises', 'http', 'http2', 'https', 'inspector',
  'module', 'net', 'os', 'path', 'perf_hooks', 'process', 'punycode',
  'querystring', 'readline', 'repl', 'stream', 'stream/promises', 'stream/web',
  'string_decoder', 'timers', 'timers/promises', 'tls', 'trace_events', 'tty',
  'url', 'util', 'v8', 'vm', 'wasi', 'worker_threads', 'zlib'
]);

/**
 * Helper to calculate line and column number from string index
 */
function getLineAndColumn(content, index) {
  const lines = content.substring(0, index).split('\n');
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1
  };
}

/**
 * Recursively walk directory and gather files
 */
function scanDirectory(dir, baseDir = dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

    // Skip ignored directories
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'build', '.next', '__pycache__', 'venv', '.venv'].includes(entry.name)) {
        continue;
      }
      scanDirectory(fullPath, baseDir, fileList);
    } else {
      fileList.push({
        fullPath,
        relPath,
        name: entry.name,
        ext: path.extname(entry.name).toLowerCase()
      });
    }
  }
  return fileList;
}

/**
 * Main Rule-Based Static Analysis & Deployment Risk Predictor
 */
function analyzeProjectFiles(extractedDir, projectPlatform = 'Docker') {
  const files = scanDirectory(extractedDir);
  const findings = [];
  const passedChecks = [];
  
  const detectedStack = {
    languages: new Set(),
    frameworks: new Set(),
    hasDockerfile: false,
    hasCompose: false,
    hasEnv: false,
    hasPackageJson: false,
    hasRequirements: false,
    totalFilesScanned: files.length
  };

  // Maps & sets for cross-file validation
  const declaredDependencies = new Set();
  const declaredDevDependencies = new Set();
  const importedPackages = new Map(); // pkgName -> { file, line, originalCode }
  const definedEnvVars = new Set();
  const referencedEnvVars = new Map(); // varName -> { file, line, originalCode }
  let packageJsonData = null;
  let hasDockerignore = false;
  let hasHealthEndpoint = false;

  // 1. First pass: detect manifests and environment definitions
  for (const f of files) {
    if (f.name === 'package.json') {
      detectedStack.hasPackageJson = true;
      detectedStack.languages.add('JavaScript');
      try {
        const raw = fs.readFileSync(f.fullPath, 'utf8');
        packageJsonData = JSON.parse(raw);
        if (packageJsonData.dependencies) {
          Object.keys(packageJsonData.dependencies).forEach(d => declaredDependencies.add(d));
        }
        if (packageJsonData.devDependencies) {
          Object.keys(packageJsonData.devDependencies).forEach(d => declaredDevDependencies.add(d));
        }

        // Framework detection from dependencies
        const allDeps = { ...(packageJsonData.dependencies || {}), ...(packageJsonData.devDependencies || {}) };
        if (allDeps.express) detectedStack.frameworks.add('Express.js');
        if (allDeps.react) detectedStack.frameworks.add('React');
        if (allDeps.next) detectedStack.frameworks.add('Next.js');
        if (allDeps.vue) detectedStack.frameworks.add('Vue.js');
        if (allDeps['@nestjs/core']) detectedStack.frameworks.add('NestJS');
        if (allDeps.fastify) detectedStack.frameworks.add('Fastify');
        if (allDeps.mongoose) detectedStack.frameworks.add('MongoDB/Mongoose');
        if (allDeps.pg || allDeps.sequelize || allDeps['typeorm']) detectedStack.frameworks.add('PostgreSQL/SQL');
      } catch (err) {
        findings.push({
          title: 'Syntax Error in package.json',
          file: f.relPath,
          line: 1,
          severity: 'Critical',
          category: 'Syntax',
          type: 'Confirmed Error',
          why: `package.json is malformed JSON: ${err.message}`,
          impact: 'Node package manager (npm/yarn/pnpm) will fail immediately during docker build or CI/CD.',
          solution: 'Ensure package.json has valid JSON syntax without trailing commas or unquoted keys.',
          originalCode: err.message,
          suggestedFix: '{\n  "name": "project",\n  "version": "1.0.0"\n}'
        });
      }
    }

    if (f.name === 'requirements.txt' || f.name === 'Pipfile' || f.name === 'pyproject.toml') {
      detectedStack.hasRequirements = true;
      detectedStack.languages.add('Python');
    }

    if (f.name.startsWith('.env')) {
      detectedStack.hasEnv = true;
      try {
        const envContent = fs.readFileSync(f.fullPath, 'utf8');
        envContent.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const eqIndex = trimmed.indexOf('=');
            if (eqIndex > 0) {
              const varName = trimmed.substring(0, eqIndex).trim();
              definedEnvVars.add(varName);
            }
          }
        });
      } catch (e) {
        // ignore read error
      }
    }

    if (f.name === 'Dockerfile') detectedStack.hasDockerfile = true;
    if (f.name === '.dockerignore') hasDockerignore = true;
    if (f.name === 'docker-compose.yml' || f.name === 'docker-compose.yaml') detectedStack.hasCompose = true;
    if (f.ext === '.ts' || f.ext === '.tsx') detectedStack.languages.add('TypeScript');
    if (f.ext === '.java') detectedStack.languages.add('Java');
    if (f.ext === '.go') detectedStack.languages.add('Go');
  }

  // 2. Validate package.json configuration
  if (packageJsonData) {
    if (!packageJsonData.scripts || !packageJsonData.scripts.start) {
      // If it's a backend or server app, missing start script causes container failure
      findings.push({
        title: 'Missing "start" script in package.json',
        file: 'package.json',
        line: 1,
        severity: 'High',
        category: 'Configuration',
        type: 'Predicted Risk',
        why: 'package.json does not define a `"start"` script.',
        impact: 'Standard container runners, Heroku, AWS Elastic Beanstalk, and Docker default CMD ["npm", "start"] will crash on launch with code 127.',
        solution: 'Add a start script under "scripts": { "start": "node index.js" } or your entrypoint file.',
        originalCode: '"scripts": {\n  "test": "echo \\"Error: no test specified\\" && exit 1"\n}',
        suggestedFix: '"scripts": {\n  "start": "node server.js",\n  "test": "echo \\"Error: no test specified\\" && exit 1"\n}'
      });
    } else {
      passedChecks.push('package.json defines a valid "start" script');
    }

    // Check for wildcard / unpinned dependencies
    if (packageJsonData.dependencies) {
      for (const [pkg, ver] of Object.entries(packageJsonData.dependencies)) {
        if (ver === '*' || ver === 'latest' || ver === '') {
          findings.push({
            title: `Unpinned / Wildcard Dependency: "${pkg}": "${ver}"`,
            file: 'package.json',
            line: 1,
            severity: 'Medium',
            category: 'Dependency',
            type: 'Predicted Risk',
            why: `The dependency "${pkg}" is declared with "${ver}", allowing arbitrary new versions to be installed during deployment.`,
            impact: 'Deployments are non-deterministic; unexpected major upstream breaking changes will break production builds without code changes.',
            solution: `Pin the dependency to a specific version or range, e.g. "^1.0.0" or "~1.0.0".`,
            originalCode: `"${pkg}": "${ver}"`,
            suggestedFix: `"${pkg}": "^1.0.0"`
          });
        }
      }
    }
  }

  // 3. Scan code files (JavaScript, TypeScript, Python, Dockerfile, etc.)
  for (const f of files) {
    if (['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx'].includes(f.ext)) {
      let code = '';
      try {
        code = fs.readFileSync(f.fullPath, 'utf8');
      } catch (err) {
        continue;
      }

      const lines = code.split('\n');

      // Check Acorn syntax for JS
      if (['.js', '.mjs', '.cjs'].includes(f.ext)) {
        try {
          const ast = acorn.parse(code, {
            ecmaVersion: 'latest',
            sourceType: 'module',
            locations: true
          });

          walk.simple(ast, {
            ImportDeclaration(node) {
              if (node.source && typeof node.source.value === 'string') {
                const src = node.source.value;
                if (!src.startsWith('.') && !src.startsWith('/')) {
                  const rootPkg = src.startsWith('@') ? src.split('/').slice(0, 2).join('/') : src.split('/')[0];
                  if (!importedPackages.has(rootPkg)) {
                    importedPackages.set(rootPkg, {
                      file: f.relPath,
                      line: node.loc.start.line,
                      originalCode: lines[node.loc.start.line - 1] || ''
                    });
                  }
                }
              }
            },
            CallExpression(node) {
              if (node.callee && node.callee.name === 'require' && node.arguments.length > 0) {
                const arg = node.arguments[0];
                if (arg.type === 'Literal' && typeof arg.value === 'string') {
                  const src = arg.value;
                  if (!src.startsWith('.') && !src.startsWith('/')) {
                    const rootPkg = src.startsWith('@') ? src.split('/').slice(0, 2).join('/') : src.split('/')[0];
                    if (!importedPackages.has(rootPkg)) {
                      importedPackages.set(rootPkg, {
                        file: f.relPath,
                        line: node.loc.start.line,
                        originalCode: lines[node.loc.start.line - 1] || ''
                      });
                    }
                  }
                }
              }
            }
          });
        } catch (syntaxErr) {
          // If acorn fails on modern JSX or export, check line syntax
          if (!f.ext.includes('x')) {
            findings.push({
              title: `JavaScript Syntax Error: ${syntaxErr.message.split('(')[0].trim()}`,
              file: f.relPath,
              line: syntaxErr.loc ? syntaxErr.loc.line : 1,
              severity: 'Critical',
              category: 'Syntax',
              type: 'Confirmed Error',
              why: `Failed to parse JavaScript syntax at line ${syntaxErr.loc ? syntaxErr.loc.line : 1}: ${syntaxErr.message}`,
              impact: 'Application will throw a SyntaxError and terminate execution immediately on startup in production.',
              solution: `Inspect ${f.relPath} around line ${syntaxErr.loc ? syntaxErr.loc.line : 1} and correct syntax errors.`,
              originalCode: lines[(syntaxErr.loc ? syntaxErr.loc.line : 1) - 1] || '',
              suggestedFix: '// Fix syntax error'
            });
          }
        }
      }

      // Line-by-line inspection for ports, envs, hardcoded secrets, health checks
      lines.forEach((line, idx) => {
        const lineNum = idx + 1;
        const trimmed = line.trim();

        // Detect health endpoints
        if (line.includes('/health') || line.includes('/healthz') || line.includes('/ping') || line.includes('/api/status')) {
          hasHealthEndpoint = true;
        }

        // Detect process.env references
        const envMatches = line.matchAll(/process\.env\.([A-Z0-9_]+)/g);
        for (const match of envMatches) {
          const varName = match[1];
          if (!['NODE_ENV'].includes(varName) && !referencedEnvVars.has(varName)) {
            referencedEnvVars.set(varName, {
              file: f.relPath,
              line: lineNum,
              originalCode: trimmed
            });
          }
        }

        // Port binding check: app.listen(3000) or listen(5000) without process.env.PORT
        const portHardcoded = line.match(/\.listen\(\s*(\d{2,5})\s*[,)]/);
        if (portHardcoded && !line.includes('process.env.PORT') && !line.includes('PORT')) {
          findings.push({
            title: `Hardcoded Port in Server Listen (${portHardcoded[1]})`,
            file: f.relPath,
            line: lineNum,
            severity: 'High',
            category: 'Port',
            type: 'Predicted Risk',
            why: `Server is listening on fixed port ${portHardcoded[1]} rather than binding to process.env.PORT.`,
            impact: 'Cloud platforms (AWS Beanstalk, Heroku, Azure App Service, Cloud Run) assign dynamic ports. Hardcoded ports prevent traffic routing and cause deployment timeouts.',
            solution: `Use process.env.PORT: const PORT = process.env.PORT || ${portHardcoded[1]}; app.listen(PORT, ...);`,
            originalCode: trimmed,
            suggestedFix: `const PORT = process.env.PORT || ${portHardcoded[1]};\napp.listen(PORT, () => console.log(\`Server listening on port \${PORT}\`));`
          });
        }

        // Localhost/127.0.0.1 binding in server
        if (line.includes("127.0.0.1") && (line.includes("listen") || line.includes("host") || line.includes("bind"))) {
          findings.push({
            title: 'Server Bound to Loopback (127.0.0.1)',
            file: f.relPath,
            line: lineNum,
            severity: 'High',
            category: 'Port',
            type: 'Predicted Risk',
            why: "The server explicitly binds to '127.0.0.1' instead of '0.0.0.0'.",
            impact: "Inside Docker, ECS, or Kubernetes, traffic from container ingress/reverse proxy cannot reach the app because loopback only accepts internal container requests.",
            solution: "Bind the server to '0.0.0.0' or omit the host argument to default to all interfaces.",
            originalCode: trimmed,
            suggestedFix: trimmed.replace(/127\.0\.0\.1/g, '0.0.0.0')
          });
        }

        // Hardcoded AWS Keys
        if (/AKIA[0-9A-Z]{16}/.test(line)) {
          findings.push({
            title: 'Hardcoded AWS Access Key ID Detected',
            file: f.relPath,
            line: lineNum,
            severity: 'Critical',
            category: 'Security',
            type: 'Confirmed Error',
            why: 'Direct AWS Access Key ID found in source code.',
            impact: 'Severe security hazard. Exposing credentials leads to AWS account compromise and automated bots abusing resources within minutes.',
            solution: 'Remove credentials from code immediately. Use AWS IAM Instance Profiles or inject AWS_ACCESS_KEY_ID via environment variables.',
            originalCode: trimmed,
            suggestedFix: 'const accessKeyId = process.env.AWS_ACCESS_KEY_ID;'
          });
        }

        // Hardcoded Database Passwords / Connection URIs
        if (/(mongodb(\+srv)?|postgres|mysql):\/\/[a-zA-Z0-9_\-\.]+:[a-zA-Z0-9_@!#$%&*]+@/i.test(line)) {
          findings.push({
            title: 'Hardcoded Database Credentials in URI',
            file: f.relPath,
            line: lineNum,
            severity: 'Critical',
            category: 'Security',
            type: 'Confirmed Error',
            why: 'Database connection string contains hardcoded credentials in plain text.',
            impact: 'Database passwords committed to source code can be extracted by unauthorized parties or leaked in production artifact traces.',
            solution: 'Extract the database URI to an environment variable: process.env.MONGODB_URI or process.env.DATABASE_URL.',
            originalCode: trimmed,
            suggestedFix: 'const dbUri = process.env.DATABASE_URL || process.env.MONGODB_URI;'
          });
        }

        // Hardcoded JWT Secret / API Secret
        if (/(jwt_secret|jwtSecret|secretKey|apiSecret)\s*=\s*['"][a-zA-Z0-9_\-\@\#\$]{6,}['"]/i.test(line)) {
          findings.push({
            title: 'Hardcoded JWT or API Secret in Source Code',
            file: f.relPath,
            line: lineNum,
            severity: 'High',
            category: 'Security',
            type: 'Predicted Risk',
            why: 'Sensitive cryptographic secret or API key appears hardcoded in source file.',
            impact: 'Attackers can forge authentication tokens or impersonate system users.',
            solution: 'Store the secret in environment variables: process.env.JWT_SECRET.',
            originalCode: trimmed,
            suggestedFix: 'const JWT_SECRET = process.env.JWT_SECRET;'
          });
        }

        // CORS wildcard with credentials
        if (line.includes("credentials: true") && (line.includes("origin: '*'") || line.includes("origin: \"*\""))) {
          findings.push({
            title: 'Insecure CORS: Wildcard Origin with Credentials',
            file: f.relPath,
            line: lineNum,
            severity: 'High',
            category: 'Security',
            type: 'Predicted Risk',
            why: "Access-Control-Allow-Origin cannot be '*' when Access-Control-Allow-Credentials is true according to the W3C CORS specification.",
            impact: "Modern web browsers will reject CORS preflight responses and block all API calls from the client.",
            solution: "Specify an explicit origin or whitelist array instead of '*'.",
            originalCode: trimmed,
            suggestedFix: "cors({ origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000', credentials: true })"
          });
        }
      });
    }

    // 4. Dockerfile validation
    if (f.name === 'Dockerfile') {
      try {
        const dockerContent = fs.readFileSync(f.fullPath, 'utf8');
        const dockerLines = dockerContent.split('\n');

        let hasExpose = false;
        let hasCmd = false;
        let hasWorkdir = false;
        let hasNonRootUser = false;
        let hasCopyAll = false;

        dockerLines.forEach((line, idx) => {
          const trimmed = line.trim();
          const upper = trimmed.toUpperCase();

          if (upper.startsWith('EXPOSE')) hasExpose = true;
          if (upper.startsWith('CMD') || upper.startsWith('ENTRYPOINT')) hasCmd = true;
          if (upper.startsWith('WORKDIR')) hasWorkdir = true;
          if (upper.startsWith('USER')) hasNonRootUser = true;
          if (upper.startsWith('COPY . .') || upper.startsWith('COPY . /') || upper.startsWith('ADD . .')) hasCopyAll = true;

          // Check for ADD instead of COPY for local files
          if (upper.startsWith('ADD ') && !trimmed.includes('http://') && !trimmed.includes('https://') && !trimmed.includes('.tar')) {
            findings.push({
              title: 'Use COPY Instead of ADD in Dockerfile',
              file: f.relPath,
              line: idx + 1,
              severity: 'Low',
              category: 'Docker',
              type: 'Predicted Risk',
              why: "Docker best practices discourage using 'ADD' for local files because it has unexpected tar extraction behaviors.",
              impact: 'Suboptimal container caching and potential unwanted file extractions.',
              solution: "Replace 'ADD' with 'COPY'.",
              originalCode: trimmed,
              suggestedFix: trimmed.replace(/^ADD/i, 'COPY')
            });
          }
        });

        if (!hasExpose) {
          findings.push({
            title: 'Missing EXPOSE Instruction in Dockerfile',
            file: f.relPath,
            line: 1,
            severity: 'Medium',
            category: 'Docker',
            type: 'Predicted Risk',
            why: 'No EXPOSE statement was found in the Dockerfile.',
            impact: 'Documentation and container platforms like AWS ECS, Portainer, or Kubernetes may fail to discover the container listening port automatically.',
            solution: 'Add `EXPOSE 3000` or the port your application listens on.',
            originalCode: '# Dockerfile missing EXPOSE',
            suggestedFix: 'EXPOSE 3000'
          });
        } else {
          passedChecks.push('Dockerfile includes explicit EXPOSE directive');
        }

        if (!hasCmd) {
          findings.push({
            title: 'Missing CMD or ENTRYPOINT in Dockerfile',
            file: f.relPath,
            line: 1,
            severity: 'Critical',
            category: 'Docker',
            type: 'Confirmed Error',
            why: 'Dockerfile does not specify CMD or ENTRYPOINT to execute the application.',
            impact: 'The container will start and immediately exit with code 0 because no process keeps it alive.',
            solution: 'Add CMD ["node", "server.js"] or appropriate startup command at the end of Dockerfile.',
            originalCode: '# Dockerfile without CMD',
            suggestedFix: 'CMD ["node", "server.js"]'
          });
        } else {
          passedChecks.push('Dockerfile specifies application entrypoint/CMD');
        }

        if (!hasWorkdir) {
          findings.push({
            title: 'Missing WORKDIR in Dockerfile',
            file: f.relPath,
            line: 1,
            severity: 'Medium',
            category: 'Docker',
            type: 'Predicted Risk',
            why: 'Files are copied directly to root filesystem without a dedicated WORKDIR.',
            impact: 'Can cause path resolution errors, permission issues, or overwrite system binaries.',
            solution: 'Set `WORKDIR /app` before copying files.',
            originalCode: 'COPY . /',
            suggestedFix: 'WORKDIR /usr/src/app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\n'
          });
        }

        if (hasCopyAll && !hasDockerignore) {
          findings.push({
            title: 'Missing .dockerignore File with `COPY . .`',
            file: 'Dockerfile',
            line: 1,
            severity: 'High',
            category: 'Docker',
            type: 'Predicted Risk',
            why: 'Dockerfile copies the entire context (`COPY . .`) but no `.dockerignore` file exists.',
            impact: 'Local `node_modules`, `.env`, temporary logs, and `.git` folders will be copied into the container. This causes bloated image sizes (GBs) and risks leaking secrets!',
            solution: 'Create a `.dockerignore` file excluding `node_modules`, `.git`, `.env`, and `dist`.',
            originalCode: 'COPY . .',
            suggestedFix: '# Create .dockerignore:\nnode_modules\n.git\n.env\n*.log\ndist\nbuild'
          });
        }

      } catch (err) {
        // Read error
      }
    }

    // 5. Docker Compose validation
    if (f.name === 'docker-compose.yml' || f.name === 'docker-compose.yaml') {
      try {
        const yamlContent = fs.readFileSync(f.fullPath, 'utf8');
        const doc = yaml.parse(yamlContent);
        if (!doc || !doc.services) {
          findings.push({
            title: 'Invalid docker-compose.yml: Missing Services',
            file: f.relPath,
            line: 1,
            severity: 'High',
            category: 'Docker',
            type: 'Confirmed Error',
            why: "docker-compose file does not contain a top-level 'services' block.",
            impact: "docker-compose up will fail to launch any containers.",
            solution: "Define at least one service under `services:`.",
            originalCode: yamlContent.substring(0, 100),
            suggestedFix: "version: '3.8'\nservices:\n  app:\n    build: .\n    ports:\n      - '3000:3000'"
          });
        } else {
          passedChecks.push('docker-compose.yml structure is syntactically valid');
        }
      } catch (yamlErr) {
        findings.push({
          title: `YAML Indentation/Syntax Error in ${f.name}`,
          file: f.relPath,
          line: yamlErr.linePos ? yamlErr.linePos[0].line : 1,
          severity: 'Critical',
          category: 'Syntax',
          type: 'Confirmed Error',
          why: `Invalid YAML formatting: ${yamlErr.message}`,
          impact: "Docker compose, AWS CloudFormation, or Kubernetes will fail parsing configuration.",
          solution: "Fix YAML indentation (use 2 spaces, no tabs).",
          originalCode: yamlErr.message,
          suggestedFix: "version: '3.8'\nservices:\n  web:\n    build: ."
        });
      }
    }
  }

  // 6. Cross-reference imported packages with declared dependencies
  if (detectedStack.hasPackageJson) {
    for (const [pkg, meta] of importedPackages.entries()) {
      if (!NODE_STDLIB.has(pkg)) {
        if (!declaredDependencies.has(pkg) && !declaredDevDependencies.has(pkg)) {
          findings.push({
            title: `Missing Dependency in package.json: "${pkg}"`,
            file: meta.file,
            line: meta.line,
            severity: 'Critical',
            category: 'Dependency',
            type: 'Confirmed Error',
            why: `Package '${pkg}' is imported in '${meta.file}' but is not declared in package.json.`,
            impact: `During 'npm install' in production, '${pkg}' will not be installed. The application will crash on boot with 'Error: Cannot find module "${pkg}"'.`,
            solution: `Run \`npm install ${pkg}\` to add it to your project dependencies.`,
            originalCode: meta.originalCode,
            suggestedFix: `// Add "${pkg}" to package.json dependencies, or run: npm install ${pkg}`
          });
        }
      }
    }
  }

  // 7. Cross-reference referenced env vars with defined env vars
  if (definedEnvVars.size > 0) {
    for (const [envVar, meta] of referencedEnvVars.entries()) {
      if (!definedEnvVars.has(envVar)) {
        findings.push({
          title: `Missing Environment Variable Definition: ${envVar}`,
          file: meta.file,
          line: meta.line,
          severity: 'Medium',
          category: 'Configuration',
          type: 'Predicted Risk',
          why: `Environment variable '${envVar}' is referenced in '${meta.file}' but was not defined in any .env or .env.example file.`,
          impact: 'In production, this variable will evaluate to `undefined`, potentially leading to runtime crashes, blank database connections, or auth failures.',
          solution: `Add '${envVar}=your_value_here' to .env.example and configure it in your cloud provider environment settings.`,
          originalCode: meta.originalCode,
          suggestedFix: `# In .env.example:\n${envVar}=<your_${envVar.toLowerCase()}_value>`
        });
      }
    }
  } else if (referencedEnvVars.size > 0 && !detectedStack.hasEnv) {
    findings.push({
      title: 'Missing .env.example / Environment Template',
      file: 'root',
      line: 1,
      severity: 'Medium',
      category: 'Configuration',
      type: 'Predicted Risk',
      why: `Project references ${referencedEnvVars.size} environment variables in code, but provides no .env.example template.`,
      impact: 'DevOps engineers and automated CI/CD pipelines will not know which environment variables need to be provisioned before launching.',
      solution: 'Create a .env.example file documenting all required environment variables.',
      originalCode: 'No .env.example found',
      suggestedFix: Array.from(referencedEnvVars.keys()).map(k => `${k}=`).join('\n')
    });
  }

  // 8. AWS & Platform-specific checks
  if (projectPlatform === 'AWS' || projectPlatform === 'Docker') {
    if (!hasHealthEndpoint && detectedStack.languages.has('JavaScript')) {
      findings.push({
        title: 'Missing Health Check Endpoint (/health)',
        file: 'server',
        line: 1,
        severity: 'Medium',
        category: 'AWS',
        type: 'Predicted Risk',
        why: 'No `/health` or `/ping` endpoint detected in server routes.',
        impact: 'AWS Application Load Balancers (ALB) and container orchestrators periodically poll a health check path. Without one, the ALB may flag instances as unhealthy and terminate them.',
        solution: 'Implement a lightweight health check endpoint returning HTTP 200 OK.',
        originalCode: '// Missing health route',
        suggestedFix: "app.get('/health', (req, res) => res.status(200).json({ status: 'ok', uptime: process.uptime() }));"
      });
    } else if (hasHealthEndpoint) {
      passedChecks.push('Application includes health check endpoint for cloud load balancers');
    }

    if (projectPlatform === 'AWS' && !detectedStack.hasDockerfile) {
      const hasBuildspec = files.some(f => f.name === 'buildspec.yml' || f.name === 'Procfile');
      if (!hasBuildspec) {
        findings.push({
          title: 'Missing AWS Deployment Descriptor (Procfile / buildspec.yml)',
          file: 'root',
          line: 1,
          severity: 'Medium',
          category: 'AWS',
          type: 'Predicted Risk',
          why: 'Project targets AWS deployment but lacks a Procfile (for Elastic Beanstalk) or buildspec.yml (for AWS CodeBuild).',
          impact: 'AWS Elastic Beanstalk may fail to determine how to run the application.',
          solution: 'Add a `Procfile` containing `web: npm start` for Elastic Beanstalk.',
          originalCode: '# No Procfile found',
          suggestedFix: 'web: npm start'
        });
      }
    }
  }

  // Passed validation checks summary
  if (detectedStack.hasPackageJson && packageJsonData) {
    passedChecks.push('package.json manifest present and valid JSON');
  }
  if (detectedStack.hasDockerfile) {
    passedChecks.push('Dockerfile present for containerized deployment');
  }
  if (definedEnvVars.size > 0) {
    passedChecks.push(`.env configuration template detected (${definedEnvVars.size} variables declared)`);
  }

  return {
    findings,
    passedChecks,
    detectedStack: {
      languages: Array.from(detectedStack.languages),
      frameworks: Array.from(detectedStack.frameworks),
      hasDockerfile: detectedStack.hasDockerfile,
      hasCompose: detectedStack.hasCompose,
      hasEnv: detectedStack.hasEnv,
      hasPackageJson: detectedStack.hasPackageJson,
      hasRequirements: detectedStack.hasRequirements,
      totalFilesScanned: detectedStack.totalFilesScanned
    }
  };
}

module.exports = {
  analyzeProjectFiles,
  scanDirectory
};
