# Accordion Pattern

Source: [WAI-ARIA APG — Accordion Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/)

## Table of Contents

1. [Identity: what is (and isn't) an accordion](#identity)
2. [Variants](#variants)
3. [Anatomy & markup](#anatomy)
4. [Keyboard interaction](#keyboard)
5. [State management](#state-management)
6. [Screen reader expectations](#screen-reader)
7. [Implementation guide](#implementation)
8. [Common mistakes](#common-mistakes)
9. [Acceptance criteria](#acceptance-criteria)

---

<a id="identity"></a>
## 1. Identity: what is (and isn't) an accordion

An **accordion** is a vertically stacked set of interactive headings, each controlling the visibility of an associated content panel. It helps manage information density — users expand only the sections they need, reducing scrolling and cognitive load.

### Essential characteristics

A component is an accordion when all of these are true:

- It presents **multiple sections** stacked vertically
- Each section has a **heading that toggles** the visibility of its content panel
- The headings are **interactive** (keyboard operable, announced as buttons)
- The sections form a **logical group** of related content

### Distinguishing from similar patterns

| Component | Key difference |
|---|---|
| **Disclosure** (`<details>`/`<summary>`) | A single show/hide toggle. One disclosure is not an accordion — an accordion is a *set* of coordinated disclosures. If there's only one collapsible section, use a disclosure. |
| **Tabs** (`tablist`/`tab`/`tabpanel`) | Tabs navigate horizontally (or vertically) with arrow keys between tab triggers; only one panel is visible. Tabs are peers in a row/column, not stacked headings. |
| **Tree view** (`tree`/`treeitem`) | Hierarchical nesting with parent-child relationships. Accordion headers are flat siblings, not nested. |
| **Menu** (`menu`/`menuitem`) | Menus present actions or choices. Accordion sections reveal content, not trigger actions. |
| **Collapsible card** | A single card with a collapse toggle is a disclosure. Multiple collapsible cards become an accordion only when they follow the heading → button → panel structure with proper ARIA. |

---

<a id="variants"></a>
## 2. Variants

### Single-panel (exclusive)

Only one panel can be open at a time. Opening a panel automatically closes the previously open one.

Some implementations require at least one panel to always remain open (the open panel cannot be collapsed). Others allow all panels to be closed.

### Multi-panel (independent)

Multiple panels can be open simultaneously. Each panel operates independently — toggling one has no effect on the others. Any combination of open/closed panels is valid.

### Behavioral comparison

| Behavior | Single-panel (exclusive) | Multi-panel (independent) |
|---|---|---|
| Max panels open simultaneously | 1 | Any number (0 to N) |
| Opening a panel closes others | Yes | No |
| All panels can be closed | Depends on implementation | Always |
| `aria-disabled` on last open header | When collapse is not allowed | Never needed |

---

<a id="anatomy"></a>
## 3. Anatomy & markup

### Required structure

```
accordion container
├── heading (h1-h6, appropriate to page hierarchy)
│   └── button
│       ├── aria-expanded="true|false"
│       └── aria-controls="[panel-id]"
├── panel (div)
│   ├── role="region" (conditionally — see below)
│   └── aria-labelledby="[button-id]"
├── heading
│   └── button ...
├── panel ...
└── ...
```

### HTML example

```html
<div class="accordion">
  <h3>
    <button id="accordion-btn-1"
            aria-expanded="true"
            aria-controls="accordion-panel-1">
      Section title
    </button>
  </h3>
  <div id="accordion-panel-1"
       role="region"
       aria-labelledby="accordion-btn-1">
    <p>Panel content goes here.</p>
  </div>

  <h3>
    <button id="accordion-btn-2"
            aria-expanded="false"
            aria-controls="accordion-panel-2">
      Another section
    </button>
  </h3>
  <div id="accordion-panel-2"
       role="region"
       aria-labelledby="accordion-btn-2"
       hidden>
    <p>Hidden panel content.</p>
  </div>
</div>
```

### Attribute breakdown

| Attribute | Element | Purpose |
|---|---|---|
| `aria-expanded` | Header button | Communicates whether the controlled panel is visible (`true`) or hidden (`false`). Must update on every toggle. |
| `aria-controls` | Header button | Associates the button with its panel by referencing the panel's `id`. Allows assistive technology to navigate directly to the controlled content. |
| `role="region"` | Panel | Makes the panel a navigable landmark. Use `aria-labelledby` to name it after its header button. |
| `aria-labelledby` | Panel | Gives the region an accessible name derived from the header button text. |
| `hidden` | Panel | Hides collapsed panels from both visual rendering and the accessibility tree. Alternatives: `display: none` or `visibility: hidden` (both remove from a11y tree). |

### When to use (and skip) `role="region"`

The APG recommends `role="region"` on panels with `aria-labelledby`, but with a caveat: when the accordion has more than roughly 6 panels that can all be expanded simultaneously, it creates **landmark proliferation** — too many landmarks dilute their navigation value. Use `role="region"` when:

- The accordion has 6 or fewer panels, OR
- Panels contain their own headings or nested structure that benefits from landmark navigation

Skip it when a large number of panels could all be expanded at once.

---

<a id="keyboard"></a>
## 4. Keyboard interaction

### Required keys

| Key | Behavior |
|---|---|
| **Enter** | When focus is on a header button: toggles the associated panel (expands if collapsed, collapses if expanded — when collapse is allowed). |
| **Space** | Same as Enter. |
| **Tab** | Moves focus to the next focusable element in page order. If the next element is inside an expanded panel, focus enters the panel content. If the panel is collapsed, focus skips over it entirely. |
| **Shift+Tab** | Moves focus to the previous focusable element in page order. |

The critical behavior for Tab: **collapsed panels are completely inert**. Their content must not receive focus. When a panel is expanded and contains focusable elements (links, inputs, buttons), Tab flows through them in DOM order before continuing to the next header.

**Focus after activation**: when the user activates a header button (Enter or Space), focus stays on that header button. It does not jump to the panel or anywhere else.

### Optional keys

These enhance navigation between headers but are not required by the APG:

| Key | Behavior |
|---|---|
| **Down Arrow** | Moves focus to the next header button (not into panel content). |
| **Up Arrow** | Moves focus to the previous header button. |
| **Home** | Moves focus to the first header button. |
| **End** | Moves focus to the last header button. |

When arrow key navigation is implemented, decide whether it **wraps** (Down Arrow on last header moves to first) or **stops** at the boundaries. Both are valid — pick one and apply it consistently.

Arrow keys move focus **only between header buttons**, never into panel content. Tab is the mechanism for entering/exiting panel content.

---

<a id="state-management"></a>
## 5. State management

### State transitions

The core state is `aria-expanded` on each header button. It must always reflect the actual visibility of its panel — no discrepancy is acceptable.

**Single-panel (exclusive):**

```
User activates Header B (currently collapsed):
  1. Header A: aria-expanded="true" → "false"
  2. Panel A:  visible → hidden
  3. Header B: aria-expanded="false" → "true"
  4. Panel B:  hidden → visible
```

When the implementation requires one panel to always be open and the user tries to collapse the only open panel:
- The panel remains open, `aria-expanded` stays `"true"`
- The button should have `aria-disabled="true"` to signal it cannot be collapsed
- Activating it has no effect

**Multi-panel (independent):**

```
User activates Header B:
  1. Header B: aria-expanded toggles ("true" ↔ "false")
  2. Panel B:  toggles visibility
  3. All other headers/panels: unchanged
```

### Hiding collapsed panels

Collapsed panels must be hidden from **both** visual presentation and the accessibility tree. Valid approaches:

| Technique | Visual | Accessibility tree | Tab order |
|---|---|---|---|
| `hidden` attribute | Hidden | Removed | Skipped |
| `display: none` | Hidden | Removed | Skipped |
| `visibility: hidden` | Hidden (space preserved) | Removed | Skipped |
| `aria-hidden="true"` + visual hiding | Hidden | Removed | **Not skipped** — needs extra work |

The `hidden` attribute or `display: none` are preferred because they handle all three concerns automatically. Avoid `aria-hidden="true"` alone — it removes content from the accessibility tree but does not prevent focus, leaving a possible trap where keyboard users tab into invisible content.

### Initial state

On first render, the accordion can start with:
- One panel expanded (typical for single-panel variant — usually the first)
- All panels collapsed (valid for both variants)
- Multiple panels expanded (only valid for multi-panel variant)

Whichever initial state is chosen, every header button's `aria-expanded` must match its panel's visibility from the first render.

---

<a id="screen-reader"></a>
## 6. Screen reader expectations

### When focus lands on a header button

The screen reader should convey:

1. **Accessible name** — the button's text content (the section title)
2. **Role** — "button"
3. **State** — "expanded" or "collapsed"
4. **Heading level** — "heading level N" (because the button is inside a heading element)

Example announcement: *"Section title, expanded, button, heading level 3"*

The exact order and wording vary by screen reader, but all four pieces of semantic information must be present.

### When the user activates a header button

The screen reader announces the state transition:
- Expanding: announces "expanded"
- Collapsing: announces "collapsed"

In the single-panel variant, when opening one panel automatically closes another, the user learns about the closure when they navigate back to that header — there is no proactive announcement for the panel that was closed in the background.

### When navigating into a panel

If the panel has `role="region"`:
- The screen reader announces entering a region landmark and its accessible name (from `aria-labelledby`)
- On exiting the panel, some screen readers announce leaving the region

Panel content is fully readable in browse/reading mode when expanded. Collapsed panels produce no announcements.

### Disabled header

When a header button has `aria-disabled="true"` (e.g., the only open panel in a single-panel accordion that requires one to always be open), the screen reader announces "dimmed" or "disabled".

---

<a id="implementation"></a>
## 7. Implementation guide

### Start from semantic HTML

```html
<!-- Each section: heading wrapping a button, followed by the panel -->
<h3>
  <button aria-expanded="false" aria-controls="panel-1">Section title</button>
</h3>
<div id="panel-1" role="region" aria-labelledby="..." hidden>
  ...panel content...
</div>
```

Why a `<button>` inside a heading? The button provides native keyboard interaction (Enter, Space) and the correct role. The heading provides the hierarchical semantics. Together, the screen reader sees both: "heading level 3, Section title, collapsed, button". Using a `<div>` with `role="button"` would require manually adding `tabindex="0"`, a `keydown` handler for Enter and Space, and click handling — all of which `<button>` provides for free.

### Toggle logic

On button activation:

1. Read current `aria-expanded` value
2. If single-panel variant and another panel is open: close that panel first (set its `aria-expanded="false"`, add `hidden` to its panel)
3. Toggle: flip `aria-expanded`, toggle `hidden` on the target panel
4. If single-panel with always-one-open requirement and this is the last open panel: do nothing, or set `aria-disabled="true"` on this button

### Heading level

The heading level (h2, h3, h4, etc.) should fit the page's document outline. All accordion headers within the same accordion use the same heading level. Do not skip heading levels relative to surrounding content — if the accordion sits under an `<h2>`, use `<h3>` for accordion headers.

### Animation considerations

If panels animate open/close (slide, fade), ensure:
- `aria-expanded` updates immediately at the start of the transition, not at the end
- Focus management is not delayed by the animation
- Users who prefer reduced motion (`prefers-reduced-motion: reduce`) see instant transitions
- Content is not accessible during the "closing" animation — once `aria-expanded` is `false`, the content should not be focusable or announced

### Framework-specific notes

When using component libraries (Radix, Headless UI, Chakra, MUI):
- Verify they emit the heading → button → panel structure, not just `div` wrappers
- Check that `aria-expanded`, `aria-controls`, and panel `hidden`/`display` are managed correctly
- Test with a screen reader — libraries sometimes miss edge cases around the `region` role or heading level

---

<a id="common-mistakes"></a>
## 8. Common mistakes

### Heading is missing or the button is outside the heading

**Problem**: The header button is not wrapped in a heading element (`h1`–`h6`), or the heading wraps additional content beyond the button. Screen readers lose the heading semantics, breaking document outline navigation.

**Fix**: Wrap each header button in a heading element at the appropriate level. The heading should contain only the button — other elements (icons, badges) go outside the heading or inside the button.

### `aria-expanded` does not match visible state

**Problem**: The `aria-expanded` attribute says `"true"` but the panel is visually hidden (or vice versa). Screen reader users get incorrect information.

**Fix**: Update `aria-expanded` synchronously with the panel's visibility. Test by toggling panels and inspecting both the attribute and the computed visibility.

### Collapsed panels are focusable

**Problem**: A collapsed panel's content still receives focus via Tab — typically because the panel is hidden with `opacity: 0` or `height: 0` instead of `display: none` or `hidden`. Keyboard users tab into invisible content.

**Fix**: Use `hidden`, `display: none`, or add `tabindex="-1"` to all focusable children when collapsing. The safest approach is `hidden` or `display: none` — they handle everything automatically.

### Interactive elements inside the heading

**Problem**: The heading element contains a second button (e.g., a menu trigger or delete button) alongside the accordion toggle. This nests interactive elements inside a heading, confusing assistive technology.

**Fix**: Place additional interactive elements adjacent to the heading, not inside it. The heading should contain only the accordion toggle button.

### Missing `aria-controls`

**Problem**: The header button has `aria-expanded` but no `aria-controls` referencing the panel. Some assistive technologies use `aria-controls` to let users jump directly from the button to the panel content.

**Fix**: Add `aria-controls="[panel-id]"` to each header button, matching the `id` of its associated panel.

### Using `aria-hidden="true"` instead of `hidden` for collapsed panels

**Problem**: `aria-hidden="true"` removes content from the accessibility tree but does not prevent focus. Keyboard users can tab into content that screen readers cannot see, creating confusion.

**Fix**: Use the `hidden` attribute or `display: none`. If visual hiding must use a different technique (e.g., for animation), also manage `tabindex="-1"` on all focusable children within the collapsed panel.

### Single section treated as an accordion

**Problem**: A single collapsible section uses accordion structure. This adds unnecessary complexity — a single show/hide is a disclosure pattern, not an accordion.

**Fix**: If there is only one collapsible section, use `<details>`/`<summary>` or a simple disclosure button. Reserve accordion structure for two or more sections.

---

<a id="acceptance-criteria"></a>
## 9. Acceptance criteria

Concise, verifiable checks for auditing an accordion implementation. Each criterion includes its severity.

### Structure

| # | Criterion | Severity |
|---|---|---|
| S1 | Each accordion header contains exactly one `<button>` element (no other interactive elements inside the heading). | Critical |
| S2 | Each header button is wrapped in a heading element (`h1`–`h6`) at the appropriate level for the page outline. | Critical |
| S3 | Each header button has `aria-expanded="true"` when its panel is visible and `aria-expanded="false"` when hidden. | Critical |
| S4 | Each header button has `aria-controls` referencing its panel's `id`. | Critical |
| S5 | Each panel with `role="region"` has `aria-labelledby` referencing its header button's `id`. | Major |
| S6 | Panels with `role="region"` are only used when there are 6 or fewer expandable panels (avoid landmark proliferation). | Minor |
| S7 | The visual state of each panel (visible/hidden) matches its header button's `aria-expanded` value at all times. | Critical |
| S8 | Collapsed panels are hidden from the accessibility tree (via `hidden`, `display: none`, or equivalent). | Critical |

### Keyboard

| # | Criterion | Severity |
|---|---|---|
| K1 | Enter and Space on a header button toggle its panel. | Critical |
| K2 | Tab moves focus to the next focusable element in page order (into expanded panel content if applicable). | Critical |
| K3 | Tab skips all content inside collapsed panels — no focusable element inside a collapsed panel receives focus. | Critical |
| K4 | Focus remains on the header button after activation (does not jump to the panel). | Critical |
| K5 | If arrow key navigation is implemented: Up/Down Arrow moves between header buttons only (not into panel content). | Minor |
| K6 | If Home/End keys are implemented: Home moves to the first header, End to the last. | Minor |

### Screen reader

| # | Criterion | Severity |
|---|---|---|
| SR1 | When focus lands on a header button, the screen reader announces: accessible name, role ("button"), expanded/collapsed state, and heading level. | Critical |
| SR2 | Activating a header button triggers a state change announcement ("expanded" or "collapsed"). | Critical |
| SR3 | Collapsed panel content produces no screen reader announcements during sequential navigation. | Critical |
| SR4 | If panels use `role="region"`, entering the panel announces the region landmark and its name. | Major |
| SR5 | A disabled header button (`aria-disabled="true"`) is announced as disabled/dimmed. | Major |

### Single-panel variant

| # | Criterion | Severity |
|---|---|---|
| SP1 | Opening a panel closes the previously open panel; only one panel is visible at a time. | Critical |
| SP2 | When a panel closes because another was opened, both buttons' `aria-expanded` update correctly. | Critical |
| SP3 | If the implementation requires one panel always open: the last open panel's button has `aria-disabled="true"` and cannot be collapsed. | Major |
| SP4 | If the implementation allows all panels closed: collapsing the only open panel works and sets all `aria-expanded` to `"false"`. | Critical |

### Multi-panel variant

| # | Criterion | Severity |
|---|---|---|
| MP1 | Opening a panel does not close any other panel. | Critical |
| MP2 | Multiple panels can be visible simultaneously with correct `aria-expanded` on each header. | Critical |
| MP3 | Each panel can be independently collapsed regardless of other panels' state. | Critical |
| MP4 | No header button has `aria-disabled="true"` (since any panel can always be collapsed). | Major |

### Edge cases

| # | Criterion | Severity |
|---|---|---|
| E1 | A dynamically added section follows the same heading → button → panel structure and is reachable via keyboard. | Critical |
| E2 | A dynamically removed section leaves no orphaned `aria-controls` references; if the removed section had focus, focus is managed gracefully. | Major |
| E3 | If a panel contains no focusable elements, Tab from the header moves directly to the next header (the panel is still readable via screen reader browse mode). | Major |
| E4 | Nested accordions use a deeper heading level and operate independently from the parent. | Minor |
| E5 | If the heading has adjacent elements (icon, badge, menu button), they are outside the heading element and independently keyboard accessible. | Major |
