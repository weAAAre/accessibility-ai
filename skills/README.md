# Skills

This directory contains accessibility-focused skills for AI coding agents, distributed via [skills.sh](https://skills.sh).

## Install all skills

```bash
npx skills add weAAAre/a11y-agents-kit
```

## Install a specific skill

```bash
npx skills add weAAAre/a11y-agents-kit@aria-patterns
```

## Available skills

| Skill | Description |
| --- | --- |
| [aria-patterns](./aria-patterns/) | Accessible ARIA patterns for interactive UI components |
| [figma-a11y-audit](./figma-a11y-audit/) | Generate Excel accessibility audit reports from Figma comments with evidence screenshots |

## Contributing a new skill

1. Create a new directory under `skills/` with a kebab-case name
2. Add a `SKILL.md` file with the required frontmatter (`name`, `description`)
3. The `name` field **must match** the directory name
4. Keep `SKILL.md` under 500 lines — move detailed references to a `references/` subfolder
5. Open a PR with a changeset: `pnpm changeset`

See the [Agent Skills Specification](https://agentskills.io) for the full format.
