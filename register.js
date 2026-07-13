const http = require('http');

function register(data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    };
    const req = http.request(options, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve(JSON.parse(b)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  try {
    const r1 = await register({ name: 'Kisan Seva Kendra', email: 'retailer@gmail.com', password: 'retailer123', role: 'RETAILER', shopId: 'RET001' });
    console.log('Retailer:', r1.error || 'Registered successfully');

    const r2 = await register({ name: 'Agriculture Officer', email: 'officer@gmail.com', password: 'officer123', role: 'OFFICER' });
    console.log('Officer:', r2.error || 'Registered successfully');
  } catch (e) {
    console.error('Error:', e.message);
  }
}

main();
