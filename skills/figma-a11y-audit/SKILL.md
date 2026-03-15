---
name: figma-a11y-audit
description: >
  Generates a formatted Excel accessibility audit report from Figma file comments with
  visual evidence screenshots. Parses structured audit comments containing WCAG criteria,
  error descriptions, and proposed solutions. Captures PNG evidence of each affected component
  and outputs a professional errores-accesibilidad.xlsx spreadsheet with hyperlinked evidence.
  Requires the figma-console MCP server connected to a Figma file via the Desktop Bridge plugin.
  Use this skill whenever the user wants to audit accessibility in Figma, extract errors from
  Figma comments, generate a WCAG report from a design file, capture evidence of accessibility
  violations, or create an Excel spreadsheet of accessibility issues found in Figma. Also trigger
  on "Figma audit", "Figma accessibility", "accessibility comments in Figma",
  "errores de accesibilidad", "export Figma comments to Excel", "WCAG audit report",
  "evidencias de accesibilidad", "informe de accesibilidad", "accessibility report from Figma",
  or any request involving Figma designs + accessibility errors + report generation, even if the
  user doesn't explicitly mention "audit" or "Excel".
license: MIT
metadata:
  author: weAAAre
  version: 0.1.0
---

# Figma A11y Audit

Generate formatted Excel accessibility audit reports from Figma file comments, with visual evidence screenshots of each issue.

## How it works

Accessibility auditors leave structured comments in Figma files while reviewing designs. This skill reads those comments via the `figma-console` MCP server, parses them into structured data, captures a PNG of the affected component as evidence, and produces a styled Excel spreadsheet ready for handoff.

## Prerequisites

This skill depends on the **figma-console MCP server** to communicate with Figma. If the user hasn't set it up yet, read `references/setup.md` and guide them through the setup process. The requirements are:

1. **Figma Desktop** app (not browser) with the **Desktop Bridge plugin** installed and running
2. **figma-console MCP server** configured in `.vscode/mcp.json` with a Figma Personal Access Token
3. **Python 3** with `openpyxl` (`pip3 install openpyxl`) for Excel generation

## Audit comment format

Each audit comment in Figma follows this structure:

```
Componente: <name>. Error: <description>. Criterio: <WCAG criterion>. Solucion: <proposed fix>
```

All possible fields:

| Field | Key in comment | Required |
|---|---|---|
| Componente | `Componente:` | Yes |
| Error | `Error:` | Yes |
| Criterio | `Criterio:` | Yes |
| Solución | `Solucion:` or `Solución:` | Yes |
| Metodología | `Metodologia:` or `Metodología:` | No |
| Instancia | `Instancia:` | No |

Fields are separated by `. ` (period + space). Key matching is case-insensitive.

## Workflow

Follow these steps in order. Complete each step before moving to the next.

### Step 1 — Verify Figma connection

Use `figma_get_status` to confirm a Figma file is connected. If there's no connection, point the user to `references/setup.md` and stop.

### Step 2 — Determine scope and fetch comments

If the user provided a Figma URL (e.g., `https://www.figma.com/design/FILE_KEY/Name?node-id=45-123`), extract the `node-id` query parameter to scope the audit to that specific frame or page. Normalise the separator to `:` (the URL may use `-` or `%3A` — both become `45:123`).

Use `figma_execute` to collect every node ID within that linked frame:

```javascript
const root = await figma.getNodeByIdAsync("LINKED_NODE_ID");
const ids = [];
const collect = (n) => {
  ids.push(n.id);
  if ('children' in n) n.children.forEach(collect);
};
collect(root);
return { ids, total: ids.length };
```

Store this set — it is used in Step 3 to restrict comments to those anchored within the linked frame. If the user didn't provide a URL with a `node-id`, skip the collection and keep all audit comments in scope.

Then use `figma_get_comments` with `include_resolved: true` to fetch every comment (active and resolved).

### Step 3 — Parse and scope audit comments

Filter comments that contain at least `"Error:"` or `"Criterio:"` in the text — these are audit comments. Ignore generic comments.

