# Skills

This directory contains accessibility-focused skills for AI coding agents, distributed via [skills.sh](https://skills.sh).

## Install all skills

```bash
npx skills add weAAAre/accessibility-skills
```

## Install a specific skill

```bash
npx skills add weAAAre/accessibility-skills@wcag-compliance
```

## Available skills

| Skill | Description |
| --- | --- |
| [wcag-compliance](./wcag-compliance/) | Guides the agent to write WCAG 2.2 Level AA compliant code |

## Contributing a new skill

1. Create a new directory under `skills/` with a kebab-case name
2. Add a `SKILL.md` file with the required frontmatter (`name`, `description`)
3. The `name` field **must match** the directory name
4. Keep `SKILL.md` under 500 lines — move detailed references to a `references/` subfolder
5. Open a PR with a changeset: `pnpm changeset`

See the [Agent Skills Specification](https://agentskills.io) for the full format.
