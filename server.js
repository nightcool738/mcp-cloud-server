import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); // web arayüzü klasörü

// === MCP Kuyruk sistemi ===
const TOKEN = process.env.TOKEN || "secret123"; // agent ile aynı olmalı
const queue = [];
const results = new Map();

// Token kontrolü (agent erişimi)
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (token !== TOKEN) return res.status(403).send("unauthorized");
  next();
}

// Yeni komut ekleme (web veya API üzerinden)
app.post("/enqueue", (req, res) => {
  const id = uuidv4();
  queue.push({ id, ...req.body });
  console.log("🆕 Kuyruğa eklendi:", req.body.tool);
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

// === Web Arayüz ===
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// === Sunucu Başlat ===
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`☁️ Server + WebUI running on ${PORT}`));
