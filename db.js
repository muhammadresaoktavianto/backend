const mysql = require("mysql");

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "bankcp"
});

db.connect(err => {
  if (err) console.error("❌ Gagal koneksi ke MySQL:", err);
  else console.log("✅ Koneksi ke MySQL berhasil");
});

module.exports = db;
