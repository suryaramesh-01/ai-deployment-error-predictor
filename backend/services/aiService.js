/**
 * AI Service for Error Explanations, Fix Recommendations, and Conversational Assistance
 * Integrates Google Gemini API with intelligent contextual rule-based fallback.
 */

async function callGeminiApi(prompt, systemInstruction = '') {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemInstruction ? systemInstruction + '\n\n' : ''}${prompt}` }]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.warn(`Gemini API returned status ${res.status}`);
      return null;
    }

    const data = await res.json();
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return candidate || null;
  } catch (err) {
    console.warn(`Failed calling Gemini API: ${err.message}`);
    return null;
  }
}

/**
 * Generate comprehensive AI explanation and solution for an issue
 */
async function generateAiExplanation(issue) {
  const systemInstruction = `You are a Senior DevOps and Cloud Infrastructure AI Engineer. 
Analyze the provided deployment issue and provide:
1. Simple English explanation
2. Root cause
3. Step-by-step troubleshooting instructions
4. Corrected configuration or code
5. Best practices to prevent this issue in production deployments.
Respond in clear, structured markdown.`;

  const prompt = `Issue Title: ${issue.title}
File: ${issue.file}:${issue.line || 'N/A'}
Severity: ${issue.severity}
Category: ${issue.category}
Original Snippet:
${issue.originalCode || 'N/A'}
Reported Why: ${issue.why}
Reported Impact: ${issue.impact}

Provide an in-depth explanation, root cause analysis, step-by-step resolution, and the corrected code.`;

  const geminiResponse = await callGeminiApi(prompt, systemInstruction);

  if (geminiResponse) {
    return {
      aiExplanation: geminiResponse,
      troubleshootingSteps: [
        'Open the affected file in your editor or IDE.',
        'Review the line referenced in the error report.',
        'Apply the suggested code diff or configuration change.',
        'Run local unit tests or build commands (`npm run build` or `docker build`).',
        'Verify with `git diff` before re-uploading and triggering analysis.'
      ],
      bestPractices: [
        'Never hardcode environment-specific credentials or ports in code.',
        'Always validate build artifacts locally using container parity.',
        'Pin dependency versions to prevent breaking upstream releases in CI/CD.',
        'Ensure health check probes return 200 OK before routing cloud traffic.'
      ]
    };
  }

  // High-fidelity fallback based on category and issue context
  let rootCause = `The project code in '${issue.file}' violates production deployment requirements.`;
  let steps = [
    `Open '${issue.file}' at or around line ${issue.line || 1}.`,
    'Examine the highlighted code block against the recommended solution.',
    'Replace hardcoded or invalid configurations with environment-driven variables.',
    'Test locally using your container or runtime command before deploying.'
  ];
  let bestPractices = [
    'Adhere to 12-Factor App methodology for configuration management.',
    'Isolate build-time dependencies from production dependencies.',
    'Implement automated linting and static analysis in pre-commit hooks.'
  ];

  if (issue.category === 'Dependency') {
    rootCause = `A module import exists in source code without a corresponding entry in the package manifest (package.json or requirements.txt). In cloud container builds, dependencies are installed in a clean environment where unlisted packages are absent.`;
    steps = [
      `Identify the missing package from the error message.`,
      `For Node.js: run \`npm install <package-name>\` in the project root.`,
      `Verify that the package is listed under \`"dependencies"\` in package.json.`,
      `Commit the updated package.json and lockfile (package-lock.json).`
    ];
    bestPractices = [
      'Always commit your package-lock.json or yarn.lock to enforce deterministic builds.',
      'Use `npm ci` instead of `npm install` in production Dockerfiles.',
      'Run `npm prune --production` to eliminate extraneous development modules.'
    ];
  } else if (issue.category === 'Port') {
    rootCause = `The web application is configured with a static port or binds exclusively to the loopback interface (127.0.0.1). Cloud platforms (AWS ECS, Heroku, Azure) dynamically allocate ports via the PORT environment variable.`;
    steps = [
      `Check your server initialization file (e.g., server.js, app.py).`,
      `Replace static port assignments like \`listen(3000)\` with \`const PORT = process.env.PORT || 3000\`.`,
      `If using Docker or container runners, ensure the server listens on '0.0.0.0' to accept external traffic.`,
      `Update your container port mapping to route host traffic to the specified port.`
    ];
    bestPractices = [
      'Always bind to `0.0.0.0` in containerized applications.',
      'Always read the listening port from `process.env.PORT` or equivalent.',
      'Never hardcode localhost/127.0.0.1 for server listen bindings in production.'
    ];
  } else if (issue.category === 'Security') {
    rootCause = `Credentials, API keys, or connection strings containing plaintext passwords were detected directly within version-controlled files.`;
    steps = [
      `Remove the plaintext secret from '${issue.file}'.`,
      `Add the secret key name to your \`.env.example\` file with an empty or placeholder value.`,
      `Store the secret securely in your cloud provider's Secrets Manager or Environment Configuration dashboard.`,
      `Rotate any exposed API key or password immediately.`
    ];
    bestPractices = [
      'Add \`.env\` and \`*.pem\` to your \`.gitignore\` and \`.dockerignore\` files.',
      'Use IAM Roles or Managed Identities instead of long-lived access keys.',
      'Run automated secret scanning tools (such as Gitleaks or Trufflehog) in CI/CD pipelines.'
    ];
  } else if (issue.category === 'Docker') {
    rootCause = `The Dockerfile lacks necessary directives (like WORKDIR, EXPOSE, or CMD) or does not have a companion .dockerignore file, leading to bloated container images and execution failures.`;
    steps = [
      `Add explicit instructions: \`WORKDIR /app\`, \`COPY package*.json ./\`, \`RUN npm install\`, \`COPY . .\`.`,
      `Ensure a valid startup command is provided: \`CMD ["npm", "start"]\`.`,
      `Create a \`.dockerignore\` file and add \`node_modules\`, \`.git\`, and \`.env\`.`,
      `Build the Docker image locally to verify: \`docker build -t test-app .\`.`
    ];
    bestPractices = [
      'Utilize multi-stage builds to minimize image size and attack surface.',
      'Run as a non-privileged user (e.g. `USER node`) instead of container root.',
      'Always create and maintain a comprehensive `.dockerignore`.'
    ];
  }

  const generatedExplanation = `### Analysis & Root Cause
${rootCause}

### Impact on Production Deployment
${issue.impact}

### Recommended Fix
${issue.solution}

### Step-by-Step Remediation
${steps.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}

### Best Practices to Prevent Recurrence
${bestPractices.map(b => `- ${b}`).join('\n')}`;

  return {
    aiExplanation: generatedExplanation,
    troubleshootingSteps: steps,
    bestPractices: bestPractices
  };
}

