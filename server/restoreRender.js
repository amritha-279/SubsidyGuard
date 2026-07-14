import fs from 'fs';
import sequelize from './db.js';
import User from './models/User.js';
import Farmer from './models/Farmer.js';
import Transaction from './models/Transaction.js';
import ClusterAlert from './models/ClusterAlert.js';
import Retailer from './models/Retailer.js';
import Inventory from './models/Inventory.js';
import StockTransaction from './models/StockTransaction.js';
import ApprovalRequest from './models/ApprovalRequest.js';
import NotificationState from './models/NotificationState.js';

async function restoreData() {
  try {
    await sequelize.authenticate();
    console.log('Connected to Render database.');
    
    const rawData = fs.readFileSync('./backup.json', 'utf8');
    const data = JSON.parse(rawData);
    
    // Sync models just to ensure tables exist
    await sequelize.sync();
    
    console.log(`Restoring ${data.users.length} users...`);
    await User.bulkCreate(data.users, { ignoreDuplicates: true });
    
    console.log(`Restoring ${data.farmers.length} farmers...`);
    await Farmer.bulkCreate(data.farmers, { ignoreDuplicates: true });
    
    console.log(`Restoring ${data.transactions.length} transactions...`);
    await Transaction.bulkCreate(data.transactions, { ignoreDuplicates: true });
    
    console.log(`Restoring ${data.clusterAlerts.length} cluster alerts...`);
    await ClusterAlert.bulkCreate(data.clusterAlerts, { ignoreDuplicates: true });
    
    console.log(`Restoring ${data.retailers.length} retailers...`);
    await Retailer.bulkCreate(data.retailers, { ignoreDuplicates: true });
    
    console.log(`Restoring ${data.inventory.length} inventory items...`);
    await Inventory.bulkCreate(data.inventory, { ignoreDuplicates: true });
    
    console.log(`Restoring ${data.stockTransactions.length} stock transactions...`);
    await StockTransaction.bulkCreate(data.stockTransactions, { ignoreDuplicates: true });
    
    console.log(`Restoring ${data.approvalRequests.length} approval requests...`);
    await ApprovalRequest.bulkCreate(data.approvalRequests, { ignoreDuplicates: true });
    
    console.log(`Restoring ${data.notificationStates.length} notification states...`);
    await NotificationState.bulkCreate(data.notificationStates, { ignoreDuplicates: true });
    
    console.log('Restore completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error restoring data:', error);
    process.exit(1);
  }
}

restoreData();
