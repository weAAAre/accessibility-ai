---
name: scaffoldMonorepo
description: Scaffold a production-ready TypeScript monorepo with full tooling and CI/CD
argument-hint: Describe the monorepo purpose, packages to include, and any distribution channels (npm, skills.sh, etc.)
---

You are setting up a **production-ready TypeScript monorepo** from scratch. Follow this structured approach:

## Phase 1: Research & Alignment

1. **Research the ecosystem**: Investigate any external distribution channels (npm registry, skills.sh, package managers) to understand their exact folder/file structure requirements.
2. **Research the organization**: Understand branding, existing conventions, licensing patterns, and prior repos.
3. **Clarify decisions** with the user before implementing:
   - npm scope for published packages
   - License (MIT, Apache 2.0, GPL, etc.)
   - Node.js version target
   - Initial packages/content to seed
   - Branch protection and repo hardening approach

## Phase 2: Root Configuration

Create these root-level files:

- `package.json` — private, packageManager field, workspace scripts (build, dev, lint, check-types, format, check, test, changeset, release)
- `pnpm-workspace.yaml` — workspace globs for each package directory
- `turbo.json` — task pipeline with proper dependency ordering and caching
- `biome.json` — formatter + linter config (VCS-aware, exclude dist/node_modules)
- `tsconfig.base.json` — shared TypeScript strict config (ES2022, NodeNext, declarations)
- `.changeset/config.json` — public access, base branch, changelog format
- `.gitignore`, `.npmrc`, `.nvmrc`, `.editorconfig`, `LICENSE`

## Phase 3: Package Scaffolding

For each package:

- `package.json` with proper name, type: module, bin (if CLI), files array, repository metadata
- `tsconfig.json` extending the base config
- `src/` directory with entry point and organized module structure
- `tests/` directory with initial test suite
- `README.md` with usage, installation, and configuration instructions

## Phase 4: Distributable Content (if applicable)

If the monorepo distributes agent skills, plugins, or other non-npm content:

- Create the appropriate directory following the platform's conventions
- Each unit of content should have the required metadata files
- Seed at least one example to validate the distribution pipeline
- Add a README explaining the contribution process

## Phase 5: GitHub Infrastructure

### Templates
- `.github/ISSUE_TEMPLATE/bug_report.yml` — structured YAML form with package dropdown
- `.github/ISSUE_TEMPLATE/feature_request.yml` — structured YAML form
- `.github/ISSUE_TEMPLATE/config.yml` — disable blank issues, add contact links
- `.github/PULL_REQUEST_TEMPLATE.md` — type of change, checklist with changeset reminder
- `.github/CONTRIBUTING.md` — setup, commands, conventions, how to add packages
- `.github/CODE_OF_CONDUCT.md` — Contributor Covenant v2.1

### Workflows
- `.github/workflows/ci.yml` — on PRs: install, biome ci, check-types, build, test (with concurrency group)
- `.github/workflows/release.yml` — on push to main: build + changesets/action with npm publish

### Repo Hardening
- `scripts/setup-repo.sh` — idempotent `gh` CLI script for branch protection (require PR reviews, status checks, linear history, no force push), repo settings (squash-only merge, delete branch on merge, disable wiki), workflow permissions

## Phase 6: Project-Specific Agent Skills

Create `.agents/skills/` with internal skills that guide contributors on project conventions (structure, how to add packages, PR process, coding standards).

## Phase 7: README & Validation

- Rewrite root `README.md` with project description, feature tables, quick start, badges, and links
- Add `.github/dependabot.yml` for automated dependency updates
- Validate: `pnpm install && pnpm build && pnpm check && pnpm test`

## Implementation Notes

- Create files **sequentially** to avoid system overload
- Use Biome (not ESLint/Prettier) for linting and formatting
- Use Changesets (not semantic-release) for versioning and publishing
- Prefer squash merges for a clean main branch history
- Implement packages incrementally: MVP tools first, then iterate
