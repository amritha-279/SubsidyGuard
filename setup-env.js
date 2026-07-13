const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('http://localhost:5000')) {
    // If it's a template string (e.g. `http://localhost:5000/api/${id}`)
    // it will become `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/${id}`
    const updated = content.replace(/http:\/\/localhost:5000/g, "${import.meta.env.VITE_API_URL || 'http://localhost:5000'}");
    fs.writeFileSync(filePath, updated);
    console.log('Updated ' + filePath);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.js') || p.endsWith('.jsx')) {
      replaceInFile(p);
    }
  }
}

walk('client/src');
console.log('API URL replacement complete.');
