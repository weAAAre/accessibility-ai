# Tooltip

> Source: [WAI-ARIA Authoring Practices — Tooltip Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/)
>
> Spec: [WAI-ARIA 1.2 — tooltip role](https://www.w3.org/TR/wai-aria-1.2/#tooltip)
>
> WCAG: [Understanding SC 1.4.13 — Content on Hover or Focus](https://www.w3.org/WAI/WCAG21/Understanding/content-on-hover-or-focus.html)

## Table of contents

1. [Identity](#identity)
2. [Variants](#variants)
3. [Anatomy & markup](#anatomy)
4. [Keyboard interaction](#keyboard)
5. [State management](#states)
6. [Screen reader expectations](#sr)
7. [Implementation guide](#implementation)
8. [Common mistakes](#mistakes)
9. [Acceptance criteria](#criteria)

---

<a id="identity"></a>

## 1 · Identity

A **tooltip** is a non-interactive, contextual popup that displays a short description for an element. It appears on hover or keyboard focus and disappears when the trigger loses hover/focus or the user presses Escape. Tooltips never receive focus themselves and must not contain interactive content (links, buttons, inputs).

> **APG status note:** The WAI-ARIA APG Tooltip pattern is marked "work in progress" and does not yet have task-force consensus. No official APG example exists (tracked in w3c/aria-practices issue #127). The guidance below synthesizes the draft APG pattern, the ARIA 1.2 spec, WCAG 1.4.13, and established community best practices.

### Essential characteristics

| Property | Value |
| --- | --- |
| ARIA role | `tooltip` (document structure role, NOT a widget role) |
| Superclass role | `section` |
| Name from | `contents`, `author` |
| Accessible name required | Yes |
| Trigger mechanism | Pointer hover **and** keyboard focus |
| Dismiss mechanism | Escape key, removing hover/focus |
| Receives focus | **Never** |
| Contains interactive content | **Never** |
| Relevant WCAG SC | 1.4.13 Content on Hover or Focus (AA) |

### What distinguishes a tooltip from similar patterns

| Feature | Tooltip | Toggletip | Popover / Non-modal dialog | Toast / Snackbar | `title` attribute |
| --- | --- | --- | --- | --- | --- |
| Trigger | Hover + focus | Click / press | Click / press | Automatic / timer | Hover only (browser) |
| Dismissible via Escape | Yes | Yes | Yes | Sometimes | No (browser-controlled) |
| Contains interactive content | No | No (plain text only) | Yes (links, buttons, forms) | Sometimes | No |
| Receives focus | No | No | Yes (focus trapped or managed) | No | No |
| ARIA role | `tooltip` | `status` (live region) | `dialog` | `status` or `alert` | None (native) |
| Keyboard accessible | Yes (focus trigger) | Yes (click/Enter) | Yes | N/A | No |
| Touch accessible | Problematic | Yes (tap trigger) | Yes | Yes | No |
| WCAG 1.4.13 applies | Yes | No (click-triggered) | No (click-triggered) | No | Exception (UA-controlled) |
| AT support | Varies; gaps exist | Good (live regions) | Good | Good | Unreliable |

---

<a id="variants"></a>

## 2 · Variants

Tooltips fall into three practical patterns based on the semantic relationship between the tooltip and its trigger.

### 2a — Describing tooltip (auxiliary description)

The tooltip provides **supplementary information** that describes the trigger element, which already has a visible or programmatic accessible name.

- Association: `aria-describedby` on the trigger references the tooltip's `id`.
- The trigger's label comes from its visible text, `aria-label`, or `aria-labelledby`.
- Screen readers announce the tooltip text after the label and role, typically with a pause.
- Example: A "Delete" button with a tooltip "Permanently remove this item and all its contents."

### 2b — Labelling tooltip (primary label)

The tooltip provides the **only accessible name** for the trigger, typically an icon-only button.

- Association: `aria-labelledby` on the trigger references the tooltip's `id`.
- The tooltip text replaces any other label source.
- Screen readers announce the tooltip text as the element's name.
- Example: An icon-only "star" button with a tooltip "Add to favorites."

### 2c — Toggletip (click-triggered, live region alternative)

When the supplementary content needs to work reliably across **touch, keyboard, and pointer**, a toggletip is more inclusive. Toggletips are NOT true tooltips — they are a distinct pattern.

- Trigger: Click / Enter / Space (not hover/focus).
- ARIA: Uses `role="status"` (live region), NOT `role="tooltip"`.
- Content is injected into the live region on activation so screen readers announce it.
- Does NOT use `aria-describedby` (that would expose content before click, making the button appear non-functional).
- Escape or clicking outside closes the bubble and empties the live region.

### Behavioral comparison

| Behavior | Describing tooltip | Labelling tooltip | Toggletip |
| --- | --- | --- | --- |
| ARIA on trigger | `aria-describedby` | `aria-labelledby` | `aria-label` (own label) |
| ARIA on popup | `role="tooltip"` | `role="tooltip"` | `role="status"` |
| Appears on | Hover + focus | Hover + focus | Click / Enter / Space |
| Touch-friendly | No (hover-based) | No (hover-based) | Yes |
| Content announces as | Description (after label + role) | Label (element name) | Live region announcement |
| Interactive content allowed | No | No | No (use dialog instead) |

---

<a id="anatomy"></a>

## 3 · Anatomy & markup

### Required structure — describing tooltip

```
trigger element [aria-describedby="tooltip-id"]
  └── (trigger content: text, icon, etc.)
tooltip element [role="tooltip"] [id="tooltip-id"]
  └── plain text content
```

### HTML — describing tooltip

```html
<div class="tooltip-wrapper">
  <button
    type="button"
    aria-describedby="delete-tooltip"
  >
    Delete
  </button>
  <div
    id="delete-tooltip"
    role="tooltip"
  >
    Permanently remove this item and all its contents
  </div>
</div>
```

### HTML — labelling tooltip (icon-only button)

```html
<div class="tooltip-wrapper">
  <button
    type="button"
    aria-labelledby="notifications-label"
  >
    <svg aria-hidden="true" focusable="false">
      <use href="#bell-icon"></use>
    </svg>
  </button>
  <div
    id="notifications-label"
    role="tooltip"
  >
    Notifications
  </div>
</div>
```

### HTML — toggletip (live region alternative)

```html
<span class="toggletip-wrapper">
  <button
    type="button"
    aria-label="More info"
    data-toggletip-content="This explains additional details about the feature"
  >
    <svg aria-hidden="true" focusable="false">
      <use href="#info-icon"></use>
    </svg>
  </button>
  <span role="status"></span>
</span>
```

When the button is clicked, JavaScript injects the bubble into the `role="status"` container:

```html
<span role="status">
  <span class="toggletip-bubble">
    This explains additional details about the feature
  </span>
</span>
```

### Attribute breakdown

| Attribute | Element | Purpose |
| --- | --- | --- |
| `role="tooltip"` | Tooltip element | Identifies the element as a tooltip; a document structure role conveying that this is a contextual description popup |
| `id` | Tooltip element | Target for `aria-describedby` or `aria-labelledby` reference |
| `aria-describedby` | Trigger element | Links trigger to tooltip as supplementary description; content announced after label + role |
| `aria-labelledby` | Trigger element | Links trigger to tooltip as primary label; content announced as element name |
| `aria-hidden="true"` | SVG icons inside trigger | Prevents SVG markup from being read by screen readers when a proper label exists |
| `focusable="false"` | SVG icons inside trigger | Prevents SVG from receiving focus in IE/Edge legacy |
| `role="status"` | Live region (toggletip) | Creates an implicit `aria-live="polite"` region; content changes are announced |
| `aria-label` | Toggletip button | Provides the button's accessible name; must NOT use `aria-describedby` for toggletips |

### The `title` attribute — why NOT to use it

The HTML `title` attribute creates browser-native tooltips, but it fails accessibility requirements:

| Problem | Detail |
| --- | --- |
| Not keyboard accessible | Only appears on mouse hover; keyboard-only users never see it |
| Not touch accessible | Mobile/tablet users cannot trigger hover |
| Inconsistent AT support | Some screen readers read `title` in some configurations, others ignore it |
| Cannot be styled | Browser controls appearance; cannot meet branding or sizing needs |
| Cannot be hovered | Disappears when pointer moves to it; fails WCAG 1.4.13 Hoverable |
| Timing is UA-controlled | May disappear before users finish reading; fails WCAG 1.4.13 Persistent |
| WCAG 1.4.13 exception | Browser-rendered `title` tooltips are exempted from 1.4.13 because they are UA-controlled, but this means they simply fail the spirit of the criterion |

> **Recommendation:** Never use `title` for essential information. If used at all, treat it as a redundant hint for mouse users and always provide a proper accessible label or description through other means.

---

<a id="keyboard"></a>

## 4 · Keyboard interaction

### Required keys

| Key | Behavior |
| --- | --- |
| `Tab` | Moves focus to the trigger element; tooltip appears |
| `Shift + Tab` | Moves focus away from the trigger; tooltip disappears |
| `Escape` | Dismisses the tooltip without moving focus; focus remains on the trigger |

### Additional keys (toggletip variant)

| Key | Behavior |
| --- | --- |
| `Enter` / `Space` | Activates the toggletip button; injects content into live region |
| `Escape` | Clears the live region content and hides the bubble |

### Focus behavior

- The tooltip itself **never receives focus**. It is a non-interactive overlay.
- Focus always stays on the trigger element while the tooltip is visible.
- If the tooltip content requires interaction (links, buttons, close controls), the pattern is **wrong** — use a non-modal dialog or disclosure instead.
- When the trigger element is a button with both hover and focus states, the tooltip must appear equally for both mouse hover and keyboard focus.

### WCAG 1.4.13 keyboard requirements

| Condition | Requirement |
| --- | --- |
| Dismissible | A mechanism (Escape) dismisses the tooltip without moving pointer or focus, unless the content communicates an input error |
| Hoverable | If pointer hover triggers the tooltip, the pointer can move over the tooltip content without it disappearing |
| Persistent | The tooltip remains visible until hover/focus is removed, the user dismisses it, or its information is no longer valid |

---

<a id="states"></a>

## 5 · State management

### Visibility states

```
  [Trigger unfocused / not hovered]
            │
            ▼
  ┌────────────────────┐
  │   Tooltip HIDDEN   │ ◄──── Default state
  └────────┬───────────┘
           │
           │ mouseenter OR focusin on trigger
           ▼
  ┌────────────────────┐
  │  Tooltip VISIBLE   │ ◄──── Active state
  └────────┬───────────┘
           │
           │ mouseleave (from trigger AND tooltip)
           │ OR focusout on trigger
           │ OR Escape keydown
           ▼
  ┌────────────────────┐
  │   Tooltip HIDDEN   │
  └────────────────────┘
```

### Toggletip state flow

```
  [Button idle, live region empty]
            │
            ▼
  ┌────────────────────────┐
  │   Bubble NOT SHOWN     │ ◄──── Default state
  └────────┬───────────────┘
           │
           │ click / Enter / Space on button
           ▼
  ┌────────────────────────┐
  │   Bubble SHOWN         │ ◄──── Live region populated
  │   (SR announces text)  │
  └────────┬───────────────┘
           │
           │ click outside OR Escape
           ▼
  ┌────────────────────────┐
  │   Bubble NOT SHOWN     │ ◄──── Live region emptied
  └────────────────────────┘
```

### Showing and hiding techniques

| Technique | Recommended | Notes |
| --- | --- | --- |
| `display: none` ↔ `display: block` | Yes | Fully removes from accessibility tree when hidden |
| `visibility: hidden` ↔ `visibility: visible` | Yes | Removes from accessibility tree; supports CSS transitions |
| `opacity: 0` ↔ `opacity: 1` | Caution | Element remains in accessibility tree unless paired with `visibility: hidden` |
| `hidden` attribute | Yes | Semantic HTML; equivalent to `display: none` |
| `aria-hidden="true"` on tooltip | Caution | Only if tooltip is in DOM but visually hidden; must toggle to `false` / remove when shown |
| CSS `:hover` + `:focus` | Yes (simple cases) | Pure CSS approach works for adjacent-sibling tooltips without JS |
| `clip-path: inset(100%)` | No (for tooltips) | Better suited for visually-hidden persistent text, not show/hide tooltips |

### Hover bridge / hover gap

When the tooltip is positioned with a visual gap between the trigger and the tooltip element, the user's pointer must be able to travel from trigger to tooltip without the tooltip disappearing. Common techniques:

- Use a transparent pseudo-element or invisible bridge element connecting trigger and tooltip.
- Add a small delay (100–200ms) before hiding the tooltip on `mouseleave`.
- Use the CSS `pointer-events` property and ensure the tooltip container covers the gap area.

### Show delay

- Consider a small delay (100–300ms) before showing the tooltip to prevent flickering when the pointer briefly crosses multiple trigger elements.
- Do NOT add long delays (>500ms) — the tooltip should appear promptly so keyboard users don't need to wait.
- The ARIA spec notes tooltip delays of 1–5 seconds, but modern best practice favors shorter delays for usability.

---

<a id="sr"></a>

## 6 · Screen reader expectations

### Describing tooltip (`aria-describedby`)

| Event | NVDA + Firefox | JAWS + Chrome | VoiceOver + Safari |
| --- | --- | --- | --- |
| Tab to trigger | "[label], [role] ... [tooltip text]" (description after a pause) | "[label], [role] ... [tooltip text]" | "[label], [role] ... [tooltip text]" |
| Hover over trigger | N/A (no mouse tracking in browse mode) | N/A | VoiceOver cursor follows mouse: "[label], [role]" then description |
| Escape pressed | No announcement | No announcement | No announcement |

### Labelling tooltip (`aria-labelledby`)

| Event | NVDA + Firefox | JAWS + Chrome | VoiceOver + Safari |
| --- | --- | --- | --- |
| Tab to trigger | "[tooltip text], button" | "[tooltip text], button" | "[tooltip text], button" |
| Hover over trigger | N/A | N/A | "[tooltip text], button" |

### Toggletip (live region `role="status"`)

| Event | NVDA + Firefox | JAWS + Chrome | VoiceOver + Safari |
| --- | --- | --- | --- |
| Click / Enter on button | "[button label], button" then after pause "[toggletip text]" | "[button label], button" then "[toggletip text]" | "[button label], button" then "[toggletip text]" |
| Click again (repopulate) | "[toggletip text]" (live region re-announced) | "[toggletip text]" | "[toggletip text]" |
| Escape pressed | No announcement (bubble removed) | No announcement | No announcement |

### AT support considerations

> **Critical warning**: `role="tooltip"` has **3/33 MUST expectations passing** on a11ysupport.io (9% pass rate). The tooltip role is **essentially dead** across assistive technologies — only VoiceOver on macOS in some configurations recognizes it. Setting `role="tooltip"` does NOT cause screen readers to announce the tooltip or read its content when it appears.

| Concern | Detail |
| --- | --- |
| `role="tooltip"` support | **Near-zero AT support.** Only 3 of 33 MUST expectations pass on a11ysupport.io. Keep the role for spec compliance, but **never rely on it** to convey information. The actual accessibility comes from `aria-describedby` or `aria-labelledby` — not the tooltip role. |
| `aria-describedby` timing | The description should be announced after the label and role. Some screen readers delay the description announcement; this is by design and helps users process information in stages. `aria-describedby` IS well-supported — this is what actually makes tooltips work for AT users. |
| `aria-labelledby` for naming | When a tooltip provides the element's **name** (e.g., icon button label), use `aria-labelledby` instead of `aria-describedby`. Also set `aria-label` as a fallback in case the tooltip element is not exposed to AT. |
| Mobile screen readers | TalkBack (Android) and VoiceOver (iOS) handle `aria-describedby` reasonably well on focusable elements. However, there is no hover equivalent — toggletips are more reliable for mobile. |
| Browse / virtual cursor mode | When a screen reader is in browse mode (reading line by line), tooltip triggers not in the tab order won't activate. Ensure all tooltip triggers are focusable elements (buttons, links, inputs). |
| Workaround for unsupported role | Since `role="tooltip"` is ignored by most AT, the tooltip's content is delivered entirely through the `aria-describedby`/`aria-labelledby` association. This means the tooltip element doesn't need to be visible to the accessibility tree as a "tooltip" — it just needs to exist in the DOM so the association works. |

---

<a id="implementation"></a>

## 7 · Implementation guide

### Step-by-step — CSS-only tooltip (describing)

This approach works when the tooltip element is an adjacent sibling of the trigger.

```css
/* 1. Position context */
.tooltip-wrapper {
  position: relative;
  display: inline-block;
}

/* 2. Hide tooltip by default */
[role="tooltip"] {
  display: none;
  position: absolute;
  z-index: 10;
  /* Position below trigger */
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  background: #1a1a1a;
  color: #fff;
  font-size: 0.875rem;
  white-space: nowrap;
  pointer-events: none;
}

/* 3. Show on hover and focus */
.tooltip-wrapper:hover [role="tooltip"],
.tooltip-wrapper:focus-within [role="tooltip"] {
  display: block;
  pointer-events: auto; /* Allow hovering the tooltip (WCAG 1.4.13) */
}
```

> **Note:** Pure CSS tooltips cannot be dismissed with Escape. For full WCAG 1.4.13 compliance, add JavaScript for the Escape key handler.

### Step-by-step — JavaScript tooltip (full WCAG 1.4.13)

```js
// 1. Query all tooltip triggers
const triggers = document.querySelectorAll('[data-tooltip-target]');

triggers.forEach((trigger) => {
  const tooltipId = trigger.getAttribute('data-tooltip-target');
  const tooltip = document.getElementById(tooltipId);
  if (!tooltip) return;

  const showTooltip = () => {
    tooltip.hidden = false;
  };

  const hideTooltip = () => {
    tooltip.hidden = true;
  };

  // 2. Show on hover and focus
  trigger.addEventListener('mouseenter', showTooltip);
  trigger.addEventListener('focusin', showTooltip);

  // 3. Hide on mouse leave (from BOTH trigger and tooltip)
  trigger.addEventListener('mouseleave', (e) => {
    if (!tooltip.contains(e.relatedTarget)) {
      hideTooltip();
    }
  });
  tooltip.addEventListener('mouseleave', (e) => {
    if (!trigger.contains(e.relatedTarget)) {
      hideTooltip();
    }
  });

  // 4. Hide on blur
  trigger.addEventListener('focusout', hideTooltip);

  // 5. Dismiss on Escape (WCAG 1.4.13 Dismissible)
  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideTooltip();
    }
  });
});
```

### Step-by-step — toggletip

```js
const toggletips = document.querySelectorAll('[data-toggletip-content]');

toggletips.forEach((button) => {
  const message = button.getAttribute('data-toggletip-content');
  const liveRegion = button.nextElementSibling; // role="status" element

  // 1. Show on click
  button.addEventListener('click', () => {
    liveRegion.innerHTML = '';
    // Brief delay ensures live region repopulation is detected by AT
    setTimeout(() => {
      liveRegion.innerHTML =
        `<span class="toggletip-bubble">${message}</span>`;
    }, 100);
  });

  // 2. Close on outside click
  document.addEventListener('click', (e) => {
    if (button !== e.target && !button.contains(e.target)) {
      liveRegion.innerHTML = '';
    }
  });

  // 3. Close on Escape
  button.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      liveRegion.innerHTML = '';
    }
  });
});
```

### Framework guidance

| Framework / Library | Tooltip component | Notes |
| --- | --- | --- |
| **Radix UI** | `@radix-ui/react-tooltip` | Uses `role="tooltip"` + `aria-describedby` by default. Handles hover/focus, Escape dismiss, hover bridge with `delayDuration`. Does NOT handle Escape for WCAG 1.4.13 by default — verify. |
| **Headless UI** | No built-in tooltip | Use Popover component or build custom. Ensure `role="tooltip"` and proper ARIA linking. |
| **MUI (Material UI)** | `<Tooltip>` | Wraps child with `aria-describedby`. Adds `role="tooltip"`. Supports `enterDelay`, `leaveDelay`. Arrow prop for visual bridge. Verify Escape dismiss behavior. |
| **Chakra UI** | `<Tooltip>` | Sets `role="tooltip"` + `aria-describedby`. Has `closeOnEsc` prop. Supports `placement` for positioning. |
| **Floating UI** | `@floating-ui/react` | Positioning library; provides `useTooltip` interaction hook. Handles hover bridge, focus, dismiss. Must add ARIA attributes manually. |
| **Native HTML** | `title` attribute | Not recommended. Fails keyboard, touch, and multiple WCAG requirements. Exempt from 1.4.13 as UA-controlled, but inaccessible. |

### Positioning

- Place tooltips below the trigger by default; flip to above if insufficient viewport space.
- Avoid covering the trigger element — users need to see what they're hovering.
- Use a positioning library (Floating UI / Popper) for dynamic repositioning based on viewport boundaries.
- Ensure the tooltip doesn't clip outside the viewport on small screens.

---

<a id="mistakes"></a>

## 8 · Common mistakes

### Mistake 1 — Interactive content inside tooltip

**Problem:** Tooltip contains links, buttons, or close icons. Users cannot Tab into the tooltip because it never receives focus, so interactive elements are inaccessible.

**Fix:** Use a non-modal dialog or disclosure pattern for interactive content. Tooltips must contain only plain text (no focusable elements).

---

### Mistake 2 — Tooltip only on hover, not focus

**Problem:** Tooltip shows on `mouseenter` but not on keyboard focus. Keyboard-only users never see the information. Fails WCAG 2.1.1 (Keyboard) and 1.4.13.

**Fix:** Always show the tooltip on both `mouseenter`/`mouseover` AND `focusin`/`focus`. Both triggers must display identical content.

---

### Mistake 3 — No Escape key dismiss

**Problem:** Tooltip appears on hover/focus but cannot be dismissed without moving the pointer or focus. Fails WCAG 1.4.13 Dismissible.

**Fix:** Add a `keydown` listener for `Escape` on the trigger element that hides the tooltip while keeping focus in place.

---

### Mistake 4 — Tooltip disappears when pointer moves to it

**Problem:** The tooltip vanishes when the user tries to hover over it to read the content. Fails WCAG 1.4.13 Hoverable. Particularly harmful for magnification users.

**Fix:** Keep the tooltip visible while the pointer is anywhere over the trigger OR the tooltip itself. Implement a hover bridge for any gap between trigger and tooltip.

---

### Mistake 5 — Using `aria-describedby` for toggletips

**Problem:** A toggletip button uses `aria-describedby` to reference the bubble content. Screen reader users hear the description before clicking, making the button appear to do nothing.

**Fix:** Use `aria-label` on the button for its name. Inject toggletip content into a `role="status"` live region on click. Do NOT use `aria-describedby`.

---

### Mistake 6 — Relying on `title` attribute for essential info

**Problem:** The `title` attribute is the sole source of important information. Keyboard, touch, and many screen reader users never access it.

**Fix:** Provide a custom tooltip with `role="tooltip"` and `aria-describedby`/`aria-labelledby`, or make the information permanently visible.

---

### Mistake 7 — Tooltip trigger is not focusable

**Problem:** The tooltip is attached to a `<span>` or `<div>` that cannot receive keyboard focus. Keyboard users cannot trigger the tooltip.

**Fix:** Use a natively focusable element (`<button>`, `<a>`, `<input>`) as the trigger. If a non-interactive element must host the tooltip, add `tabindex="0"` and an appropriate `role` — but prefer semantic elements.

---

### Mistake 8 — Missing `role="tooltip"` on the tooltip element

**Problem:** The popup element lacks `role="tooltip"`. While the `aria-describedby`/`aria-labelledby` association may still work in many AT, the `tooltip` role extends support reliability and conveys semantic intent.

**Fix:** Always add `role="tooltip"` to the tooltip element paired with the appropriate ARIA linking attribute on the trigger.

---

### Mistake 9 — Tooltip obscures the trigger

**Problem:** The tooltip covers the trigger element, preventing the user from seeing what they activated or from clicking the trigger.

**Fix:** Position the tooltip adjacent to the trigger (above, below, or beside), never directly on top of it.

---

### Mistake 10 — No delay or hover bridge causing flickering

**Problem:** Moving the mouse near the trigger rapidly shows and hides the tooltip, creating a flickering effect that is disorienting for users with motion sensitivities or cognitive disabilities.

**Fix:** Add a small show delay (100–300ms) and a small hide delay (100–200ms). Implement a hover bridge to prevent the tooltip from closing whilst the pointer traverses to it.

---

<a id="criteria"></a>

## 9 · Acceptance criteria

### Structure

| # | Check | Severity |
| --- | --- | --- |
| S-1 | Tooltip element has `role="tooltip"` | Must |
| S-2 | Tooltip element has a unique `id` | Must |
| S-3 | Trigger element has `aria-describedby` (describing) or `aria-labelledby` (labelling) referencing the tooltip `id` | Must |
| S-4 | Tooltip contains only plain text — no focusable or interactive elements | Must |
| S-5 | Trigger element is natively focusable (`button`, `a`, `input`) or has `tabindex="0"` | Must |
| S-6 | SVG icons inside trigger have `aria-hidden="true"` and `focusable="false"` | Should |
| S-7 | Tooltip is not present in the accessibility tree when hidden (`display: none`, `hidden` attribute, or `visibility: hidden`) | Must |

### Keyboard

| # | Check | Severity |
| --- | --- | --- |
| K-1 | Tab to trigger shows the tooltip | Must |
| K-2 | Tab away from trigger hides the tooltip | Must |
| K-3 | Escape key hides the tooltip without moving focus | Must |
| K-4 | Focus never moves to the tooltip element | Must |
| K-5 | Keyboard and mouse trigger identical tooltip behavior and content | Must |

### Screen reader

| # | Check | Severity |
| --- | --- | --- |
| SR-1 | Describing tooltip: content announced as description after label and role | Must |
| SR-2 | Labelling tooltip: content announced as the element's accessible name | Must |
| SR-3 | Tooltip role does not create confusing announcements (no "tooltip" role announcement required) | Should |
| SR-4 | Tooltip content is not announced twice (no duplicate via `aria-label` + `aria-describedby` pointing to same text) | Must |
| SR-5 | Description text is announced with a noticeable pause after label + role | Should |

### WCAG 1.4.13 — Content on Hover or Focus

| # | Check | Severity |
| --- | --- | --- |
| W-1 | **Dismissible:** Tooltip can be dismissed via Escape without moving pointer or focus (unless it communicates an input error or doesn't obscure content) | Must |
| W-2 | **Hoverable:** Pointer can move from trigger to tooltip without the tooltip disappearing | Must |
| W-3 | **Persistent:** Tooltip remains visible until hover/focus is removed, user dismisses it, or its information becomes invalid | Must |
| W-4 | Tooltip appears on both pointer hover and keyboard focus | Must |
| W-5 | Tooltip does not obscure the trigger element | Should |
| W-6 | Show delay is ≤ 500ms to ensure prompt feedback | Should |

### Toggletip specific

| # | Check | Severity |
| --- | --- | --- |
| T-1 | Toggletip button does NOT use `aria-describedby` to reference the bubble | Must |
| T-2 | Live region (`role="status"`) exists adjacent to the button | Must |
| T-3 | Clicking the button populates the live region with the bubble content | Must |
| T-4 | Clicking a second time re-populates (with brief clear/set delay) so AT re-announces | Should |
| T-5 | Clicking outside the button empties the live region | Must |
| T-6 | Escape key empties the live region | Must |
| T-7 | Button has an accessible name via `aria-label` or visible text | Must |
| T-8 | Button is a `<button>` element (not a `<span>` or `<div>`) | Must |

### Edge cases

| # | Check | Severity |
| --- | --- | --- |
| E-1 | Tooltip repositions to stay within the viewport when near screen edges | Should |
| E-2 | Tooltip works correctly inside scrollable containers (position updates on scroll) | Should |
| E-3 | On touch devices, tooltip triggers still provide accessible information (consider toggletip alternative) | Should |
| E-4 | Tooltip does not appear during brief pointer traversal (appropriate show/hide delay) | Should |
| E-5 | Multiple tooltips on the same page do not interfere with each other (only one tooltip visible at a time) | Should |
| E-6 | Tooltip content updates dynamically if the underlying data changes while visible | May |
| E-7 | Long tooltip text wraps gracefully and does not overflow the viewport | Should |
| E-8 | Tooltip visibility survives mode changes (e.g., screen reader toggling browse/focus mode) while trigger retains focus | Should |
