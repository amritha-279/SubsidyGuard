import { DataTypes } from 'sequelize';
import sequelize from '../db.js';

const Farmer = sequelize.define('Farmer', {
  aadhaarId: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  mobile: { type: DataTypes.STRING, allowNull: true },
  landSize: { type: DataTypes.FLOAT, allowNull: false },
  cropType: { type: DataTypes.STRING, allowNull: false },
  soilNitrogenLevel: { type: DataTypes.FLOAT, defaultValue: 150 },
  village: { type: DataTypes.STRING, allowNull: false },
  district: { type: DataTypes.STRING, allowNull: true }
});

export default Farmer;
