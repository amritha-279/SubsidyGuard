import express from 'express';
import cors from 'cors';
import { db, setupDatabase } from './db.js';
import routes from './routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Database
setupDatabase();

app.use('/api', routes);

// --- Health Check ---
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', message: 'Subsidy Guard API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
