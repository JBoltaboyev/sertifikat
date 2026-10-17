const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy static assets to standalone
copyDir('.next/static', '.next/standalone/.next/static');
copyDir('public', '.next/standalone/public');

// Copy dev.db if exists
if (fs.existsSync('dev.db')) {
  fs.copyFileSync('dev.db', '.next/standalone/dev.db');
}

// Clean up dev cache if exists
if (fs.existsSync('.next/dev')) {
  fs.rmSync('.next/dev', { recursive: true, force: true });
}

console.log('✓ Standalone bundle tayyor: .next/standalone (~40MB)');
