import express from 'express';
import NotificationState from '../models/NotificationState.js';

const router = express.Router();

// Get notification states for a user
router.get('/:userId', async (req, res) => {
  try {
    const states = await NotificationState.findAll({ where: { userId: req.params.userId } });
    res.json({ states });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a notification state (mark read/deleted)
router.patch('/:userId/:notificationId', async (req, res) => {
  try {
    const { userId, notificationId } = req.params;
    const { isRead, isDeleted } = req.body;
    
    let [state, created] = await NotificationState.findOrCreate({
      where: { userId, notificationId },
      defaults: { isRead: false, isDeleted: false }
    });
    
    if (isRead !== undefined) state.isRead = isRead;
    if (isDeleted !== undefined) state.isDeleted = isDeleted;
    
    await state.save();
    res.json({ state });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all as read
router.post('/:userId/mark-all-read', async (req, res) => {
  try {
    const { notificationIds } = req.body;
    for (const id of notificationIds) {
      await NotificationState.findOrCreate({
        where: { userId: req.params.userId, notificationId: id },
        defaults: { isRead: true, isDeleted: false }
      }).then(([state, created]) => {
        if (!created) state.update({ isRead: true });
      });
    }
    res.json({ message: 'All marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
