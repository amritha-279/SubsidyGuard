import express from 'express';
import { Op } from 'sequelize';
import axios from 'axios';
import Farmer from '../models/Farmer.js';
import Transaction from '../models/Transaction.js';
import ClusterAlert from '../models/ClusterAlert.js';
import User from '../models/User.js';
import Inventory from '../models/Inventory.js';
import StockTransaction from '../models/StockTransaction.js';

const router = express.Router();
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// ── Thresholds (must match fertilizer_config.json) ───────────────────────────
const GREEN_MAX_PCT  = 1.05;   // ≤ 105% → GREEN
const YELLOW_MAX_PCT = 1.20;   // ≤ 120% → YELLOW, > 120% → RED

// ── Season helper ─────────────────────────────────────────────────────────────
function getSeason(month) {
  if (month >= 6 && month <= 10) return 'Kharif';
  if (month === 4 || month === 5)  return 'Summer';
  return 'Rabi';
}

// ── Rule-based status from ratio ──────────────────────────────────────────────
function ruleStatus(ratio) {
  if (ratio <= GREEN_MAX_PCT)  return 'GREEN';
  if (ratio <= YELLOW_MAX_PCT) return 'YELLOW';
  return 'RED';
}



// ── ML service call ───────────────────────────────────────────────────────────
async function getMLPrediction(payload) {
  try {
    const res = await axios.post(`${ML_SERVICE_URL}/predict`, payload, { timeout: 5000 });
    return res.data;
  } catch {
    return null;
  }
}

// ── Retailer risk score (0–1) from transaction history ───────────────────────
async function getRetailerRiskScore(retailerId) {
  const total = await Transaction.count({ where: { retailerId } });
  if (total === 0) return 0.0;
  const flagged = await Transaction.count({
    where: { retailerId, status: { [Op.in]: ['YELLOW', 'RED'] } }
  });
  return Math.min(parseFloat((flagged / total).toFixed(2)), 1.0);
}

// ── Village risk score (0–1) from recent flagged transactions ─────────────────
async function getVillageRiskScore(village) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const total = await Transaction.count({
    where: { village, timestamp: { [Op.gte]: thirtyDaysAgo } }
  });
  if (total === 0) return 0.0;
  const flagged = await Transaction.count({
    where: { village, status: { [Op.in]: ['YELLOW', 'RED'] }, timestamp: { [Op.gte]: thirtyDaysAgo } }
  });
  return Math.min(parseFloat((flagged / total).toFixed(2)), 1.0);
}

