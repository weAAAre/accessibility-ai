import type { PromptDefinition } from '@weaaare/mcp-auditor-core';
import { getPromptMessages, listPrompts } from '@weaaare/mcp-auditor-core';

// ─── Virtual Screen Reader Prompts ───────────────────────────────────────────
// These use the virtual screen reader (headless browser + injected SR).
// Workflow: virtual_start → navigate → log_finding → virtual_stop → report

const virtualAccessibilityAudit: PromptDefinition = {
  prompt: {
    name: 'virtual_accessibility_audit',
    description:
      'Run an accessibility audit using the Virtual Screen Reader. Choose the page and the type of test. Works on any OS — no real screen reader required.',
    arguments: [
      {
        name: 'url',
        description: 'URL of the page to audit',
        required: true,
      },
      {
        name: 'testType',
        description: 'Type of test to run: full | headings | forms | navigation | links | images',
        required: true,
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
    const testType = args.testType ?? 'full';
    const wcagLevel = args.wcagLevel ?? 'AA';

    const testBlocks: Record<string, string> = {
      full: `## Phase 2 — Audit Workflow

### 2.1 Page Title & Language
- \`virtual_item_text\` — check what the screen reader announces on page load
- Verify the page title is descriptive (WCAG 2.4.2)
- \`log_finding\`

### 2.2 Landmark Regions
- \`virtual_perform\` → moveToNextLandmark (repeat until exhausted) to get overview
- Then check specific landmark types directly:
  - \`virtual_perform\` → moveToNextMain (required — verify it exists)
  - \`virtual_perform\` → moveToNextNavigation (recommended)
  - \`virtual_perform\` → moveToNextBanner (header)
  - \`virtual_perform\` → moveToNextContentinfo (footer)
  - \`virtual_perform\` → moveToNextComplementary (aside)
  - \`virtual_perform\` → moveToNextSearch (search region)
- \`log_finding\` for WCAG 1.3.1

### 2.3 Heading Structure
- \`virtual_perform\` → moveToNextHeading (repeat until exhausted)
- Record each heading level and text via \`virtual_last_spoken_phrase\` and \`virtual_item_text\`
- Verify: exactly one h1, no skipped levels
- \`log_finding\` for WCAG 1.3.1, 2.4.6

### 2.4 Links
- \`virtual_perform\` → moveToNextLink (repeat)
- Verify descriptive link text (not "click here", "read more", "here")
- \`log_finding\` for WCAG 2.4.4

### 2.5 Forms
- \`virtual_perform\` → moveToNextForm (repeat) — find form containers
- Within each form: \`virtual_perform\` → findNextControl (repeat) — find individual controls
- For each control: \`virtual_last_spoken_phrase\` to verify label, required state
- \`log_finding\` for WCAG 1.3.1, 3.3.2, 4.1.2

### 2.6 Images
- \`virtual_perform\` → moveToNextFigure (repeat until exhausted) — jump directly from image to image
- For each image:
  a. \`virtual_last_spoken_phrase\` — check what is announced
  b. \`virtual_item_text\` — check the text content
  c. Informative images: verify alt text exists and is descriptive
  d. Decorative images: verify they are hidden (role="presentation" or alt="")
- \`log_finding\` for WCAG 1.1.1

### 2.7 Keyboard Navigation
- Use \`virtual_press\` with "Tab" to tab through the page
- Verify logical focus order, no keyboard traps, interactive elements reachable
- \`log_finding\` for WCAG 2.1.1, 2.1.2, 2.4.3`,
      headings: `## Phase 2 — Heading Audit

- \`virtual_perform\` → moveToNextHeading (repeat until exhausted) — collect all headings
- For each heading record: level and text via \`virtual_last_spoken_phrase\` and \`virtual_item_text\`
- Then verify h1 count with a targeted pass:
  - \`virtual_perform\` → moveToNextHeadingLevel1 (repeat) — count all h1s (must be exactly one)
- If skipped levels suspected, verify with level-specific commands:
  - moveToNextHeadingLevel2, moveToNextHeadingLevel3, etc.
- Verify:
  - Exactly one h1 on the page
  - No skipped levels (h1→h2→h3, not h1→h3)
  - Headings are descriptive (not empty, not just "Section")
  - Heading hierarchy reflects content structure
- \`log_finding\` for WCAG 1.3.1, 2.4.6`,
      forms: `## Phase 2 — Form Audit

- \`virtual_perform\` → moveToNextForm (repeat) — find form containers
- Within each form, find individual controls:
  a. \`virtual_perform\` → findNextControl (repeat until exhausted)
- For each control:
  a. Record announcement via \`virtual_last_spoken_phrase\`
  b. \`virtual_item_text\` — verify label association
  c. Check required state is announced
  d. For text inputs: \`virtual_type\` to enter text, check validation
  e. \`virtual_press\` with "Tab" to verify keyboard flow
- Also check ARIA error relationships: \`virtual_perform\` → jumpToErrorMessageElement
- Verify:
  - All inputs have labels (WCAG 1.3.1, 3.3.2)
  - Required fields indicated (WCAG 3.3.2)
  - Error messages announced (WCAG 3.3.1)
  - Form completable entirely by keyboard (WCAG 2.1.1)
  - Submit button reachable by keyboard
- \`log_finding\` for each issue`,
      navigation: `## Phase 2 — Navigation Audit

### Skip Links
- \`virtual_press\` with "Tab" once from start — check for a "skip to content" link

### Landmarks
- Check each specific landmark type directly for precise verification:
  - \`virtual_perform\` → moveToNextMain — MUST exist (required landmark)
  - \`virtual_perform\` → moveToNextNavigation — recommended
  - \`virtual_perform\` → moveToNextBanner — header region
  - \`virtual_perform\` → moveToNextContentinfo — footer region
  - \`virtual_perform\` → moveToNextComplementary — aside region
  - \`virtual_perform\` → moveToNextSearch — search region
  - \`virtual_perform\` → moveToNextRegion — named regions
- Then \`virtual_perform\` → moveToNextLandmark (repeat) to catch any additional landmarks
- \`log_finding\` for WCAG 1.3.1

### Tab Order
- \`virtual_press\` with "Tab" through entire page
- Verify order follows visual/logical reading order
- Verify no keyboard traps (can always Tab out)
- Verify all interactive elements are reachable
- \`log_finding\` for WCAG 2.1.1, 2.1.2, 2.4.3

### Focus Management
- Check modals: focus should be trapped inside
- Check expandable sections: focus should move appropriately
- \`log_finding\` for WCAG 2.4.3`,
      links: `## Phase 2 — Link Audit

- \`virtual_perform\` → moveToNextLink (repeat until exhausted)
- For each link:
  a. \`virtual_last_spoken_phrase\` — record full announcement
  b. \`virtual_item_text\` — record link text
  c. Verify link text is descriptive (not "click here", "read more", "here", "link")
  d. Verify link purpose is clear from text alone or surrounding context
  e. Check for redundant links (same destination, different text)
- \`log_finding\` for WCAG 2.4.4 (Link Purpose in Context)`,
      images: `## Phase 2 — Image Audit

- \`virtual_perform\` → moveToNextFigure (repeat until exhausted) — jump directly from image to image
- For each image:
  a. \`virtual_last_spoken_phrase\` — check what the screen reader announces
  b. \`virtual_item_text\` — check the text content
  c. Informative images: verify alt text exists and is descriptive
  d. Decorative images: verify they are hidden from the screen reader (role="presentation" or alt="")
  e. Complex images (charts, diagrams): verify long description is provided (check with \`virtual_perform\` → jumpToDetailsElement)
- \`log_finding\` for WCAG 1.1.1 (Non-text Content)`,
    };

    const testBlock = testBlocks[testType] ?? testBlocks.full;

    return [
      {
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `Run a ${testType} accessibility audit of ${url} using the Virtual Screen Reader. Follow every step in order.

## Phase 1 — Start
1. \`virtual_start\` with url "${url}"
2. \`start_audit\` with url "${url}", screenReader "virtual", wcagLevel "${wcagLevel}"

${testBlock}

## Handling Issues
- Inability to navigate to an element via screen reader IS a finding — log it as a violation
- Try a workaround (e.g., Tab key via \`virtual_press\`) and continue; never stop at the first failure

## Phase 3 — Report & Shutdown
1. \`end_audit\`
2. \`generate_report\` with format "markdown"
3. Present the report with critical issues first
4. \`virtual_stop\``,
        },
      },
    ];
  },
};

const virtualFullAudit: PromptDefinition = {
  prompt: {
    name: 'virtual_full_audit',
    description:
      'Comprehensive virtual screen reader audit. Covers headings, landmarks, links, forms, images, and keyboard navigation.',
    arguments: [
      {
        name: 'url',
        description: 'URL of the page to audit',
        required: true,
      },
      {
        name: 'wcagLevel',
        description: 'WCAG conformance level: A, AA, or AAA (default: AA)',
        required: false,
      },
    ],
  },
  getMessage: (args) =>
    virtualAccessibilityAudit.getMessage({
      ...args,
      testType: 'full',
    }),
};

const virtualHeadingAudit: PromptDefinition = {
  prompt: {
    name: 'virtual_heading_audit',
    description:
      'Audit heading structure using the Virtual Screen Reader. Checks h1 uniqueness, hierarchy, and descriptive content.',
    arguments: [
      {
        name: 'url',
        description: 'URL of the page to audit',
        required: true,
      },
    ],
  },
  getMessage: (args) =>
    virtualAccessibilityAudit.getMessage({
      ...args,
      testType: 'headings',
    }),
};

const virtualFormAudit: PromptDefinition = {
  prompt: {
    name: 'virtual_form_audit',
    description:
      'Audit form accessibility using the Virtual Screen Reader: labels, error messages, required fields, and keyboard navigation.',
    arguments: [
      {
        name: 'url',
        description: 'URL of the page with forms to audit',
        required: true,
      },
    ],
  },
  getMessage: (args) =>
    virtualAccessibilityAudit.getMessage({
      ...args,
      testType: 'forms',
    }),
};

const virtualNavigationAudit: PromptDefinition = {
  prompt: {
    name: 'virtual_navigation_audit',
    description:
      'Audit keyboard navigation and landmarks using the Virtual Screen Reader. Checks tab order, landmarks, skip links, and focus management.',
    arguments: [
      {
        name: 'url',
        description: 'URL of the page to audit',
        required: true,
      },
    ],
  },
  getMessage: (args) =>
    virtualAccessibilityAudit.getMessage({
      ...args,
      testType: 'navigation',
    }),
};

export const VIRTUAL_PROMPTS: ReadonlyMap<string, PromptDefinition> = new Map([
  ['virtual_accessibility_audit', virtualAccessibilityAudit],
  ['virtual_full_audit', virtualFullAudit],
  ['virtual_heading_audit', virtualHeadingAudit],
  ['virtual_form_audit', virtualFormAudit],
  ['virtual_navigation_audit', virtualNavigationAudit],
]);

export const listVirtualPrompts = (): ReturnType<typeof listPrompts> =>
  listPrompts(VIRTUAL_PROMPTS);

export const getVirtualPromptMessages = (
  name: string,
  args: Record<string, string | undefined>,
): ReturnType<typeof getPromptMessages> => getPromptMessages(name, args, VIRTUAL_PROMPTS);
