import type { PromptDefinition } from '@weaaare/mcp-auditor-core';
import { getPromptMessages, listPrompts } from '@weaaare/mcp-auditor-core';

// ─── Shared lifecycle instructions ───────────────────────────────────────────
// Every audit prompt follows the same start/stop discipline:
//   1. voiceover_start  →  check_setup  →  navigate →  focus_ensure_browser
//      (VoiceOver must be running before check_setup can verify AppleScript)
//   2. … audit work …
//   3. end_audit  →  voiceover_stop →  generate_report

const fullAccessibilityAudit: PromptDefinition = {
  prompt: {
    name: 'full_accessibility_audit',
    description:
      'Comprehensive screen reader accessibility audit of a web page. Covers headings, landmarks, links, forms, images, and keyboard navigation.',
    arguments: [
      {
        name: 'url',
        description: 'URL of the page to audit',
        required: true,
      },
      {
        name: 'browser',
        description: 'Browser to use (default: Google Chrome)',
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
    const browser = args.browser ?? 'Google Chrome';
    const wcagLevel = args.wcagLevel ?? 'AA';

    return [
      {
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `Perform a comprehensive accessibility audit of ${url}. Follow every step in order.

## Phase 1 — Environment & VoiceOver Startup
1. \`voiceover_start\` — **start VoiceOver** (must run first so check_setup can reach the VoiceOver process)
2. \`check_setup\` — verify macOS environment is ready (requires VoiceOver to be running)
3. Navigate to ${url} (use Playwright MCP if available, otherwise instruct the user)
4. \`focus_ensure_browser\` with browserName "${browser}"
5. \`start_audit\` with url "${url}", wcagLevel "${wcagLevel}"

## Phase 2 — Audit Workflow

### 2.0 Enable Quick Nav for efficient navigation
- \`voiceover_commander\` → toggleSingleKeyQuickNav
  (Once enabled: 'h' = next heading, 'l' = next link, 'f' = next form control, 'i' = next image, 'w' = next landmark, 't' = next table, '1'-'6' = heading levels. Shift+key = previous.)
  
### 2.1 Page Title & Language
- \`voiceover_item_text\` — check what VoiceOver announces on page load
- Verify the page title is descriptive (WCAG 2.4.2 Page Titled)
- Log finding

### 2.2 Landmark Regions
- \`voiceover_commander\` → goToBeginning
- \`voiceover_commander\` → findNextLandmark (repeat until exhausted)
- For each landmark: \`voiceover_last_spoken_phrase\` to identify its type (banner, navigation, main, contentinfo, complementary)
- Verify \`main\` landmark exists (required), \`navigation\` recommended
- Log findings for WCAG 1.3.1 (Info and Relationships)

### 2.3 Heading Structure
- \`voiceover_commander\` → goToBeginning
- \`voiceover_perform\` → findNextHeading (repeat until exhausted) — or use Quick Nav: \`voiceover_press\` 'h' repeatedly
- Record each heading level and text via \`voiceover_last_spoken_phrase\`
- Verify: exactly one h1, no skipped levels (h1→h2→h3, not h1→h3)
- Log findings for WCAG 1.3.1, 2.4.6 (Headings and Labels)

### 2.4 Links
- \`voiceover_commander\` → goToBeginning
- \`voiceover_perform\` → findNextLink (repeat) — or Quick Nav: \`voiceover_press\` 'l' repeatedly
- For each link: \`voiceover_last_spoken_phrase\` + \`voiceover_commander\` → readLinkAddress
- Verify descriptive link text (not "click here", "read more", "here")
- Log findings for WCAG 2.4.4 (Link Purpose in Context)

### 2.5 Forms
- \`voiceover_commander\` → goToBeginning
- Navigate by control type for thorough coverage:
  a. \`voiceover_commander\` → findNextField (repeat) — text inputs, selects, textareas
  b. \`voiceover_commander\` → findNextButton (repeat) — buttons/submit
  c. \`voiceover_commander\` → findNextTickbox (repeat) — checkboxes
  d. \`voiceover_commander\` → findNextRadioGroup (repeat) — radio groups
- For each control: verify label, required state via \`voiceover_last_spoken_phrase\`
- Log findings for WCAG 1.3.1, 3.3.2, 4.1.2

### 2.6 Images
- \`voiceover_commander\` → goToBeginning
- Use Quick Nav: \`voiceover_press\` 'i' to jump directly image-to-image (repeat until exhausted)
- For each image:
  a. \`voiceover_last_spoken_phrase\` — check announcement
  b. \`voiceover_commander\` → readImageDescriptionForItem — get image description
  c. Verify alt text exists and is descriptive
  d. Decorative images must be hidden from the screen reader
- Log findings for WCAG 1.1.1 (Non-text Content)

### 2.7 Keyboard Navigation
- Tab through the entire page
- Verify logical focus order, no keyboard traps, interactive elements reachable
- Log findings for WCAG 2.1.1, 2.1.2, 2.4.3

## Focus Recovery (use throughout Phase 2)
- \`focus_record\` after each section
- If focus seems lost → \`focus_last_known\` and recover
- If a dialog/notification appears → dismiss it and return

## Handling Inaccessible Flows
- Inability to navigate to an element via screen reader IS a finding — log it as a violation
- Try a workaround (e.g., Tab key) and continue; never stop at the first failure

## Phase 3 — Report & Shutdown
1. \`end_audit\`
2. \`generate_report\` with format "markdown"
3. Present the report with critical issues first
4. \`voiceover_stop\` — **stop VoiceOver**`,
        },
      },
    ];
  },
};

const headingStructureAudit: PromptDefinition = {
  prompt: {
    name: 'heading_structure_audit',
    description:
      'Audit heading structure of a web page using screen reader navigation. Checks h1 uniqueness, hierarchy, and descriptive content.',
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
          text: `Audit the heading structure of ${url} using VoiceOver.

## Setup
1. \`voiceover_start\` — start VoiceOver (must run first)
2. \`check_setup\` — verify environment (requires VoiceOver running)
3. Navigate to ${url}
4. \`focus_ensure_browser\`
5. \`start_audit\` with url "${url}"

## Heading Traversal
6. \`voiceover_commander\` → goToBeginning
7. \`voiceover_perform\` → findNextHeading — repeat until no more headings are found
   (Alternative: enable Quick Nav with \`voiceover_commander\` → toggleSingleKeyQuickNav, then \`voiceover_press\` 'h' repeatedly)
8. For each heading record: level, text content, spoken phrase (use \`voiceover_last_spoken_phrase\` and \`voiceover_item_text\`)
9. Also verify specific levels: \`voiceover_press\` '1' to find all h1s (should be exactly one)

## Verification
9. Check:
   - Exactly one h1 on the page
   - No skipped levels (e.g., h1→h3 without h2 is a violation)
   - Headings are descriptive (not empty, not just "Section")
   - Heading hierarchy reflects content structure
10. \`log_finding\` for each issue found

## Wrap-up
11. \`end_audit\`
12. \`voiceover_stop\` — stop VoiceOver
13. \`generate_report\` with format "markdown"`,
        },
      },
    ];
  },
};

