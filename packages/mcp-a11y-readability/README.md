# @weaaare/mcp-a11y-readability

MCP (Model Context Protocol) server for **text readability analysis**. Gives AI coding agents the ability to evaluate reading difficulty in **Spanish** and **English** using scientifically validated formulas, aligned with WCAG accessibility standards.

Can help cover [**WCAG 2.2 SC 3.1.5 — Reading Level** (AAA)](#wcag-22-sc-315--reading-level-aaa) — see the [criterion, sufficient techniques, and how AI agents use this server](#wcag-22-sc-315--reading-level-aaa) below.

## Tools

| Tool | Description |
| --- | --- |
| `analyze-readability` | Run all formulas for a language, get a consensus difficulty level |
| `analyze-readability-formula` | Run a single named formula on a text |
| `get-text-stats` | Get word, sentence, syllable, and character statistics |
| `list-formulas` | List all available formulas (optionally filtered by language) |
| `suggest-readability-improvements` | Get actionable suggestions to simplify text |
| `compare-texts` | Compare readability between two texts (e.g. before/after) |

## Supported formulas

### Spanish (7)

| Formula | Author(s) | Year | Output |
| --- | --- | --- | --- |
| Fernández Huerta | Fernández Huerta, J. | 1959 | Ease score (0–100) |
| Szigriszt-Pazos (Perspicuidad) | Szigriszt Pazos, F. | 1993 | Ease score (0–100) |
| INFLESZ | Barrio-Cantalejo, I.M. et al. | 2008 | Ease score (healthcare scale) |
| Gutiérrez de Polini | Gutiérrez de Polini, L.E. | 1972 | Ease score (0–100) |
| Crawford | Crawford, A.N. | 1989 | Grade level (primary school) |
| Legibilidad µ (mu) | Muñoz Baquedano, M. & Muñoz Urra, J. | 2006 | Ease score (0–∞) |
| García López | García López, J.A. & Arcos, A. | 1999 | Minimum age |

### English (6)

| Formula | Author(s) | Year | Output |
| --- | --- | --- | --- |
| Flesch Reading Ease | Flesch, R. | 1948 | Ease score (0–100) |
| Flesch-Kincaid Grade Level | Kincaid, J.P. et al. | 1975 | U.S. grade level |
| Gunning Fog Index | Gunning, R. | 1952 | Years of education |
| SMOG Index | McLaughlin, G.H. | 1969 | U.S. grade level |
| Coleman-Liau Index | Coleman, M. & Liau, T. | 1975 | U.S. grade level |
| Automated Readability Index | Smith, E.A. & Senter, R.J. | 1967 | U.S. grade level |

## Getting started

**Standard config** works in most MCP clients:

```json
{
  "mcpServers": {
    "a11y-readability": {
      "command": "npx",
      "args": ["-y", "@weaaare/mcp-a11y-readability"]
    }
  }
}
```

<details>
<summary>VS Code</summary>

Add to your project's `.vscode/mcp.json` (or user-level `settings.json` under `"mcp"`):

```json
{
  "servers": {
    "a11y-readability": {
      "command": "npx",
      "args": ["-y", "@weaaare/mcp-a11y-readability"]
    }
  }
}
```

Or install via the VS Code CLI:

```bash
code --add-mcp '{"name":"a11y-readability","command":"npx","args":["-y","@weaaare/mcp-a11y-readability"]}'
```

</details>

<details>
<summary>Claude Desktop</summary>

Follow the MCP install [guide](https://modelcontextprotocol.io/quickstart/user). Add to your `claude_desktop_config.json` using the standard config above.

</details>

<details>
<summary>Claude Code</summary>

```bash
claude mcp add a11y-readability npx -y @weaaare/mcp-a11y-readability
```

</details>

<details>
<summary>Cursor</summary>

Go to `Cursor Settings` → `MCP` → `Add new MCP Server`. Use `command` type with `npx -y @weaaare/mcp-a11y-readability`.

Or add to `.cursor/mcp.json` using the standard config above.

</details>

<details>
<summary>Windsurf</summary>

Follow Windsurf MCP [documentation](https://docs.windsurf.com/windsurf/cascade/mcp). Use the standard config above.

</details>

<details>
<summary>Cline</summary>

Add to your [`cline_mcp_settings.json`](https://docs.cline.bot/mcp/configuring-mcp-servers#editing-mcp-settings-files):

```json
{
  "mcpServers": {
    "a11y-readability": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@weaaare/mcp-a11y-readability"],
      "disabled": false
    }
  }
}
```

</details>

<details>
<summary>Kiro</summary>

Follow the MCP Servers [documentation](https://kiro.dev/docs/mcp/). Add to `.kiro/settings/mcp.json` using the standard config above.

</details>

<details>
<summary>Codex</summary>

```bash
codex mcp add a11y-readability npx "-y" "@weaaare/mcp-a11y-readability"
```

Or edit `~/.codex/config.toml`:

```toml
[mcp_servers.a11y-readability]
command = "npx"
args = ["-y", "@weaaare/mcp-a11y-readability"]
```

</details>

<details>
<summary>Goose</summary>

Go to `Advanced settings` → `Extensions` → `Add custom extension`. Use type `STDIO` and set the command to `npx -y @weaaare/mcp-a11y-readability`.

</details>

<details>
<summary>Warp</summary>

Go to `Settings` → `AI` → `Manage MCP Servers` → `+ Add`. Use the standard config above.

</details>

<details>
<summary>Gemini CLI</summary>

Follow the MCP install [guide](https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md#configure-the-mcp-server-in-settingsjson). Use the standard config above.

</details>

## WCAG 2.2 SC 3.1.5 — Reading Level (AAA)

### The criterion

> When text requires reading ability more advanced than the **lower secondary education level** after removal of proper names and titles, **supplemental content**, or a **version that does not require reading ability more advanced than the lower secondary education level**, is available.

The criterion belongs to **Principle 3 — Understandable**, under **Guideline 3.1 — Readable**. It is the only WCAG success criterion that directly addresses the *cognitive complexity* of written content.

**Lower secondary education level** corresponds to 7–9 years of formal schooling (roughly ages 12–15), as defined by the [International Standard Classification of Education (UNESCO)](https://unesdoc.unesco.org/ark:/48223/pf0000219109). Text that exceeds this threshold creates barriers for people with reading disabilities (such as dyslexia), cognitive disabilities, and non-native speakers — even when those users are otherwise highly educated.

The criterion is classified as **Level AAA** — the highest conformance tier — because it is not always possible to simplify every piece of content (legal texts, scientific papers, technical documentation). However, when the text *can* be simplified or supplemented, doing so dramatically improves comprehension for a broad range of users.

### Sufficient techniques

WCAG defines five sufficient techniques for meeting SC 3.1.5. Any one of them (or a combination) is considered valid:

| Technique | ID | Summary | Testable with readability formulas? |
| --- | --- | --- | --- |
| Provide a text summary at lower secondary level | [G86](https://www.w3.org/WAI/WCAG22/Techniques/general/G86) | Write a short plain-language summary alongside the complex content. Measure its readability to confirm it is below the threshold. | **Yes** — measure the summary |
| Make the text itself easier to read | [G153](https://www.w3.org/WAI/WCAG22/Techniques/general/G153) | Shorten sentences, replace jargon, use active voice, use lists, limit conjunctions to two per sentence, one topic per paragraph. Measure the result. | **Yes** — measure the rewritten text |
| Provide visual illustrations | [G103](https://www.w3.org/WAI/WCAG22/Techniques/general/G103) | Add charts, diagrams, photographs, or graphic organizers that explain the same ideas as the text. | No — visual check |
| Provide a spoken version | [G79](https://www.w3.org/WAI/WCAG22/Techniques/general/G79) | Offer a recorded or synthesized audio version of the text. | No — audio check |
| Provide a sign language version | [G160](https://www.w3.org/WAI/WCAG22/Techniques/general/G160) | Include a sign language video that conveys the same information as the text. | No — video check |

Of these five techniques, **G86 and G153 require measuring readability** — and both state in their test procedure: *"Measure the readability of the text. Check that the text requires reading ability less advanced than the lower secondary education level."* This is exactly what `mcp-a11y-readability` does.

### How this MCP server helps AI agents

Traditional accessibility auditing tools can check contrast ratios, missing alt attributes, or ARIA roles automatically. But **reading level has always been a blind spot for automated tools** — it requires linguistic analysis that depends on the language of the text and the choice of readability formula.

By exposing readability analysis through the Model Context Protocol, this server gives AI coding agents the ability to **reason about and verify text complexity** as part of their workflow:

1. **Detect the problem** — An agent can use `analyze-readability` to check whether a piece of content (a landing page, a help article, a legal notice) exceeds the lower secondary education threshold according to validated formulas.

2. **Apply technique G153** — If the text is too complex, the agent can rewrite it using simpler language, then call `compare-texts` to verify the rewritten version scores below the threshold — a measurable before/after comparison.

3. **Apply technique G86** — If the original cannot be simplified (e.g. a legal contract), the agent can generate a plain-language summary and use `analyze-readability` to confirm the summary meets the required level.

4. **Choose the right formulas for the language** — The agent can call `list-formulas` to discover which formulas are available for the content's language (7 for Spanish, 6 for English), and use `analyze-readability-formula` to run a specific one if there is a domain preference (e.g. INFLESZ for healthcare texts in Spanish, SMOG for healthcare in English).

5. **Get actionable suggestions** — `suggest-readability-improvements` returns concrete guidance: which metrics are out of range (words per sentence, syllables per word, etc.) and what to change.

Without this MCP server, an AI agent has no way to *measure* whether its rewritten text actually meets the reading level requirement — it can only guess. With it, the agent can **close the loop**: analyze → rewrite → measure → verify.

## Acknowledgements

### Readability formulas

#### Spanish

- **Fernández Huerta, J.** (1959). _Medidas sencillas de lecturabilidad_. Consigna, 214, 29–32. Adapted from Flesch's formula for Spanish. Coefficients corrected by **Gwillim Law** (2011) as documented on [legible.es](https://legible.es/blog/lecturabilidad-fernandez-huerta/).
- **Szigriszt Pazos, F.** (1993). _Sistemas predictivos de legibilidad del mensaje escrito: fórmula de perspicuidad_. Doctoral thesis, Universidad Complutense de Madrid. Reference: [legible.es](https://legible.es/blog/perspicuidad-szigriszt-pazos/).
- **Barrio-Cantalejo, I.M. et al.** (2008). _Validación de la Escala INFLESZ para evaluar la legibilidad de los textos dirigidos a pacientes_. Anales del Sistema Sanitario de Navarra, 31(2), 135–152. Healthcare-oriented interpretation scale for the Szigriszt-Pazos formula. Reference: [legible.es](https://legible.es/blog/escala-inflesz/).
- **Gutiérrez de Polini, L.E.** (1972). _Investigación sobre lectura en Venezuela_. First readability formula designed natively for Spanish (not adapted from English). Reference: [legible.es](https://legible.es/blog/comprensibilidad-gutierrez-de-polini/).
- **Crawford, A.N.** (1989). _Fórmula y gráfico para determinar la comprensibilidad de textos de nivel primario en castellano_. Lectura y Vida, 10(4). Grade-level formula for primary school texts. Reference: [legible.es](https://legible.es/blog/formula-de-crawford/).
- **Muñoz Baquedano, M. & Muñoz Urra, J.** (2006). _Legibilidad Mμ_. Viña del Mar, Chile. Uses word-length variance instead of syllable counting. Reference: [legible.es](https://legible.es/blog/legibilidad-mu/).
- **García López, J.A. & Arcos, A.** (1999). _Medida de la legibilidad del material escrito_. Pharm Care Esp, 1(6), 412–419. Returns the minimum age required to understand a text. Reference: [legible.es](https://legible.es/blog/garcia-lopez/).

#### English

- **Flesch, R.** (1948). _A new readability yardstick_. Journal of Applied Psychology, 32(3), 221–233. The most widely used readability formula worldwide.
- **Kincaid, J.P. et al.** (1975). _Derivation of new readability formulas for Navy enlisted personnel_. CNTECHTRA Research Branch Report 8-75. U.S. military standard for document readability.
- **Gunning, R.** (1952). _The Technique of Clear Writing_. McGraw-Hill. Estimates years of formal education needed to understand the text.
- **McLaughlin, G.H.** (1969). _SMOG grading — a new readability formula_. Journal of Reading, 22, 639–646. Recommended for healthcare materials.
- **Coleman, M. & Liau, T.** (1975). _A computer readability formula designed for machine scoring_. Journal of Applied Psychology, 60(2), 283–284. Uses character count instead of syllable count.
- **Smith, E.A. & Senter, R.J.** (1967). _Automated Readability Index_. AMRL-TR-66-220. Designed for automated processing without syllable counting.

### References and standards

- **[legible.es](https://legible.es/)** — Comprehensive reference for Spanish readability formulas. Created by Alejandro Muñoz Fernández. All Spanish formulas in this package reference their documentation. Content licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.es).
- **[W3C](https://www.w3.org/WAI/)** — [WCAG 2.2 SC 3.1.5 Reading Level](https://www.w3.org/TR/WCAG22/#reading-level). W3C content is used under the [W3C Software and Document License](https://www.w3.org/copyright/software-license/).

### Libraries

- **[silabajs](https://www.npmjs.com/package/silabajs)** (v2.1.0) — Spanish syllable splitter by Nicolás Cofré Méndez. Zero dependencies, TypeScript, MIT license.
- **[syllable](https://www.npmjs.com/package/syllable)** (v5.0.1) — English syllable counter by Titus Wormer ([wooorm](https://github.com/wooorm)). Part of the [unified](https://unifiedjs.com/) ecosystem, MIT license.

## License

MIT — [weAAAre](https://weAAAre.com)
