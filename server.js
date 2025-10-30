// ======================
// MCP Cloud Server + Web Dashboard
// ======================

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";

// Sistem dizin tanımı
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); // Web panel dosyaları

// ======================
// MCP Kuyruk Sistemi
// ======================
const TOKEN = process.env.TOKEN || "secret123"; // Agent ile eşleşmeli
const queue = [];
const results = new Map();

// Basit auth kontrolü
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (token !== TOKEN) return res.status(403).send("unauthorized");
  next();
}

// === API Uçları ===

// Yeni komut ekleme
app.post("/enqueue", (req, res) => {
  const id = uuidv4();
  queue.push({ id, ...req.body });
  console.log("🆕 Kuyruğa eklendi:", req.body.tool || "unknown");
  res.json({ id });
});

// Agent komut çekiyor
app.get("/next", auth, (req, res) => {
  const cmd = queue.shift();
  if (!cmd) return res.status(204).end();
  console.log("💬 Komut verildi:", cmd.tool);
  res.json(cmd);
});

// Agent sonucu gönderiyor
app.post("/result/:id", auth, (req, res) => {
  results.set(req.params.id, req.body);
  console.log("✅ Sonuç geldi:", req.params.id);
  res.sendStatus(200);
});

// Sonucu sorgulama
app.get("/result/:id", (req, res) => {
  res.json(results.get(req.params.id) || {});
});

// ======================
// Web Dashboard
// ======================

// Debug endpoint - klasör kontrolü
app.get("/debug", (req, res) => {
  const fs = require("fs");
  const publicPath = path.join(__dirname, "public");
  const indexPath = path.join(publicPath, "index.html");
  res.json({
    __dirname,
    publicPath,
    indexPath,
    publicExists: fs.existsSync(publicPath),
    indexExists: fs.existsSync(indexPath),
    files: fs.existsSync(publicPath) ? fs.readdirSync(publicPath) : []
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 404 yakalama (opsiyonel)
app.use((req, res) => {
  res.status(404).send("Sayfa bulunamadı 😢");
});

// ======================
// Sunucu Başlat
// ======================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`☁️ Server + WebUI running on ${PORT}`));
