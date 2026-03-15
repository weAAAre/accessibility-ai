# @weaaare/mcp-nvda-auditor

MCP (Model Context Protocol) server for **screen reader accessibility audits on Windows** using NVDA. Drives NVDA through [guidepup](https://github.com/guidepup/guidepup), letting an AI agent navigate web pages exactly as an NVDA user would: read element announcements, check focus order, detect keyboard traps, and log structured WCAG findings — all without a human manually operating NVDA.

Can help cover up to **12 WCAG 2.2 success criteria** (1.1.1, 1.3.1, 2.1.1, 2.1.2, 2.4.1, 2.4.2, 2.4.3, 2.4.4, 2.4.6, 3.3.1, 3.3.2, 4.1.2).

> **Important:** This tool does **not** replace a manual audit by an accessibility specialist, nor does it substitute real testing with assistive-technology users. It is a fast feedback loop that catches common issues early — a complement, never a replacement.

## Requirements

- **Windows 10 or later** — NVDA is Windows-only
- **NVDA installed** — download free at [nvaccess.org](https://www.nvaccess.org/)
- **Node.js ≥ 24**
- **guidepup setup** — run `npx @guidepup/setup` once to configure the Windows environment for NVDA automation

## Install

```bash
npx @guidepup/setup   # one-time Windows environment setup
npx @weaaare/mcp-nvda-auditor
```

## MCP client config

**Standard config** (works in most MCP clients):

```json
{
  "mcpServers": {
    "nvda-auditor": {
      "command": "npx",
      "args": ["-y", "@weaaare/mcp-nvda-auditor"]
    }
  }
}
```

<details>
<summary>VS Code</summary>

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "nvda-auditor": {
      "command": "npx",
      "args": ["-y", "@weaaare/mcp-nvda-auditor"]
    }
  }
}
```

Or install via CLI:

```bash
code --add-mcp '{"name":"nvda-auditor","command":"npx","args":["-y","@weaaare/mcp-nvda-auditor"]}'
```

</details>

<details>
<summary>Claude Desktop</summary>

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "nvda-auditor": {
      "command": "npx",
      "args": ["-y", "@weaaare/mcp-nvda-auditor"]
    }
  }
}
```

</details>

<details>
<summary>Claude Code</summary>

```bash
claude mcp add nvda-auditor npx -y @weaaare/mcp-nvda-auditor
```

</details>

<details>
<summary>Cursor</summary>

