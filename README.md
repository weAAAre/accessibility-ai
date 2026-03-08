# accessibility-skills

> Accessibility tools and agent skills for AI coding agents — by [weAAAre](https://weAAAre.com), the digital accessibility school.

[![CI](https://github.com/weAAAre/accessibility-skills/actions/workflows/ci.yml/badge.svg)](https://github.com/weAAAre/accessibility-skills/actions/workflows/ci.yml)
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

### 🧠 Agent Skills (`skills/`)

Reusable procedural knowledge for AI coding agents, distributed via [skills.sh](https://skills.sh).

| Skill | Description | Install |
|-------|-------------|---------|
| [`aria-patterns`](./skills/aria-patterns/) | Accessible ARIA patterns for interactive UI components | `npx skills add weAAAre/accessibility-skills@aria-patterns` |

---

## Quick start

### Install all skills

```bash
npx skills add weAAAre/accessibility-skills
```

### Install a specific skill

```bash
npx skills add weAAAre/accessibility-skills@aria-patterns
```

### Use an MCP server (Claude Desktop, VS Code, etc.)

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "mcp-a11y-color": {
      "command": "npx",
      "args": ["-y", "@weaaare/mcp-a11y-color"]
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

---

## Local development

### Prerequisites

- [Node.js](https://nodejs.org/) >= 24
- [pnpm](https://pnpm.io/) >= 9

### Setup

```bash
git clone https://github.com/weAAAre/accessibility-skills.git
cd accessibility-skills
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