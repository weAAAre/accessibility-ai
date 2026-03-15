import type { PromptDefinition } from '@weaaare/mcp-auditor-core';
import { getPromptMessages, listPrompts } from '@weaaare/mcp-auditor-core';

// ─── Shared lifecycle note ────────────────────────────────────────────────────
// Every NVDA audit follows this discipline:
//   1. check_setup  →  nvda_start  →  navigate to URL  →  start_audit
//   2. … audit work using nvda_perform, nvda_press, nvda_next, nvda_last_spoken_phrase …
//   3. end_audit  →  generate_report  →  nvda_stop

const fullAccessibilityAudit: PromptDefinition = {
  prompt: {
    name: 'full_accessibility_audit',
    description:
      'Comprehensive NVDA screen reader accessibility audit of a web page. Covers headings, landmarks, links, forms, images, tables, and keyboard navigation.',
    arguments: [
      {
        name: 'url',
        description: 'URL of the page to audit',
        required: true,
      },
      {
        name: 'browser',
        description: 'Browser to use (default: Chrome)',
        required: false,
      },
      {
        name: 'wcagLevel',
        description: 'WCAG conformance level: A, AA, or AAA (default: AA)',
        required: false,
      },
    ],
  },
  getMessage: (args) => {
    const url = args.url ?? 'UNKNOWN_URL';
    const browser = args.browser ?? 'Chrome';
    const wcagLevel = args.wcagLevel ?? 'AA';

    return [
      {
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `Perform a comprehensive NVDA accessibility audit of ${url}. Follow every step in order.

## Phase 1 — Environment & NVDA Startup
1. \`check_setup\` — verify Windows environment (NVDA is Windows-only)
2. \`nvda_start\` — start NVDA
3. Navigate to ${url} in ${browser} (use Playwright MCP, browser dev tools, or instruct the user)
4. \`start_audit\` with url "${url}", screenReader "nvda", wcagLevel "${wcagLevel}"

**Browse mode note:** NVDA uses browse mode by default for web content. Single-letter commands (H, K, F, D…) navigate by element type. To interact with a specific control (e.g. type in a field), toggle to focus mode with \`nvda_perform\` → toggleBetweenBrowseAndFocusMode, interact, then press Escape to return to browse mode.

## Phase 2 — Audit Workflow

### 2.1 Page Title & Language
- \`nvda_perform\` → reportTitle — check what NVDA announces as the page title
- Verify the title is descriptive and unique (WCAG 2.4.2 Page Titled)
- \`nvda_last_spoken_phrase\` — capture the announcement
- \`log_finding\` — log pass or violation

### 2.2 Heading Structure
- \`nvda_perform\` → moveToNextHeading (repeat until NVDA announces "no next heading" or similar)
- For each heading: \`nvda_last_spoken_phrase\` and \`nvda_item_text\` — record level and text
- Also audit specific levels: \`nvda_perform\` → moveToNextHeadingLevel1 (expect exactly one h1)
- Use \`nvda_perform\` → browseModeElementsList to open the Elements List dialog (NVDA+F7) — it shows all headings in a navigable list for a complete overview
- Verify:
  - Exactly one h1 on the page (WCAG 2.4.6)
  - No skipped levels (e.g., h1 → h3 without h2 is a violation)
  - Heading text is descriptive
- \`log_finding\` for each issue (WCAG 1.3.1, 2.4.6)

### 2.3 Landmark Regions
- \`nvda_perform\` → moveToNextLandmark (repeat until exhausted)
- For each landmark: \`nvda_last_spoken_phrase\` — identify its type (banner, navigation, main, contentinfo, complementary)
- Required: \`main\` landmark must exist. Recommended: \`navigation\` and \`contentinfo\`.
- \`log_finding\` for missing required landmarks (WCAG 1.3.1, 2.4.1)

### 2.4 Links
- \`nvda_perform\` → moveToNextLink (repeat until exhausted)
- For each link: \`nvda_last_spoken_phrase\` — check announced text
- Watch for vague link text: "click here", "read more", "here", "more", URLs as link text
- Also audit visited vs unvisited: \`nvda_perform\` → moveToNextUnvisitedLink
- \`log_finding\` for vague links (WCAG 2.4.4 Link Purpose in Context)

### 2.5 Forms
Navigate by specific control type for thorough coverage:
- **Text inputs / selects:** \`nvda_perform\` → moveToNextEditField / moveToNextFormField (repeat)
- **Buttons:** \`nvda_perform\` → moveToNextButton (repeat)
- **Checkboxes:** \`nvda_perform\` → moveToNextCheckbox (repeat)
- **Radio buttons:** \`nvda_perform\` → moveToNextRadioButton (repeat)
- **Combo boxes:** \`nvda_perform\` → moveToNextComboBox (repeat)

For each control:
  a. \`nvda_last_spoken_phrase\` — check label, role, required state, current value
  b. Verify label is announced (tab to control with \`nvda_press\` 'Tab')
  c. Toggle to focus mode (\`nvda_perform\` → toggleBetweenBrowseAndFocusMode) to interact
  d. For text fields: type invalid data, check error messages are announced
  e. Return to browse mode (Escape key via \`nvda_press\` 'Escape')
- \`log_finding\` per issue (WCAG 1.3.1, 3.3.1, 3.3.2, 4.1.2)

### 2.6 Images and Graphics
- \`nvda_perform\` → moveToNextGraphic (repeat until exhausted)
- For each image: \`nvda_last_spoken_phrase\` — check alt text announcement
  - Informative images: must have descriptive alt text
  - Decorative images: must be hidden (NVDA should skip them or announce "graphic" with empty alt)
  - Complex images (charts/diagrams): check for long description (\`nvda_perform\` → openLongDescription)
- \`log_finding\` per issue (WCAG 1.1.1 Non-text Content)

### 2.7 Tables
- \`nvda_perform\` → moveToNextTable (repeat)
- For each table: navigate cells with moveToNextColumn/moveToNextRow
  - \`nvda_last_spoken_phrase\` — NVDA should announce column/row header context with each cell
  - Verify headers are associated with data cells
  - Check table caption or summary if present
- \`log_finding\` per issue (WCAG 1.3.1)

### 2.8 Keyboard Navigation
- Press Tab from the start of the page (\`nvda_press\` 'Tab' repeatedly)
- Verify logical focus order — matches reading/visual order
- Verify no keyboard traps — you can always Tab out of any component
- Verify all interactive elements are reachable with keyboard
- Pay particular attention to modals, menus, and custom widgets
- \`log_finding\` per issue (WCAG 2.1.1, 2.1.2, 2.4.3)

### 2.9 Dynamic Content & Live Regions
- Trigger dynamic updates (form submissions, AJAX, notifications)
- \`nvda_last_spoken_phrase\` — verify NVDA announces changes automatically
- Check that status messages are announced without moving focus (WCAG 4.1.3)
- \`log_finding\` per issue

## Handling Accessibility Failures
- If NVDA cannot navigate to an element at all → that IS the finding — log it as a violation
- If toggling browse/focus mode is needed → use \`nvda_perform\` → toggleBetweenBrowseAndFocusMode
- If the Elements List dialog is useful → \`nvda_perform\` → browseModeElementsList

## Phase 3 — Report & Shutdown
1. \`end_audit\`
2. \`generate_report\` with format "markdown"
3. Present findings — critical violations first, then warnings, then passes
4. \`nvda_stop\` — stop NVDA`,
        },
      },
    ];
  },
};

