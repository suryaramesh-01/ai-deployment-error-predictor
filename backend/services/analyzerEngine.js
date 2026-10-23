const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { analyzeProjectFiles } = require('./ruleEngine');

// Python binary location check
function getPythonCommand() {
  const customPath = process.env.PYTHON_PATH || 'C:\\Users\\SURYA\\AppData\\Local\\Programs\\Python\\Python313\\python.exe';
  if (fs.existsSync(customPath)) {
    return customPath;
  }
  return 'python';
}

function runPythonAnalysis(projectDir) {
  return new Promise((resolve) => {
    const pythonScript = path.join(__dirname, '..', 'python_analyzer', 'analyze.py');
    const pythonCmd = getPythonCommand();

    try {
      const proc = spawn(pythonCmd, [pythonScript, projectDir]);
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (d) => { stdout += d.toString(); });
      proc.stderr.on('data', (d) => { stderr += d.toString(); });

      proc.on('close', (code) => {
        if (code === 0 && stdout.trim()) {
          try {
            const parsed = JSON.parse(stdout);
            resolve(parsed);
            return;
          } catch (e) {
            // failed to parse
          }
        }
        resolve({ frameworks: [], findings: [] });
      });

      proc.on('error', () => {
        resolve({ frameworks: [], findings: [] });
      });

      // Set safety timeout 15 seconds
      setTimeout(() => {
        try { proc.kill(); } catch (e) {}
        resolve({ frameworks: [], findings: [] });
      }, 15000);
    } catch (e) {
      resolve({ frameworks: [], findings: [] });
    }
  });
}

/**
 * Calculates Deployment Readiness Score and recommended actions
 */
function calculateReadinessScore(findings, passedChecksCount) {
  const critical = findings.filter(f => f.severity === 'Critical').length;
  const high = findings.filter(f => f.severity === 'High').length;
  const medium = findings.filter(f => f.severity === 'Medium').length;
  const low = findings.filter(f => f.severity === 'Low').length;

  // Deductions
  const deduction = (critical * 25) + (high * 12) + (medium * 6) + (low * 2);
  let score = Math.max(0, Math.min(100, Math.round(100 - deduction)));

  // If there are critical errors, score is capped at 45 (Not Ready for Production)
  if (critical > 0 && score > 45) {
    score = 45;
  }

  let scoreExplanation = '';
  if (score >= 90) {
    scoreExplanation = `Excellent deployment readiness (${score}%). Project passed ${passedChecksCount} validation checks with minimal low-risk items. Ready for staging/production deployment.`;
  } else if (score >= 70) {
    scoreExplanation = `Good readiness (${score}%). No critical blockers detected, but ${high} high-severity and ${medium} medium-severity issues should be reviewed prior to production rollout.`;
  } else if (score >= 45) {
    scoreExplanation = `Moderate readiness (${score}%). Significant deployment risks identified (${critical} critical, ${high} high). Container startup or build failure is likely without resolution.`;
  } else {
    scoreExplanation = `High Risk (${score}%). Multiple critical deployment blockers (${critical} critical, ${high} high) will prevent the application from successfully building or booting in cloud environments.`;
  }

  const recommendedActions = [];
  if (critical > 0) {
    recommendedActions.push({
      action: `Resolve ${critical} Critical blocker(s) immediately (missing dependencies, syntax breaks, or hardcoded secrets).`,
      priority: 'Immediate'
    });
  }
  if (high > 0) {
    recommendedActions.push({
      action: `Fix ${high} High-severity configuration risk(s) including port bindings, missing start scripts, or CORS flags.`,
      priority: 'Immediate'
    });
  }
  if (medium > 0) {
    recommendedActions.push({
      action: `Address ${medium} Medium warning(s) such as missing .env.example templates or unpinned dependency versions.`,
      priority: 'Recommended'
    });
  }
  if (low > 0) {
    recommendedActions.push({
      action: `Review ${low} Low-severity Docker optimization suggestions for improved container caching.`,
      priority: 'Optional'
    });
  }
  if (recommendedActions.length === 0) {
    recommendedActions.push({
      action: 'All deployment checks passed. Proceed to continuous integration test suite.',
      priority: 'Recommended'
    });
  }

  return {
    score,
    scoreExplanation,
    recommendedActions,
    metrics: {
      criticalIssues: critical,
      highIssues: high,
      mediumIssues: medium,
      lowIssues: low,
      totalIssues: findings.length,
      passedChecks: passedChecksCount,
      failedChecks: findings.length,
      resolvedIssues: 0
    }
  };
}

/**
 * Execute full analysis on extracted project folder
 */
async function runAnalysis(extractedDir, projectPlatform = 'Docker') {
  // 1. Run Node & cross-file rule engine
  const nodeResult = analyzeProjectFiles(extractedDir, projectPlatform);

  // 2. If Python files or requirements.txt exist, run Python AST analyzer
  let pythonResult = { frameworks: [], findings: [] };
  if (nodeResult.detectedStack.hasRequirements || nodeResult.detectedStack.languages.includes('Python')) {
    pythonResult = await runPythonAnalysis(extractedDir);
  }

  // Merge findings & detected frameworks
  const allFindings = [...nodeResult.findings, ...(pythonResult.findings || [])];
  const combinedFrameworks = Array.from(new Set([
    ...nodeResult.detectedStack.frameworks,
    ...(pythonResult.frameworks || [])
  ]));

  const readiness = calculateReadinessScore(allFindings, nodeResult.passedChecks.length);

  return {
    readinessScore: readiness.score,
    scoreExplanation: readiness.scoreExplanation,
    recommendedActions: readiness.recommendedActions,
    metrics: readiness.metrics,
    passedChecks: nodeResult.passedChecks,
    detectedStack: {
      ...nodeResult.detectedStack,
      frameworks: combinedFrameworks
    },
    findings: allFindings
  };
}

module.exports = {
  runAnalysis,
  calculateReadinessScore
};
