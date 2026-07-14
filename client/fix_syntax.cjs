const fs = require('fs');
const path = require('path');

function fixSyntax(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixSyntax(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Use [^'\n]* to prevent matching across multiple lines
      const regex = /\`\$\{import\.meta\.env\.VITE_API_URL \|\| ''\}\/api\/([^'\n]*)'/g;
      
      if (regex.test(content)) {
        content = content.replace(regex, "`${import.meta.env.VITE_API_URL || ''}/api/$1`");
        fs.writeFileSync(fullPath, content);
        console.log('Fixed syntax in', fullPath);
      }
    }
  }
}

fixSyntax(path.join(__dirname, 'src'));
