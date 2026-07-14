import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import { createServer } from 'http';
import { Server } from 'socket.io';
import sequelize from './db.js';
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import adminRoutes from './routes/admin.js';
import inventoryRoutes from './routes/inventory.js';
import notificationRoutes from './routes/notifications.js';

// Import models so Sequelize registers them
import './models/User.js';
import './models/Farmer.js';
import './models/Transaction.js';
import './models/ClusterAlert.js';
import './models/Retailer.js';
import './models/Inventory.js';
import './models/StockTransaction.js';
import './models/ApprovalRequest.js';
import './models/NotificationState.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/force-restore', async (req, res) => {
  try {
    const rawData = fs.readFileSync('./backup.json', 'utf8');
    const data = JSON.parse(rawData);
    
    const { default: User } = await import('./models/User.js');
    const { default: Farmer } = await import('./models/Farmer.js');
    const { default: Transaction } = await import('./models/Transaction.js');
    const { default: ClusterAlert } = await import('./models/ClusterAlert.js');
    const { default: Retailer } = await import('./models/Retailer.js');
    const { default: Inventory } = await import('./models/Inventory.js');
    const { default: StockTransaction } = await import('./models/StockTransaction.js');
    const { default: ApprovalRequest } = await import('./models/ApprovalRequest.js');
    const { default: NotificationState } = await import('./models/NotificationState.js');
    
    await User.bulkCreate(data.users, { ignoreDuplicates: true });
    await Farmer.bulkCreate(data.farmers, { ignoreDuplicates: true });
    await Transaction.bulkCreate(data.transactions, { ignoreDuplicates: true });
    await ClusterAlert.bulkCreate(data.clusterAlerts, { ignoreDuplicates: true });
    await Retailer.bulkCreate(data.retailers, { ignoreDuplicates: true });
    await Inventory.bulkCreate(data.inventory, { ignoreDuplicates: true });
    await StockTransaction.bulkCreate(data.stockTransactions, { ignoreDuplicates: true });
    await ApprovalRequest.bulkCreate(data.approvalRequests, { ignoreDuplicates: true });
    await NotificationState.bulkCreate(data.notificationStates, { ignoreDuplicates: true });
    
    res.json({ message: 'Restore completed successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Subsidy Guard API' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', message: 'Subsidy Guard API is running' });
});

// Sync all models to PostgreSQL then start server
sequelize.sync()
  .then(() => {
    console.log('PostgreSQL connected and tables synced');
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => console.error('Database connection error:', err));
