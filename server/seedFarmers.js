import sequelize from './db.js';
import Farmer from './models/Farmer.js';

const farmers = [
  // ================= KANYAKUMARI =================
  { aadhaarId: '311245678901', name: 'Murugesan Pillai', mobile: '9843100001', landSize: 4.0, cropType: 'paddy', village: 'Marthandam', district: 'Kanyakumari', soilNitrogenLevel: 148 },
  { aadhaarId: '311345678902', name: 'Selvi Arumugam', mobile: '9843100002', landSize: 2.5, cropType: 'banana', village: 'Nagercoil', district: 'Kanyakumari', soilNitrogenLevel: 155 },
  { aadhaarId: '311445678903', name: 'Thangavel Rajan', mobile: '9843100003', landSize: 5.5, cropType: 'coconut', village: 'Kuzhithurai', district: 'Kanyakumari', soilNitrogenLevel: 142 },
  { aadhaarId: '311545678904', name: 'Meenakshi Sundaram', mobile: '9843100004', landSize: 3.0, cropType: 'rubber', village: 'Colachel', district: 'Kanyakumari', soilNitrogenLevel: 150 },
  { aadhaarId: '311645678905', name: 'Arjunan Nadar', mobile: '9843100005', landSize: 2.8, cropType: 'paddy', village: 'Kulasekaram', district: 'Kanyakumari', soilNitrogenLevel: 146 },

  // ================= MADURAI =================
  { aadhaarId: '312245678906', name: 'Kamachi Devi', mobile: '9843100006', landSize: 3.5, cropType: 'cotton', village: 'Melur', district: 'Madurai', soilNitrogenLevel: 140 },
  { aadhaarId: '312345678907', name: 'Selvakumar Pandian', mobile: '9843100007', landSize: 6.0, cropType: 'maize', village: 'Usilampatti', district: 'Madurai', soilNitrogenLevel: 135 },
  { aadhaarId: '312445678908', name: 'Parvathi Muthusamy', mobile: '9843100008', landSize: 2.0, cropType: 'groundnut', village: 'Thirumangalam', district: 'Madurai', soilNitrogenLevel: 158 },
  { aadhaarId: '312545678909', name: 'Govindasamy Pillai', mobile: '9843100009', landSize: 4.2, cropType: 'paddy', village: 'Vadipatti', district: 'Madurai', soilNitrogenLevel: 147 },
  { aadhaarId: '312645678910', name: 'Kavitha Subramanian', mobile: '9843100010', landSize: 3.1, cropType: 'banana', village: 'Alanganallur', district: 'Madurai', soilNitrogenLevel: 149 },

  // ================= COIMBATORE =================
  { aadhaarId: '313245678911', name: 'Rajan Krishnamurthy', mobile: '9843100011', landSize: 5.5, cropType: 'maize', village: 'Pollachi', district: 'Coimbatore', soilNitrogenLevel: 145 },
  { aadhaarId: '313345678912', name: 'Annamalai Gounder', mobile: '9843100012', landSize: 6.5, cropType: 'coconut', village: 'Mettupalayam', district: 'Coimbatore', soilNitrogenLevel: 132 },
  { aadhaarId: '313445678913', name: 'Ponni Devi', mobile: '9843100013', landSize: 2.5, cropType: 'banana', village: 'Annur', district: 'Coimbatore', soilNitrogenLevel: 150 },
  { aadhaarId: '313545678914', name: 'Shanmugam Velayutham', mobile: '9843100014', landSize: 7.0, cropType: 'cotton', village: 'Sulur', district: 'Coimbatore', soilNitrogenLevel: 129 },
  { aadhaarId: '313645678915', name: 'Duraisamy Thevar', mobile: '9843100015', landSize: 3.5, cropType: 'maize', village: 'Kinathukadavu', district: 'Coimbatore', soilNitrogenLevel: 144 },

  // ================= TIRUCHIRAPPALLI =================
  { aadhaarId: '314245678916', name: 'Saraswathi Murugan', mobile: '9843100016', landSize: 2.0, cropType: 'paddy', village: 'Lalgudi', district: 'Tiruchirappalli', soilNitrogenLevel: 160 },
  { aadhaarId: '314345678917', name: 'Karthikeyan Pillai', mobile: '9843100017', landSize: 5.0, cropType: 'banana', village: 'Musiri', district: 'Tiruchirappalli', soilNitrogenLevel: 142 },
  { aadhaarId: '314445678918', name: 'Palanisamy Gounder', mobile: '9843100018', landSize: 6.0, cropType: 'sugarcane', village: 'Manapparai', district: 'Tiruchirappalli', soilNitrogenLevel: 136 },
  { aadhaarId: '314545678919', name: 'Malathi Krishnan', mobile: '9843100019', landSize: 3.2, cropType: 'groundnut', village: 'Thuraiyur', district: 'Tiruchirappalli', soilNitrogenLevel: 151 },
  { aadhaarId: '314645678920', name: 'Velu Murugesan', mobile: '9843100020', landSize: 4.8, cropType: 'maize', village: 'Srirangam', district: 'Tiruchirappalli', soilNitrogenLevel: 148 },

  // ================= THANJAVUR =================
  { aadhaarId: '315245678921', name: 'Natarajan Pillai', mobile: '9843100021', landSize: 4.5, cropType: 'paddy', village: 'Papanasam', district: 'Thanjavur', soilNitrogenLevel: 144 },
  { aadhaarId: '315345678922', name: 'Chitra Devi', mobile: '9843100022', landSize: 2.5, cropType: 'paddy', village: 'Kumbakonam', district: 'Thanjavur', soilNitrogenLevel: 160 },
  { aadhaarId: '315445678923', name: 'Ramasamy Thevar', mobile: '9843100023', landSize: 5.5, cropType: 'sugarcane', village: 'Thiruvaiyaru', district: 'Thanjavur', soilNitrogenLevel: 141 },
  { aadhaarId: '315545678924', name: 'Ilango Mudaliar', mobile: '9843100024', landSize: 3.0, cropType: 'banana', village: 'Pattukottai', district: 'Thanjavur', soilNitrogenLevel: 149 },
  { aadhaarId: '315645678925', name: 'Vasantha Kumari', mobile: '9843100025', landSize: 6.0, cropType: 'paddy', village: 'Orathanadu', district: 'Thanjavur', soilNitrogenLevel: 138 },

  // ================= TIRUNELVELI =================
  { aadhaarId: '316245678926', name: 'Periasamy Nadar', mobile: '9843100026', landSize: 4.0, cropType: 'banana', village: 'Palayamkottai', district: 'Tirunelveli', soilNitrogenLevel: 150 },
  { aadhaarId: '316345678927', name: 'Thilaga Devi', mobile: '9843100027', landSize: 2.5, cropType: 'groundnut', village: 'Nanguneri', district: 'Tirunelveli', soilNitrogenLevel: 162 },
  { aadhaarId: '316445678928', name: 'Murugan Rajan', mobile: '9843100028', landSize: 5.5, cropType: 'cotton', village: 'Ambasamudram', district: 'Tirunelveli', soilNitrogenLevel: 136 },
  { aadhaarId: '316545678929', name: 'Subbaiah Pillai', mobile: '9843100029', landSize: 3.5, cropType: 'paddy', village: 'Cheranmahadevi', district: 'Tirunelveli', soilNitrogenLevel: 154 },
  { aadhaarId: '316645678930', name: 'Alamelu Nachiyar', mobile: '9843100030', landSize: 6.0, cropType: 'maize', village: 'Tenkasi', district: 'Tirunelveli', soilNitrogenLevel: 145 },

  // ================= SALEM =================
  { aadhaarId: '317245678931', name: 'Prakash Kumar', mobile: '9843100031', landSize: 3.5, cropType: 'maize', village: 'Omalur', district: 'Salem', soilNitrogenLevel: 148 },
  { aadhaarId: '317345678932', name: 'Revathi Selvam', mobile: '9843100032', landSize: 5.0, cropType: 'sugarcane', village: 'Mettur', district: 'Salem', soilNitrogenLevel: 134 },
  { aadhaarId: '317445678933', name: 'Manikandan Ravi', mobile: '9843100033', landSize: 4.2, cropType: 'cotton', village: 'Attur', district: 'Salem', soilNitrogenLevel: 130 },
  { aadhaarId: '317545678934', name: 'Lakshmi Priya', mobile: '9843100034', landSize: 2.8, cropType: 'groundnut', village: 'Sankagiri', district: 'Salem', soilNitrogenLevel: 158 },
  { aadhaarId: '317645678935', name: 'Ganesan Moorthy', mobile: '9843100035', landSize: 6.0, cropType: 'paddy', village: 'Edappadi', district: 'Salem', soilNitrogenLevel: 143 },
  // --- Added 10 more to Kanyakumari ---
  { aadhaarId: '320000000000', name: 'Gita Vannan', mobile: '9843200000', landSize: 1.5, cropType: 'groundnut', village: 'Thuckalay', district: 'Kanyakumari', soilNitrogenLevel: 122 },
  { aadhaarId: '320000000001', name: 'Meena Nadar', mobile: '9843200001', landSize: 4.6, cropType: 'rubber', village: 'Agasteeswaram', district: 'Kanyakumari', soilNitrogenLevel: 159 },
  { aadhaarId: '320000000002', name: 'Kala Rajan', mobile: '9843200002', landSize: 4.0, cropType: 'maize', village: 'Boothapandi', district: 'Kanyakumari', soilNitrogenLevel: 128 },
  { aadhaarId: '320000000003', name: 'Sita Kumar', mobile: '9843200003', landSize: 3.5, cropType: 'maize', village: 'Eraniel', district: 'Kanyakumari', soilNitrogenLevel: 138 },
  { aadhaarId: '320000000004', name: 'Gita Reddy', mobile: '9843200004', landSize: 1.7, cropType: 'sugarcane', village: 'Kalkulam', district: 'Kanyakumari', soilNitrogenLevel: 155 },
  { aadhaarId: '320000000005', name: 'Geetha Thevar', mobile: '9843200005', landSize: 4.2, cropType: 'cotton', village: 'Vilavancode', district: 'Kanyakumari', soilNitrogenLevel: 122 },
  { aadhaarId: '320000000006', name: 'Anand Rajan', mobile: '9843200006', landSize: 3.9, cropType: 'maize', village: 'Killiyoor', district: 'Kanyakumari', soilNitrogenLevel: 130 },
  { aadhaarId: '320000000007', name: 'Sita Swamy', mobile: '9843200007', landSize: 5.0, cropType: 'sugarcane', village: 'Thiruvattar', district: 'Kanyakumari', soilNitrogenLevel: 157 },
  { aadhaarId: '320000000008', name: 'Sita Iyer', mobile: '9843200008', landSize: 4.5, cropType: 'maize', village: 'Kanyakumari Town', district: 'Kanyakumari', soilNitrogenLevel: 140 },
  { aadhaarId: '320000000009', name: 'Babu Vannan', mobile: '9843200009', landSize: 2.2, cropType: 'sugarcane', village: 'Suchindram', district: 'Kanyakumari', soilNitrogenLevel: 158 },
  // --- Added 10 more to Madurai ---
  { aadhaarId: '320000000010', name: 'Meena Nadar', mobile: '9843200010', landSize: 3.7, cropType: 'paddy', village: 'Peraiyur', district: 'Madurai', soilNitrogenLevel: 121 },
  { aadhaarId: '320000000011', name: 'Kumar Vannan', mobile: '9843200011', landSize: 5.0, cropType: 'banana', village: 'Sedapatti', district: 'Madurai', soilNitrogenLevel: 138 },
  { aadhaarId: '320000000012', name: 'Gita Kumar', mobile: '9843200012', landSize: 3.9, cropType: 'rubber', village: 'Kottampatti', district: 'Madurai', soilNitrogenLevel: 155 },
  { aadhaarId: '320000000013', name: 'Venkatesh Rajan', mobile: '9843200013', landSize: 1.7, cropType: 'coconut', village: 'T.Kallupatti', district: 'Madurai', soilNitrogenLevel: 156 },
  { aadhaarId: '320000000014', name: 'Radha Nadar', mobile: '9843200014', landSize: 3.2, cropType: 'groundnut', village: 'Chellampatti', district: 'Madurai', soilNitrogenLevel: 145 },
  { aadhaarId: '320000000015', name: 'Gita Vannan', mobile: '9843200015', landSize: 3.2, cropType: 'rubber', village: 'Kalligudi', district: 'Madurai', soilNitrogenLevel: 130 },
  { aadhaarId: '320000000016', name: 'Anand Gounder', mobile: '9843200016', landSize: 2.6, cropType: 'rubber', village: 'Avaniyapuram', district: 'Madurai', soilNitrogenLevel: 142 },
  { aadhaarId: '320000000017', name: 'Priya Samy', mobile: '9843200017', landSize: 1.5, cropType: 'sugarcane', village: 'Thiruparankundram', district: 'Madurai', soilNitrogenLevel: 120 },
  { aadhaarId: '320000000018', name: 'Sita Naidu', mobile: '9843200018', landSize: 2.3, cropType: 'coconut', village: 'Othakadai', district: 'Madurai', soilNitrogenLevel: 150 },
  { aadhaarId: '320000000019', name: 'Gita Vannan', mobile: '9843200019', landSize: 4.0, cropType: 'banana', village: 'Sholavandan', district: 'Madurai', soilNitrogenLevel: 133 },
  // --- Added 10 more to Coimbatore ---
  { aadhaarId: '320000000020', name: 'Babu Kumar', mobile: '9843200020', landSize: 1.9, cropType: 'groundnut', village: 'Valparai', district: 'Coimbatore', soilNitrogenLevel: 131 },
  { aadhaarId: '320000000021', name: 'Lakshmi Thevar', mobile: '9843200021', landSize: 3.0, cropType: 'coconut', village: 'Thondamuthur', district: 'Coimbatore', soilNitrogenLevel: 159 },
  { aadhaarId: '320000000022', name: 'Karthik Pillai', mobile: '9843200022', landSize: 3.7, cropType: 'groundnut', village: 'Madukkarai', district: 'Coimbatore', soilNitrogenLevel: 142 },
  { aadhaarId: '320000000023', name: 'Venkatesh Pillai', mobile: '9843200023', landSize: 2.5, cropType: 'paddy', village: 'Periyanaickenpalayam', district: 'Coimbatore', soilNitrogenLevel: 154 },
  { aadhaarId: '320000000024', name: 'Babu Thevar', mobile: '9843200024', landSize: 3.9, cropType: 'coconut', village: 'Karamadai', district: 'Coimbatore', soilNitrogenLevel: 135 },
  { aadhaarId: '320000000025', name: 'Geetha Gounder', mobile: '9843200025', landSize: 4.0, cropType: 'sugarcane', village: 'Sarcarsamakulam', district: 'Coimbatore', soilNitrogenLevel: 128 },
  { aadhaarId: '320000000026', name: 'Kumar Reddy', mobile: '9843200026', landSize: 1.4, cropType: 'cotton', village: 'Thudiyalur', district: 'Coimbatore', soilNitrogenLevel: 153 },
  { aadhaarId: '320000000027', name: 'Kala Rao', mobile: '9843200027', landSize: 2.3, cropType: 'rubber', village: 'Sirumugai', district: 'Coimbatore', soilNitrogenLevel: 134 },
  { aadhaarId: '320000000028', name: 'Rani Rao', mobile: '9843200028', landSize: 2.1, cropType: 'banana', village: 'Kottur', district: 'Coimbatore', soilNitrogenLevel: 153 },
  { aadhaarId: '320000000029', name: 'Karthik Reddy', mobile: '9843200029', landSize: 4.0, cropType: 'banana', village: 'Vettaikaranpudur', district: 'Coimbatore', soilNitrogenLevel: 144 },
  // --- Added 10 more to Tiruchirappalli ---
  { aadhaarId: '320000000030', name: 'Lakshmi Naidu', mobile: '9843200030', landSize: 6.0, cropType: 'maize', village: 'Thottiyam', district: 'Tiruchirappalli', soilNitrogenLevel: 155 },
  { aadhaarId: '320000000031', name: 'Anand Nadar', mobile: '9843200031', landSize: 3.6, cropType: 'paddy', village: 'Uppiliyapuram', district: 'Tiruchirappalli', soilNitrogenLevel: 155 },
  { aadhaarId: '320000000032', name: 'Kumar Iyer', mobile: '9843200032', landSize: 5.1, cropType: 'rubber', village: 'Vaiyampatti', district: 'Tiruchirappalli', soilNitrogenLevel: 136 },
  { aadhaarId: '320000000033', name: 'Kala Vannan', mobile: '9843200033', landSize: 1.3, cropType: 'maize', village: 'Marungapuri', district: 'Tiruchirappalli', soilNitrogenLevel: 135 },
  { aadhaarId: '320000000034', name: 'Lakshmi Rao', mobile: '9843200034', landSize: 3.7, cropType: 'banana', village: 'Pullambadi', district: 'Tiruchirappalli', soilNitrogenLevel: 136 },
  { aadhaarId: '320000000035', name: 'Meena Iyer', mobile: '9843200035', landSize: 1.3, cropType: 'rubber', village: 'Tiruverumbur', district: 'Tiruchirappalli', soilNitrogenLevel: 150 },
  { aadhaarId: '320000000036', name: 'Gopi Naidu', mobile: '9843200036', landSize: 6.0, cropType: 'coconut', village: 'Andanallur', district: 'Tiruchirappalli', soilNitrogenLevel: 124 },
  { aadhaarId: '320000000037', name: 'Lakshmi Reddy', mobile: '9843200037', landSize: 4.1, cropType: 'sugarcane', village: 'Manikandam', district: 'Tiruchirappalli', soilNitrogenLevel: 127 },
  { aadhaarId: '320000000038', name: 'Kala Nadar', mobile: '9843200038', landSize: 5.5, cropType: 'sugarcane', village: 'Kattuputhur', district: 'Tiruchirappalli', soilNitrogenLevel: 130 },
  { aadhaarId: '320000000039', name: 'Priya Kumar', mobile: '9843200039', landSize: 1.3, cropType: 'groundnut', village: 'Musiri Rural', district: 'Tiruchirappalli', soilNitrogenLevel: 137 },
  // --- Added 10 more to Thanjavur ---
  { aadhaarId: '320000000040', name: 'Kumar Pillai', mobile: '9843200040', landSize: 5.9, cropType: 'sugarcane', village: 'Peravurani', district: 'Thanjavur', soilNitrogenLevel: 142 },
  { aadhaarId: '320000000041', name: 'Kala Naidu', mobile: '9843200041', landSize: 3.2, cropType: 'maize', village: 'Thiruvidaimarudur', district: 'Thanjavur', soilNitrogenLevel: 142 },
  { aadhaarId: '320000000042', name: 'Santhi Mudaliar', mobile: '9843200042', landSize: 4.1, cropType: 'groundnut', village: 'Ammapettai', district: 'Thanjavur', soilNitrogenLevel: 133 },
  { aadhaarId: '320000000043', name: 'Gopi Iyer', mobile: '9843200043', landSize: 1.9, cropType: 'groundnut', village: 'Sethubhavachatram', district: 'Thanjavur', soilNitrogenLevel: 153 },
  { aadhaarId: '320000000044', name: 'Ravi Rajan', mobile: '9843200044', landSize: 3.8, cropType: 'cotton', village: 'Madukkur', district: 'Thanjavur', soilNitrogenLevel: 141 },
  { aadhaarId: '320000000045', name: 'Sita Nadar', mobile: '9843200045', landSize: 4.8, cropType: 'maize', village: 'Budalur', district: 'Thanjavur', soilNitrogenLevel: 131 },
  { aadhaarId: '320000000046', name: 'Sita Iyer', mobile: '9843200046', landSize: 4.5, cropType: 'rubber', village: 'Thiruppanandal', district: 'Thanjavur', soilNitrogenLevel: 129 },
  { aadhaarId: '320000000047', name: 'Rani Iyer', mobile: '9843200047', landSize: 6.0, cropType: 'maize', village: 'Adirampattinam', district: 'Thanjavur', soilNitrogenLevel: 148 },
  { aadhaarId: '320000000048', name: 'Meena Pillai', mobile: '9843200048', landSize: 1.1, cropType: 'rubber', village: 'Vallam', district: 'Thanjavur', soilNitrogenLevel: 148 },
  { aadhaarId: '320000000049', name: 'Lakshmi Gounder', mobile: '9843200049', landSize: 1.5, cropType: 'sugarcane', village: 'Kurinjipadi', district: 'Thanjavur', soilNitrogenLevel: 121 },
  // --- Added 10 more to Tirunelveli ---
  { aadhaarId: '320000000050', name: 'Karthik Samy', mobile: '9843200050', landSize: 4.0, cropType: 'banana', village: 'Radhapuram', district: 'Tirunelveli', soilNitrogenLevel: 147 },
  { aadhaarId: '320000000051', name: 'Suresh Rao', mobile: '9843200051', landSize: 4.3, cropType: 'banana', village: 'Valliyur', district: 'Tirunelveli', soilNitrogenLevel: 145 },
  { aadhaarId: '320000000052', name: 'Sita Reddy', mobile: '9843200052', landSize: 5.3, cropType: 'maize', village: 'Manur', district: 'Tirunelveli', soilNitrogenLevel: 148 },
  { aadhaarId: '320000000053', name: 'Suresh Vannan', mobile: '9843200053', landSize: 3.2, cropType: 'rubber', village: 'Pappakudi', district: 'Tirunelveli', soilNitrogenLevel: 138 },
  { aadhaarId: '320000000054', name: 'Karthik Mudaliar', mobile: '9843200054', landSize: 3.3, cropType: 'cotton', village: 'Kadayam', district: 'Tirunelveli', soilNitrogenLevel: 145 },
  { aadhaarId: '320000000055', name: 'Karthik Vannan', mobile: '9843200055', landSize: 5.8, cropType: 'maize', village: 'Kalakkad', district: 'Tirunelveli', soilNitrogenLevel: 138 },
  { aadhaarId: '320000000056', name: 'Radha Kumar', mobile: '9843200056', landSize: 4.4, cropType: 'banana', village: 'Cheranmahadevi Rural', district: 'Tirunelveli', soilNitrogenLevel: 144 },
  { aadhaarId: '320000000057', name: 'Gita Iyer', mobile: '9843200057', landSize: 5.6, cropType: 'groundnut', village: 'Alangulam', district: 'Tirunelveli', soilNitrogenLevel: 129 },
  { aadhaarId: '320000000058', name: 'Gita Vannan', mobile: '9843200058', landSize: 3.4, cropType: 'cotton', village: 'Kadayanallur', district: 'Tirunelveli', soilNitrogenLevel: 123 },
  { aadhaarId: '320000000059', name: 'Babu Pillai', mobile: '9843200059', landSize: 1.7, cropType: 'cotton', village: 'Sankarankoil', district: 'Tirunelveli', soilNitrogenLevel: 124 },
  // --- Added 10 more to Salem ---
  { aadhaarId: '320000000060', name: 'Vijay Naidu', mobile: '9843200060', landSize: 4.2, cropType: 'groundnut', village: 'Yercaud', district: 'Salem', soilNitrogenLevel: 143 },
  { aadhaarId: '320000000061', name: 'Lakshmi Mudaliar', mobile: '9843200061', landSize: 1.7, cropType: 'groundnut', village: 'Valapady', district: 'Salem', soilNitrogenLevel: 147 },
  { aadhaarId: '320000000062', name: 'Gopi Rao', mobile: '9843200062', landSize: 1.3, cropType: 'rubber', village: 'Gangavalli', district: 'Salem', soilNitrogenLevel: 157 },
  { aadhaarId: '320000000063', name: 'Sita Rao', mobile: '9843200063', landSize: 5.2, cropType: 'groundnut', village: 'Pethanaickenpalayam', district: 'Salem', soilNitrogenLevel: 135 },
  { aadhaarId: '320000000064', name: 'Anand Rao', mobile: '9843200064', landSize: 4.6, cropType: 'sugarcane', village: 'Kadayampatti', district: 'Salem', soilNitrogenLevel: 159 },
  { aadhaarId: '320000000065', name: 'Karthik Naidu', mobile: '9843200065', landSize: 3.7, cropType: 'cotton', village: 'Konganapuram', district: 'Salem', soilNitrogenLevel: 148 },
  { aadhaarId: '320000000066', name: 'Anand Chettiar', mobile: '9843200066', landSize: 1.1, cropType: 'sugarcane', village: 'Macdonalds Choultry', district: 'Salem', soilNitrogenLevel: 126 },
  { aadhaarId: '320000000067', name: 'Santhi Rao', mobile: '9843200067', landSize: 2.2, cropType: 'banana', village: 'Panamarathupatti', district: 'Salem', soilNitrogenLevel: 121 },
  { aadhaarId: '320000000068', name: 'Kala Rajan', mobile: '9843200068', landSize: 2.5, cropType: 'groundnut', village: 'Ayothiapattinam', district: 'Salem', soilNitrogenLevel: 147 },
  { aadhaarId: '320000000069', name: 'Suresh Rao', mobile: '9843200069', landSize: 2.1, cropType: 'maize', village: 'Nangavalli', district: 'Salem', soilNitrogenLevel: 152 },
];

async function seed() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    // Delete all existing farmers first
    await Farmer.destroy({ where: {} });
    console.log('Cleared existing farmer records.');

    let created = 0;
    for (const f of farmers) {
      await Farmer.create(f);
      created++;
    }

    console.log(`\nSeeding complete:`);
    console.log(`  Created : ${created} Tamil Nadu farmers`);
    console.log(`\nFarmer Aadhaar Reference:`);
    console.log('─'.repeat(80));
    console.log('Aadhaar         | Name                     | Crop       | Land  | Village');
    console.log('─'.repeat(80));
    farmers.forEach(f =>
      console.log(
        `${f.aadhaarId.padEnd(16)}| ${f.name.padEnd(25)}| ${f.cropType.padEnd(11)}| ${String(f.landSize).padEnd(6)}| ${f.village}`
      )
    );
    console.log('─'.repeat(80));
  } catch (err) {
    console.error('Seeding failed:', err.message);
  } finally {
    await sequelize.close();
  }
}

seed();
