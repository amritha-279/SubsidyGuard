import { DataTypes } from 'sequelize';
import sequelize from '../db.js';

const ApprovalRequest = sequelize.define('ApprovalRequest', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  transactionId: { type: DataTypes.STRING, allowNull: false },
  retailerId: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'), defaultValue: 'PENDING' },
  officerRemarks: { type: DataTypes.TEXT },
});

export default ApprovalRequest;
