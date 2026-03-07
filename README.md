# accessibility-skills

> Accessibility tools and agent skills for AI coding agents — by [weAAAre](https://weAAAre.com), the digital accessibility school.

[![CI](https://github.com/weAAAre/accessibility-skills/actions/workflows/ci.yml/badge.svg)](https://github.com/weAAAre/accessibility-skills/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node >= 20](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9-orange)](https://pnpm.io/)

## What's inside

This monorepo contains two types of distributable content:

### 🛠️ MCP Servers (`packages/`)

Model Context Protocol servers that give AI assistants programmatic accessibility tooling.

| Package | Description | Install |
|---------|-------------|---------|
| [`@weAAAre/mcp-a11y-color`](./packages/mcp-a11y-color/) | Contrast checking, color-blindness simulation, WCAG 2.2 color compliance | `npx @weAAAre/mcp-a11y-color` |

### 🧠 Agent Skills (`skills/`)

Reusable procedural knowledge for AI coding agents, distributed via [skills.sh](https://skills.sh).

| Skill | Description | Install |
|-------|-------------|---------|
| [`wcag-compliance`](./skills/wcag-compliance/) | Write WCAG 2.2 Level AA compliant HTML, CSS, ARIA, and JS | `npx skills add weAAAre/accessibility-skills@wcag-compliance` |

---

## Quick start

### Install all skills

```bash
npx skills add weAAAre/accessibility-skills
```

### Install a specific skill

```bash
npx skills add weAAAre/accessibility-skills@wcag-compliance
```

### Use an MCP server (Claude Desktop, VS Code, etc.)

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "mcp-a11y-color": {
      "command": "npx",
      "args": ["-y", "@weAAAre/mcp-a11y-color"]
    }
  }
}
```

---

## MCP tools — `@weAAAre/mcp-a11y-color`

| Tool | Description |
|------|-------------|
| `check-contrast` | Check contrast ratio between two colors (WCAG AA/AAA) |
| `find-accessible-color` | Find the closest accessible color to a given input |
| `get-color-info` | Get full color info: hex, RGB, HSL, luminance |
| `simulate-color-blindness` | Simulate how a color looks with protanopia, deuteranopia, tritanopia |
| `suggest-contrast-fix` | Suggest a foreground/background adjustment to meet WCAG contrast |

---

## Local development

### Prerequisites

- [Node.js](https://nodejs.org/) >= 20
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