# @weAAAre/mcp-a11y-color

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

### Planned tools

- `check-contrast-apca` — APCA (draft WCAG 3) contrast
- `check-link-contrast` — Link vs background + link vs surrounding text
- `check-palette-contrast` — Contrast matrix for all pairs in a palette
- `check-palette-colorblind-safety` — Palette distinguishability across CVD types
- `generate-accessible-palette` — Generate color scales from seed colors + target ratios
- `check-text-on-gradient` — Text readability over gradient backgrounds
- `check-alpha-transparency` — Resolve semi-transparent colors and check contrast
- `check-dark-mode-pair` — Validate colors across light + dark mode
- `check-focus-indicator` — Focus indicator contrast vs component + page background
- `audit-color-tokens` — Audit design token pairs for contrast compliance

## Installation

```bash
npm install -g @weAAAre/mcp-a11y-color
```

Or use directly with `npx`:

```bash
npx @weAAAre/mcp-a11y-color
```

## Configuration

### VS Code (GitHub Copilot)

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "a11y-color": {
      "command": "npx",
      "args": ["-y", "@weAAAre/mcp-a11y-color"]
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
      "args": ["-y", "@weAAAre/mcp-a11y-color"]
    }
  }
}
```

## WCAG criteria covered

| SC | Name | Tools |
| --- | --- | --- |
| 1.4.1 | Use of Color | `simulate-color-blindness` |
| 1.4.3 | Contrast (Minimum) | `check-contrast`, `suggest-contrast-fix`, `find-accessible-color` |
| 1.4.6 | Contrast (Enhanced) | `check-contrast`, `suggest-contrast-fix`, `find-accessible-color` |
| 1.4.11 | Non-text Contrast | `check-contrast` |
| 2.4.7 | Focus Visible | Planned: `check-focus-indicator` |

## License

MIT — [weAAAre](https://weAAAre.com)
