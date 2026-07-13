import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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
app.use(express.json());

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', message: 'Subsidy Guard API is running' });
});

// Sync all models to PostgreSQL then start server
sequelize.sync({ alter: true })
  .then(() => {
    console.log('PostgreSQL connected and tables synced');
    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => console.error('Database connection error:', err));
