const PDFDocument = require('pdfkit');

/**
 * Generate a PDF deployment audit and error prediction report
 */
function generateProjectReportPdf(project, analysis, issues = []) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        info: {
          Title: `Deployment Readiness Report - ${project.name}`,
          Author: 'AI-Based Deployment Error Prediction System',
          Subject: 'Software Pre-Deployment Verification & Risk Analysis'
        }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Colors
      const darkNavy = '#0f172a';
      const slate = '#475569';
      const blue = '#2563eb';
      const violet = '#7c3aed';
      const criticalRed = '#dc2626';
      const highAmber = '#d97706';
      const mediumYellow = '#ca8a04';
      const lowSlate = '#64748b';
      const successGreen = '#16a34a';

      // Header Banner
      doc.rect(0, 0, doc.page.width, 100).fill('#0b0f19');

      doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold')
         .text('AI DEPLOYMENT READINESS AUDIT', 50, 30);
      doc.fillColor('#94a3b8').fontSize(10).font('Helvetica')
         .text('Automated Error Prediction & Cloud Risk Assessment Report', 50, 60);
      doc.fillColor('#38bdf8').fontSize(9).font('Helvetica-Bold')
         .text(`Generated: ${new Date().toUTCString()}`, 50, 78);

      doc.moveDown(4);

      // Project Overview Section
      doc.fillColor(darkNavy).fontSize(16).font('Helvetica-Bold')
         .text('1. Project Overview', 50, 120);
      doc.rect(50, 140, 495, 1).fill('#e2e8f0');

      doc.font('Helvetica').fontSize(10).fillColor(slate);
      doc.text(`Project Name: `, 50, 150, { continued: true })
         .font('Helvetica-Bold').fillColor(darkNavy).text(project.name);

      doc.font('Helvetica').fillColor(slate)
         .text(`Deployment Target: `, 50, 168, { continued: true })
         .font('Helvetica-Bold').fillColor(darkNavy).text(project.deploymentPlatform || 'Docker');

      doc.font('Helvetica').fillColor(slate)
         .text(`Technologies: `, 50, 186, { continued: true })
         .font('Helvetica-Bold').fillColor(darkNavy).text(project.technologies?.join(', ') || 'N/A');

      doc.font('Helvetica').fillColor(slate)
         .text(`Scan Date: `, 300, 150, { continued: true })
         .font('Helvetica-Bold').fillColor(darkNavy).text(new Date(analysis.scanDate).toLocaleDateString());

      doc.font('Helvetica').fillColor(slate)
         .text(`Status: `, 300, 168, { continued: true })
         .font('Helvetica-Bold').fillColor(darkNavy).text(project.status || 'In Progress');

      doc.font('Helvetica').fillColor(slate)
         .text(`Files Analyzed: `, 300, 186, { continued: true })
         .font('Helvetica-Bold').fillColor(darkNavy).text(String(analysis.detectedStack?.totalFilesScanned || 0));

      // Readiness Score Box
      const score = analysis.readinessScore;
      const scoreColor = score >= 80 ? successGreen : score >= 50 ? highAmber : criticalRed;

      doc.roundedRect(50, 215, 495, 65, 8).fillAndStroke('#f8fafc', '#cbd5e1');
      doc.fillColor(darkNavy).fontSize(12).font('Helvetica-Bold').text('DEPLOYMENT READINESS SCORE', 65, 228);
      doc.fillColor(scoreColor).fontSize(30).font('Helvetica-Bold').text(`${score}/100`, 65, 245);

      const statusText = score >= 80 ? 'READY FOR DEPLOYMENT' : score >= 50 ? 'ACTION REQUIRED' : 'NOT DEPLOYMENT READY';
      doc.fillColor(scoreColor).fontSize(11).font('Helvetica-Bold').text(statusText, 200, 240);
      doc.fillColor(slate).fontSize(9).font('Helvetica')
         .text(analysis.scoreExplanation || 'Evaluation completed based on static code checks.', 200, 258, { width: 330 });

      // Findings Summary Breakdown
      doc.moveDown(5);
      doc.fillColor(darkNavy).fontSize(14).font('Helvetica-Bold').text('2. Issue Severity Distribution', 50, 305);
      doc.rect(50, 322, 495, 1).fill('#e2e8f0');

      const colW = 115;
      const topY = 335;

      // Critical
      doc.roundedRect(50, topY, colW, 40, 4).fillAndStroke('#fef2f2', '#fecaca');
      doc.fillColor(criticalRed).fontSize(16).font('Helvetica-Bold').text(String(analysis.metrics?.criticalIssues || 0), 65, topY + 8);
      doc.fontSize(9).font('Helvetica-Bold').text('CRITICAL', 65, topY + 26);

      // High
      doc.roundedRect(175, topY, colW, 40, 4).fillAndStroke('#fffbeb', '#fde68a');
      doc.fillColor(highAmber).fontSize(16).font('Helvetica-Bold').text(String(analysis.metrics?.highIssues || 0), 190, topY + 8);
      doc.fontSize(9).font('Helvetica-Bold').text('HIGH RISK', 190, topY + 26);

      // Medium
      doc.roundedRect(300, topY, colW, 40, 4).fillAndStroke('#fefce8', '#fef08a');
      doc.fillColor(mediumYellow).fontSize(16).font('Helvetica-Bold').text(String(analysis.metrics?.mediumIssues || 0), 315, topY + 8);
      doc.fontSize(9).font('Helvetica-Bold').text('MEDIUM RISK', 315, topY + 26);

      // Low
      doc.roundedRect(425, topY, colW, 40, 4).fillAndStroke('#f1f5f9', '#cbd5e1');
      doc.fillColor(lowSlate).fontSize(16).font('Helvetica-Bold').text(String(analysis.metrics?.lowIssues || 0), 440, topY + 8);
      doc.fontSize(9).font('Helvetica-Bold').text('LOW / NOTICE', 440, topY + 26);

      // Recommended Actions
      doc.fillColor(darkNavy).fontSize(14).font('Helvetica-Bold').text('3. Deployment Checklist & Actions', 50, 400);
      doc.rect(50, 417, 495, 1).fill('#e2e8f0');

      let currentY = 430;
      if (analysis.recommendedActions && analysis.recommendedActions.length > 0) {
        analysis.recommendedActions.forEach((act) => {
          doc.fillColor(blue).fontSize(9).font('Helvetica-Bold').text(`[${act.priority.toUpperCase()}] `, 50, currentY, { continued: true });
          doc.fillColor(darkNavy).font('Helvetica').text(act.action, { width: 440 });
          currentY += 20;
        });
      }

      // Detailed Issues List
      doc.addPage();
      doc.fillColor(darkNavy).fontSize(16).font('Helvetica-Bold').text('4. Detailed Detected Issues & AI Fixes', 50, 50);
      doc.rect(50, 70, 495, 1).fill('#e2e8f0');

      let issueY = 85;

      if (issues.length === 0) {
        doc.fillColor(successGreen).fontSize(11).font('Helvetica').text('No deployment errors or high risks detected in this scan.', 50, issueY);
      } else {
        issues.forEach((item, index) => {
          if (issueY > 680) {
            doc.addPage();
            issueY = 50;
          }

          const badgeColor = item.severity === 'Critical' ? criticalRed : item.severity === 'High' ? highAmber : mediumYellow;

          doc.fillColor(badgeColor).fontSize(10).font('Helvetica-Bold')
             .text(`[${item.severity.toUpperCase()}] ${item.type || 'Risk'}: `, 50, issueY, { continued: true });
          doc.fillColor(darkNavy).fontSize(11).font('Helvetica-Bold').text(item.title);

          issueY += 16;
          doc.fillColor(slate).fontSize(8.5).font('Helvetica')
             .text(`File: ${item.file || 'root'}${item.line ? ` (Line ${item.line})` : ''} | Category: ${item.category} | Status: ${item.status}`, 50, issueY);

          issueY += 14;
          doc.fillColor(darkNavy).fontSize(8.5).font('Helvetica-Bold').text('Root Cause / Why: ', 50, issueY, { continued: true });
          doc.font('Helvetica').fillColor(slate).text(item.why || 'N/A', { width: 495 });

          issueY += 24;
          doc.fillColor(darkNavy).fontSize(8.5).font('Helvetica-Bold').text('Deployment Impact: ', 50, issueY, { continued: true });
          doc.font('Helvetica').fillColor(slate).text(item.impact || 'N/A', { width: 495 });

          issueY += 24;
          doc.fillColor(darkNavy).fontSize(8.5).font('Helvetica-Bold').text('Recommended Solution: ', 50, issueY, { continued: true });
          doc.font('Helvetica').fillColor(slate).text(item.solution || 'N/A', { width: 495 });

          issueY += 28;
          doc.rect(50, issueY, 495, 0.5).fill('#e2e8f0');
          issueY += 12;
        });
      }

      // Disclaimer on footer of last page
      doc.moveDown(2);
      doc.fillColor('#94a3b8').fontSize(8).font('Helvetica-Oblique')
         .text('Disclaimer: The Deployment Readiness Score and recommendations are generated through automated static analysis, dependency manifest checks, and heuristic rule evaluation. They do not constitute a guarantee of 100% runtime success in production.', 50, doc.page.height - 40, { width: 495, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateProjectReportPdf
};
