const express = require("express");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const Papa = require("papaparse");

// CSV loader async
const loadCSV = async (db) => {
  const filePath = path.join(__dirname, "../ml/ml_models/X_test_rf.csv");
  if (!fs.existsSync(filePath)) {
    console.log("CSV tidak ditemukan:", filePath);
    return;
  }

  const csvFile = fs.readFileSync(filePath, "utf8");
  const parsed = Papa.parse(csvFile, { header: true, skipEmptyLines: true });

  let processed = 0;
  for (const row of parsed.data) {
    if (!row.name) continue;

    // Panggil Python langsung
    const prediction = await new Promise((resolve, reject) => {
      const py = spawn("python3", [path.join(__dirname, "../ml/ml_models/predict_leads.py")]);
      let output = "";
      py.stdout.on("data", (data) => (output += data.toString()));
      py.stderr.on("data", (err) => console.error(err.toString()));
      py.on("close", (code) => {
        if (code !== 0) return reject("Python script error");
        resolve(JSON.parse(output));
      });
      py.stdin.write(JSON.stringify(row));
      py.stdin.end();
    });

    const values = [
      row.name, row.phone_number, Number(row.age) || 0, row.job, row.marital, row.education,
      row.default || "no", row.housing || "no", row.loan || "no", row.contact, row.month, row.day || "",
      Number(row.duration) || 0, Number(row.campaign) || 0, Number(row.pdays) || 0, Number(row.previous) || 0,
      row.poutcome || "", Number(row["emp.var.rate"]) || 0, Number(row["cons.price.idx"]) || 0,
      Number(row["cons.conf.idx"]) || 0, Number(row.euribor3m) || 0, Number(row["nr.employed"]) || 0,
      prediction.lead_score, prediction.status_kampanye, JSON.stringify(prediction.aktivitas),
      "", prediction.subscription_status
    ];

    const sql = `
      INSERT INTO leads (
        name, phone_number, age, job, marital, education, default_status,
        housing, loan, contact, month, day, duration, campaign, pdays, previous,
        poutcome, emp_var_rate, cons_price_idx, cons_conf_idx, euribor3m, nr_employed,
        lead_score, status_kampanye, aktivitas, alasan_status, subscription_status
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON DUPLICATE KEY UPDATE 
        name=VALUES(name), age=VALUES(age), job=VALUES(job), lead_score=VALUES(lead_score)
    `;

    await new Promise((resolve, reject) => {
      db.query(sql, values, (err) => {
        if (err) return reject(err);
        processed++;
        resolve();
      });
    });
  }

  console.log(`✅ CSV selesai. Total baris diproses: ${processed}`);
};

// Router
const createLeadsRouter = (db) => {
  const router = express.Router();

  // POST /leads → prediksi & insert
  router.post("/", async (req, res) => {
    const data = req.body;

    try {
      // Panggil Python
      const prediction = await new Promise((resolve, reject) => {
        const py = spawn("python3", [path.join(__dirname, "../ml/ml_models/predict_leads.py")]);
        let output = "";
        py.stdout.on("data", (data) => (output += data.toString()));
        py.stderr.on("data", (err) => console.error(err.toString()));
        py.on("close", (code) => {
          if (code !== 0) return reject("Python script error");
          resolve(JSON.parse(output));
        });
        py.stdin.write(JSON.stringify(data));
        py.stdin.end();
      });

      const values = [
        data.name, data.phone_number, Number(data.age) || 0, data.job, data.marital, data.education,
        data.default_status || "no", data.housing || "no", data.loan || "no", data.contact,
        data.month, data.day || "", Number(data.duration) || 0, Number(data.campaign) || 0,
        Number(data.pdays) || 0, Number(data.previous) || 0, data.poutcome || "unknown",
        Number(data.emp_var_rate) || 0, Number(data.cons_price_idx) || 0, Number(data.cons_conf_idx) || 0,
        Number(data.euribor3m) || 0, Number(data.nr_employed) || 0, prediction.lead_score,
        prediction.status_kampanye, JSON.stringify(prediction.aktivitas), "", prediction.subscription_status
      ];

      const sql = `
        INSERT INTO leads (
          name, phone_number, age, job, marital, education, default_status,
          housing, loan, contact, month, day, duration, campaign, pdays, previous,
          poutcome, emp_var_rate, cons_price_idx, cons_conf_idx, euribor3m, nr_employed,
          lead_score, status_kampanye, aktivitas, alasan_status, subscription_status
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON DUPLICATE KEY UPDATE 
          name=VALUES(name), age=VALUES(age), job=VALUES(job), lead_score=VALUES(lead_score)
      `;

      db.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.status(201).json({ success: true, lead_score: prediction.lead_score });
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Prediksi gagal" });
    }
  });

  // GET /leads → semua nasabah
  router.get("/", (req, res) => {
    db.query("SELECT * FROM leads ORDER BY lead_score DESC", (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  });

  return router;
};

module.exports = { loadCSV, createLeadsRouter };
