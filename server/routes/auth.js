import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'subsidy_guard_secret_key_2024';

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, shopId, licenseNumber, shopName, mobile, aadhaarNumber, shopAddress, district, village, pinCode } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const status = role === 'OFFICER' ? 'APPROVED' : 'PENDING';
    const user = await User.create({ name, email, password: hashedPassword, role, shopId, licenseNumber, shopName, mobile, aadhaarNumber, shopAddress, district, village, pinCode, status });

    if (role === 'RETAILER') {
      return res.json({ message: 'Registration successful. Awaiting Agriculture Officer approval.' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, shopId: user.shopId, licenseNumber: user.licenseNumber, shopName: user.shopName, mobile: user.mobile, district: user.district, village: user.village, pinCode: user.pinCode, shopAddress: user.shopAddress, status: user.status } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, identifier, password } = req.body;
    const loginId = identifier || email;

    console.log(`\n--- LOGIN ATTEMPT ---`);
    console.log(`Incoming request body:`, { email, identifier });
    console.log(`Queried loginId (email/username):`, loginId);

    const user = await User.findOne({ where: { email: loginId } });
    
    if (!user) {
      console.log(`Login failed: User not found in the database for loginId '${loginId}'.`);
      return res.status(401).json({ error: 'User not found. Please register first.' });
    }
    
    console.log(`User found in database. User ID: ${user.id}, Status: ${user.status}`);

    const isValid = await bcrypt.compare(password, user.password);
    console.log(`Password comparison result for user ${user.id}: ${isValid}`);

    if (!isValid) {
      console.log(`Login failed: Incorrect password for user ${user.id}.`);
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    if (user.role === 'RETAILER' && user.status === 'PENDING') {
      console.log(`Login blocked: Retailer ${user.id} is PENDING.`);
      return res.status(403).json({ error: 'Your account is pending Agriculture Officer approval.' });
    }
    if (user.role === 'RETAILER' && user.status === 'REJECTED') {
      console.log(`Login blocked: Retailer ${user.id} is REJECTED.`);
      return res.status(403).json({ error: 'Your account has been rejected. Contact the Agriculture Officer.' });
    }

    console.log(`Login successful for user ${user.id}. Generating JWT...`);
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, shopId: user.shopId, licenseNumber: user.licenseNumber, shopName: user.shopName, mobile: user.mobile, district: user.district, village: user.village, pinCode: user.pinCode, shopAddress: user.shopAddress, status: user.status } });
  } catch (error) {
    console.error(`Login completely failed due to server error:`, error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'No account found with this email.' });
    const otp = '123456';
    const expiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.update({ resetOtp: otp, resetOtpExpiry: expiry });
    res.json({ message: `OTP sent to ${email}`, email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'No account found.' });
    if (user.resetOtp !== otp) return res.status(400).json({ error: 'Invalid OTP.' });
    if (new Date() > new Date(user.resetOtpExpiry)) return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashed, resetOtp: null, resetOtpExpiry: null });
    res.json({ message: 'Password reset successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/change-password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { currentPassword, newPassword } = req.body;
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return res.status(400).json({ error: 'Current password is incorrect.' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashed });
    res.json({ message: 'Password changed successfully' });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.patch('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { name, shopName, mobile, email, district, village, pinCode, shopAddress } = req.body;
    await user.update({ name, shopName, mobile, email, district, village, pinCode, shopAddress });
    res.json({ message: 'Profile updated' });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, shopId: user.shopId, licenseNumber: user.licenseNumber, shopName: user.shopName, mobile: user.mobile, district: user.district, village: user.village, pinCode: user.pinCode, shopAddress: user.shopAddress, status: user.status });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
