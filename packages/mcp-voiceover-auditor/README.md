# @weaaare/mcp-voiceover-auditor

MCP (Model Context Protocol) server for **screen reader accessibility audits on macOS**. Gives AI coding agents the ability to run VoiceOver checks, log WCAG findings, recover focus context, and generate audit reports in real-time.

Covers **WCAG 2.2** (SC 1.1.1, 1.3.1, 2.1.1, 2.1.2, 2.4.1, 2.4.2, 2.4.3, 2.4.4, 2.4.6, 3.3.1, 3.3.2, 4.1.2) criteria.

## Tools

| Tool | Description |
| --- | --- |
| `check_setup` | Verify VoiceOver environment setup (support, default screen reader, AppleScript readiness) |
| `voiceover_start` | Start VoiceOver before running navigation and audit commands |
| `voiceover_stop` | Stop VoiceOver and clean up the session |
| `voiceover_commander` | Execute native VoiceOver commander commands for robust navigation |
| `voiceover_perform` | Execute keyboard-based VoiceOver navigation commands |
| `voiceover_next` | Move the VoiceOver cursor to the next item |
| `voiceover_previous` | Move the VoiceOver cursor to the previous item |
| `voiceover_act` | Perform default action for focused item (VO-Space equivalent) |
| `voiceover_interact` | Start interacting with the current container item |
| `voiceover_stop_interacting` | Stop interacting with the current container item |
| `voiceover_press` | Press a key on the focused item (e.g. `Enter`, `Tab`, `ArrowDown`) |
| `voiceover_type` | Type text into the currently focused item |
| `voiceover_item_text` | Get text of the currently focused VoiceOver item |
| `voiceover_last_spoken_phrase` | Get the most recent phrase spoken by VoiceOver |
| `voiceover_spoken_phrase_log` | Get full spoken phrase history for this session |
| `voiceover_item_text_log` | Get full visited item text history for this session |
| `voiceover_clear_spoken_phrase_log` | Clear the spoken phrase log for this session |
| `voiceover_clear_item_text_log` | Clear the item text log for this session |
| `voiceover_click` | Perform a mouse click at the current position |
| `voiceover_detect` | Detect whether VoiceOver is supported on the current system |
| `voiceover_default` | Check whether VoiceOver is the default screen reader |
| `macos_activate_application` | Activate a macOS application by name |
| `macos_get_active_application` | Get the currently active macOS application |
| `focus_ensure_browser` | Ensure browser is focused before page interaction |
| `focus_record` | Save a focus breadcrumb for recovery during audits |
| `focus_last_known` | Retrieve the last known focus position |
| `focus_history` | Retrieve complete focus breadcrumb history |
| `start_audit` | Start a new audit session with URL, WCAG level, and screen reader |
| `log_finding` | Log `violation`, `warning`, or `pass` with WCAG criteria and recommendation |
| `get_audit_status` | Get current audit progress, counts, and duration |
| `get_findings` | Retrieve findings from current or last session |
| `end_audit` | End audit session and generate summary statistics |
| `generate_report` | Generate audit report in `markdown`, `json`, or `csv` |

## Installation

```bash
npm install -g @weaaare/mcp-voiceover-auditor
```

Or use directly with `npx`:

```bash
npx @weaaare/mcp-voiceover-auditor
```

## Configuration

### VS Code (GitHub Copilot)

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "voiceover-auditor": {
      "command": "npx",
      "args": ["-y", "@weaaare/mcp-voiceover-auditor"]
    }
  }
}
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "voiceover-auditor": {
      "command": "npx",
      "args": ["-y", "@weaaare/mcp-voiceover-auditor"]
    }
  }
}
```

## WCAG criteria covered

| SC | Name | Tools |
| --- | --- | --- |
| 1.1.1 | Non-text Content | `voiceover_item_text`, `voiceover_last_spoken_phrase`, `log_finding` |
| 1.3.1 | Info and Relationships | `voiceover_perform`, `voiceover_commander`, `log_finding` |
| 2.1.1 | Keyboard | `voiceover_press`, `focus_record`, `log_finding` |
| 2.1.2 | No Keyboard Trap | `voiceover_press`, `focus_last_known`, `log_finding` |
| 2.4.1 | Bypass Blocks | `voiceover_commander`, `voiceover_perform`, `log_finding` |
| 2.4.2 | Page Titled | `voiceover_item_text`, `voiceover_last_spoken_phrase`, `log_finding` |
| 2.4.3 | Focus Order | `focus_record`, `focus_history`, `log_finding` |
| 2.4.4 | Link Purpose (In Context) | `voiceover_perform`, `voiceover_commander`, `log_finding` |
| 2.4.6 | Headings and Labels | `voiceover_perform`, `voiceover_item_text`, `log_finding` |
| 3.3.1 | Error Identification | `voiceover_last_spoken_phrase`, `voiceover_item_text`, `log_finding` |
| 3.3.2 | Labels or Instructions | `voiceover_item_text`, `voiceover_perform`, `log_finding` |
| 4.1.2 | Name, Role, Value | `voiceover_last_spoken_phrase`, `voiceover_item_text`, `log_finding` |

## License

MIT - [weAAAre](https://weAAAre.com)