const formAccessibilityAudit: PromptDefinition = {
  prompt: {
    name: 'form_accessibility_audit',
    description:
      'Audit form accessibility: labels, error messages, required fields, and keyboard navigation.',
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
          text: `Audit form accessibility on ${url} using VoiceOver.

## Setup
1. \`voiceover_start\` — start VoiceOver (must run first)
2. \`check_setup\` — verify environment (requires VoiceOver running)
3. navigate to ${url}, \`focus_ensure_browser\`
4. \`start_audit\` with url "${url}"

## Form Controls
5. Navigate by specific control type for thorough coverage:
   a. \`voiceover_commander\` → findNextField (repeat) — find all text inputs, selects, textareas
   b. \`voiceover_commander\` → findNextButton (repeat) — find all buttons
   c. \`voiceover_commander\` → findNextTickbox (repeat) — find all checkboxes
   d. \`voiceover_commander\` → findNextRadioGroup (repeat) — find all radio groups
6. For each control:
   a. Record VoiceOver announcement (label, role, state) via \`voiceover_last_spoken_phrase\`
   b. \`voiceover_item_text\` — verify label association
   c. Check required state is announced
   d. For text inputs: type text and check for validation messages
   e. Tab to next control to verify keyboard flow

## Verification
7. All inputs have labels (WCAG 1.3.1, 3.3.2)
8. Required fields indicated (WCAG 3.3.2)
9. Error messages announced (WCAG 3.3.1)
10. Form completable entirely by keyboard (WCAG 2.1.1)
11. Submit button reachable by keyboard
12. \`log_finding\` for each issue

## Wrap-up
13. \`end_audit\`
14. \`voiceover_stop\` — stop VoiceOver
15. \`generate_report\` with format "markdown"`,
        },
      },
    ];
  },
};

