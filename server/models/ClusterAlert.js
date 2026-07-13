import { DataTypes } from 'sequelize';
import sequelize from '../db.js';

const ClusterAlert = sequelize.define('ClusterAlert', {
  alertId: { type: DataTypes.STRING, primaryKey: true },
  type: { type: DataTypes.STRING, allowNull: false },
  retailerId: { type: DataTypes.STRING, allowNull: false },
  village: { type: DataTypes.STRING, allowNull: false },
  farmersInvolved: { type: DataTypes.INTEGER, allowNull: false },
  totalQuantity: { type: DataTypes.FLOAT, allowNull: false },
  severity: { type: DataTypes.ENUM('WARNING', 'CRITICAL'), allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'Pending Action' },
  detectedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

export default ClusterAlert;