const headingStructureAudit: PromptDefinition = {
  prompt: {
    name: 'heading_structure_audit',
    description:
      'Audit heading structure using NVDA. Checks h1 uniqueness, hierarchy, and descriptive content.',
    arguments: [
      {
        name: 'url',
        description: 'URL of the page to audit',
        required: true,
      },
    ],
  },
  getMessage: (args) => {
    const url = args.url ?? 'UNKNOWN_URL';
    return [
      {
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `Audit the heading structure of ${url} using NVDA.

## Setup
1. \`check_setup\` — verify Windows environment
2. \`nvda_start\` — start NVDA
3. Navigate to ${url} in browser
4. \`start_audit\` with url "${url}"

## Overview with Elements List
5. \`nvda_perform\` → browseModeElementsList
   Opens the NVDA Elements List dialog (NVDA+F7). Select "Headings" from the dropdown.
   This shows all headings with their levels — ideal for a complete structural overview.
   Press Escape to close the dialog after reviewing.

## Heading Traversal
6. \`nvda_perform\` → moveToNextHeading — repeat until exhausted
   For each heading: \`nvda_last_spoken_phrase\` and \`nvda_item_text\`
   Record: heading level (h1–h6) and text content.

7. Verify level 1 specifically:
   \`nvda_perform\` → moveToNextHeadingLevel1 (should find exactly ONE h1)
   \`nvda_perform\` → moveToNextHeadingLevel1 again (should find no more)

## Verification
8. Check:
   - Exactly one h1 on the page (WCAG 2.4.6)
   - No skipped heading levels (h1 → h3 without h2 is a violation)
   - All headings are descriptive (not empty, not generic like "Section")
   - Heading hierarchy reflects the logical document structure

9. \`log_finding\` for each issue found

## Wrap-up
10. \`end_audit\`
11. \`nvda_stop\` — stop NVDA
12. \`generate_report\` with format "markdown"`,
        },
      },
    ];
  },
};

