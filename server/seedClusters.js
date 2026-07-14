import { Sequelize } from 'sequelize';
import ClusterAlert from './models/ClusterAlert.js';
import sequelize from './db.js';

async function seedClusters() {
  await sequelize.sync();
  
  const count = await ClusterAlert.count();
  if (count > 0) {
    console.log('Clusters already seeded. Deleting and reseeding...');
    await ClusterAlert.destroy({ where: {} });
  }

  await ClusterAlert.bulkCreate([
    {
      alertId: `C-${Date.now() - 100000}`,
      type: 'Time-Window Bulk Purchase',
      retailerId: 'TN-AGR-RET-2026-00125',
      village: 'Nagercoil',
      farmersInvolved: 4,
      totalQuantity: 850,
      severity: 'CRITICAL',
      status: 'OPEN'
    },
    {
      alertId: `C-${Date.now() - 50000}`,
      type: 'Repeated Aadhaar Usage',
      retailerId: 'TN-AGR-RET-2026-002',
      village: 'Usilampatti',
      farmersInvolved: 1,
      totalQuantity: 400,
      severity: 'WARNING',
      status: 'INVESTIGATING'
    }
  ]);
  console.log('Successfully seeded mock clusters!');
  process.exit(0);
}

seedClusters().catch(console.error);
