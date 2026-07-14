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

async function exportData() {
  try {
    await sequelize.authenticate();
    console.log('Connected to local database.');
    
    const data = {
      users: await User.findAll(),
      farmers: await Farmer.findAll(),
      transactions: await Transaction.findAll(),
      clusterAlerts: await ClusterAlert.findAll(),
      retailers: await Retailer.findAll(),
      inventory: await Inventory.findAll(),
      stockTransactions: await StockTransaction.findAll(),
      approvalRequests: await ApprovalRequest.findAll(),
      notificationStates: await NotificationState.findAll()
    };
    
    fs.writeFileSync('./backup.json', JSON.stringify(data, null, 2));
    console.log('Data exported to backup.json successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error exporting data:', error);
    process.exit(1);
  }
}

exportData();
