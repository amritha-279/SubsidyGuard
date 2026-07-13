import { DataTypes } from 'sequelize';
import sequelize from '../db.js';

const Transaction = sequelize.define('Transaction', {
  transactionId:       { type: DataTypes.STRING, primaryKey: true },
  farmerAadhaar:       { type: DataTypes.STRING, allowNull: false },
  farmerName:          { type: DataTypes.STRING, allowNull: true },
  retailerId:          { type: DataTypes.STRING, allowNull: false },
  cropType:            { type: DataTypes.STRING, allowNull: false },
  fertilizerType:      { type: DataTypes.STRING, allowNull: false },
  quantity:            { type: DataTypes.FLOAT,  allowNull: false },
  recommendedQuantity: { type: DataTypes.FLOAT,  allowNull: false },
  status:              { type: DataTypes.ENUM('GREEN', 'YELLOW', 'RED', 'BLOCKED'), allowNull: false },
  reason:              { type: DataTypes.TEXT },
  fraudProbability:    { type: DataTypes.FLOAT,  allowNull: true },
  village:             { type: DataTypes.STRING },
  isCompleted:         { type: DataTypes.BOOLEAN, defaultValue: false },
  investigationStatus: { type: DataTypes.ENUM('Open', 'Investigating', 'Closed'), defaultValue: 'Open' },
  timestamp:           { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

export default Transaction;
