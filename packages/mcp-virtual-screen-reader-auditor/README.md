# @weaaare/mcp-virtual-screen-reader-auditor

MCP (Model Context Protocol) server for **headless virtual screen reader accessibility audits**. Works on any OS — no native screen reader required. Launches a real browser, injects a virtual screen reader, and navigates the live accessibility tree including dynamic/SPA content.

Covers **WCAG 2.2** criteria using the same audit, findings, and reporting framework as `@weaaare/mcp-voiceover-auditor`.

## Tools

| Tool | Description |
| --- | --- |
| `virtual_start` | Start the Virtual Screen Reader on a URL or raw HTML (launches headless browser) |
| `virtual_stop` | Stop the Virtual Screen Reader and release resources |
| `virtual_next` | Move cursor to the next item in the accessibility tree |
| `virtual_previous` | Move cursor to the previous item in the accessibility tree |
| `virtual_act` | Perform default action for the current item (e.g., activate a link/button) |
| `virtual_interact` | Interact with the current container item |
| `virtual_stop_interacting` | Stop interacting with the current container item |
| `virtual_press` | Press a key on the focused item (e.g. `Enter`, `Tab`, `ArrowDown`) |
| `virtual_type` | Type text into the currently focused item |
| `virtual_perform` | Semantic navigation by element type: headings, links, landmarks, forms, figures |
| `virtual_item_text` | Get text of the item under the Virtual Screen Reader cursor |
| `virtual_last_spoken_phrase` | Get the last phrase spoken by the Virtual Screen Reader |
| `virtual_spoken_phrase_log` | Get full spoken phrase history for this session |
| `virtual_item_text_log` | Get full visited item text history for this session |
| `virtual_clear_spoken_phrase_log` | Clear the spoken phrase log |
| `virtual_clear_item_text_log` | Clear the visited item text log |
| `virtual_click` | Click the mouse at the current position |
| `start_audit` | Start a structured audit session with metadata |
| `log_finding` | Log violations/warnings/passes with WCAG criteria and recommendations |
| `get_audit_status` | Get current audit progress and finding counters |
| `get_findings` | Retrieve findings from current or latest session |
| `end_audit` | End audit session and return summary data |
| `generate_report` | Generate reports in Markdown, JSON, or CSV |

## Installation

```bash
npm install -g @weaaare/mcp-virtual-screen-reader-auditor
```

Or use directly with `npx`:

```bash
npx @weaaare/mcp-virtual-screen-reader-auditor
```

## Configuration

### VS Code (GitHub Copilot)

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "virtual-screen-reader-auditor": {
      "command": "npx",
      "args": ["-y", "@weaaare/mcp-virtual-screen-reader-auditor"]
    }
  }
}
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "virtual-screen-reader-auditor": {
      "command": "npx",
      "args": ["-y", "@weaaare/mcp-virtual-screen-reader-auditor"]
    }
  }
}
```

## License

MIT - [weAAAre](https://weAAAre.com)
