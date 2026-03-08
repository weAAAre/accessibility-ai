# Contributing to accessibility-ai

Thanks for your interest in contributing! This project is maintained by [weAAAre](https://weAAAre.com), a digital accessibility school.

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 24
- [pnpm](https://pnpm.io/) >= 9

### Setup

```bash
git clone https://github.com/weAAAre/accessibility-ai.git
cd accessibility-ai
pnpm install   # also runs `lefthook install` via the prepare script
pnpm build
```

Git hooks are managed with [Lefthook](https://lefthook.dev). After `pnpm install` you'll have:

| Hook | What it runs |
| --- | --- |
| `pre-commit` | Biome lint + format on staged files (auto-staged back) |
| `commit-msg` | commitlint — enforces Conventional Commits |
| `pre-push` | TypeScript type-check + full test suite |

### Common commands

| Command | Description |
| --- | --- |
| `pnpm build` | Build all packages |
| `pnpm dev` | Watch mode for all packages |
| `pnpm check` | Lint + format with Biome (auto-fix) |
| `pnpm ci:check` | Lint + format (CI mode, no auto-fix) |
| `pnpm check-types` | TypeScript type checking |
| `pnpm test` | Run tests |
| `pnpm changeset` | Create a changeset for your changes |

## Adding a new skill

1. Create a directory under `skills/` with a **kebab-case** name
2. Add a `SKILL.md` with required frontmatter:

```markdown
---
name: your-skill-name
description: What this skill does and when to use it.
license: MIT
metadata:
  author: weAAAre
  version: 0.1.0
---

# Your Skill Name

Instructions for the agent...
```

3. The `name` field **must match** the directory name
4. Keep `SKILL.md` under 500 lines — move detailed content to `references/`
5. Test with: `npx skills add weAAAre/accessibility-ai@your-skill-name --list`

## Adding a new MCP tool

1. If the tool belongs to an existing package, add it in that package's `src/tools/` directory
2. If it's a new server, create a new package under `packages/`:

```
packages/your-server/
├── package.json       # name: "@weAAAre/your-server"
├── tsconfig.json      # extends ../../tsconfig.base.json
├── src/
│   ├── index.ts       # Server entry point
│   ├── tools/         # One file per tool
│   ├── lib/           # Shared utilities
│   └── types.ts       # Shared types
├── tests/
└── README.md
```

3. Register the tool in `src/index.ts` using the MCP SDK
4. Add tests in `tests/`
5. Update the package README with the new tool

## Submitting changes

1. Create a feature branch: `git checkout -b feat/your-feature`
2. Make your changes
3. Run checks: `pnpm check && pnpm check-types && pnpm test`
4. **Add a changeset** (for package changes): `pnpm changeset`
5. Commit using [Conventional Commits](https://www.conventionalcommits.org/) — enforced by commitlint:

   ```
   <type>(<scope>): <short description>
   ```

   **Types:** `feat` · `fix` · `docs` · `refactor` · `test` · `chore` · `ci`

   **Scopes:** `mcp-a11y-color` · `skills` · `wcag-compliance` · `packages` · `root` · `ci` · `deps` · `release`

   Examples:
   - `feat(mcp-a11y-color): add apca contrast tool`
   - `fix(mcp-a11y-color): correct contrast ratio rounding`
   - `docs(skills): update wcag-compliance references`
   - `chore(deps): update biome to 2.4.0`

6. Push and open a Pull Request against `main`

## Code style

- **Biome** handles linting and formatting — run `pnpm check` before committing
- TypeScript strict mode is enabled
- Use single quotes, semicolons, trailing commas

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.