// ── GET /farmer/:aadhaar — lookup seeded farmer details ─────────────────────
router.get('/farmer/:aadhaar', async (req, res) => {
  try {
    const farmer = await Farmer.findOne({ where: { aadhaarId: req.params.aadhaar } });
    if (!farmer) return res.status(404).json({ error: 'Farmer not found' });
    res.json({
      name:     farmer.name,
      mobile:   farmer.mobile   || '',
      village:  farmer.village  || '',
      district: farmer.district || '',
      landSize: farmer.landSize,
      cropType: farmer.cropType,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── POST /verify ──────────────────────────────────────────────────────────────
router.post('/verify', async (req, res) => {
  try {
    const {
      aadhaar_id, name, land_size, crop_type, fertilizer_type,
      quantity, retailer_id, village, district,
      otp_verified = 0, officer_approved = 0
    } = req.body;

    // ── Input validation ──────────────────────────────────────────────────────
    if (!aadhaar_id || !land_size || !crop_type || !fertilizer_type || !quantity) {
      return res.status(400).json({ error: 'Missing required fields: aadhaar_id, land_size, crop_type, fertilizer_type, quantity' });
    }
    const parsedLandSize  = parseFloat(land_size);
    const requestedQty    = parseFloat(quantity);

    if (isNaN(parsedLandSize) || parsedLandSize <= 0) {
      return res.status(400).json({ error: 'land_size must be a positive number' });
    }
    if (isNaN(requestedQty) || requestedQty <= 0) {
      return res.status(400).json({ error: 'quantity must be a positive number' });
    }

    // ── Retailer district check ───────────────────────────────────────────────
    const retailer = await User.findOne({ where: { shopId: retailer_id, role: 'RETAILER' } });
    const retailerDistrict = retailer?.district || null;

    // Helper to log blocked transactions to the database so they appear in history
    const saveBlockedTransaction = async (reasonText) => {
      try {
        await Transaction.create({
          transactionId: `TXN${Date.now()}`,
          farmerAadhaar: aadhaar_id,
          farmerName: name || 'Unknown',
          retailerId: retailer_id,
          cropType: crop_type,
          fertilizerType: fertilizer_type,
          quantity: requestedQty,
          recommendedQuantity: req.body.frontend_recommended_qty || 0,
          status: 'BLOCKED',
          reason: reasonText,
          village: village || 'Unknown',
          fraudProbability: null,
          isCompleted: false
        });
      } catch (err) {
        console.error('Failed to log blocked transaction:', err);
      }
    };

    if (retailerDistrict && district && district.toLowerCase() !== retailerDistrict.toLowerCase()) {
      await saveBlockedTransaction(`Farmer district (${district}) does not match retailer district (${retailerDistrict}).`);
      return res.status(400).json({
        blocked: true,
        error: `Farmer district (${district}) does not match retailer district (${retailerDistrict}). Transaction not allowed.`,
        checks: [{
          id: 'district_mismatch', name: 'District Mismatch Detected', passed: false, color: 'red',
          details: `Farmer's district (${district}) does not match retailer's district (${retailerDistrict}).`
        }]
      });
    }

    // ── Stock validation ──────────────────────────────────────────────────────
    if (retailer) {
      const inventoryItem = await Inventory.findOne({ 
        where: { retailerId: retailer.id, fertilizer: fertilizer_type } 
      });
      const availableStock = inventoryItem ? inventoryItem.available : 0;
      
      if (requestedQty > availableStock) {
        const blockReason = `Requested quantity (${requestedQty} kg) exceeds available stock (${availableStock} kg).`;
        await saveBlockedTransaction(blockReason);
        return res.status(400).json({
          blocked: true,
          error: blockReason,
          checks: [{
            id: 'stock_exceeded', name: 'Insufficient Stock', passed: false, color: 'red',
            details: `Requested ${requestedQty} kg, but only ${availableStock} kg of ${fertilizer_type} is available.`
          }]
        });
      }
    }

    // ── Fetch or create farmer ────────────────────────────────────────────────
    let farmer = await Farmer.findOne({ where: { aadhaarId: aadhaar_id } });
    if (!farmer) {
      farmer = await Farmer.create({
        aadhaarId: aadhaar_id,
        name: name || 'Unknown',
        landSize: parsedLandSize,
        cropType: crop_type.toLowerCase(),
        village: village || 'Unknown'
      });
    }

    // ── Purchase history ──────────────────────────────────────────────────────
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo  = new Date(Date.now() -  7 * 24 * 60 * 60 * 1000);
    const oneHourAgo    = new Date(Date.now() - 60 * 60 * 1000);

    // Exclude BLOCKED transactions from all history checks
    const purchaseCount30d = await Transaction.count({
      where: { farmerAadhaar: aadhaar_id, status: { [Op.ne]: 'BLOCKED' }, timestamp: { [Op.gte]: thirtyDaysAgo } }
    });

    const lastTxn = await Transaction.findOne({
      where: { farmerAadhaar: aadhaar_id, status: { [Op.ne]: 'BLOCKED' } },
      order: [['timestamp', 'DESC']]
    });
    const daysSinceLast = lastTxn
      ? Math.floor((Date.now() - new Date(lastTxn.timestamp)) / 86400000)
      : 365;

    const previousFraudCount = await Transaction.count({
      where: { farmerAadhaar: aadhaar_id, status: 'RED' }
    });

    // ── Hard block checks (return immediately, do NOT save) ───────────────────

    // Block: same fertilizer already purchased within 30 days
    const sameFertLast30 = await Transaction.findOne({
      where: {
        farmerAadhaar:  aadhaar_id,
        fertilizerType: fertilizer_type,
        status:         { [Op.in]: ['GREEN', 'YELLOW'] },
        timestamp:      { [Op.gte]: thirtyDaysAgo }
      },
      order: [['timestamp', 'DESC']]
    });
    if (sameFertLast30) {
      const daysAgo = Math.floor((Date.now() - new Date(sameFertLast30.timestamp)) / 86400000);
      const nextAllowed = new Date(sameFertLast30.timestamp);
      nextAllowed.setDate(nextAllowed.getDate() + 30);
      const blockReason = `Duplicate purchase blocked: ${fertilizer_type} already purchased ${daysAgo} day(s) ago. Next allowed: ${nextAllowed.toDateString()}.`;
      await saveBlockedTransaction(blockReason);
      return res.status(400).json({
        blocked: true, error: blockReason,
        checks: [{ id: 'repeat_fertilizer_block', name: 'Duplicate Fertilizer Purchase Blocked', passed: false, color: 'red',
          details: `${fertilizer_type} was already purchased ${daysAgo} day(s) ago (${new Date(sameFertLast30.timestamp).toDateString()}). Same fertilizer cannot be purchased within 30 days. Next allowed: ${nextAllowed.toDateString()}.` }]
      });
    }

    // Block: any purchase within last 7 days
    if (lastTxn && daysSinceLast < 7) {
      const nextAllowed = new Date(lastTxn.timestamp);
      nextAllowed.setDate(nextAllowed.getDate() + 7);
      const blockReason = `Purchase too soon: last purchase was ${daysSinceLast} day(s) ago. Minimum 7-day gap required. Next allowed: ${nextAllowed.toDateString()}.`;
      await saveBlockedTransaction(blockReason);
      return res.status(400).json({
        blocked: true, error: blockReason,
        checks: [{ id: 'too_soon_block', name: 'Purchase Too Soon — Blocked', passed: false, color: 'red',
          details: `Last purchase was ${daysSinceLast} day(s) ago (${new Date(lastTxn.timestamp).toDateString()}). Minimum 7-day gap required. Next allowed: ${nextAllowed.toDateString()}.` }]
      });
    }

    // Block: 3 or more purchases already in this 30-day window
    if (purchaseCount30d >= 3) {
      const blockReason = `Monthly limit reached: farmer has already made ${purchaseCount30d} purchases in the last 30 days. Maximum is 3.`;
      await saveBlockedTransaction(blockReason);
      return res.status(400).json({
        blocked: true, error: blockReason,
        checks: [{ id: 'monthly_limit_block', name: 'Monthly Purchase Limit Reached — Blocked', passed: false, color: 'red',
          details: `Farmer has made ${purchaseCount30d} purchases in the last 30 days. Maximum allowed is 3 per 30-day window.` }]
      });
    }

    const retailerRiskScore = await getRetailerRiskScore(retailer_id);
    const villageRiskScore  = await getVillageRiskScore(village || 'Unknown');

    const now   = new Date();
    const month = now.getMonth() + 1;
    const season = getSeason(month);
    const transactionHour = now.getHours();

    // ── Call ML service for recommendation + prediction ───────────────────────
    const mlPayload = {
      land_size:               parsedLandSize,
      crop_type:               crop_type.toLowerCase(),
      fertilizer_type,
      requested_quantity:      requestedQty,
      season,
      month,
      days_since_last_purchase: daysSinceLast,
      purchase_count_30d:      purchaseCount30d,
      previous_fraud_count:    previousFraudCount,
      retailer_risk_score:     retailerRiskScore,
      village_risk_score:      villageRiskScore,
      otp_verified:            parseInt(otp_verified) || 0,
      officer_approved:        parseInt(officer_approved) || 0,
      transaction_hour:        transactionHour
    };

    const mlResult = await getMLPrediction(mlPayload);

    // ── Calculate recommended_quantity based on explicit rules ─────────────
    const baseRates = { Urea: 50, DAP: 40, MOP: 30, NPK: 45, SSP: 35, 'Zinc Sulphate': 10, 'Ammonium Sulphate': 40 };
    const fertKey = Object.keys(baseRates).find(k => fertilizer_type.startsWith(k)) || 'Urea';
    const recommendedQty = Math.round(parsedLandSize * (baseRates[fertKey] || 40));

    const quantityRatio = recommendedQty > 0 ? (requestedQty / recommendedQty) : 1;
    const excessPct     = recommendedQty > 0 ? ((quantityRatio - 1) * 100).toFixed(1) : '0.0';

    // ── Build checks list ─────────────────────────────────────────────────────
    const checks = [];

    if (retailerDistrict) {
      checks.push({
        id: 'district_check', name: 'District Verified', passed: true, color: 'green',
        details: `Farmer and retailer are both in ${retailerDistrict}.`
      });
    }

    checks.push({
      id: 'land_size', name: 'Land Size Verified', passed: true, color: 'green',
      details: `Farmer registered with ${parsedLandSize} acres.`
    });

    checks.push({
      id: 'recommendation', name: 'Crop Requirement Calculated', passed: true, color: 'green',
      details: mlResult
        ? `Recommended for ${parsedLandSize} acres of ${crop_type} (${fertilizer_type}, ${season}): ${recommendedQty} kg. Requested: ${requestedQty} kg (${(quantityRatio * 100).toFixed(1)}% of recommendation).`
        : `Requested: ${requestedQty} kg. ML service unavailable — recommendation could not be calculated.`
    });

    // Quantity ratio checks
    if (quantityRatio > YELLOW_MAX_PCT) {
      checks.push({
        id: 'excess_high', name: 'Critical Over-limit Detected', passed: false, color: 'red',
        details: `Requested quantity exceeds the recommended quantity by ${excessPct}%, which is in the critical threshold. Officer approval required.`
      });
    } else if (quantityRatio > GREEN_MAX_PCT) {
      checks.push({
        id: 'excess_moderate', name: 'Moderate Excess Detected', passed: false, color: 'yellow',
        details: `Requested quantity exceeds the recommended quantity by ${excessPct}%, which is within the warning threshold. OTP verification required.`
      });
    }

    // Frequent purchase
    if (purchaseCount30d >= 3) {
      checks.push({
        id: 'frequent_purchase', name: 'Frequent Purchase Warning', passed: false, color: 'yellow',
        details: `Farmer has made ${purchaseCount30d} purchases in the last 30 days (last: ${daysSinceLast} days ago).`
      });
    } else if (purchaseCount30d >= 2) {
      checks.push({
        id: 'repeat_purchase', name: 'Repeat Purchase Noted', passed: false, color: 'yellow',
        details: `Farmer has made ${purchaseCount30d} purchases in the last 30 days.`
      });
    }

    // Prior fraud
    if (previousFraudCount >= 2) {
      checks.push({
        id: 'fraud_history', name: 'Prior Fraud History', passed: false, color: 'red',
        details: `Farmer has ${previousFraudCount} previously flagged (RED) transactions.`
      });
    } else if (previousFraudCount === 1) {
      checks.push({
        id: 'fraud_history_warn', name: 'Prior Fraud Warning', passed: false, color: 'yellow',
        details: 'Farmer has 1 previously flagged transaction.'
      });
    }

    // ML analysis check
    if (mlResult) {
      const mlColor = mlResult.risk_level === 'GREEN' ? 'green' : mlResult.risk_level === 'YELLOW' ? 'yellow' : 'red';
      checks.push({
        id: 'ml_analysis', name: 'AI Fraud Analysis', passed: mlResult.risk_level === 'GREEN', color: mlColor,
        details: `Fraud probability: ${mlResult.fraud_probability}% | Confidence: ${mlResult.confidence_score}% | ${mlResult.reasons?.[0] ?? ''}`
      });
    }

    // ── Final status ──────────────────────────────────────────────────────────
    const finalStatus = ruleStatus(quantityRatio);

    if (finalStatus === 'RED') {
      const blockReason = `Requested quantity exceeds the recommended quantity by ${excessPct}%, which is strictly prohibited. Transaction blocked.`;
      await saveBlockedTransaction(blockReason);
      return res.status(400).json({
        blocked: true,
        error: blockReason,
        checks: [...checks, { id: 'excess_red', name: 'Critical Over-limit Detected', passed: false, color: 'red', details: blockReason }],
        mlResult
      });
    }

    let reason = finalStatus === 'YELLOW' 
      ? `Requested quantity exceeds the recommended quantity by ${excessPct}%, therefore Agriculture Officer approval is required.` 
      : `Normal purchase within limits.`;

    // ── Save transaction on every verify call (once) ─────────────────────────────────
    const transactionId = `TXN${Date.now()}`;
    await Transaction.create({
      transactionId,
      farmerAadhaar:       aadhaar_id,
      farmerName:          name || farmer.name || 'Unknown',
      retailerId:          retailer_id,
      cropType:            crop_type,
      fertilizerType:      fertilizer_type,
      quantity:            requestedQty,
      recommendedQuantity: recommendedQty,
      status:              finalStatus,
      reason,
      village:             village || 'Unknown',
      fraudProbability:    mlResult?.fraud_probability ?? null
    });

    // ── Cluster detection ─────────────────────────────────────────────────────
    const recentFlagged = await Transaction.findAll({
      where: {
        retailerId: retailer_id,
        timestamp:  { [Op.gte]: oneHourAgo },
        status:     { [Op.in]: ['YELLOW', 'RED'] }
      }
    });

    if (recentFlagged.length >= 3) {
      const uniqueFarmers = new Set(recentFlagged.map(t => t.farmerAadhaar));
      const totalQty      = recentFlagged.reduce((sum, t) => sum + t.quantity, 0);
      await ClusterAlert.create({
        alertId:         `C-${Date.now()}`,
        type:            'Time-Window Bulk Purchase',
        retailerId:      retailer_id,
        village:         village || 'Unknown',
        farmersInvolved: uniqueFarmers.size,
        totalQuantity:   totalQty,
        severity:        'CRITICAL'
      });
      if (req.io) req.io.emit('cluster_alert_new', { retailerId: retailer_id });
    }

    if (req.io) req.io.emit('transaction_new', { transactionId, status: finalStatus });

    res.json({
      transactionId,
      status:              finalStatus,
      recommendedQuantity: recommendedQty,
      quantityRatioPct:    parseFloat((quantityRatio * 100).toFixed(1)),
      checks,
      mlResult,
      message: 'Transaction analyzed'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── POST /request-approval — create an approval request for a RED transaction
router.post('/request-approval', async (req, res) => {
  try {
    const { transactionId } = req.body;
    if (!transactionId) return res.status(400).json({ error: 'transactionId required' });
    const txn = await Transaction.findByPk(transactionId);
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });
    
    // Import ApprovalRequest here to avoid circular dependency if any, or just use it if imported at top
    const { default: ApprovalRequest } = await import('../models/ApprovalRequest.js');

    // Check if one already exists
    const existing = await ApprovalRequest.findOne({ where: { transactionId } });
    if (existing) {
      return res.status(400).json({ error: 'Approval request already submitted for this transaction.' });
    }

    await ApprovalRequest.create({
      transactionId,
      retailerId: txn.retailerId,
      status: 'PENDING'
    });

    res.json({ message: 'Approval request submitted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── POST /confirm — save a pending transaction after retailer confirms ────────
router.post('/confirm', async (req, res) => {
  try {
    const { transactionId } = req.body;
    if (!transactionId) return res.status(400).json({ error: 'transactionId required' });
    const txn = await Transaction.findByPk(transactionId);
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });
    
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

        await StockTransaction.create({
          retailerId: retailer.id,
          action: 'SALE',
          fertilizer: txn.fertilizerType,
          quantity: txn.quantity,
          beforeQuantity,
          afterQuantity,
          user: 'Retailer',
          remarks: `Transaction ${transactionId}`
        });
        
        await txn.update({ isCompleted: true });

        if (req.io) {
          req.io.emit('inventory_updated', { retailerId: retailer.id });
        }
      }
    }

    res.json({ transactionId, status: txn.status, message: 'Sale confirmed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── POST /cancel — cancel a transaction and restore inventory ────────
router.post('/cancel', async (req, res) => {
  try {
    const { transactionId } = req.body;
    if (!transactionId) return res.status(400).json({ error: 'transactionId required' });
    const txn = await Transaction.findByPk(transactionId);
    if (!txn) return res.status(404).json({ error: 'Transaction not found' });
    
    if (txn.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Transaction already cancelled' });
    }

    // ── Restore Stock ────────────────────────────────────────────────────────
    const retailer = await User.findOne({ where: { shopId: txn.retailerId, role: 'RETAILER' } });
    if (retailer) {
      const item = await Inventory.findOne({ 
        where: { retailerId: retailer.id, fertilizer: txn.fertilizerType } 
      });
      if (item) {
        const beforeQuantity = item.available;
        const afterQuantity = item.available + txn.quantity;
        await item.update({
          available: afterQuantity,
          soldToday: Math.max(0, item.soldToday - txn.quantity)
        });

        await StockTransaction.create({
          retailerId: retailer.id,
          action: 'CANCEL',
          fertilizer: txn.fertilizerType,
          quantity: txn.quantity,
          beforeQuantity,
          afterQuantity,
          user: 'Retailer',
          remarks: `Cancelled Transaction ${transactionId}`
        });

        if (req.io) {
          req.io.emit('inventory_updated', { retailerId: retailer.id });
        }
      }
    }

    await txn.update({ status: 'CANCELLED' });

    res.json({ transactionId, status: 'CANCELLED', message: 'Transaction cancelled and stock restored' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── GET /farmer-lookup — fetch farmer details and history ────────
router.get('/farmer-lookup', async (req, res) => {
  try {
    const { type, query } = req.query;
    if (!type || !query) return res.status(400).json({ error: 'type and query required' });

    let whereClause = {};
    if (type === 'aadhaar') whereClause.aadhaarId = query;
    else if (type === 'mobile') whereClause.mobile = query;
    else if (type === 'farmerId') {
      return res.status(404).json({ error: 'Search by Farmer ID is not supported yet' });
    }

    const farmer = await Farmer.findOne({ where: whereClause });
    if (!farmer) return res.status(404).json({ error: 'Farmer not found' });

    const history = await Transaction.findAll({
      where: { farmerAadhaar: farmer.aadhaarId },
      order: [['timestamp', 'DESC']],
      limit: 10
    });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentTxns = history.filter(t => new Date(t.timestamp) >= thirtyDaysAgo);

    const flagged = recentTxns.filter(t => t.status !== 'GREEN').length;
    const riskLevel = flagged >= 2 ? 'RED' : flagged === 1 ? 'YELLOW' : 'GREEN';

    res.json({
      name: farmer.name,
      farmerId: 'FRM-' + farmer.aadhaarId.slice(-4),
      aadhaar: farmer.aadhaarId,
      mobile: farmer.mobile || 'Not available',
      landSize: `${farmer.landSize} Acres`,
      village: farmer.village,
      district: farmer.district || 'Not available',
      cropDetails: farmer.cropType ? farmer.cropType.toUpperCase() : 'N/A',
      subsidyHistory: `${history.length} transactions total`,
      lastPurchaseDate: history.length > 0 ? new Date(history[0].timestamp).toLocaleDateString() : 'N/A',
      purchaseFrequency: `${recentTxns.length} in last 30 days`,
      riskLevel,
      previousPurchases: history.map(t => ({
        date: new Date(t.timestamp).toLocaleDateString(),
        fertilizer: t.fertilizerType,
        qty: `${t.quantity} kg`,
        status: t.status
      }))
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
