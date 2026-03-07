# Tabs — Tabbed Interface Pattern

## Identity

A tabs interface displays one panel of content at a time, with a set of tab elements along one edge that act as selectors. Tabs are NOT the same as accordions (which can show multiple panels) or navigation bars (which navigate to different pages).

### When to Use Tabs vs. Alternatives

| Pattern | Use when | NOT when |
|---------|----------|----------|
| **Tabs** | Content sections are parallel/equivalent and user switches between them frequently | Sections are sequential or all need to be visible at once |
| **Accordion** | Many sections, user may need multiple open, vertical space is limited | Sections are tightly related and switching is primary action |
| **Navigation bar** | Links go to different pages/URLs | Content loads in-place without navigation |

## Critical Implementation Details

### Automatic vs. Manual Activation — The Definitive Answer

The APG **explicitly recommends automatic activation** (panel displays when tab receives focus via arrow keys) as the default behavior. This contradicts many blog posts and tutorials that teach manual activation.

**Automatic activation** (recommended):
- When user presses arrow key to move focus to a tab, the tab's panel is immediately displayed
- No need to press Space/Enter to activate
- APG recommendation: "tabs activate automatically when they receive focus as long as their associated tab panels are displayed without noticeable latency"

**Manual activation** (use only when):
- Tab panel content loads asynchronously (network request)
- Displaying the panel causes a significant latency that would slow keyboard navigation
- The tab triggers a destructive/side-effect action

**Why automatic is better:** With manual activation, keyboard users must press an arrow key AND then Space/Enter for every tab — doubling the interaction cost. Screen reader users may not realize they need to activate after focusing.

### Tab Key Behavior — Counterintuitive but Critical

Pressing **Tab** while focused on a tab element should:
1. Move focus **into the tab panel** (or to the next focusable element after the tab list)
2. **NOT** move to the next tab in the list

Pressing **Shift+Tab** while in the tab panel should return focus to the active tab.

Arrow keys (Left/Right for horizontal, Up/Down for vertical) navigate between tabs within the tab list. This "roving tabindex" pattern means:
- The **active tab** gets `tabindex="0"` 
- All **inactive tabs** get `tabindex="-1"`
- Only one tab is in the page's tab sequence at any time

### tabpanel Must Be Focusable (Conditional)

If the tab panel contains no focusable elements, OR if the first element with meaningful content is not focusable, the `<div role="tabpanel">` **must** have `tabindex="0"`. Otherwise, pressing Tab from the tab list would skip the panel entirely.

```html
<!-- Panel with no interactive content — needs tabindex="0" -->
<div role="tabpanel" id="panel-1" aria-labelledby="tab-1" tabindex="0">
  <p>This panel has only text content, no links or buttons.</p>
</div>

<!-- Panel with focusable content — tabindex NOT needed -->
<div role="tabpanel" id="panel-2" aria-labelledby="tab-2">
  <a href="/details">View details</a>
  <p>More content here.</p>
</div>
```

## Required Markup

```html
<div role="tablist" aria-label="Entertainment options">
  <button role="tab" id="tab-1" aria-selected="true" aria-controls="panel-1" tabindex="0">
    Movies
  </button>
  <button role="tab" id="tab-2" aria-selected="false" aria-controls="panel-2" tabindex="-1">
    Music
  </button>
  <button role="tab" id="tab-3" aria-selected="false" aria-controls="panel-3" tabindex="-1">
    Games
  </button>
</div>

<div role="tabpanel" id="panel-1" aria-labelledby="tab-1" tabindex="0">
  <!-- Panel 1 content — visible -->
</div>
<div role="tabpanel" id="panel-2" aria-labelledby="tab-2" tabindex="0" hidden>
  <!-- Panel 2 content — hidden -->
</div>
<div role="tabpanel" id="panel-3" aria-labelledby="tab-3" tabindex="0" hidden>
  <!-- Panel 3 content — hidden -->
</div>
```

### Required ARIA Attributes

| Element | Role | Required Attributes | Notes |
|---------|------|-------------------|-------|
| Tab list container | `tablist` | `aria-label` or `aria-labelledby` | Label describes the tab set |
| Each tab | `tab` | `aria-selected`, `aria-controls` | `aria-controls` → associated tabpanel ID |
| Each panel | `tabpanel` | `aria-labelledby` | Points back to associated tab |

### `aria-orientation` on `tablist`

| Value | Keyboard behavior | When to use |
|-------|------------------|-------------|
| `horizontal` (default) | Left/Right arrow keys navigate tabs | Standard top/bottom tab bar |
| `vertical` | Up/Down arrow keys navigate tabs | Side tabs layout |

When `aria-orientation="vertical"`:
- Up Arrow replaces Left Arrow
- Down Arrow replaces Right Arrow
- Horizontal tab lists should NOT intercept Up/Down keys (they need to be available for page scrolling)

## Keyboard Interaction

