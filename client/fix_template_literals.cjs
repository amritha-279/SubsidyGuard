const fs = require('fs');
const path = require('path');

function fix(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fix(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Match: api.get('/api/admin/stats`, ...)
      // We want to replace the single quote before /api/ with a backtick
      // We look for: ' followed by /api/ followed by anything up to a backtick.
      // But only if there is a mismatched single quote.
      
      const regex = /api\.(get|post|put|patch|delete)\(\s*'(\/api\/[^'`]+?)\`/g;
      
      if (regex.test(content)) {
        const newContent = content.replace(regex, 'api.$1(`$2`');
        fs.writeFileSync(fullPath, newContent);
        console.log('Fixed syntax in', fullPath);
      }
    }
  }
}

fix(path.join(__dirname, 'src'));
