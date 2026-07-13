const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('import.meta.env.VITE_API_URL')) {
    // We want to replace:
    // '${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin'
    // with:
    // `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin`
    
    // Regex explanation:
    // Match a single quote, then exactly ${import.meta.env.VITE_API_URL || 'http://localhost:5000'}
    // then any characters (like /api/admin) until a single quote.
    const regex = /'\$\{import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:5000'\}(.*?)'/g;
    
    if (regex.test(content)) {
      const updated = content.replace(regex, "`\\${import.meta.env.VITE_API_URL || 'http://localhost:5000'}$1`");
      fs.writeFileSync(filePath, updated);
      console.log('Fixed syntax in ' + filePath);
    }
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.js') || p.endsWith('.jsx')) {
      fixFile(p);
    }
  }
}

walk('client/src');
console.log('Fixes applied.');
