# SubsidyGuard - Setup Instructions

## Prerequisites
- Node.js (v16+)
- MongoDB (running locally or MongoDB Atlas)

## Installation

### 1. Install MongoDB
Download and install MongoDB from https://www.mongodb.com/try/download/community
Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas

### 2. Backend Setup

```bash
cd server
npm install
```

### 3. Frontend Setup

```bash
cd client
npm install
```

## Running the Application

### 1. Start MongoDB
If using local MongoDB:
```bash
mongod
```

### 2. Start Backend Server
```bash
cd server
npm run dev
```
Server runs on http://localhost:5000

### 3. Start Frontend
```bash
cd client
npm run dev
```
Frontend runs on http://localhost:5173

## Creating Test Users

### Register a Retailer
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kisan Seva Kendra",
    "email": "retailer@test.com",
    "password": "password123",
    "role": "RETAILER",
    "shopId": "RET001"
  }'
```

### Register an Officer
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Agriculture Officer",
    "email": "officer@test.com",
    "password": "password123",
    "role": "OFFICER"
  }'
```

## Login Credentials

After registration, use these credentials:

**Retailer:**
- Email: retailer@test.com
- Password: password123

**Officer:**
- Email: officer@test.com
- Password: password123

## Features Implemented

### 1. Authentication
- JWT-based login/register
- Role-based access (RETAILER/OFFICER)
- Bcrypt password hashing

### 2. Verification Logic
- Crop-based fertilizer calculation:
  - Wheat: 4 bags/acre
  - Rice: 5 bags/acre
  - Cotton: 6 bags/acre
  - Maize: 3 bags/acre
- Status determination:
  - GREEN: quantity ≤ recommended
  - YELLOW: quantity > recommended AND ≤ 1.5x recommended
  - RED: quantity > 1.5x recommended

### 3. Fraud Detection
- Frequent purchase detection (>2 purchases in 30 days)
- Cluster fraud detection (3+ flagged transactions from same retailer within 1 hour)

### 4. Database Models
- Users (authentication)
- Farmers (land records)
- Transactions (purchase history)
- Retailers (shop information)
- ClusterAlerts (fraud patterns)

### 5. Admin Dashboard
- Real-time transaction monitoring
- Statistics (GREEN/YELLOW/RED counts)
- Cluster alerts view

## API Endpoints

### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login user

### Transactions
- POST /api/transactions/verify - Verify fertilizer purchase

### Admin
- GET /api/admin/stats - Get dashboard statistics
- GET /api/admin/clusters - Get cluster alerts

## Environment Variables

Create `.env` file in server directory:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/subsidyguard
JWT_SECRET=subsidy_guard_secret_key_2024
```

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check MONGO_URI in .env file
- For MongoDB Atlas, use connection string from Atlas dashboard

### Port Already in Use
- Change PORT in server/.env
- Update API URLs in frontend files

### CORS Errors
- Ensure backend is running on port 5000
- Check frontend is making requests to correct URL
