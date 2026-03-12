# AGENTS.md

## Purpose

This monorepo provides **accessibility-focused skills and MCP servers** for AI coding agents. It is maintained by [weAAAre](https://github.com/weAAAre) and published under the `@weAAAre` npm scope.

- `packages/` — MCP server packages:
  - `mcp-a11y-color` — WCAG color contrast, color blindness simulation, palette analysis.
  - `mcp-voiceover-auditor` — macOS VoiceOver-based accessibility audits.
  - `mcp-virtual-screen-reader-auditor` — Headless virtual screen reader audits (cross-platform).
  - `mcp-auditor-core` — Shared audit session, findings, reports, and tool registry (internal, not published).
- `packages/config` — Shared configuration (tsconfig, rstest base config).
- `skills/` — Agent skills (markdown-based knowledge modules on accessibility topics like ARIA patterns).

## Stack

| Tool | Version | Purpose |
|---|---|---|
| Node.js | ≥ 24 | Runtime (see `.nvmrc`) |
| pnpm | 9.15.4 | Package manager with workspace catalog |
| TypeScript | 5.9.3 | Language (strict mode, ESM) |
| Turborepo | 2.8.14 | Monorepo task orchestration |
| Biome | 2.4.6 | Linter + formatter |
| Rstest | 0.9.0 | Test runner |
| Changesets | 2.30.0 | Versioning and npm publishing |
| Lefthook | 2.1.3 | Git hooks |
| Commitlint | 20.4.3 | Commit message validation |

## Commands

Always run `pnpm install` before building or testing after a fresh clone.

```sh
pnpm install              # install all dependencies
pnpm build                # build all packages (via Turborepo)
pnpm test                 # run all tests (via Turborepo → rstest)
pnpm check-types          # type-check all packages
pnpm lint                 # lint all packages (via Turborepo)
pnpm ci:check             # Biome CI mode (lint + format, no writes)
pnpm format               # auto-format everything with Biome
pnpm check                # Biome check with auto-fix
```

To scope to a single package:

```sh
pnpm --filter mcp-a11y-color test
pnpm --filter mcp-a11y-color build
```

## CI Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push/PR to `main`:

1. `pnpm install --frozen-lockfile`
2. `pnpm ci:check` (Biome lint & format)
3. `pnpm check-types`
4. `pnpm build`
5. `pnpm test`

All steps must pass before merging.

## Code Rules

These rules are mandatory. Follow them in every file you create or modify.

### Functions

- Always use **arrow functions**. Never use the `function` keyword.
- Exception: when a framework or library explicitly requires a `function` declaration (e.g. certain `this`-binding scenarios). In that case add a brief explanation.

### Comments

- Do **not** write comments that only restate what the code does. Code should be self-explanatory.
- Comments are allowed **only** when they explain **why** (business logic, non-obvious decisions, workarounds, links to specs).
- Never leave commented-out code.
- Never add `// TODO` without an associated issue number.

### Naming

- Use `camelCase` for variables, functions, and parameters.
- Use `PascalCase` for types, interfaces, and classes.
- Use `SCREAMING_SNAKE_CASE` for constants that represent fixed configuration values.
- File names use `kebab-case` (e.g. `color-parser.ts`, `check-contrast.ts`).

### Types

- Always explicitly type function parameters and return types. Do not rely on inference for public APIs.
- Prefer `type` over `interface` unless declaration merging is needed.
- Never use `any`. Use `unknown` and narrow with type guards when the type is truly unknown.
- Never use `as` type assertions unless unavoidable — prefer type predicates or `satisfies`.

### Imports and Modules

- All packages use `"type": "module"` (ESM only).
- Use path extensions in relative imports (e.g. `./foo.ts` not `./foo`).
- Group imports: external packages first, then internal modules, separated by a blank line.

### Formatting

Biome handles all formatting. Do not fight it. Key settings:

- 2-space indent, 100-character line width.
- Single quotes, semicolons always, trailing commas.
- Arrow parentheses always: `(x) => x` not `x => x`.

### Error Handling

- Never swallow errors silently. Always log or re-throw.
- Use typed errors or `Error` subclasses with descriptive messages.

### Tests

- Test files live in `tests/` alongside the package source.
- Test runner is **Rstest** (`@rstest/core`). It uses Jest-compatible APIs (`describe`, `it`, `expect`).
- Every new feature or bug fix requires at least one test.
- Run `pnpm test` before committing. All tests must pass.

## Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/) enforced by Commitlint.

Format: `type(scope): description`

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

**Scopes:** `mcp-a11y-color`, `mcp-auditor-core`, `mcp-virtual-screen-reader-auditor`, `mcp-voiceover-auditor`, `skills`, `aria-patterns`, `packages`, `root`, `ci`, `deps`, `release`.

Subject must be lowercase, no period, max 100 characters.

## Dependency Management

- All dependency versions are centralized in the pnpm workspace catalog (`pnpm-workspace.yaml`).
- Package-level `package.json` files reference versions with `catalog:`.
- Always use **exact versions** (no `^` or `~` ranges).
- When adding a new dependency, add it to the catalog first, then reference it with `catalog:` in the package.

## Adding a New Package

1. Create a directory under `packages/<name>/`.
2. Add `package.json` with `"name": "@weaaare/<name>"`, `"type": "module"`, and `catalog:` dependency references.
3. Extend `@weaaare/config/tsconfig/library.json` in `tsconfig.json`.
4. Add the scope to `commitlint.config.ts` in the `scope-enum` rule.

## Skills

Skills are markdown-based knowledge modules in `skills/`. They follow the structure:

```
skills/<topic>/
  SKILL.md               # Main skill instructions
  references/            # Supporting reference material
```

Skills are pure documentation — no runtime code.
