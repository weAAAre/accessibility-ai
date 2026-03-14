# Figma A11y Audit — Setup Guide

This skill requires the **figma-console MCP server** to interact with Figma files. Follow these steps to set everything up.

## 1. Install the Figma Desktop Bridge Plugin

The MCP server communicates with your Figma file through a local WebSocket bridge. You need to install the plugin once — it persists across sessions.

1. Open **Figma Desktop** (the desktop app, not the browser version).
2. Go to **Plugins → Development → Import plugin from manifest…**
3. Navigate to the `figma-desktop-bridge/manifest.json` inside the `figma-console-mcp` package directory.
   - If you installed via npx, run this command to find the directory:
     ```bash
     npx figma-console-mcp@latest --print-path
     ```
   - Then look for `figma-desktop-bridge/manifest.json` inside that path.
4. Select the `manifest.json` file and confirm.
5. Run the plugin in your Figma file — it auto-connects via WebSocket (it scans ports 9223–9232).

This is a **one-time setup**. The plugin stays in your Development plugins list and you just need to run it each time you open a Figma file you want to audit.

## 2. Get a Figma Personal Access Token

The MCP server needs a token to access the Figma API (for reading comments, file metadata, etc.).

1. Go to [Figma Account Settings](https://www.figma.com/settings) → **Personal access tokens**.
2. Click **Generate new token**.
3. Give it a descriptive name (e.g., "MCP Audit").
4. Copy the token — you'll need it when starting the MCP server.

## 3. Configure the MCP Server

Add the `figma-console` MCP server to your workspace. Create or update `.vscode/mcp.json`:

```json
{
  "servers": {
    "figma-console": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "figma-console-mcp@latest"],
      "env": {
        "FIGMA_ACCESS_TOKEN": "${input:figma-access-token}",
        "ENABLE_MCP_APPS": "true"
      }
    }
  },
  "inputs": [
    {
      "id": "figma-access-token",
      "type": "promptString",
      "description": "Figma Access Token",
      "password": true
    }
  ]
}
```

This configuration prompts you for the token each time VS Code starts the server.

## 4. Install Python dependency

The skill generates the Excel report using Python's `openpyxl` library. If it's not installed:

```bash
pip3 install openpyxl
```

## 5. Verify the setup

1. Open Figma Desktop with the file you want to audit.
2. Run the **Desktop Bridge** plugin (Plugins → Development → figma-desktop-bridge).
3. Open VS Code and make sure the `figma-console` MCP server starts (you'll be prompted for your token).
4. Ask the agent to check the Figma connection — it should see the open file.
