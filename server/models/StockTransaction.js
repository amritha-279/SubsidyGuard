import { DataTypes } from 'sequelize';
import sequelize from '../db.js';
import User from './User.js';

const StockTransaction = sequelize.define('StockTransaction', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  retailerId: { 
    type: DataTypes.UUID, 
    allowNull: false,
    references: { model: User, key: 'id' }
  },
  action: { 
    type: DataTypes.ENUM('ADD', 'UPDATE', 'SALE', 'CANCEL'),
    allowNull: false
  },
  fertilizer: { type: DataTypes.STRING, allowNull: false },
  quantity: { type: DataTypes.FLOAT, allowNull: false },
  beforeQuantity: { type: DataTypes.FLOAT, allowNull: false },
  afterQuantity: { type: DataTypes.FLOAT, allowNull: false },
  date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  user: { type: DataTypes.STRING },
  remarks: { type: DataTypes.TEXT }
});

export default StockTransaction;
