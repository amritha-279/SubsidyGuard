const fs = require('fs');
const path = require('path');

function fixFetch(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixFetch(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      if (content.includes("fetch('/api/")) {
        content = content.replace(/fetch\('\/api\//g, "fetch(`${import.meta.env.VITE_API_URL || ''}/api/");
        changed = true;
      }
      
      // Also fix axios calls that don't have base URL correctly if any edge cases exist, but mainly fetch is the issue.
      if (content.includes("axios.post('/api/")) {
        content = content.replace(/axios\.post\('\/api\//g, "axios.post(`${import.meta.env.VITE_API_URL || ''}/api/");
        changed = true;
      }
      if (content.includes("axios.get('/api/")) {
        content = content.replace(/axios\.get\('\/api\//g, "axios.get(`${import.meta.env.VITE_API_URL || ''}/api/");
        changed = true;
      }
      if (content.includes("axios.put('/api/")) {
        content = content.replace(/axios\.put\('\/api\//g, "axios.put(`${import.meta.env.VITE_API_URL || ''}/api/");
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log('Fixed', fullPath);
      }
    }
  }
}

fixFetch(path.join(__dirname, 'src'));
