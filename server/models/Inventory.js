import { DataTypes } from 'sequelize';
import sequelize from '../db.js';
import User from './User.js';

const Inventory = sequelize.define('Inventory', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  retailerId: { 
    type: DataTypes.UUID, 
    allowNull: false,
    references: { model: User, key: 'id' }
  },
  fertilizer: { type: DataTypes.STRING, allowNull: false },
  available: { type: DataTypes.FLOAT, defaultValue: 0 },
  soldToday: { type: DataTypes.FLOAT, defaultValue: 0 },
  threshold: { type: DataTypes.FLOAT, defaultValue: 100 },
  supplier: { type: DataTypes.STRING },
  batchNumber: { type: DataTypes.STRING },
  expiryDate: { type: DataTypes.DATE },
  remarks: { type: DataTypes.TEXT }
});

export default Inventory;
