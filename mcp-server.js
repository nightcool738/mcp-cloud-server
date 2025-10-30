#!/usr/bin/env node
// ======================
// Gerçek MCP Protocol Server
// Model Context Protocol standardına uygun
// ======================

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import os from "os";
import { exec } from "child_process";
import { promisify } from "util";
import OpenAI from "openai";

const execAsync = promisify(exec);

// OpenAI istemcisi
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ======================
// MCP Server Kurulumu
// ======================
const server = new Server(
  {
    name: "mcp-cloud-server",
    version: "1.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ======================
// Tool Implementasyonları
// ======================

const tools = {
  listFiles: async (params) => {
    try {
      const files = await fs.readdir(params.path || ".");
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ files, path: params.path || "." }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Hata: ${error.message}` }],
        isError: true,
      };
    }
  },

  readFile: async (params) => {
    try {
      const content = await fs.readFile(params.path, "utf8");
      return {
        content: [
          {
            type: "text",
            text: content,
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Hata: ${error.message}` }],
        isError: true,
      };
    }
  },

  writeFile: async (params) => {
    try {
      await fs.writeFile(params.path, params.content || "", "utf8");
      return {
        content: [
          {
            type: "text",
            text: `✅ Dosya yazıldı: ${params.path}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Hata: ${error.message}` }],
        isError: true,
      };
    }
  },

  runScript: async (params) => {
    try {
      const { stdout, stderr } = await execAsync(params.path);
      return {
        content: [
          {
            type: "text",
            text: stdout || stderr || "Script çalıştırıldı",
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Hata: ${error.message}` }],
        isError: true,
      };
    }
  },

  getSystemInfo: async () => {
    const info = {
      platform: os.platform(),
      arch: os.arch(),
      cpu: os.cpus()[0].model,
      totalMem: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
      freeMem: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
      uptime: `${(os.uptime() / 3600).toFixed(2)} saat`,
      hostname: os.hostname(),
    };
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(info, null, 2),
        },
      ],
    };
  },

  chatGPT: async (params) => {
    try {
      const completion = await openai.chat.completions.create({
        model: params.model || "gpt-4",
        messages: [
          {
            role: "user",
            content: params.prompt,
          },
        ],
        temperature: params.temperature || 0.7,
        max_tokens: params.max_tokens || 1000,
      });

      return {
        content: [
          {
            type: "text",
            text: completion.choices[0].message.content,
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `ChatGPT Hatası: ${error.message}` }],
        isError: true,
      };
    }
  },
};

// ======================
// MCP Protocol Handlers
// ======================

// Tool listesi
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "listFiles",
        description: "Belirtilen dizindeki dosyaları listeler",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Listelenecek klasör yolu (varsayılan: mevcut dizin)",
            },
          },
        },
      },
      {
        name: "readFile",
        description: "Belirtilen dosyanın içeriğini okur",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Okunacak dosya yolu",
            },
          },
          required: ["path"],
        },
      },
      {
        name: "writeFile",
        description: "Yeni bir dosya oluşturur veya var olanı yazar",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Dosya yolu",
            },
            content: {
              type: "string",
              description: "Yazılacak içerik",
            },
          },
          required: ["path", "content"],
        },
      },
      {
        name: "runScript",
        description: "Yerel script veya komut çalıştırır",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Çalıştırılacak script yolu veya komut",
            },
          },
          required: ["path"],
        },
      },
      {
        name: "getSystemInfo",
        description: "Sistem bilgilerini döndürür (CPU, RAM, uptime vb.)",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "chatGPT",
        description: "OpenAI ChatGPT ile sohbet et veya soru sor",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "ChatGPT'ye sorulacak soru veya prompt",
            },
            model: {
              type: "string",
              description: "Model adı (varsayılan: gpt-4)",
              enum: ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
            },
            temperature: {
              type: "number",
              description: "Yaratıcılık seviyesi 0-1 arası (varsayılan: 0.7)",
            },
            max_tokens: {
              type: "number",
              description: "Maksimum cevap uzunluğu (varsayılan: 1000)",
            },
          },
          required: ["prompt"],
        },
      },
    ],
  };
});

// Tool çağrıları
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!tools[name]) {
    return {
      content: [{ type: "text", text: `❌ Bilinmeyen araç: ${name}` }],
      isError: true,
    };
  }

  try {
    return await tools[name](args || {});
  } catch (error) {
    return {
      content: [{ type: "text", text: `❌ Hata: ${error.message}` }],
      isError: true,
    };
  }
});

// ======================
// Server Başlat
// ======================
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🎯 MCP Server başlatıldı (stdio mode)");
}

main().catch((error) => {
  console.error("❌ Server hatası:", error);
  process.exit(1);
});
