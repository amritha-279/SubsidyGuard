import express from 'express';
import Inventory from '../models/Inventory.js';
import StockTransaction from '../models/StockTransaction.js';
import User from '../models/User.js';

const router = express.Router();

router.get('/:retailerId', async (req, res) => {
  try {
    let inventory = await Inventory.findAll({ 
      where: { retailerId: req.params.retailerId },
      order: [['id', 'ASC']]
    });
    
    if (inventory.length === 0) {
      const DEFAULT_FERTILIZERS = [
        { fertilizer: 'Urea', threshold: 200, init: 850 },
        { fertilizer: 'DAP', threshold: 150, init: 600 },
        { fertilizer: 'MOP', threshold: 100, init: 450 },
        { fertilizer: 'NPK (10-26-26)', threshold: 100, init: 500 },
        { fertilizer: 'NPK (12-32-16)', threshold: 80, init: 480 },
        { fertilizer: 'SSP', threshold: 80, init: 420 },
        { fertilizer: 'Zinc Sulphate', threshold: 50, init: 400 },
        { fertilizer: 'Ammonium Sulphate', threshold: 80, init: 440 }
      ];
      
      await Inventory.bulkCreate(DEFAULT_FERTILIZERS.map(f => ({
        retailerId: req.params.retailerId,
        fertilizer: f.fertilizer,
        threshold: f.threshold,
        available: f.init,
        soldToday: 0
      })));
      
      inventory = await Inventory.findAll({ 
        where: { retailerId: req.params.retailerId },
        order: [['id', 'ASC']]
      });
    }

    res.json({ inventory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/history/:retailerId', async (req, res) => {
  try {
    const history = await StockTransaction.findAll({
      where: { retailerId: req.params.retailerId },
      order: [['date', 'DESC']],
      limit: 100
    });
    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/add', async (req, res) => {
  try {
    const { retailerId, fertilizer, quantity, supplier, batchNumber, expiryDate, remarks, user } = req.body;
    if (quantity <= 0) return res.status(400).json({ error: 'Quantity must be positive' });

    let item = await Inventory.findOne({ where: { retailerId, fertilizer } });
    let beforeQuantity = 0;

    if (!item) {
      item = await Inventory.create({
        retailerId,
        fertilizer,
        available: 0,
        soldToday: 0,
        threshold: req.body.threshold || 100
      });
    } else {
      beforeQuantity = item.available;
    }

    const afterQuantity = beforeQuantity + parseFloat(quantity);

    await item.update({
      available: afterQuantity,
      supplier: supplier || item.supplier,
      batchNumber: batchNumber || item.batchNumber,
      expiryDate: expiryDate || item.expiryDate,
      remarks: remarks || item.remarks
    });

    await StockTransaction.create({
      retailerId,
      action: 'ADD',
      fertilizer,
      quantity: parseFloat(quantity),
      beforeQuantity,
      afterQuantity,
      user: user || 'Retailer',
      remarks
    });

    // Broadcast update
    if (req.io) {
      req.io.emit('inventory_updated', { retailerId });
    }

    res.json({ message: 'Stock added successfully', item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/update', async (req, res) => {
  try {
    const { retailerId, fertilizer, quantity, threshold, supplier, batchNumber, expiryDate, remarks, user } = req.body;
    if (quantity < 0) return res.status(400).json({ error: 'Quantity cannot be negative' });

    let item = await Inventory.findOne({ where: { retailerId, fertilizer } });
    if (!item) return res.status(404).json({ error: 'Fertilizer not found in inventory' });

    const beforeQuantity = item.available;
    const afterQuantity = parseFloat(quantity);
    const difference = Math.abs(afterQuantity - beforeQuantity);

    await item.update({
      available: afterQuantity,
      threshold: threshold !== undefined ? threshold : item.threshold,
      supplier: supplier || item.supplier,
      batchNumber: batchNumber || item.batchNumber,
      expiryDate: expiryDate || item.expiryDate,
      remarks: remarks || item.remarks
    });

    await StockTransaction.create({
      retailerId,
      action: 'UPDATE',
      fertilizer,
      quantity: difference,
      beforeQuantity,
      afterQuantity,
      user: user || 'Retailer',
      remarks: remarks || 'Manual stock update'
    });

    if (req.io) {
      req.io.emit('inventory_updated', { retailerId });
    }

    res.json({ message: 'Stock updated successfully', item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
