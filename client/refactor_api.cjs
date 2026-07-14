const fs = require('fs');
const path = require('path');

function getRelativePath(fromDir, toFile) {
  let rel = path.relative(fromDir, toFile).replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel;
}

function refactor(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      refactor(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // 1. Remove import axios from 'axios'
      if (content.includes("import axios from 'axios';")) {
        content = content.replace(/import axios from 'axios';\n?/, '');
        changed = true;
      }

      // 2. Replace axios calls with api calls
      // Match: axios.get(`${import.meta.env.VITE_API_URL || ''}/api/...`)
      // Or axios.get(`/api/...`)
      
      const axiosRegex1 = /axios\.(get|post|put|patch|delete)\(\s*\`\$\{import\.meta\.env\.VITE_API_URL\s*\|\|\s*''\}\/api\//g;
      if (axiosRegex1.test(content)) {
        content = content.replace(axiosRegex1, "api.$1('/api/");
        changed = true;
      }

      const axiosRegex2 = /axios\.(get|post|put|patch|delete)\(\s*['"`]\/api\//g;
      if (axiosRegex2.test(content)) {
        content = content.replace(axiosRegex2, "api.$1('/api/");
        changed = true;
      }
      
      // Admin API string replacements where people used template literals
      const adminRegex = /axios\.(get|post|put|patch|delete)\(\s*\`\$\{API\}\//g;
      if (adminRegex.test(content)) {
        content = content.replace(adminRegex, "api.$1('/api/admin/");
        changed = true;
      }

      // 3. Inject api import if we used api.
      if (changed && content.includes('api.')) {
        const apiPath = path.join(__dirname, 'src', 'api.js');
        const relPath = getRelativePath(path.dirname(fullPath), apiPath);
        
        // Find last import
        const lines = content.split('\n');
        let lastImportIdx = -1;
        for (let i=0; i<lines.length; i++) {
          if (lines[i].startsWith('import ')) lastImportIdx = i;
        }
        
        const importStmt = `import api from '${relPath}';`;
        if (lastImportIdx !== -1) {
          lines.splice(lastImportIdx + 1, 0, importStmt);
        } else {
          lines.unshift(importStmt);
        }
        content = lines.join('\n');
      }

      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log('Refactored', fullPath);
      }
    }
  }
}

refactor(path.join(__dirname, 'src'));
