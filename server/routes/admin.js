import express from 'express';
import { Op, fn, col, literal } from 'sequelize';
import Transaction from '../models/Transaction.js';
import ClusterAlert from '../models/ClusterAlert.js';
import User from '../models/User.js';
import Farmer from '../models/Farmer.js';
import Inventory from '../models/Inventory.js';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ML_CONFIG_PATH = path.join(__dirname, '../../ml_service/fertilizer_config.json');

const router = express.Router();

// Main dashboard stats with optional filters
router.get('/stats', async (req, res) => {
  try {
    const { district, village, retailer_id, crop_type, from_date, to_date } = req.query;

    const where = {};
    if (retailer_id) where.retailerId = retailer_id;
    if (crop_type)   where.cropType   = crop_type;
    if (from_date || to_date) {
      where.timestamp = {};
      if (from_date) where.timestamp[Op.gte] = new Date(from_date);
      if (to_date)   where.timestamp[Op.lte] = new Date(to_date);
    }

    const transactions = await Transaction.findAll({ where, order: [['timestamp', 'DESC']] });

    const total   = transactions.length;
    const green   = transactions.filter(t => t.status === 'GREEN').length;
    const yellow  = transactions.filter(t => t.status === 'YELLOW').length;
    const red     = transactions.filter(t => t.status === 'RED' || t.status === 'BLOCKED').length;
    const blocked = transactions.filter(t => t.status === 'BLOCKED').length;
    const flagged = yellow + red;

    const withProb = transactions.filter(t => t.fraudProbability !== null);
    const avgFraudProb = withProb.length > 0
      ? (withProb.reduce((s, t) => s + t.fraudProbability, 0) / withProb.length).toFixed(1)
      : null;

    // Attach ApprovalRequest if any
    const { default: ApprovalRequest } = await import('../models/ApprovalRequest.js');
    const enhancedTransactions = await Promise.all(transactions.map(async (txn) => {
      const approval = await ApprovalRequest.findOne({ where: { transactionId: txn.transactionId } });
      return { ...txn.toJSON(), approvalRequest: approval ? approval.toJSON() : null };
    }));

    res.json({ transactions: enhancedTransactions, stats: { total, flagged, green, yellow, red, blocked, avgFraudProb } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cluster alerts
router.get('/clusters', async (req, res) => {
  try {
    const clusters = await ClusterAlert.findAll({ order: [['detectedAt', 'DESC']], limit: 20 });
    res.json({ clusters });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/retailer-risk', async (req, res) => {
  try {
    const transactions = await Transaction.findAll();
    const users = await User.findAll({ where: { role: 'RETAILER' } });
    const clusters = await ClusterAlert.findAll({ order: [['detectedAt', 'DESC']] });
    
    const retailerClusterMap = {};
    clusters.forEach(c => {
      if (!retailerClusterMap[c.retailerId]) retailerClusterMap[c.retailerId] = [];
      retailerClusterMap[c.retailerId].push(c);
    });

    const retailerMap = {};
    users.forEach(u => {
      const idKey = u.shopId || u.id;
      retailerMap[idKey] = {
        userId: u.id,
        retailerId: idKey,
        shopName: u.shopName || idKey,
        ownerName: u.name,
        licenseNumber: u.licenseNumber || idKey,
        mobile: u.mobile,
        email: u.email,
        district: u.district || 'Unknown',
        village: u.village || 'Unknown',
        registrationDate: u.createdAt,
        status: u.status,
        officerNotes: u.officerNotes || [],
        clusterAlerts: retailerClusterMap[idKey] || [],
        total: 0,
        approved: 0,
        yellow: 0,
        red: 0,
        totalFraudProb: 0,
        probCount: 0
      };
    });

    transactions.forEach(t => {
      if (!retailerMap[t.retailerId]) {
        retailerMap[t.retailerId] = {
          retailerId: t.retailerId, shopName: t.retailerId, ownerName: 'Unknown', licenseNumber: t.retailerId,
          district: 'Unknown', status: 'UNKNOWN', officerNotes: [], clusterAlerts: retailerClusterMap[t.retailerId] || [],
          total: 0, approved: 0, yellow: 0, red: 0, totalFraudProb: 0, probCount: 0
        };
      }
      retailerMap[t.retailerId].total++;
      if (t.status === 'GREEN') retailerMap[t.retailerId].approved++;
      if (t.status === 'YELLOW') retailerMap[t.retailerId].yellow++;
      if (t.status === 'RED' || t.status === 'BLOCKED') retailerMap[t.retailerId].red++;
      if (t.fraudProbability !== null) {
        retailerMap[t.retailerId].totalFraudProb += t.fraudProbability;
        retailerMap[t.retailerId].probCount++;
      }
    });

    const rankings = Object.values(retailerMap).map(r => {
      const fraudPercentage = r.total > 0 ? ((r.yellow + r.red) / r.total) * 100 : 0;
      const redPercentage = r.total > 0 ? (r.red / r.total) * 100 : 0;
      const avgFraudScore = r.probCount > 0 ? (r.totalFraudProb / r.probCount) : 0;
      
      const clusterCount = r.clusterAlerts.length;
      let clusterScore = 0;
      if (clusterCount === 1) clusterScore = 50;
      else if (clusterCount > 1) clusterScore = 100;
      
      let riskScore = (0.4 * fraudPercentage) + (0.3 * avgFraudScore) + (0.2 * redPercentage) + (0.1 * clusterScore);
      riskScore = Math.max(0, Math.min(100, riskScore));
      
      let riskLevel = 'LOW RISK';
      if (riskScore >= 70) riskLevel = 'HIGH RISK';
      else if (riskScore >= 40) riskLevel = 'MEDIUM RISK';
      
      return {
        ...r,
        fraudPercentage: fraudPercentage.toFixed(1),
        avgFraudProbability: avgFraudScore.toFixed(1),
        redPercentage: redPercentage.toFixed(1),
        retailerRiskScore: riskScore.toFixed(1),
        riskLevel
      };
    }).sort((a, b) => b.retailerRiskScore - a.retailerRiskScore);

    res.json({ rankings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// All farmers with full details + transaction stats
router.get('/farmers', async (req, res) => {
  try {
    const farmers = await Farmer.findAll({ order: [['createdAt', 'DESC']] });
    const transactions = await Transaction.findAll();

    const result = farmers.map(f => {
      const farmerTxns = transactions.filter(t => t.farmerAadhaar === f.aadhaarId);
      const flagged = farmerTxns.filter(t => t.status !== 'GREEN').length;
      const withProb = farmerTxns.filter(t => t.fraudProbability !== null);
      const avgFraud = withProb.length > 0
        ? (withProb.reduce((s, t) => s + t.fraudProbability, 0) / withProb.length).toFixed(1)
        : null;
      return {
        aadhaarId: f.aadhaarId,
        name: f.name,
        mobile: f.mobile,
        landSize: f.landSize,
        cropType: f.cropType,
        village: f.village,
        district: f.district,
        total: farmerTxns.length,
        flagged,
        flaggedRate: farmerTxns.length > 0 ? ((flagged / farmerTxns.length) * 100).toFixed(1) : '0.0',
        avgFraudProbability: avgFraud,
        transactions: farmerTxns.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
      };
    });

    res.json({ farmers: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Farmer risk rankings
router.get('/farmer-risk', async (req, res) => {
  try {
    const transactions = await Transaction.findAll();
    const farmerMap = {};

    transactions.forEach(t => {
      if (!farmerMap[t.farmerAadhaar]) {
        farmerMap[t.farmerAadhaar] = { farmerAadhaar: t.farmerAadhaar, total: 0, flagged: 0, totalFraudProb: 0, probCount: 0 };
      }
      farmerMap[t.farmerAadhaar].total++;
      if (t.status !== 'GREEN') farmerMap[t.farmerAadhaar].flagged++;
      if (t.fraudProbability !== null) {
        farmerMap[t.farmerAadhaar].totalFraudProb += t.fraudProbability;
        farmerMap[t.farmerAadhaar].probCount++;
      }
    });

    const rankings = Object.values(farmerMap).map(f => ({
      farmerAadhaar: `...${f.farmerAadhaar.slice(-4)}`,
      total: f.total,
      flagged: f.flagged,
      flaggedRate: f.total > 0 ? ((f.flagged / f.total) * 100).toFixed(1) : 0,
      avgFraudProbability: f.probCount > 0 ? (f.totalFraudProb / f.probCount).toFixed(1) : null
    })).sort((a, b) => b.flaggedRate - a.flaggedRate).slice(0, 10);

    res.json({ rankings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Monthly fraud trends
router.get('/monthly-trends', async (req, res) => {
  try {
    const transactions = await Transaction.findAll({ order: [['timestamp', 'ASC']] });
    const monthMap = {};

    transactions.forEach(t => {
      const key = new Date(t.timestamp).toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!monthMap[key]) monthMap[key] = { month: key, green: 0, yellow: 0, red: 0, avgFraud: 0, count: 0 };
      const statusKey = t.status === 'BLOCKED' ? 'red' : t.status.toLowerCase();
      if (monthMap[key][statusKey] !== undefined) {
        monthMap[key][statusKey]++;
      }
      if (t.fraudProbability !== null) {
        monthMap[key].avgFraud += t.fraudProbability;
        monthMap[key].count++;
      }
    });

    const trends = Object.values(monthMap).map(m => ({
      ...m,
      avgFraud: m.count > 0 ? parseFloat((m.avgFraud / m.count).toFixed(1)) : 0
    }));

    res.json({ trends });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Village fraud heatmap data
router.get('/village-heatmap', async (req, res) => {
  try {
    const [transactions, retailers] = await Promise.all([
      Transaction.findAll(),
      User.findAll({ where: { role: 'RETAILER' } })
    ]);

    // Build retailer status lookup by shopId
    const retailerStatusMap = {};
    retailers.forEach(r => {
      if (r.shopId) retailerStatusMap[r.shopId] = { status: r.status, name: r.name, shopName: r.shopName };
    });

    const villageMap = {};

    transactions.forEach(t => {
      const village = t.village || 'Unknown';
      if (!villageMap[village]) villageMap[village] = { village, total: 0, flagged: 0, avgFraud: 0, count: 0, retailers: {} };
      villageMap[village].total++;
      if (t.status !== 'GREEN') villageMap[village].flagged++;
      if (t.fraudProbability !== null) {
        villageMap[village].avgFraud += t.fraudProbability;
        villageMap[village].count++;
      }
      // Track retailer IDs active in this village
      if (t.retailerId && !villageMap[village].retailers[t.retailerId]) {
        const info = retailerStatusMap[t.retailerId];
        villageMap[village].retailers[t.retailerId] = {
          retailerId: t.retailerId,
          status: info?.status || 'UNKNOWN',
          name: info?.shopName || info?.name || t.retailerId,
        };
      }
    });

    const heatmap = Object.values(villageMap).map(v => {
      const retailerList = Object.values(v.retailers);
      const unapproved = retailerList.filter(r => r.status !== 'APPROVED');
      return {
        village: v.village,
        total: v.total,
        flagged: v.flagged,
        riskScore: v.count > 0 ? parseFloat((v.avgFraud / v.count).toFixed(1)) : 0,
        retailers: retailerList,
        unapprovedRetailers: unapproved,
        hasScamIndicator: unapproved.length > 0,
      };
    }).sort((a, b) => b.riskScore - a.riskScore);

    res.json({ heatmap });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all pending retailer registrations
router.get('/pending-retailers', async (req, res) => {
  try {
    const pending = await User.findAll({ where: { role: 'RETAILER', status: 'PENDING' } });
    const all = await User.findAll({ where: { role: 'RETAILER' } });
    const mapUser = u => ({
      id: u.id, name: u.name, email: u.email, shopId: u.shopId, status: u.status, createdAt: u.createdAt,
      mobile: u.mobile, aadhaarNumber: u.aadhaarNumber, shopName: u.shopName, shopAddress: u.shopAddress,
      district: u.district, village: u.village, pinCode: u.pinCode
    });
    res.json({
      pending: pending.map(mapUser),
      all: all.map(mapUser)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve or reject a retailer
router.patch('/retailer-status/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    await user.update({ status });
    
    // Automatically create default inventory when approved
    if (status === 'APPROVED') {
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
      
      const existing = await Inventory.count({ where: { retailerId: user.id } });
      if (existing === 0) {
        await Inventory.bulkCreate(DEFAULT_FERTILIZERS.map(f => ({
          retailerId: user.id,
          fertilizer: f.fertilizer,
          threshold: f.threshold,
          available: f.init,
          soldToday: 0
        })));
      }
    }

    res.json({ message: `Retailer ${status.toLowerCase()} successfully`, user: { id: user.id, name: user.name, email: user.email, status: user.status } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Reports endpoint
router.get('/reports', async (req, res) => {
  try {
    const { type, from_date, to_date, retailer_id } = req.query;
    const where = {};
    const now = new Date();

    if (type === 'daily') {
      const start = new Date(now); start.setHours(0, 0, 0, 0);
      where.timestamp = { [Op.gte]: start };
    } else if (type === 'weekly') {
      const start = new Date(now); start.setDate(now.getDate() - 7);
      where.timestamp = { [Op.gte]: start };
    } else if (type === 'monthly') {
      const start = new Date(now); start.setDate(now.getDate() - 30);
      where.timestamp = { [Op.gte]: start };
    } else if (type === 'fraud') {
      where.status = { [Op.in]: ['YELLOW', 'RED'] };
    } else if (type === 'retailer' && retailer_id) {
      where.retailerId = retailer_id;
    }

    if (from_date) where.timestamp = { ...(where.timestamp || {}), [Op.gte]: new Date(from_date) };
    if (to_date) where.timestamp = { ...(where.timestamp || {}), [Op.lte]: new Date(to_date + 'T23:59:59') };

    const transactions = await Transaction.findAll({ where, order: [['timestamp', 'DESC']] });
    res.json({ transactions, count: transactions.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Settings endpoints
router.get('/settings/thresholds', (req, res) => {
  try {
    const config = JSON.parse(fs.readFileSync(ML_CONFIG_PATH, 'utf-8'));
    res.json(config.thresholds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/settings/thresholds', async (req, res) => {
  try {
    const config = JSON.parse(fs.readFileSync(ML_CONFIG_PATH, 'utf-8'));
    config.thresholds = { ...config.thresholds, ...req.body };
    fs.writeFileSync(ML_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
    
    // Notify ML service to reload configuration
    try {
      const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
      await axios.post(`${mlUrl}/reload_config`);
    } catch (err) {
      console.warn('Could not reload ML service config:', err.message);
    }
    
    res.json({ message: 'Thresholds updated successfully', thresholds: config.thresholds });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Transaction Approvals ───────────────────────────────────────────────────
router.get('/transaction-approvals', async (req, res) => {
  try {
    const { default: ApprovalRequest } = await import('../models/ApprovalRequest.js');
    const requests = await ApprovalRequest.findAll({ order: [['createdAt', 'DESC']] });
    
    // Join with Transaction data
    const enhanced = await Promise.all(requests.map(async (req) => {
      const txn = await Transaction.findByPk(req.transactionId);
      return {
        ...req.toJSON(),
        transaction: txn ? txn.toJSON() : null
      };
    }));
    
    res.json({ requests: enhanced });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/transaction-approvals/:id', async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const { default: ApprovalRequest } = await import('../models/ApprovalRequest.js');
    const approvalReq = await ApprovalRequest.findByPk(req.params.id);
    if (!approvalReq) return res.status(404).json({ error: 'Request not found' });

    await approvalReq.update({ status, officerRemarks: remarks });

    if (status === 'APPROVED') {
      const txn = await Transaction.findByPk(approvalReq.transactionId);
      if (txn) {
        await txn.update({
          status: 'GREEN',
          reason: 'Excess quantity approved by Agriculture Officer.',
          isCompleted: true
        });

        // ── Deduct Stock ────────────────────────────────────────────────────────
        const retailer = await User.findOne({ where: { shopId: txn.retailerId, role: 'RETAILER' } });
        if (retailer) {
          const item = await Inventory.findOne({ 
            where: { retailerId: retailer.id, fertilizer: txn.fertilizerType } 
          });
          if (item) {
            const beforeQuantity = item.available;
            const afterQuantity = Math.max(0, item.available - txn.quantity);
            await item.update({
              available: afterQuantity,
              soldToday: item.soldToday + txn.quantity
            });

            const StockTransaction = (await import('../models/StockTransaction.js')).default;
            await StockTransaction.create({
              retailerId: retailer.id,
              action: 'SALE',
              fertilizer: txn.fertilizerType,
              quantity: txn.quantity,
              beforeQuantity,
              afterQuantity,
              user: 'Officer',
              remarks: `Officer Approved Transaction ${txn.transactionId}`
            });

            if (req.io) {
              req.io.emit('inventory_updated', { retailerId: retailer.id });
            }
          }
        }
      }
    } else if (status === 'REJECTED') {
      const txn = await Transaction.findByPk(approvalReq.transactionId);
      if (txn) {
        await txn.update({
          status: 'BLOCKED',
          reason: 'Excess quantity rejected by Agriculture Officer.',
          isCompleted: false
        });
      }
    }

    res.json({ message: `Request ${status.toLowerCase()} successfully.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Alert Status ────────────────────────────────────────────────────────────
router.patch('/transaction-alert-status/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Open', 'Investigating', 'Closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const txn = await Transaction.findByPk(req.params.id);
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });
    
    await txn.update({ investigationStatus: status });
    res.json({ message: 'Alert status updated successfully.', investigationStatus: txn.investigationStatus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Retailer Suspend ────────────────────────────────────────────────────────
router.patch('/retailer-suspend/:id', async (req, res) => {
  try {
    const retailer = await User.findOne({ where: { shopId: req.params.id, role: 'RETAILER' } });
    if (!retailer) return res.status(404).json({ error: 'Retailer not found' });
    
    const { reason, remarks } = req.body;
    const newStatus = retailer.status === 'SUSPENDED' ? 'APPROVED' : 'SUSPENDED';
    
    let notes = Array.isArray(retailer.officerNotes) ? [...retailer.officerNotes] : [];
    if (reason || remarks) {
      notes.push({
        officerName: 'Admin Officer', // Hardcoded for now unless we decode token
        timestamp: new Date().toISOString(),
        note: `Status changed to ${newStatus}. Reason: ${reason || 'N/A'}. Remarks: ${remarks || 'None'}`
      });
    }

    await retailer.update({ status: newStatus, officerNotes: notes });
    
    res.json({ message: `Retailer is now ${newStatus}`, status: retailer.status, officerNotes: notes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Retailer Officer Notes ──────────────────────────────────────────────────
router.patch('/retailer-notes/:id', async (req, res) => {
  try {
    const retailer = await User.findOne({ where: { shopId: req.params.id, role: 'RETAILER' } });
    if (!retailer) return res.status(404).json({ error: 'Retailer not found' });
    
    const { note, officerName } = req.body;
    let notes = Array.isArray(retailer.officerNotes) ? [...retailer.officerNotes] : [];
    notes.push({
      officerName: officerName || 'Admin Officer',
      timestamp: new Date().toISOString(),
      note
    });

    await retailer.update({ officerNotes: notes });
    res.json({ message: 'Note added successfully', officerNotes: notes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
