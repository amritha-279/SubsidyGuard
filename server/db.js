import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

export function setupDatabase() {
  db.serialize(() => {
    // 1. Farmers Table
    db.run(`
      CREATE TABLE IF NOT EXISTS farmers (
        aadhaar_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        land_size REAL NOT NULL
      )
    `);

    // 2. Soil Health Table (mock data)
    db.run(`
      CREATE TABLE IF NOT EXISTS soil_health (
        aadhaar_id TEXT PRIMARY KEY,
        n_level REAL,
        p_level REAL,
        k_level REAL,
        status TEXT,
        FOREIGN KEY (aadhaar_id) REFERENCES farmers(aadhaar_id)
      )
    `);

    // 3. Transactions Table
    db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        aadhaar_id TEXT NOT NULL,
        retailer_id TEXT NOT NULL,
        crop_type TEXT NOT NULL,
        fertilizer_type TEXT NOT NULL,
        quantity REAL NOT NULL,
        status TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        reason TEXT,
        FOREIGN KEY (aadhaar_id) REFERENCES farmers(aadhaar_id)
      )
    `);

    // 4. Retailers Table (for cluster detection)
    db.run(`
      CREATE TABLE IF NOT EXISTS retailers (
        retailer_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT NOT NULL
      )
    `);

    // Seed Data
    seedData();
  });
}

function seedData() {
  db.get("SELECT COUNT(*) as count FROM farmers", (err, row) => {
    if (err) return console.error(err);
    if (row.count === 0) {
      console.log("Seeding database with initial data...");
      
      const insertFarmer = db.prepare("INSERT INTO farmers VALUES (?, ?, ?)");
      insertFarmer.run("123456789012", "Rajesh Kumar", 2.5);
      insertFarmer.run("234567890123", "Amit Singh", 5.0);
      insertFarmer.run("345678901234", "Suresh Patel", 1.2);
      insertFarmer.finalize();

      const insertSoil = db.prepare("INSERT INTO soil_health VALUES (?, ?, ?, ?, ?)");
      insertSoil.run("123456789012", 120, 20, 150, "DEFICIENT_N");
      insertSoil.run("234567890123", 250, 45, 200, "NORMAL");
      insertSoil.run("345678901234", 300, 50, 250, "SURPLUS_N");
      insertSoil.finalize();

      const insertRetailer = db.prepare("INSERT INTO retailers VALUES (?, ?, ?)");
      insertRetailer.run("RET001", "Kisan Seva Kendra", "Village A");
      insertRetailer.run("RET002", "Agri Inputs Shop", "Village B");
      insertRetailer.finalize();
    }
  });
}

export { db };
