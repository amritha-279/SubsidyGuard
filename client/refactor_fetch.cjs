const fs = require('fs');
const path = require('path');

function getRelativePath(fromDir, toFile) {
  let rel = path.relative(fromDir, toFile).replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel;
}

function refactorFetch() {
  const filesToFix = [
    'src/pages/LoginPage.jsx',
    'src/pages/retailer/RetailerLayout.jsx',
    'src/pages/admin/SettingsPage.jsx',
    'src/pages/retailer/RetailerProfile.jsx'
  ];

  for (const f of filesToFix) {
    const fullPath = path.join(__dirname, f);
    if (!fs.existsSync(fullPath)) continue;
    let content = fs.readFileSync(fullPath, 'utf8');
    let changed = false;

    // Inject import api
    const apiPath = path.join(__dirname, 'src', 'api.js');
    const relPath = getRelativePath(path.dirname(fullPath), apiPath);
    if (!content.includes('import api from')) {
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

    // Replace fetch for forgot-password
    content = content.replace(
      /const res = await fetch\(\`\$\{import\.meta\.env\.VITE_API_URL \|\| ''\}\/api\/auth\/forgot-password\`, \{ method: 'POST', headers: \{ 'Content-Type': 'application\/json' \}, body: JSON\.stringify\(\{ email \}\) \}\);/g,
      "const res = await api.post('/api/auth/forgot-password', { email });"
    );

    // Replace fetch for reset-password
    content = content.replace(
      /const res = await fetch\(\`\$\{import\.meta\.env\.VITE_API_URL \|\| ''\}\/api\/auth\/reset-password\`, \{ method: 'POST', headers: \{ 'Content-Type': 'application\/json' \}, body: JSON\.stringify\(\{ email, otp, newPassword: newPw \}\) \}\);/g,
      "const res = await api.post('/api/auth/reset-password', { email, otp, newPassword: newPw });"
    );

    // Replace fetch for login (officer)
    content = content.replace(
      /const res = await fetch\(\`\$\{import\.meta\.env\.VITE_API_URL \|\| ''\}\/api\/auth\/login\`, \{ method: 'POST', headers: \{ 'Content-Type': 'application\/json' \}, body: JSON\.stringify\(\{ email: officerForm\.username, password: officerForm\.password \}\) \}\);/g,
      "const res = await api.post('/api/auth/login', { email: officerForm.username, password: officerForm.password });"
    );

    // Replace fetch for login (retailer)
    content = content.replace(
      /const res = await fetch\(\`\$\{import\.meta\.env\.VITE_API_URL \|\| ''\}\/api\/auth\/login\`, \{ method: 'POST', headers: \{ 'Content-Type': 'application\/json' \}, body: JSON\.stringify\(\{ email: retailerForm\.email, password: retailerForm\.password \}\) \}\);/g,
      "const res = await api.post('/api/auth/login', { email: retailerForm.email, password: retailerForm.password });"
    );

    // Replace fetch for me
    content = content.replace(
      /fetch\(\`\$\{import\.meta\.env\.VITE_API_URL \|\| ''\}\/api\/auth\/me\`, \{ headers: \{ Authorization: \`Bearer \$\{token\}\` \} \}\)/g,
      "api.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })"
    );

    // Replace async fetch for me (Settings/RetailerProfile)
    content = content.replace(
      /const res = await fetch\(\`\$\{import\.meta\.env\.VITE_API_URL \|\| ''\}\/api\/auth\/me\`, \{\s*headers: \{ Authorization: \`Bearer \$\{token\}\` \}\s*\}\);/g,
      "const res = await api.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });"
    );

    // Replace async fetch for change-password
    content = content.replace(
      /const res = await fetch\(\`\$\{import\.meta\.env\.VITE_API_URL \|\| ''\}\/api\/auth\/change-password\`, \{\s*method: 'POST',\s*headers: \{\s*'Content-Type': 'application\/json',\s*Authorization: \`Bearer \$\{token\}\`\s*\},\s*body: JSON\.stringify\(\{ currentPassword: currentPw, newPassword: newPw \}\)\s*\}\);/g,
      "const res = await api.post('/api/auth/change-password', { currentPassword: currentPw, newPassword: newPw }, { headers: { Authorization: `Bearer ${token}` } });"
    );

    fs.writeFileSync(fullPath, content);
    console.log('Fixed fetch in', fullPath);
  }
}

refactorFetch();