const formAccessibilityAudit: PromptDefinition = {
  prompt: {
    name: 'form_accessibility_audit',
    description:
      'Audit form accessibility with NVDA: labels, error messages, required fields, and keyboard navigation.',
    arguments: [
      {
        name: 'url',
        description: 'URL of the page with forms to audit',
        required: true,
      },
    ],
  },
  getMessage: (args) => {
    const url = args.url ?? 'UNKNOWN_URL';
    return [
      {
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `Audit form accessibility on ${url} using NVDA.

## Setup
1. \`check_setup\` — verify Windows environment
2. \`nvda_start\` — start NVDA
3. Navigate to ${url} in browser
4. \`start_audit\` with url "${url}"

## Form Controls
Navigate by control type for thorough coverage:

a. **Edit fields & text inputs:**
   \`nvda_perform\` → moveToNextEditField (repeat)
   \`nvda_last_spoken_phrase\` — check label text, role, required state

b. **General form fields (includes selects, textareas):**
   \`nvda_perform\` → moveToNextFormField (repeat)
   \`nvda_last_spoken_phrase\` — check complete announcement

c. **Buttons:**
   \`nvda_perform\` → moveToNextButton (repeat)
   \`nvda_last_spoken_phrase\` — check button label

d. **Checkboxes:**
   \`nvda_perform\` → moveToNextCheckbox (repeat)
   \`nvda_last_spoken_phrase\` — check label and checked/unchecked state

e. **Radio buttons:**
   \`nvda_perform\` → moveToNextRadioButton (repeat)
   \`nvda_last_spoken_phrase\` — check label, group name, selected state

f. **Combo boxes / dropdowns:**
   \`nvda_perform\` → moveToNextComboBox (repeat)
   \`nvda_last_spoken_phrase\` — check label and current value

## Interaction Testing (for each control that accepts input)
5. Tab to the control (\`nvda_press\` 'Tab')
6. \`nvda_perform\` → toggleBetweenBrowseAndFocusMode — enter focus mode
7. Interact: type invalid data, select options, check/uncheck
8. Submit or trigger validation
9. \`nvda_last_spoken_phrase\` — check if error messages are announced
10. Press Escape (\`nvda_press\` 'Escape') to return to browse mode

## Verification Checklist
- All inputs have associated labels (WCAG 1.3.1, 3.3.2)
- Required fields are announced as required (WCAG 3.3.2)
- Error messages are announced — either live region or associated with field (WCAG 3.3.1)
- Form is completable entirely by keyboard (WCAG 2.1.1)
- Submit button is reachable by Tab (WCAG 2.1.1)

11. \`log_finding\` for each issue

## Wrap-up
12. \`end_audit\`
13. \`nvda_stop\` — stop NVDA
14. \`generate_report\` with format "markdown"`,
        },
      },
    ];
  },
};