**Scope filtering:** if a node-id scope was established in Step 2, further filter to only those comments whose `client_meta.node_id` is present in the collected set. Discard every comment that falls outside the linked frame — only issues belonging to the specific link the user provided should appear in the report. This is important: without this filter, comments from unrelated pages or frames would pollute the output.

Parsing rules:

- Extract each `Key: value` pair from the comment text
- If **Metodología** isn't specified, infer it from the WCAG criterion:
  - 1.4.3, 1.4.6, 1.4.11, 1.4.1 → `"Color"`
  - 1.1.1 → `"Lector"`
  - 1.3.4 → `"Giro"`
  - 1.4.4 → `"Zoom"`
  - Anything else → `"Manual"`
- If **Instancia** isn't specified, default to `"Sucede en toda la app"`
- Preserve each comment's `client_meta.node_id` and `client_meta.node_offset` — these are needed for evidence capture

### Step 4 — Capture evidence screenshots

Each Figma comment has metadata indicating where it's anchored:

- `client_meta.node_id` — the node the comment is attached to
- `client_meta.node_offset` — the (x, y) position within that node

The goal is to screenshot the most specific UI element the comment points to, not the entire frame. Here's the strategy:

**Find the best node for context.** The screenshot must be specific enough to pinpoint the issue, but large enough for stakeholders to recognise where it lives in the UI. Prefer `COMPONENT` or `INSTANCE` nodes — they represent self-contained UI components with meaningful surrounding context. Enforce a minimum size so that tiny elements (icons, labels, individual text nodes) never produce unrecognisable crops:

```javascript
const parent = await figma.getNodeByIdAsync(NODE_ID);
const parentBox = parent.absoluteBoundingBox;
const absX = parentBox.x + OFFSET_X;
const absY = parentBox.y + OFFSET_Y;

const MIN_WIDTH = 200;
const MIN_HEIGHT = 120;

let bestNode = parent;
let bestArea = parentBox ? parentBox.width * parentBox.height : Infinity;

const walk = (n) => {
  if ('absoluteBoundingBox' in n && n.absoluteBoundingBox) {
    const b = n.absoluteBoundingBox;
    if (absX >= b.x && absX <= b.x + b.width &&
        absY >= b.y && absY <= b.y + b.height) {
      const area = b.width * b.height;
      const isComponent = n.type === 'COMPONENT' || n.type === 'INSTANCE';
      const hasContext = b.width >= MIN_WIDTH && b.height >= MIN_HEIGHT;
      if ((isComponent || hasContext) && area < bestArea) {
        bestArea = area;
        bestNode = n;
      }
    }
  }
  if ('children' in n) {
    for (const child of n.children) walk(child);
  }
};
walk(parent);
```

If the selected node is still below the minimum size (e.g., a standalone icon or a short label), walk up the ancestor chain until you reach a node that meets the threshold:

```javascript
let contextNode = bestNode;
while (contextNode.parent && contextNode.absoluteBoundingBox) {
  const b = contextNode.absoluteBoundingBox;
  if (b.width >= MIN_WIDTH && b.height >= MIN_HEIGHT) break;
  contextNode = contextNode.parent;
}
bestNode = contextNode;
```

This guarantees every screenshot shows enough surrounding UI for the issue to be immediately recognisable — no 30×30 icon crops without context.

**Export as PNG in base64.** The Figma Plugin API doesn't have filesystem access, so export the node as bytes and manually encode to base64 within `figma_execute`:

```javascript
const targetNode = await figma.getNodeByIdAsync(TARGET_NODE_ID);
const bytes = await targetNode.exportAsync({
  format: 'PNG',
  constraint: { type: 'SCALE', value: 2 }
});

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
let base64 = '';
let i = 0;
while (i < bytes.length) {
  const a = bytes[i++] || 0;
  const b = i < bytes.length ? bytes[i++] : 0;
  const c = i < bytes.length ? bytes[i++] : 0;
  const triple = (a << 16) | (b << 8) | c;
  base64 += chars[(triple >> 18) & 63];
  base64 += chars[(triple >> 12) & 63];
  base64 += i - 2 < bytes.length ? chars[(triple >> 6) & 63] : '=';
  base64 += i - 1 < bytes.length ? chars[triple & 63] : '=';
}

return { nodeId: TARGET_NODE_ID, nodeName: targetNode.name, base64 };
```

