# MCP Cloud Server with ChatGPT Integration

Modern Model Context Protocol (MCP) server with ChatGPT integration.

## 🚀 Features

- ✅ **File System Tools**: Read, write, list files
- ✅ **Script Execution**: Run local scripts and commands
- ✅ **System Info**: Get CPU, RAM, uptime details
- ✅ **ChatGPT Integration**: Direct OpenAI API access via MCP

## 📦 Installation

```bash
npm install
```

## 🔑 Configuration

Create a `.env` file:

```bash
OPENAI_API_KEY=your-openai-api-key-here
```

## 🎯 Usage

### Local Development

```bash
node mcp-server.js
```

### Claude Desktop Integration

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mcp-cloud-server": {
      "command": "node",
      "args": ["C:\\path\\to\\mcp-server.js"],
      "env": {
        "OPENAI_API_KEY": "your-key-here"
      }
    }
  }
}
```

## 🌐 Render Deployment

1. Push to GitHub
2. Connect to Render
3. Add `OPENAI_API_KEY` environment variable in Render Dashboard
4. Deploy!

## 🛠️ Available Tools

- `listFiles` - List directory contents
- `readFile` - Read file contents
- `writeFile` - Create or update files
- `runScript` - Execute scripts
- `getSystemInfo` - System information
- `chatGPT` - OpenAI ChatGPT API

## 📝 License

MIT
