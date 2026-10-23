const path = require('path');
const fs = require('fs');
const AdmZip = require('./backend/node_modules/adm-zip');

const rootDir = __dirname;
const zip = new AdmZip();

const excludeDirs = ['node_modules', '.git', 'dist', 'uploads', 'temp', 'mongodb_data', '.system_generated', 'dist'];
const excludeFiles = ['.DS_Store', 'Thumbs.db', 'ai-deployment-error-predictor.zip'];

function addFolderRecursively(currentPath, zipPath = '') {
  const items = fs.readdirSync(currentPath);

  for (const item of items) {
    const fullPath = path.join(currentPath, item);
    const relZipPath = zipPath ? `${zipPath}/${item}` : item;
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (excludeDirs.includes(item)) continue;
      addFolderRecursively(fullPath, relZipPath);
    } else {
      if (excludeFiles.includes(item)) continue;
      if (item.endsWith('.log') || item.endsWith('.tmp')) continue;
      const content = fs.readFileSync(fullPath);
      zip.addFile(relZipPath, content);
    }
  }
}

console.log('Packaging project into ZIP...');
addFolderRecursively(rootDir);

const outPaths = [
  path.join(rootDir, '..', 'ai-deployment-error-predictor.zip'),
  path.join(rootDir, 'backend', 'samples', 'ai-deployment-error-predictor.zip'),
  path.join(rootDir, 'frontend', 'public', 'samples', 'ai-deployment-error-predictor.zip')
];

for (const outPath of outPaths) {
  const dir = path.dirname(outPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  zip.writeZip(outPath);
  const size = (fs.statSync(outPath).size / 1024).toFixed(1);
  console.log(`Saved: ${outPath} (${size} KB)`);
}
console.log('Zip packaging completed successfully!');