/**
 * Conversational AI Assistant for general deployment and DevOps queries
 */
async function answerDevOpsQuestion(query, projectContext = null) {
  let contextPrompt = '';
  if (projectContext) {
    contextPrompt = `User's current project: "${projectContext.name}" (${projectContext.deploymentPlatform}, Tech: ${projectContext.technologies?.join(', ')}). Latest Readiness Score: ${projectContext.latestReadinessScore ?? 'Not yet scanned'}.`;
  }

  const systemInstruction = `You are an expert DevOps and Cloud Deployment Assistant built into the AI-Based Deployment Error Prediction System. 
Provide clear, practical, production-ready advice on Docker, AWS, CI/CD pipelines, environment variables, security, and deployment error troubleshooting.
${contextPrompt}`;

  const geminiAnswer = await callGeminiApi(query, systemInstruction);
  if (geminiAnswer) {
    return geminiAnswer;
  }

  // Contextual fallback response
  const lower = query.toLowerCase();
  if (lower.includes('docker') || lower.includes('container')) {
    return `### Docker Deployment Best Practices
1. **Always use a \`.dockerignore\` file**: Exclude \`node_modules\`, \`.git\`, \`.env\`, and build caches so they are not copied into the Docker image.
2. **Bind to 0.0.0.0**: Ensure your server listens on all network interfaces (\`0.0.0.0\`), not \`127.0.0.1\` or \`localhost\`.
3. **Multi-stage builds**: For frontend apps (React/Vite) or compiled languages (Go/Java), build in one stage and copy artifacts to an Nginx or minimal Alpine container.
4. **Use non-root users**: Add \`USER node\` or create a dedicated service user to avoid container privilege escalation.`;
  } else if (lower.includes('aws') || lower.includes('cloud') || lower.includes('ecs') || lower.includes('beanstalk')) {
    return `### AWS Deployment Recommendations
1. **Application Load Balancers (ALB)**: AWS requires a responsive health check route (e.g., \`GET /health\` returning \`200 OK\`). If absent, instances will fail health checks and get terminated.
2. **Environment Variables & Secrets**: Do not store secrets in source code. Inject variables via AWS Systems Manager Parameter Store or AWS Secrets Manager.
3. **Dynamic Port Binding**: Elastic Beanstalk and ECS dynamic port mapping require the app to listen on \`process.env.PORT\`.
4. **IAM Roles**: Use EC2 instance profiles and ECS task execution roles instead of hardcoded \`AWS_ACCESS_KEY_ID\` and \`AWS_SECRET_ACCESS_KEY\`.`;
  } else if (lower.includes('score') || lower.includes('readiness')) {
    return `### Understanding the Deployment Readiness Score
The Deployment Readiness Score (0-100) evaluates your project against critical cloud deployment criteria:
- **Critical Issues (-25 pts each)**: Missing dependencies, syntax errors, missing CMD, hardcoded AWS keys. Capped at 45% if any critical blocker exists.
- **High Issues (-12 pts each)**: Hardcoded ports, loopback host binding, missing start script, insecure CORS.
- **Medium Issues (-6 pts each)**: Missing \`.env.example\`, missing health endpoints, unpinned dependencies.
- **Low Issues (-2 pts each)**: Docker caching optimizations, minor config warnings.

Aim for a score of **85%+** before deploying to production!`;
  } else {
    return `### DevOps Deployment Guidance
Here are key steps to ensure a flawless deployment:
1. **Audit Dependencies**: Ensure all required packages are declared in \`package.json\` or \`requirements.txt\`. Run \`npm ls\` or \`pip check\` locally.
2. **Validate Configurations**: Check that all \`process.env\` variables used in code have default values or are defined in your environment template.
3. **Verify Health Checks**: Ensure your web service exposes a lightweight \`/health\` endpoint for load balancers.
4. **Test Build Artifacts**: Always test your production build (\`npm run build\`) locally before committing code to staging or production branches.`;
  }
}

module.exports = {
  callGeminiApi,
  generateAiExplanation,
  answerDevOpsQuestion
};
