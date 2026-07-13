const fs = require('fs');

const file = fs.readFileSync('c:/Users/Amritha/Desktop/SubsidyGuard/server/seedFarmers.js', 'utf8');

const districts = ['Kanyakumari', 'Madurai', 'Coimbatore', 'Tiruchirappalli', 'Thanjavur', 'Tirunelveli', 'Salem'];
const crops = ['paddy', 'banana', 'coconut', 'rubber', 'cotton', 'maize', 'groundnut', 'sugarcane'];
const firstNames = ['Ravi', 'Gopi', 'Babu', 'Kumar', 'Anand', 'Venkatesh', 'Karthik', 'Suresh', 'Ramesh', 'Vijay', 'Priya', 'Lakshmi', 'Sita', 'Gita', 'Meena', 'Kala', 'Radha', 'Rani', 'Santhi', 'Geetha'];
const lastNames = ['Iyer', 'Pillai', 'Gounder', 'Nadar', 'Thevar', 'Mudaliar', 'Chettiar', 'Naidu', 'Reddy', 'Rao', 'Kumar', 'Rajan', 'Swamy', 'Samy', 'Vannan'];

let newFarmersCode = '';
let aadhaarStart = 320000000000;
let mobileStart = 9843200000;

districts.forEach(d => {
  newFarmersCode += '  // --- Added 10 more to ' + d + ' ---\n';
  for (let i = 1; i <= 10; i++) {
    const aadhaar = (aadhaarStart++).toString();
    const name = firstNames[Math.floor(Math.random()*firstNames.length)] + ' ' + lastNames[Math.floor(Math.random()*lastNames.length)];
    const mobile = (mobileStart++).toString();
    const landSize = (Math.random() * 5 + 1).toFixed(1);
    const cropType = crops[Math.floor(Math.random()*crops.length)];
    const village = d + ' Village ' + i;
    const district = d;
    const soilNitrogenLevel = Math.floor(Math.random() * 40) + 120;
    
    newFarmersCode += `  { aadhaarId: '${aadhaar}', name: '${name}', mobile: '${mobile}', landSize: ${landSize}, cropType: '${cropType}', village: '${village}', district: '${district}', soilNitrogenLevel: ${soilNitrogenLevel} },\n`;
  }
});

const updated = file.replace(/];/, newFarmersCode + '];');
fs.writeFileSync('c:/Users/Amritha/Desktop/SubsidyGuard/server/seedFarmers.js', updated);
console.log('Added 70 farmers');