const navigationAudit: PromptDefinition = {
  prompt: {
    name: 'navigation_audit',
    description:
      'Audit keyboard navigation and landmark regions. Checks tab order, landmarks, skip links, and focus management.',
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
          text: `Audit keyboard navigation and landmarks on ${url} using VoiceOver.

## Setup
1. \`voiceover_start\` — start VoiceOver (must run first)
2. \`check_setup\` — verify environment (requires VoiceOver running)
3. navigate to ${url}, \`focus_ensure_browser\`
4. \`start_audit\` with url "${url}"

## Skip Links
5. Tab once from page start — check for a "skip to content" link

## Landmarks
6. \`voiceover_commander\` → findNextLandmark (repeat until exhausted)
   - For each: \`voiceover_last_spoken_phrase\` to identify type
   - Identify: banner (header), navigation (nav), main, contentinfo (footer), complementary (aside)
   - Log missing required landmarks (main is required, navigation recommended)

## Tab Order
7. Tab through the entire page start → end
   - Verify order follows visual/logical reading order
   - Verify no keyboard traps (can always Tab out)
   - Verify all interactive elements are reachable

## Focus Management
8. Modals: verify focus is trapped within modal when open
9. Expandable sections: verify focus moves appropriately

## Findings
10. \`log_finding\` for WCAG 2.4.1, 2.1.1, 2.1.2, 2.4.3, 1.3.1

## Wrap-up
11. \`end_audit\`
12. \`voiceover_stop\` — stop VoiceOver
13. \`generate_report\` with format "markdown"`,
        },
      },
    ];
  },
};

const fillReportTemplate: PromptDefinition = {
  prompt: {
    name: 'fill_report_template',
    description:
      'Fill a custom report template with audit data. Pass your template and the system will populate it with findings.',
    arguments: [
      {
        name: 'template',
        description:
          'Your report template with placeholders. Can be any format: CSV headers, markdown structure, VPAT table, etc.',
        required: true,
      },
    ],
  },
  getMessage: (args) => {
    const template = args.template ?? '';
    return [
      {
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `Fill the following report template with the audit data.

First, get the audit findings using \`get_findings\` and the audit status using \`get_audit_status\`.

Then, populate the template below with the actual audit data. Match the template structure exactly, filling in placeholders with real data.

## Template:
${template}

## Instructions:
- Preserve the exact format and structure of the template
- Fill in all fields with data from the audit findings
- If a field doesn't have corresponding data, mark it as "N/A"
- For any repeating rows/sections, create one entry per finding
- Maintain the same column order and naming`,
        },
      },
    ];
  },
};

export const VOICEOVER_PROMPTS: ReadonlyMap<string, PromptDefinition> = new Map([
  ['full_accessibility_audit', fullAccessibilityAudit],
  ['heading_structure_audit', headingStructureAudit],
  ['form_accessibility_audit', formAccessibilityAudit],
  ['navigation_audit', navigationAudit],
  ['fill_report_template', fillReportTemplate],
]);

export const listVoiceOverPrompts = (): ReturnType<typeof listPrompts> =>
  listPrompts(VOICEOVER_PROMPTS);

export const getVoiceOverPromptMessages = (
  name: string,
  args: Record<string, string | undefined>,
): ReturnType<typeof getPromptMessages> => getPromptMessages(name, args, VOICEOVER_PROMPTS);
