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
app.use(express.static(path.join(__dirname, "public"))); // web dosyaları burada

const TOKEN = "secret123";
const queue = [];
const results = new Map();

function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (token !== TOKEN) return res.status(403).send("unauthorized");
  next();
}

app.post("/enqueue", (req, res) => {
  const id = uuidv4();
  queue.push({ id, ...req.body });
  res.json({ id });
});

app.get("/next", auth, (req, res) => {
  const cmd = queue.shift();
  if (!cmd) return res.status(204).end();
  res.json(cmd);
});

app.post("/result/:id", auth, (req, res) => {
  results.set(req.params.id, req.body);
  res.sendStatus(200);
});

app.get("/result/:id", (req, res) => {
  res.json(results.get(req.params.id) || {});
});

// web arayüz
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`☁️ Server + WebUI running on ${PORT}`));
