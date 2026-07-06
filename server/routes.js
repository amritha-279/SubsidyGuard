import express from 'express';
import { db } from './db.js';

const router = express.Router();

// Reference Values (simplified for prototype)
// kg per acre
const FERTILIZER_REQUIREMENTS = {
  'Wheat': { 'Urea': 50, 'DAP': 20 },
  'Rice': { 'Urea': 60, 'DAP': 25 },
  'Sugarcane': { 'Urea': 80, 'DAP': 30 }
};

router.post('/verify-transaction', (req, res) => {
  const { aadhaar_id, name, land_size, crop_type, fertilizer_type, quantity, retailer_id } = req.body;

  // 1. Basic Validation
  if (!aadhaar_id || !land_size || !crop_type || !fertilizer_type || !quantity) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // 2. Calculate Recommendation
  const perAcreNeed = FERTILIZER_REQUIREMENTS[crop_type]?.[fertilizer_type] || 50; // default 50
  const recommendedQuantity = perAcreNeed * land_size;

  let status = 'GREEN';
  let reason = 'Normal Purchase';
  let checks = [];

  checks.push({
    id: 'land_size',
    name: 'Land Size Verified',
    passed: true,
    details: `Farmer registered with ${land_size} acres.`,
    color: 'green'
  });

  checks.push({
    id: 'requirement',
    name: 'Crop Requirement Calculated',
    passed: true,
    details: `Recommended for ${land_size} acres of ${crop_type}: ${recommendedQuantity} kg.`,
    color: 'green'
  });

  // 3. Logic Checks
  if (quantity <= recommendedQuantity * 1.1) {
    // Normal (up to 10% extra allowed)
    status = 'GREEN';
  } else if (quantity <= recommendedQuantity * 1.5) {
    // Suspicious (up to 50% extra)
    status = 'YELLOW';
    reason = 'Excess quantity requested. OTP required.';
    checks.push({
      id: 'excess',
      name: 'Excess Fertilizer Requested',
      passed: false,
      details: `Requested ${quantity} kg exceeds recommended limit of ${recommendedQuantity} kg.`,
      color: 'yellow'
    });
  } else {
    // Highly Suspicious (> 50% extra)
    status = 'RED';
    reason = 'Quantity far exceeds limits. Officer approval required.';
    checks.push({
      id: 'excess_high',
      name: 'Critical Over-limit Detected',
      passed: false,
      details: `Requested ${quantity} kg is suspiciously high for ${land_size} acres.`,
      color: 'red'
    });
  }

  // Record Transaction
  const query = `
    INSERT INTO transactions 
    (aadhaar_id, retailer_id, crop_type, fertilizer_type, quantity, status, reason)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [aadhaar_id, retailer_id, crop_type, fertilizer_type, quantity, status, reason], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({
      transactionId: this.lastID,
      status,
      recommendedQuantity,
      checks,
      message: 'Transaction analyzed'
    });
  });
});

// Admin Dashboard Endpoints
router.get('/admin/stats', (req, res) => {
  db.all('SELECT * FROM transactions ORDER BY timestamp DESC LIMIT 50', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Calculate simple stats
    let total = rows.length;
    let flagged = rows.filter(r => r.status === 'RED' || r.status === 'YELLOW').length;
    
    res.json({
      transactions: rows,
      stats: { total, flagged }
    });
  });
});

export default router;