Go to `Cursor Settings` → `MCP` → `Add new MCP Server`. Use `command` type with `npx -y @weaaare/mcp-nvda-auditor`.

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
    "nvda-auditor": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@weaaare/mcp-nvda-auditor"],
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
codex mcp add nvda-auditor npx "-y" "@weaaare/mcp-nvda-auditor"
```

Or edit `~/.codex/config.toml`:

```toml
[mcp_servers.nvda-auditor]
command = "npx"
args = ["-y", "@weaaare/mcp-nvda-auditor"]
```

</details>

<details>
<summary>Goose</summary>

Go to `Advanced settings` → `Extensions` → `Add custom extension`. Use type `STDIO` and set the command to `npx -y @weaaare/mcp-nvda-auditor`.

</details>

<details>
<summary>Warp</summary>

Go to `Settings` → `AI` → `Manage MCP Servers` → `+ Add`. Use the standard config above.

</details>

<details>
<summary>Gemini CLI</summary>

Follow the MCP install [guide](https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md#configure-the-mcp-server-in-settingsjson). Use the standard config above.

</details>

## Tools

### NVDA Control

| Tool | Description |
| --- | --- |
| `check_setup` | Verify Windows environment and NVDA availability before starting an audit |
| `nvda_start` | Start NVDA — must be called before any navigation commands |
| `nvda_stop` | Stop NVDA and clean up the session |
| `nvda_detect` | Detect whether NVDA is supported on this system (Windows only) |
| `nvda_default` | Check whether NVDA is the default screen reader for this OS |

### Navigation

| Tool | Description |
| --- | --- |
| `nvda_next` | Move the NVDA cursor to the next item (Down Arrow equivalent) |
| `nvda_previous` | Move the NVDA cursor to the previous item (Up Arrow equivalent) |
| `nvda_act` | Perform the default action for the focused item (Enter equivalent) |
| `nvda_interact` | No-op on NVDA (provided for cross-screen-reader API compatibility) |
| `nvda_stop_interacting` | No-op on NVDA (provided for cross-screen-reader API compatibility) |
| `nvda_press` | Press a key — uses NVDA's single-letter browse mode shortcuts directly |
| `nvda_type` | Type text into the currently focused item |
| `nvda_perform` | Execute a named NVDA keyboard command (see full list below) |
| `nvda_click` | Click the mouse at the current NVDA cursor position |

### Reading and Logging

| Tool | Description |
| --- | --- |
| `nvda_item_text` | Get text of the item currently in the NVDA cursor |
| `nvda_last_spoken_phrase` | Get the last phrase spoken by NVDA |
| `nvda_spoken_phrase_log` | Get the full spoken phrase history for this session |
| `nvda_item_text_log` | Get the full visited item text history for this session |
| `nvda_clear_spoken_phrase_log` | Clear the spoken phrase log |
| `nvda_clear_item_text_log` | Clear the item text log |

### Audit Session

| Tool | Description |
| --- | --- |
| `start_audit` | Start a new audit session with URL, WCAG level, and screen reader |
| `log_finding` | Log a `violation`, `warning`, or `pass` with WCAG criteria and recommendation |
| `get_audit_status` | Get current audit progress, finding counts, and duration |
| `get_findings` | Retrieve findings from the current or last session |
| `end_audit` | End the audit session and generate summary statistics |
| `generate_report` | Generate an audit report in `markdown`, `json`, or `csv` format |

## `nvda_perform` commands

The `nvda_perform` tool executes named NVDA keyboard commands. These are the most useful for structured web auditing:

### Essential navigation

| Command | NVDA key | Description |
| --- | --- | --- |
| `moveToNextHeading` | H | Move to next heading |
| `moveToPreviousHeading` | Shift+H | Move to previous heading |
| `moveToNextHeadingLevel1`–`6` | 1–6 | Move to next heading at level 1–6 |
| `moveToPreviousHeadingLevel1`–`6` | Shift+1–6 | Move to previous heading at level 1–6 |
| `moveToNextLandmark` | D | Move to next ARIA landmark region |
| `moveToPreviousLandmark` | Shift+D | Move to previous ARIA landmark region |
| `moveToNextLink` | K | Move to next link |
| `moveToPreviousLink` | Shift+K | Move to previous link |
| `moveToNextUnvisitedLink` | U | Move to next unvisited link |
| `moveToNextVisitedLink` | V | Move to next visited link |
| `moveToNextFormField` | F | Move to next form field (any type) |
| `moveToPreviousFormField` | Shift+F | Move to previous form field |
| `moveToNextButton` | B | Move to next button |
| `moveToNextCheckbox` | X | Move to next checkbox |
| `moveToNextRadioButton` | R | Move to next radio button |
| `moveToNextComboBox` | C | Move to next combo box |
| `moveToNextEditField` | E | Move to next text edit field |
| `moveToNextTable` | T | Move to next table |
| `moveToNextGraphic` | G | Move to next graphic/image |
| `moveToNextList` | L | Move to next list |
| `moveToNextListItem` | I | Move to next list item |

### Browse mode

| Command | NVDA key | Description |
| --- | --- | --- |
| `browseModeElementsList` | NVDA+F7 | Open the Elements List dialog — shows all headings, links, or form fields |
| `toggleBetweenBrowseAndFocusMode` | NVDA+Space | Toggle between browse mode and focus mode |
| `exitFocusMode` | Escape | Return to browse mode from focus mode |
| `refreshBrowseDocument` | NVDA+F5 | Refresh the virtual document buffer |
| `toggleSingleLetterNavigation` | NVDA+Shift+Space | Enable/disable single-letter quick nav |

### Reading

| Command | NVDA key | Description |
| --- | --- | --- |
| `sayAll` | NVDA+Down Arrow | Read from current position to end of page |
| `readLine` | NVDA+Up Arrow | Read current line |
| `reportTitle` | NVDA+T | Report the title of the active window |
| `reportCurrentFocus` | NVDA+Tab | Report the currently focused element |
| `readActiveWindow` | NVDA+B | Read all content in the active window |
| `reportTextFormatting` | NVDA+F | Report text formatting at the caret |
| `reportStatusBar` | NVDA+End | Report the status bar |
| `stopSpeech` | Control | Stop NVDA speech immediately |

### Find

| Command | NVDA key | Description |
| --- | --- | --- |
| `find` | NVDA+Control+F | Open find text dialog |
| `findNext` | NVDA+F3 | Find next occurrence |
| `findPrevious` | NVDA+Shift+F3 | Find previous occurrence |
| `openLongDescription` | NVDA+D | Open long description for the current element |

## Prompts

Built-in audit prompts are available in all MCP clients that support prompts:

| Prompt | Description |
| --- | --- |
| `full_accessibility_audit` | Comprehensive audit: headings, landmarks, links, forms, images, tables, keyboard navigation |
| `heading_structure_audit` | Focused audit of heading hierarchy and descriptive quality |
| `form_accessibility_audit` | Focused audit of form labels, errors, required states, and keyboard accessibility |
| `navigation_audit` | Focused audit of landmarks, skip links, tab order, and focus management |
| `image_accessibility_audit` | Focused audit of alt text, decorative images, and complex image descriptions |

## NVDA browse mode cheat sheet

NVDA uses **browse mode** by default for web content. In browse mode, single-letter keys navigate by element type:

| Key | Navigate to |
| --- | --- |
| H / Shift+H | Next / previous heading (any level) |
| 1–6 / Shift+1–6 | Next / previous heading at level 1–6 |
| K / Shift+K | Next / previous link |
| F / Shift+F | Next / previous form field |
| B / Shift+B | Next / previous button |
| D / Shift+D | Next / previous ARIA landmark |
| T / Shift+T | Next / previous table |
| G / Shift+G | Next / previous graphic |
| L / Shift+L | Next / previous list |
| I / Shift+I | Next / previous list item |
| E / Shift+E | Next / previous edit field |
| X / Shift+X | Next / previous checkbox |
| R / Shift+R | Next / previous radio button |
| C / Shift+C | Next / previous combo box |
| NVDA+F7 | Elements List — all headings, links, or form fields |
| NVDA+Space | Toggle browse mode / focus mode |
| NVDA+Control+F | Find text in page |
| Tab | Move to next focusable element |

> Use `nvda_press` with these keys directly, or use `nvda_perform` with the named command equivalents.

## Typical audit workflow

```
check_setup
nvda_start
[navigate to URL in browser]
start_audit
nvda_perform → moveToNextHeading   # navigate by heading
nvda_last_spoken_phrase             # capture announcement
...
log_finding                         # log a violation or pass
...
end_audit
generate_report
nvda_stop
```

## WCAG criteria covered

| SC | Name | Tools |
| --- | --- | --- |
| 1.1.1 | Non-text Content | `nvda_item_text`, `nvda_last_spoken_phrase`, `log_finding` |
| 1.3.1 | Info and Relationships | `nvda_perform`, `nvda_item_text`, `log_finding` |
| 2.1.1 | Keyboard | `nvda_press`, `nvda_act`, `log_finding` |
| 2.1.2 | No Keyboard Trap | `nvda_press`, `nvda_next`, `log_finding` |
| 2.4.1 | Bypass Blocks | `nvda_perform`, `nvda_next`, `log_finding` |
| 2.4.2 | Page Titled | `nvda_item_text`, `nvda_last_spoken_phrase`, `log_finding` |
| 2.4.3 | Focus Order | `nvda_next`, `nvda_previous`, `log_finding` |
| 2.4.4 | Link Purpose (In Context) | `nvda_perform`, `nvda_item_text`, `log_finding` |
| 2.4.6 | Headings and Labels | `nvda_perform`, `nvda_item_text`, `log_finding` |
| 3.3.1 | Error Identification | `nvda_last_spoken_phrase`, `nvda_item_text`, `log_finding` |
| 3.3.2 | Labels or Instructions | `nvda_item_text`, `nvda_perform`, `log_finding` |
| 4.1.2 | Name, Role, Value | `nvda_last_spoken_phrase`, `nvda_item_text`, `log_finding` |

## Acknowledgements

- **[W3C](https://www.w3.org/WAI/)** — for the [WCAG 2.2](https://www.w3.org/TR/WCAG22/) guidelines, [WAI-ARIA](https://www.w3.org/TR/wai-aria/) specification, and the [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/). W3C content is used under the [W3C Software and Document License](https://www.w3.org/copyright/software-license/).
- **[a11ysupport.io](https://a11ysupport.io/)** — community-driven assistive-technology support data by Michael Fairchild, available under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

## License

MIT - [weAAAre](https://weAAAre.com)
