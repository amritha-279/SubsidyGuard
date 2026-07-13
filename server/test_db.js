import sequelize from './db.js';
async function test() {
  const [users] = await sequelize.query('SELECT * FROM "Users" WHERE role = \'RETAILER\' AND status = \'PENDING\'');
  console.log(users[users.length - 1]);
  process.exit(0);
}
test();