| Key | Behavior |
|-----|----------|
| **Tab** | Moves focus into tab list → active tab. From active tab → into tab panel (or next focusable element outside tablist) |
| **Shift+Tab** | Reverse of Tab |
| **Left Arrow** (horizontal) | Moves focus to previous tab. Wraps from first to last. Optionally activates. |
| **Right Arrow** (horizontal) | Moves focus to next tab. Wraps from last to first. Optionally activates. |
| **Up Arrow** (vertical) | Same as Left Arrow for vertical tabs |
| **Down Arrow** (vertical) | Same as Right Arrow for vertical tabs |
| **Space / Enter** | Activates the focused tab (only needed for manual activation) |
| **Home** (optional) | Moves focus to first tab |
| **End** (optional) | Moves focus to last tab |
| **Delete** (optional) | If closeable, deletes current tab + panel, focus → next tab |

## State Management

### Tab Selection

```
User focuses tab via arrow key:
  ├── Automatic activation:
  │   → Set aria-selected="true" on focused tab
  │   → Set aria-selected="false" on all other tabs
  │   → Show associated panel, hide all others
  │   → Update tabindex: focused tab = "0", others = "-1"
  └── Manual activation (Space/Enter pressed):
      → Same state changes as automatic
```

### Tab Deletion (Optional)

```
User presses Delete on deletable tab:
  → Remove tab element and its panel from DOM
  → If deleted tab was AFTER other tabs: focus → next tab
  → If deleted tab was last: focus → previous tab
  → Optionally activate the newly focused tab
```

## Screen Reader Expectations

| Information | Expected announcement |
|-------------|---------------------|
| Role | "Tab" |
| Name | Tab's text label |
| Selected state | "Selected" or equivalent for active tab |
| Position | "Tab N of M" (e.g., "tab 2 of 3") |
| Associated panel | Panel content is accessible when tab is activated |
| Tablist context | Screen reader may announce "tab list" when entering the tablist |

### Known Screen Reader Behaviors

- **VoiceOver (macOS/iOS):** Announces tab count reliably but may not announce "selected" state change immediately on automatic activation — users may need to interact to hear updated state
- **JAWS:** Announces "tab N of M" when navigating. `aria-controls` is exposed, allowing JAWS users to jump to the controlled panel
- **NVDA:** Announces tab name, role, selection state, and position. Handles both automatic and manual activation
- **TalkBack:** Works well with tabs but announces panel content differently — focus moves into the panel content rather than announcing the panel as a labeled region

## Common Mistakes

### 1. Using Tabs for Navigation

❌ Using `role="tab"` for elements that navigate to different URLs. Tabs switch panels in-place; for navigation, use a regular `<nav>` with links.

### 2. Missing `aria-selected` on All Tabs

Every tab must have `aria-selected` set — `true` for the active tab, `false` for all others. Omitting `aria-selected="false"` on inactive tabs can cause screen readers to report incorrect state.

### 3. All Tabs Having `tabindex="0"`

Only the active tab should have `tabindex="0"`. Inactive tabs must have `tabindex="-1"`. If all tabs have `tabindex="0"`, Tab key will cycle through all tabs instead of moving to the panel — breaking the roving tabindex pattern.

### 4. Showing Only the Active Panel in HTML

Hidden panels should use the `hidden` attribute or `display: none` — NOT just visual hiding via CSS opacity or positioning. Hidden panels must be removed from the accessibility tree so screen readers don't encounter them when browsing content.

### 5. Intercepting Arrow Keys on Horizontal Tabs Vertically

A horizontal tab list should NOT capture Up/Down arrow keys. These should be available for normal page scrolling. Only Left/Right should navigate horizontal tabs.

### 6. Forgetting `tabindex="0"` on Non-Interactive Panels

If a tab panel contains only text content (no links, buttons, or inputs), the panel itself needs `tabindex="0"` so it receives focus when the user presses Tab from the tab list.

## Acceptance Criteria

### Critical
- [ ] Tab list has `role="tablist"` with accessible name
- [ ] Each tab has `role="tab"` with `aria-selected` and `aria-controls`
- [ ] Each panel has `role="tabpanel"` with `aria-labelledby`
- [ ] Only active tab has `tabindex="0"`, inactive tabs have `tabindex="-1"`
- [ ] Tab key moves from tablist into panel, NOT to next tab
- [ ] Arrow keys navigate between tabs (respecting `aria-orientation`)
- [ ] Hidden panels are removed from accessibility tree (`hidden` attribute or `display: none`)

### Major
- [ ] Automatic activation used when panels display without latency
- [ ] Non-interactive panels have `tabindex="0"` to receive focus
- [ ] Panel content updates immediately on tab activation
- [ ] Screen reader announces tab name, role, selection state, and position

### Minor
- [ ] Home/End keys supported for large tab sets
- [ ] Delete key for closeable tabs with proper focus management
- [ ] `aria-orientation="vertical"` set when tabs are arranged vertically
