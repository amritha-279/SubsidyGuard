import { DataTypes } from 'sequelize';
import sequelize from '../db.js';

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('RETAILER', 'OFFICER'), allowNull: false },
  shopId: { type: DataTypes.STRING },
  shopName: { type: DataTypes.STRING },
  mobile: { type: DataTypes.STRING },
  aadhaarNumber: { type: DataTypes.STRING },
  shopAddress: { type: DataTypes.TEXT },
  district: { type: DataTypes.STRING },
  village: { type: DataTypes.STRING },
  pinCode: { type: DataTypes.STRING },
  status: { type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'), defaultValue: 'PENDING' },
  inventory: { type: DataTypes.TEXT },
  licenseNumber: { type: DataTypes.STRING },
  officerNotes: { type: DataTypes.JSON, defaultValue: [] },
  resetOtp: { type: DataTypes.STRING },
  resetOtpExpiry: { type: DataTypes.DATE }
});

export default User;
