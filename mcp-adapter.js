import express from "express";
import fs from "fs/promises";
import os from "os";
import { exec } from "child_process";

const app = express();
app.use(express.json());

const tools = {
  listFiles: async (params) => {
    const files = await fs.readdir(params.path || ".");
    return { files };
  },
  readFile: async (params) => {
    const content = await fs.readFile(params.path, "utf8");
    return { content };
  },
  writeFile: async (params) => {
    await fs.writeFile(params.path, params.content || "", "utf8");
    return { message: "dosya yazıldı" };
  },
  runScript: async (params) =>
    new Promise((resolve) =>
      exec(params.path, (err, stdout, stderr) =>
        resolve(err ? { error: stderr } : { output: stdout })
      )
    ),
  getSystemInfo: async () => ({
    platform: os.platform(),
    cpu: os.cpus()[0].model,
    totalMem: os.totalmem(),
    freeMem: os.freemem(),
    uptime: os.uptime(),
  }),
};

app.post("/mcp/run", async (req, res) => {
  const { tool, params } = req.body;
  if (!tools[tool]) return res.status(400).json({ error: "geçersiz araç" });
  try {
    const result = await tools[tool](params || {});
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🧩 MCP Adapter aktif -> Port ${PORT}`));
