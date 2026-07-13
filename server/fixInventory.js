import { Op } from 'sequelize';
import Inventory from './models/Inventory.js';
import sequelize from './db.js';

const INIT_VALUES = {
  'Urea': 850,
  'DAP': 600,
  'MOP': 450,
  'NPK (10-26-26)': 500,
  'NPK (12-32-16)': 480,
  'SSP': 420,
  'Zinc Sulphate': 400,
  'Ammonium Sulphate': 440
};

async function fixInventory() {
  try {
    await sequelize.authenticate();
    const items = await Inventory.findAll();
    for (let item of items) {
      // Only update if the stock is below 400 (which covers the 200 ones we just set, and 0 ones)
      if (item.available <= 200) {
         const newAmount = INIT_VALUES[item.fertilizer] || 400;
         await item.update({ available: newAmount });
      }
    }
    console.log(`Updated items to 400+ limits.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixInventory();