const navigationAudit: PromptDefinition = {
  prompt: {
    name: 'navigation_audit',
    description:
      'Audit keyboard navigation and landmark regions with NVDA. Checks tab order, landmarks, skip links, and focus management.',
    arguments: [
      {
        name: 'url',
        description: 'URL of the page to audit',
        required: true,
      },
    ],
  },
  getMessage: (args) => {
    const url = args.url ?? 'UNKNOWN_URL';
    return [
      {
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `Audit keyboard navigation and landmark regions on ${url} using NVDA.

## Setup
1. \`check_setup\` — verify Windows environment
2. \`nvda_start\` — start NVDA
3. Navigate to ${url} in browser
4. \`start_audit\` with url "${url}"

## Skip Links
5. Press Tab once from the top of the page (\`nvda_press\` 'Tab')
   - Check if a "Skip to main content" or "Skip navigation" link appears
   - \`nvda_last_spoken_phrase\` — verify the link text is descriptive
   - Activate it (\`nvda_act\`) and verify focus moves to the main content area

## Landmark Regions
6. \`nvda_perform\` → moveToNextLandmark (repeat until exhausted)
   For each landmark: \`nvda_last_spoken_phrase\` — note the type announced
   Expected landmark types: banner, navigation, main, contentinfo, complementary, search, form, region
   - \`main\` landmark is required (WCAG 1.3.1)
   - \`navigation\` (nav) is strongly recommended
   - \`contentinfo\` (footer) is recommended
7. \`log_finding\` for missing required or expected landmarks

## Tab Order
8. From page start, press Tab repeatedly (\`nvda_press\` 'Tab')
   - \`nvda_last_spoken_phrase\` after each Tab to track focus position
   - Verify order follows logical/visual reading order (WCAG 2.4.3)
   - Verify all interactive elements are reachable (links, buttons, inputs, selects)
   - Verify there are no keyboard traps — you can always Tab out (WCAG 2.1.2)
   - Watch for invisible or off-screen focused elements

## Focus Management
9. If the page has modals/dialogs:
   - Trigger the modal (click/Enter)
   - Verify focus moves into the modal automatically
   - Verify focus is trapped within modal while open (Tab should cycle within modal)
   - Close modal and verify focus returns to trigger element
10. If the page has expandable sections (accordions, disclosures):
    - Toggle open — verify appropriate focus or announcement

## Findings
11. \`log_finding\` per issue with applicable WCAG criteria:
    - 2.4.1 Bypass Blocks (skip link)
    - 2.4.3 Focus Order
    - 2.1.1 Keyboard
    - 2.1.2 No Keyboard Trap
    - 1.3.1 Info and Relationships (landmarks)

## Wrap-up
12. \`end_audit\`
13. \`nvda_stop\` — stop NVDA
14. \`generate_report\` with format "markdown"`,
        },
      },
    ];
  },
};

const imageAudit: PromptDefinition = {
  prompt: {
    name: 'image_accessibility_audit',
    description:
      'Audit image accessibility with NVDA. Checks alt text, decorative image handling, and complex image descriptions.',
    arguments: [
      {
        name: 'url',
        description: 'URL of the page to audit',
        required: true,
      },
    ],
  },
  getMessage: (args) => {
    const url = args.url ?? 'UNKNOWN_URL';
    return [
      {
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `Audit image accessibility on ${url} using NVDA.

## Setup
1. \`check_setup\` — verify Windows environment
2. \`nvda_start\` — start NVDA
3. Navigate to ${url} in browser
4. \`start_audit\` with url "${url}"

## Image Traversal
5. \`nvda_perform\` → moveToNextGraphic (repeat until exhausted)
   For each graphic:
   a. \`nvda_last_spoken_phrase\` — capture what NVDA announces
   b. \`nvda_item_text\` — get item text

## Per-Image Analysis
Classify each image based on NVDA's announcement:
- **Has descriptive alt text** → "graphic, [description]" → PASS
- **Empty alt (decorative)** → NVDA skips entirely or announces just role → PASS (verify intentional)
- **Missing alt** → NVDA announces filename or "graphic" with no description → VIOLATION
- **Alt text is filename** → e.g. "image001.jpg" → VIOLATION
- **Alt text is redundant** → same as surrounding text → WARNING
- **Alt text says "image of"/"picture of"** → redundant prefix → WARNING

For complex images (charts, graphs, infographics):
  \`nvda_perform\` → openLongDescription — check if long description exists and is comprehensive
  Verify the image has an aria-describedby, figure/figcaption, or linked long description

## Verification Checklist
- All informative images have meaningful alt text (WCAG 1.1.1)
- Decorative images are hidden from the accessibility tree (alt="" or role="presentation")
- Complex images have complete long descriptions

6. \`log_finding\` per image with issue

## Wrap-up
7. \`end_audit\`
8. \`nvda_stop\` — stop NVDA
9. \`generate_report\` with format "markdown"`,
        },
      },
    ];
  },
};

const PROMPT_DEFINITIONS: ReadonlyMap<string, PromptDefinition> = new Map([
  ['full_accessibility_audit', fullAccessibilityAudit],
  ['heading_structure_audit', headingStructureAudit],
  ['form_accessibility_audit', formAccessibilityAudit],
  ['navigation_audit', navigationAudit],
  ['image_accessibility_audit', imageAudit],
]);

export const listNvdaPrompts = (): ReturnType<typeof listPrompts> =>
  listPrompts(PROMPT_DEFINITIONS);

export const getNvdaPromptMessages = (
  name: string,
  args: Record<string, string | undefined>,
): ReturnType<typeof getPromptMessages> => getPromptMessages(name, args, PROMPT_DEFINITIONS);
