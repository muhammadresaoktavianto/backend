const express = require("express");
const cors = require("cors");
const db = require("./db");
const { loadCSV, createLeadsRouter } = require("./routes/leads");
const reportsRouter = require("./routes/reports")(db);

const app = express();
const port = process.env.PORT || 5000;

app.use(cors()); // terbuka untuk semua domain
app.use(express.json());

app.use("/leads", createLeadsRouter(db));
app.use("/reports", reportsRouter);

loadCSV(db)
  .then(() => console.log("✅ CSV loader selesai"))
  .catch(err => console.error("❌ Error CSV loader:", err));

app.use((req, res) => res.status(404).json({ error: "Route not found" }));

app.listen(port, () => console.log(`🚀 Backend berjalan di port ${port}`));
