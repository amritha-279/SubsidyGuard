const fs = require('fs');
const path = require('path');

function fixAPI(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixAPI(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('const API = `\\${import.meta.env.VITE_API_URL || \'\'}')) {
        content = content.replace(/const API = `\\\$\{import\.meta\.env\.VITE_API_URL \|\| ''}/g, "const API = `${import.meta.env.VITE_API_URL || ''}");
        fs.writeFileSync(fullPath, content);
        console.log('Fixed', fullPath);
      }
    }
  }
}
fixAPI('src');