For large nodes (> 500px tall), reduce the scale to `0.5` to avoid oversized exports. For nodes that can't be exported (PAGE, DOCUMENT types), use `figma_capture_screenshot` as fallback.

**Save to disk.** Decode the base64 string in the terminal:

```bash
mkdir -p evidencias
echo "BASE64_STRING" | base64 -d > evidencias/FILENAME.png
```

File naming convention: `{two_digit_index}-{component_name_kebab_case}.png`
- Lowercase, no accents, spaces → hyphens, alphanumeric and hyphens only
- Examples: `01-estrellas.png`, `02-imagen-carrusel.png`, `03-texto-gris.png`

### Step 5 — Generate the Excel report

Write a Python script using `openpyxl` and execute it in the terminal. The output file is `errores-accesibilidad.xlsx` in the project root.

**Columns:**

| # | Column | Width |
|---|---|---|
| 1 | Componente | 26 |
| 2 | Criterio | 28 |
| 3 | Metodología | 16 |
| 4 | Error | 56 |
| 5 | Solución | 56 |
| 6 | Instancia | 22 |
| 7 | Evidencias | 30 |

**Styling:**

- **Header row:** background `#1A1A2E`, white bold text, `Calibri 11`, centered, thin border `#CCCCCC`, height 24px
- **Data rows:** `Calibri 10`, vertical-align top, wrap text, height 52px
- **Alternating rows:** `#EEF2FF` (even) / `#FFFFFF` (odd)
- **All cells:** thin border `#CCCCCC`
- **Frozen pane:** `A2` (header always visible)
- **Auto-filter:** enabled on the header row
- **Evidencias column:** cell value is the relative file path (e.g., `evidencias/01-estrellas.png`) with a clickable hyperlink (`cell.hyperlink = path`)

Key code patterns for the Python script:

```python
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

header_fill = PatternFill(start_color="1A1A2E", end_color="1A1A2E", fill_type="solid")
header_font = Font(bold=True, color="FFFFFF", size=11, name="Calibri")
alt_fill = PatternFill(start_color="EEF2FF", end_color="EEF2FF", fill_type="solid")
link_font = Font(size=10, name="Calibri", color="0563C1", underline="single")
border = Border(
    left=Side(style="thin", color="CCCCCC"),
    right=Side(style="thin", color="CCCCCC"),
    top=Side(style="thin", color="CCCCCC"),
    bottom=Side(style="thin", color="CCCCCC"),
)

# For the Evidencias column, add hyperlink:
ev_cell = ws.cell(row=row, column=7)
if ev_cell.value:
    ev_cell.hyperlink = ev_cell.value
    ev_cell.font = link_font

ws.freeze_panes = "A2"
ws.auto_filter.ref = f"A1:{get_column_letter(7)}1"
```

### Step 6 — Report to the user

Summarize what was generated:
- Number of errors found and processed
- Number of evidence screenshots captured
- Output file locations (`errores-accesibilidad.xlsx` and `evidencias/`)
- Any comments that couldn't be parsed (list them so the user can fix the format)

## Important guidelines

- **Never fabricate data.** Only use information that comes from actual Figma comments.
- **Skip unparseable comments** and report them to the user at the end.
- If `openpyxl` isn't installed, install it with `pip3 install openpyxl` before running the script.
- If a base64 export exceeds ~500KB, reduce the export scale to `0.25`.
- If a node can't be exported, use `figma_capture_screenshot` as fallback and note `"Ver Figma: {nodeId}"` in the Evidencias column.
- Complete each step before advancing to the next — don't generate the Excel until all data and evidence are ready.
