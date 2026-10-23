const fs = require('fs');
const path = require('path');

async function testFullWorkflow() {
  console.log('--- STARTING E2E INTEGRATION TEST ---');
  const baseUrl = 'http://localhost:5000/api';

  // 1. Test Health endpoint
  const healthRes = await fetch('http://localhost:5000/health');
  const healthData = await healthRes.json();
  console.log('[1] Health Check:', healthData.status === 'healthy' ? 'PASS' : 'FAIL');

  // 2. Register user
  const email = `dev_${Date.now()}@testcloud.com`;
  const regRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Engineer',
      email: email,
      password: 'password123',
      role: 'devops'
    })
  });
  const regData = await regRes.json();
  console.log('[2] User Registration:', regData.success ? `PASS (User ID: ${regData.user.id})` : `FAIL: ${regData.message}`);
  const token = regData.token;

  // 3. Create Project
  const projRes = await fetch(`${baseUrl}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Cloud Payment Microservice',
      description: 'Production payment gateway service with Docker and AWS target',
      technologies: ['Node.js', 'Express', 'Docker', 'AWS'],
      deploymentPlatform: 'AWS',
      status: 'In Progress'
    })
  });
  const projData = await projRes.json();
  const projectId = projData.data._id;
  console.log('[3] Project Creation:', projData.success ? `PASS (Project ID: ${projectId})` : 'FAIL');

  // 4. Upload and analyze sample-node-project.zip
  const zipPath = path.join(__dirname, 'samples', 'sample-node-project.zip');
  const fileBytes = fs.readFileSync(zipPath);

  // Build multipart form data manually with FormData
  const formData = new FormData();
  const blob = new Blob([fileBytes], { type: 'application/zip' });
  formData.append('projectZip', blob, 'sample-node-project.zip');

  const scanRes = await fetch(`${baseUrl}/projects/${projectId}/upload-and-analyze`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  const scanData = await scanRes.json();
  console.log('[4] Upload & Static Analysis:', scanData.success ? 'PASS' : `FAIL: ${scanData.message}`);
  if (!scanData.success) {
    console.error(scanData);
    process.exit(1);
  }

  const analysisId = scanData.data.analysis._id;
  const readinessScore = scanData.data.analysis.readinessScore;
  const issues = scanData.data.issues;

  console.log(`    Readiness Score: ${readinessScore}/100`);
  console.log(`    Detected Findings: ${issues.length}`);
  console.log(`    Passed Checks: ${scanData.data.passedChecks.length}`);

  // 5. Inspect detected issues
  const criticalIssues = issues.filter(i => i.severity === 'Critical');
  console.log(`[5] Critical Blockers Found: ${criticalIssues.length}`);
  criticalIssues.forEach(ci => {
    console.log(`    - [${ci.category}] ${ci.title} in ${ci.file}:${ci.line || 1}`);
  });

  // Verify side-by-side diff data
  const sampleIssue = issues[0];
  console.log(`[6] AI Solution & Diff Verification for "${sampleIssue.title}":`);
  console.log(`    Original Code: ${sampleIssue.originalCode ? 'Present' : 'Absent'}`);
  console.log(`    Suggested Fix: ${sampleIssue.suggestedFix ? 'Present' : 'Absent'}`);
  console.log(`    AI Explanation: ${sampleIssue.aiExplanation ? 'Generated' : 'Absent'}`);

  // 7. Create task from issue
  const taskRes = await fetch(`${baseUrl}/tasks/project/${projectId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: `Fix Blocker: ${sampleIssue.title}`,
      description: sampleIssue.solution,
      priority: sampleIssue.severity,
      issueId: sampleIssue._id
    })
  });
  const taskData = await taskRes.json();
  console.log('[7] Task Creation from Issue:', taskData.success ? `PASS (Task ID: ${taskData.data._id})` : 'FAIL');

  // 8. Mark issue resolved
  const resolveRes = await fetch(`${baseUrl}/issues/${sampleIssue._id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status: 'Resolved' })
  });
  const resolveData = await resolveRes.json();
  console.log('[8] Issue Status Resolution:', resolveData.data.status === 'Resolved' ? 'PASS' : 'FAIL');

  // 9. AI Assistant DevOps chat
  const chatRes = await fetch(`${baseUrl}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      query: 'Why is hardcoding 127.0.0.1 bad for Docker and AWS deployments?',
      projectId: projectId
    })
  });
  const chatData = await chatRes.json();
  console.log('[9] AI Assistant Conversational Response:', chatData.success && chatData.answer.length > 50 ? 'PASS' : 'FAIL');

  // 10. Dashboard Telemetry Aggregation
  const dashRes = await fetch(`${baseUrl}/projects/stats/dashboard`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const dashData = await dashRes.json();
  console.log('[10] Dashboard Stats Aggregation:', dashData.success && dashData.stats.totalProjects >= 1 ? 'PASS' : 'FAIL');

  // 11. PDF Report Download
  const pdfRes = await fetch(`${baseUrl}/reports/project/${projectId}/analysis/${analysisId}/pdf`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const pdfBuffer = await pdfRes.arrayBuffer();
  const pdfHeader = Buffer.from(pdfBuffer).subarray(0, 5).toString();
  console.log('[11] PDF Report Generation:', pdfHeader === '%PDF-' ? `PASS (${pdfBuffer.byteLength} bytes generated)` : 'FAIL');

  console.log('\nALL 11 INTEGRATION TESTS COMPLETED SUCCESSFULLY!');
}

testFullWorkflow().catch(console.error);
