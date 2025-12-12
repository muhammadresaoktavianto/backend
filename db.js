// Load .env dulu (buat lokal testing)
require("dotenv").config(); 
const mysql = require("mysql");

// Debug cek apakah ENV terbaca
console.log("ENV CHECK:", {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  pass: process.env.DB_PASS ? "*****" : "",
  db: process.env.DB_NAME,
  port: process.env.DB_PORT
});

// Koneksi MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) {
    console.error("❌ Gagal koneksi ke MySQL:", err);
  } else {
    console.log("✅ Koneksi ke MySQL berhasil");
  }
});

module.exports = db;
