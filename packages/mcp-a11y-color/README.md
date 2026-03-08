# @weaaare/mcp-a11y-color

MCP (Model Context Protocol) server for **color accessibility**. Gives AI coding agents the ability to verify, simulate, and suggest accessible colors in real-time while writing code.

Covers **WCAG 2.2** (SC 1.4.1, 1.4.3, 1.4.6, 1.4.11, 2.4.7) criteria.

## Tools

| Tool | Description |
| --- | --- |
| `check-contrast` | WCAG 2.2 contrast ratio between fg/bg — pass/fail for AA/AAA, normal/large/UI |
| `get-color-info` | Parse any CSS color → hex, RGB, HSL, luminance, contrast on B/W |
| `suggest-contrast-fix` | Given a failing pair, suggest the minimal change to meet target level |
| `simulate-color-blindness` | Simulate colors under 8 types of color vision deficiency |
| `find-accessible-color` | Given background + hue, find a color meeting a target contrast ratio |
| `apca-contrast` | APCA Lc (WCAG 3.0 draft) perceptual contrast score with polarity and usage recommendation |
| `nearest-color-name` | Find the closest CSS named color(s) using perceptual Delta E distance |
| `analyze-palette-contrast` | N×N contrast matrix for a set of colors — essential for design system audits |
| `generate-cvd-safe-palette` | Generate a palette of N colors distinguishable under all CVD types |
| `analyze-design-tokens` | Audit design tokens for WCAG compliance, auto-classify and suggest fixes |

## Installation

```bash
npm install -g @weaaare/mcp-a11y-color
```

Or use directly with `npx`:

```bash
npx @weaaare/mcp-a11y-color
```

## Configuration

### VS Code (GitHub Copilot)

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "a11y-color": {
      "command": "npx",
      "args": ["-y", "@weaaare/mcp-a11y-color"]
    }
  }
}
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "a11y-color": {
      "command": "npx",
      "args": ["-y", "@weaaare/mcp-a11y-color"]
    }
  }
}
```

## WCAG criteria covered

| SC | Name | Tools |
| --- | --- | --- |
| 1.4.1 | Use of Color | `simulate-color-blindness`, `generate-cvd-safe-palette` |
| 1.4.3 | Contrast (Minimum) | `check-contrast`, `suggest-contrast-fix`, `find-accessible-color`, `analyze-design-tokens` |
| 1.4.6 | Contrast (Enhanced) | `check-contrast`, `suggest-contrast-fix`, `find-accessible-color`, `apca-contrast` |
| 1.4.11 | Non-text Contrast | `check-contrast`, `analyze-palette-contrast` |
| 2.4.7 | Focus Visible | Planned: `check-focus-indicator` |

## License

MIT — [weAAAre](https://weAAAre.com)
