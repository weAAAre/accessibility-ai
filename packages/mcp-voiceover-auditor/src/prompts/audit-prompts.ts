import type { Prompt } from '@modelcontextprotocol/sdk/types.js';

interface PromptDefinition {
  readonly prompt: Prompt;
  readonly getMessage: (
    args: Record<string, string | undefined>,
  ) => { role: 'user'; content: { type: 'text'; text: string } }[];
}

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

### 2.1 Page Title & Language
- \`voiceover_item_text\` — check what VoiceOver announces on page load
- Verify the page title is descriptive (WCAG 2.4.2 Page Titled)
- Log finding

### 2.2 Landmark Regions
- \`voiceover_perform\` → jumpToTopEdge
- Navigate with \`voiceover_next\`, listening for landmarks (main, nav, banner, contentinfo, complementary)
- Log findings for WCAG 1.3.1 (Info and Relationships)

### 2.3 Heading Structure
- \`voiceover_perform\` → findNextHeading (repeat until exhausted)
- Record each heading level and text
- Verify: exactly one h1, no skipped levels (h1→h2→h3, not h1→h3)
- Log findings for WCAG 1.3.1, 2.4.6 (Headings and Labels)

### 2.4 Links
- \`voiceover_perform\` → findNextLink (repeat)
- Verify descriptive link text (not "click here", "read more", "here")
- Log findings for WCAG 2.4.4 (Link Purpose in Context)

### 2.5 Forms
- \`voiceover_perform\` → findNextControl (repeat)
- For each control: verify label, required state, keyboard reachability
- Log findings for WCAG 1.3.1, 3.3.2, 4.1.2

### 2.6 Images
- Navigate through images; verify alt text exists and is descriptive
- Decorative images must be hidden from the screen reader
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
6. \`voiceover_perform\` → jumpToTopEdge
7. \`voiceover_perform\` → findNextHeading — repeat until no more headings are found
8. For each heading record: level, text content, spoken phrase (use \`voiceover_last_spoken_phrase\` and \`voiceover_item_text\`)

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
5. \`voiceover_perform\` → findNextControl (repeat for every control)
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
6. Navigate the page and identify ARIA landmarks:
   - banner (header), navigation (nav), main, contentinfo (footer), complementary (aside)
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

export const AUDIT_PROMPTS: ReadonlyMap<string, PromptDefinition> = new Map([
  ['full_accessibility_audit', fullAccessibilityAudit],
  ['heading_structure_audit', headingStructureAudit],
  ['form_accessibility_audit', formAccessibilityAudit],
  ['navigation_audit', navigationAudit],
  ['fill_report_template', fillReportTemplate],
]);

export function listPrompts(): Prompt[] {
  return [...AUDIT_PROMPTS.values()].map((p) => p.prompt);
}

export function getPromptMessages(
  name: string,
  args: Record<string, string | undefined>,
): { role: 'user'; content: { type: 'text'; text: string } }[] {
  const definition = AUDIT_PROMPTS.get(name);
  if (!definition) {
    throw new Error(`Unknown prompt: ${name}. Available: ${[...AUDIT_PROMPTS.keys()].join(', ')}`);
  }
  return definition.getMessage(args);
}
