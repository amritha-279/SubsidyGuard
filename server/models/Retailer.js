import { DataTypes } from 'sequelize';
import sequelize from '../db.js';

const Retailer = sequelize.define('Retailer', {
  shopId: { type: DataTypes.STRING, primaryKey: true },
  shopName: { type: DataTypes.STRING, allowNull: false },
  village: { type: DataTypes.STRING, allowNull: false },
  district: { type: DataTypes.STRING, allowNull: false }
});

export default Retailer;
