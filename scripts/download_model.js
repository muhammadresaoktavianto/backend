const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

async function downloadModel() {
    const fileId = "1F0O0eQi8rNnICfQXm5UIdHtYJ0PiDMXv"; 
    const url = `https://drive.google.com/uc?export=download&id=${fileId}`;

    const destPath = path.join(__dirname, "../ml/models/rf_model_lead.pkl");
    const res = await fetch(url);

    if (!res.ok) throw new Error("Gagal download model");

    const fileStream = fs.createWriteStream(destPath);
    await new Promise((resolve) => {
        res.body.pipe(fileStream);
        res.body.on("end", resolve);
    });

    console.log("Model ML berhasil didownload ✔");
}

downloadModel();
