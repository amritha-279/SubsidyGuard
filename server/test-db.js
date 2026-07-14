import sequelize from './db.js';

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connection to PostgreSQL has been established successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
}

testConnection();
