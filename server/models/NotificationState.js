import { DataTypes } from 'sequelize';
import sequelize from '../db.js';

const NotificationState = sequelize.define('NotificationState', {
  notificationId: { type: DataTypes.STRING, allowNull: false },
  userId:         { type: DataTypes.STRING, allowNull: false },
  isRead:         { type: DataTypes.BOOLEAN, defaultValue: false },
  isDeleted:      { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  indexes: [
    {
      unique: true,
      fields: ['notificationId', 'userId']
    }
  ]
});

export default NotificationState;
