# accessibility-ai

> Accessibility tools and agent skills for AI coding agents — by [weAAAre](https://weAAAre.com), the digital accessibility school.

[![CI](https://github.com/weAAAre/accessibility-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/weAAAre/accessibility-ai/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node >= 24](https://img.shields.io/badge/node-%3E%3D24-brightgreen)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9-orange)](https://pnpm.io/)

## What's inside

This monorepo contains two types of distributable content:

### 🛠️ MCP Servers (`packages/`)

Model Context Protocol servers that give AI assistants programmatic accessibility tooling.

| Package | Description | Install |
|---------|-------------|---------|
| [`@weaaare/mcp-a11y-color`](./packages/mcp-a11y-color/) | Contrast checking, color-blindness simulation, WCAG 2.2 color compliance | `npx @weaaare/mcp-a11y-color` |
| [`@weaaare/mcp-voiceover-auditor`](./packages/mcp-voiceover-auditor/) | Automates accessibility audits using voiceover | `npx @weaaare/mcp-voiceover-auditor` |

### 🧠 Agent Skills (`skills/`)

Reusable procedural knowledge for AI coding agents, distributed via [skills.sh](https://skills.sh).

| Skill | Description | Install |
|-------|-------------|---------|
| [`aria-patterns`](./skills/aria-patterns/) | Accessible ARIA patterns for interactive UI components | `npx skills add weAAAre/accessibility-ai@aria-patterns` |

---

## Quick start

### Install all skills

```bash
npx skills add weAAAre/accessibility-ai
```

### Install a specific skill

```bash
npx skills add weAAAre/accessibility-ai@aria-patterns
```

### Use an MCP server (Claude Desktop, VS Code, etc.)

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "mcp-a11y-color": {
      "command": "npx",
      "args": ["-y", "@weaaare/mcp-a11y-color"]
    },
    "mcp-voiceover-auditor": {
      "command": "npx",
      "args": ["-y", "@weaaare/mcp-voiceover-auditor"]
    }
  }
}
```

---

## MCP tools — `@weaaare/mcp-a11y-color`

| Tool | Description |
|------|-------------|
| `check-contrast` | WCAG 2.2 contrast ratio between fg/bg — pass/fail for AA/AAA, normal/large/UI |
| `get-color-info` | Parse any CSS color → hex, RGB, HSL, luminance, contrast on B/W |
| `suggest-contrast-fix` | Suggest the minimal color change to meet a target WCAG level |
| `simulate-color-blindness` | Simulate colors under 8 types of color vision deficiency |
| `find-accessible-color` | Given background + hue, find a color meeting a target contrast ratio |
| `apca-contrast` | APCA Lc (WCAG 3.0 draft) perceptual contrast score |
| `nearest-color-name` | Find the closest CSS named color(s) using perceptual Delta E |
| `analyze-palette-contrast` | N×N contrast matrix for a set of colors — design system audits |
| `generate-cvd-safe-palette` | Generate a palette distinguishable under all CVD types |
| `analyze-design-tokens` | Audit design tokens for WCAG compliance with automatic fixes |

## MCP tools - `@weaaare/mcp-voiceover-auditor`

| Tool | Description |
|------|-------------|
| `check_setup` | Verify VoiceOver environment setup (AppleScript, OS support, screen reader readiness) |
| `voiceover_start` | Start VoiceOver before running navigation and audit commands |
| `voiceover_stop` | Stop VoiceOver and clean up the session |
| `voiceover_commander` | Execute native VoiceOver commander commands for reliable navigation |
| `voiceover_perform` | Execute keyboard-driven VoiceOver navigation commands |
| `voiceover_next` | Move the VoiceOver cursor to the next item |
| `voiceover_previous` | Move the VoiceOver cursor to the previous item |
| `voiceover_act` | Perform default action for focused item (VO-Space equivalent) |
| `voiceover_interact` | Start interacting with the current container item |
| `voiceover_stop_interacting` | Stop interacting with the current container item |
| `voiceover_press` | Press a key on the focused item (e.g. `Enter`, `Tab`, `ArrowDown`) |
| `voiceover_type` | Type text into the currently focused item |
| `voiceover_item_text` | Read current focused item text announced by VoiceOver |
| `voiceover_last_spoken_phrase` | Get the latest spoken output from VoiceOver |
| `voiceover_spoken_phrase_log` | Get full spoken phrase history for this session |
| `voiceover_item_text_log` | Get full visited item text history for this session |
| `voiceover_clear_spoken_phrase_log` | Clear the spoken phrase log for this session |
| `voiceover_clear_item_text_log` | Clear the item text log for this session |
| `voiceover_click` | Perform a mouse click at the current position |
| `voiceover_detect` | Detect whether VoiceOver is supported on the current system |
| `voiceover_default` | Check whether VoiceOver is the default screen reader |
| `macos_activate_application` | Activate a macOS application by name |
| `macos_get_active_application` | Get the currently active macOS application |
| `focus_history` | Retrieve complete focus breadcrumb history |
| `focus_ensure_browser` | Ensure browser is focused before audit navigation |
| `focus_record` | Record focus breadcrumbs for recovery during audits |
| `focus_last_known` | Recover last known focus position if context is lost |
| `start_audit` | Start a structured audit session with metadata |
| `log_finding` | Log violations/warnings/passes with WCAG criteria and recommendations |
| `get_audit_status` | Get current audit progress and finding counters |
| `get_findings` | Retrieve findings from current or latest session |
| `end_audit` | End audit session and return summary data |
| `generate_report` | Generate reports in Markdown, JSON, or CSV |

---

## Local development

### Prerequisites

- [Node.js](https://nodejs.org/) >= 24
- [pnpm](https://pnpm.io/) >= 9

### Setup

```bash
git clone https://github.com/weAAAre/accessibility-ai.git
cd accessibility-ai
pnpm install
pnpm build
```

### Common commands

| Command | Description |
|---------|-------------|
| `pnpm build` | Build all packages |
| `pnpm dev` | Watch mode |
| `pnpm check` | Lint + format with Biome (auto-fix) |
| `pnpm ci:check` | Lint + format for CI (no auto-fix) |
| `pnpm check-types` | TypeScript type checking |
| `pnpm test` | Run all tests |
| `pnpm changeset` | Create a changeset for your changes |

---

## Contributing

See [CONTRIBUTING.md](./.github/CONTRIBUTING.md) for the full guide. In short:

1. Fork → branch → implement → `pnpm changeset` → PR
2. Run `pnpm check && pnpm check-types && pnpm test` before pushing
3. Open a PR against `main` with a [conventional commit](https://www.conventionalcommits.org/) title

---

## License

[MIT](./LICENSE) © [weAAAre](https://weAAAre.com)