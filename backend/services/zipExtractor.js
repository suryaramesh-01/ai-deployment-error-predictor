const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');

/**
 * Safely extracts a ZIP archive preventing Zip Slip (path traversal attacks)
 * and enforcing maximum file count and uncompressed byte size limits.
 */
function extractZipSafely(zipFilePath, targetDir, options = {}) {
  const maxFiles = options.maxFiles || 1500;
  const maxTotalSize = options.maxTotalSize || 200 * 1024 * 1024; // 200 MB

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const realTargetDir = fs.realpathSync(targetDir);
  const zip = new AdmZip(zipFilePath);
  const zipEntries = zip.getEntries();

  if (zipEntries.length > maxFiles) {
    throw new Error(`Archive exceeds maximum file limit of ${maxFiles} entries (found ${zipEntries.length}).`);
  }

  let totalExtractedSize = 0;

  for (const entry of zipEntries) {
    totalExtractedSize += entry.header.size;
    if (totalExtractedSize > maxTotalSize) {
      throw new Error(`Archive uncompressed size exceeds maximum limit of ${Math.round(maxTotalSize / (1024 * 1024))}MB.`);
    }

    // Path traversal check
    const entryPath = entry.entryName;
    const resolvedPath = path.resolve(realTargetDir, entryPath);

    // Verify target path begins with realTargetDir
    if (!resolvedPath.startsWith(realTargetDir)) {
      throw new Error(`Security violation: Malicious relative path detected in archive entry: ${entryPath}`);
    }

    if (entry.isDirectory) {
      if (!fs.existsSync(resolvedPath)) {
        fs.mkdirSync(resolvedPath, { recursive: true });
      }
    } else {
      const parentDir = path.dirname(resolvedPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(resolvedPath, entry.getData());
    }
  }

  return {
    fileCount: zipEntries.length,
    totalSize: totalExtractedSize,
    extractedDir: realTargetDir
  };
}

module.exports = {
  extractZipSafely
};
