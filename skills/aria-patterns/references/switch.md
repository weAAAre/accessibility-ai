# Switch

<a id="identity"></a>

## 1. What a switch is

A **switch** is a type of input widget that represents an on/off binary state, as opposed to the checked/unchecked semantics of a checkbox. Switches have **immediate effect** — toggling a switch applies the change right away, like flipping a light switch — while checkboxes typically defer their effect until form submission.

The `switch` role is a subclass of `checkbox` in the WAI-ARIA taxonomy. Both share `aria-checked`, but a switch restricts values to `true` (on) and `false` (off) — the `mixed` value is **invalid** on a switch and user agents must treat it as `false`.

> **AT support warning:** The `role="switch"` is not universally recognized by assistive technologies. Some screen readers fall back to announcing the element as a checkbox. There is currently **no data** on [a11ysupport.io](https://a11ysupport.io/) for the switch role, which reflects its inconsistent support. Authors should plan for degraded announcements and ensure the experience remains usable even when the switch role is not conveyed.

### How it differs from similar patterns

| Pattern | Role / attribute | State semantics | Typical use case | State values |
|---|---|---|---|---|
| **Switch** | `role="switch"` + `aria-checked` | "on" / "off" | Immediate-effect toggle (e.g. enable dark mode) | `true`, `false` only |
| **Checkbox** | `role="checkbox"` or `<input type="checkbox">` + `aria-checked` | "checked" / "unchecked" / "mixed" | Deferred selection, often in forms | `true`, `false`, `mixed` |
| **Toggle button** | `<button>` + `aria-pressed` | "pressed" / "not pressed" | Action toggle (e.g. bold, mute) | `true`, `false`, `mixed` |
| **Radio button** | `role="radio"` + `aria-checked` | "selected" in a mutually-exclusive group | Choose one option from a set | `true`, `false` |

**Key distinctions:**

- A switch **never** supports the `mixed` state — it is strictly binary.
- A switch implies **immediate effect**; a checkbox inside a form implies a deferred commit.
- `aria-pressed` (toggle button) and `aria-checked` (switch) are different state attributes that map to different accessibility API properties. Do not mix them.
- The label of a switch **must not change** when the state changes. The state itself ("on"/"off") conveys the change.

<a id="variants"></a>

## 2. Variants

### 2.1 Button-based switch

A `<button>` element with `role="switch"` and `aria-checked`. This is the most common approach in the APG examples.

- Uses `aria-checked="true"` or `aria-checked="false"` (required, since the button has no native checked state).
- Keyboard: `Space` toggles the switch (required). `Enter` also toggles because native buttons activate on both keys.
- The button's accessible name comes from its text content or `aria-label`/`aria-labelledby`.

### 2.2 Checkbox-based switch

An `<input type="checkbox">` with `role="switch"`. Leverages native checkbox semantics for form participation.

- The native `checked` property provides the on/off state. Browsers map the native checked state to `aria-checked` automatically — authors do **not** need to set `aria-checked` explicitly on a native checkbox.
- Keyboard: `Space` toggles the switch (inherited from native checkbox). `Enter` does **not** toggle — native checkboxes do not respond to Enter.
- Participates in form submission with name/value pairs natively.
- Use `<label>` or wrapping `<label>` element for the accessible name.

### 2.3 Custom element switch (div/span-based)

A `<div>` or `<span>` with `role="switch"`, `tabindex="0"`, and `aria-checked`. Requires full manual keyboard, focus, and state management.

- Must add `tabindex="0"` to make the element focusable.
- Must handle both `Space` and optionally `Enter` key events.
- Must prevent default scroll behavior on `Space`.
- The most fragile approach — prefer button-based or checkbox-based implementations.

### Variant comparison

| Feature | Button-based | Checkbox-based | Custom element |
|---|---|---|---|
| Base element | `<button>` | `<input type="checkbox">` | `<div>` or `<span>` |
| `role="switch"` | Required | Required | Required |
| `aria-checked` | Required (explicit) | Automatic from native `checked` | Required (explicit) |
| `tabindex` | Not needed (native) | Not needed (native) | Required (`tabindex="0"`) |
| Space key | Native | Native | Manual handler required |
| Enter key | Native (activates button) | Does **not** toggle | Manual handler required |
| Form submission | No (without hidden input) | Yes (native) | No (without hidden input) |
| Recommended | **Yes — best default choice** | Yes — when form participation needed | Avoid if possible |

<a id="anatomy"></a>

## 3. Anatomy and required markup

### 3.1 Button-based switch (recommended)

```html
<button type="button"
        role="switch"
        aria-checked="false">
  Dark mode
</button>
```

### 3.2 Checkbox-based switch

```html
<label>
  <span class="label-text">Reduced motion</span>
  <input type="checkbox" role="switch">
</label>
```

Or with explicit label association:

```html
<input id="motion-switch"
       type="checkbox"
       role="switch">
<label for="motion-switch">Reduced motion</label>
```

### 3.3 Custom element switch (avoid when possible)

```html
<span role="switch"
      tabindex="0"
      aria-checked="false"
      aria-labelledby="notif-label">
  <span class="switch-track">
    <span class="switch-thumb"></span>
  </span>
</span>
<span id="notif-label">Email notifications</span>
```

### 3.4 Grouped switches

When presenting multiple related switches, wrap them in a labelled group:

**Button-based group:**

```html
<div role="group" aria-labelledby="group-label">
  <h3 id="group-label">Notification preferences</h3>
  <button type="button" role="switch" aria-checked="true">
    Email notifications
  </button>
  <button type="button" role="switch" aria-checked="false">
    SMS notifications
  </button>
</div>
```

**Checkbox-based group:**

```html
<fieldset>
  <legend>Accessibility preferences</legend>
  <label>
    <span>Reduced motion</span>
    <input type="checkbox" role="switch">
  </label>
  <label>
    <span>Show captions</span>
    <input type="checkbox" role="switch">
  </label>
</fieldset>
```

### Required attributes

| Attribute | Element | Required | Purpose |
|---|---|---|---|
| `role="switch"` | All variants | Yes | Identifies the element as a switch widget |
| `aria-checked="true\|false"` | `<button>`, `<div>`, `<span>` | Yes | Indicates on/off state; **never** use `mixed` |
| `checked` (native) | `<input type="checkbox">` | Automatic | Native checked state maps to `aria-checked` |
| `tabindex="0"` | `<div>`, `<span>` | Yes | Makes custom elements focusable |
| `aria-label` or `aria-labelledby` | All variants | If no visible label | Provides accessible name; prefer visible labels |
| `aria-disabled="true"` | All variants | When disabled | Indicates the switch cannot be toggled |
| `role="group"` | Container `<div>` | For grouped switches | Groups related switches under a common label |
| `aria-labelledby` | Group container | For grouped switches | References the group's visible label |

<a id="keyboard"></a>

## 4. Keyboard interaction

### Required keys

| Key | Action |
|---|---|
| `Space` | Toggles the switch between on and off. |

### Optional keys

| Key | Action | Notes |
|---|---|---|
| `Enter` | Toggles the switch between on and off. | Native `<button>` elements handle this automatically. Not expected on checkbox-based switches. For custom elements, authors should add Enter support for consistency with button behavior. |

### Focus behavior

- The switch itself receives focus, not an internal element.
- `Tab` moves focus to the switch. `Shift+Tab` moves focus away.
- For grouped switches, each switch is a separate tab stop (no arrow-key navigation between switches).
- Focus must be visible with a clear focus indicator meeting WCAG 2.4.7 (Focus Visible) and ideally 2.4.11 (Focus Not Obscured).
- For custom elements: prevent the default `Space` key scroll behavior with `event.preventDefault()`.

<a id="state"></a>

## 5. State management

### State transitions

A switch has exactly **two** states:

```
┌─────────────┐    Space / Enter / Click    ┌─────────────┐
│             │ ──────────────────────────▶  │             │
│  OFF        │                              │  ON         │
│  (false)    │  ◀──────────────────────────  │  (true)     │
│             │    Space / Enter / Click    │             │
└─────────────┘                              └─────────────┘
```

- `aria-checked="false"` → Switch is **off**
- `aria-checked="true"` → Switch is **on**
- `aria-checked="mixed"` → **Invalid**. User agents must treat as `false`.

### State synchronization

For button-based and custom-element switches, toggle `aria-checked` between `"true"` and `"false"` on each activation:

```javascript
switchElement.addEventListener('click', () => {
  const isOn = switchElement.getAttribute('aria-checked') === 'true';
  switchElement.setAttribute('aria-checked', String(!isOn));
});
```

For checkbox-based switches, the native `checked` property drives the state. Toggle it via the standard checkbox mechanism:

```javascript
// Native checkbox handles toggle automatically.
// To read state programmatically:
const isOn = checkboxElement.checked;
```

### Label must not change with state

The accessible name of the switch must remain constant regardless of state. **Do not** change the label text between "Enable dark mode" and "Disable dark mode". Screen readers announce the state separately ("on" or "off"), so changing the label creates confusing double announcements.

If visual text indicating "On" or "Off" is displayed near the switch, hide it from assistive technologies with `aria-hidden="true"` to prevent redundant state announcements.

### Immediate effect

Unlike checkboxes in forms, a switch should apply its effect immediately when toggled. There is no separate "submit" step. If the switch controls a setting, that setting should change as soon as the switch is toggled.

### Disabled state

Use `aria-disabled="true"` to indicate a switch cannot be toggled. For native elements, also use the `disabled` attribute. Ensure the disabled state is visually distinguishable.

When using `aria-disabled="true"` (without native `disabled`), the element remains focusable but the toggle action should be suppressed in the event handler. This approach is preferred when you want the switch to remain discoverable by screen reader users who navigate via Tab.

<a id="screen-reader"></a>

## 6. Screen reader expectations

### Expected announcements

When a switch is well-supported, screen readers should announce:

1. **Name** — the accessible name of the switch (e.g. "Dark mode")
2. **Role** — "switch" (or fallback: "checkbox" or "toggle button")
3. **State** — "on" or "off"

Example: *"Dark mode, switch, off"*

### AT support gaps

The `switch` role has **inconsistent support** across assistive technologies:

| Screen reader + Browser | Role announcement | State announcement | Notes |
|---|---|---|---|
| JAWS + Chrome/Edge | "switch" | "on" / "off" | Generally good support in recent versions |
| JAWS + Firefox | "switch" | "on" / "off" | Good support |
| NVDA + Chrome/Edge | May announce "switch" or fall back to "checkbox" | "on"/"off" or "checked"/"not checked" | Support improved in recent NVDA versions |
| NVDA + Firefox | May fall back to "checkbox" | "checked" / "not checked" | Less reliable |
| VoiceOver + Safari (macOS) | "switch" | "on" / "off" | Good support on macOS |
| VoiceOver + Safari (iOS) | "switch" or "toggle" | "on" / "off" | Good support on iOS |
| VoiceOver + Chrome (macOS) | May fall back to "checkbox" | "checked" / "not checked" | Chrome support less reliable than Safari |
| TalkBack + Chrome (Android) | "switch" | "on" / "off" | Generally good support |
| Narrator + Edge | "toggle switch" | "on" / "off" | Good support |

> **Important:** a11ysupport.io currently has **no test data** for `role="switch"`, which itself reflects the newness and inconsistency of support. The `aria-checked` attribute is well-supported across all AT, but the *role-specific announcement* (saying "switch" instead of "checkbox") is where gaps exist.

### Fallback behavior

When a screen reader does not recognize `role="switch"`, it falls back to the superclass role `checkbox`. This means:

- The role is announced as "checkbox" instead of "switch".
- The state is announced as "checked" / "not checked" instead of "on" / "off".
- The widget **remains operable** — users can still toggle it. The degraded experience is in naming, not functionality.

This fallback is acceptable but may confuse users who see a visual switch but hear "checkbox". To mitigate:

- Ensure the accessible name uses language that works for both patterns (e.g. "Dark mode" works whether announced as a switch or checkbox).
- Avoid label text that relies on switch-specific terminology like "flip" or "toggle on".

### On state change

When the user toggles the switch, screen readers should announce the new state:

- Supported: *"on"* or *"off"*
- Fallback: *"checked"* or *"not checked"*

No live region or additional announcement is needed — the state change is communicated through the built-in role semantics.

### Group context

When switches are in a labelled `group` or `fieldset`:

- **VoiceOver**: Announces the group label when focus enters the group for the first time.
- **JAWS**: Announces the group label on first entry and may repeat it depending on verbosity settings.
- **NVDA**: Announces the group label when entering the group.
- **TalkBack**: Announces the group label when focus enters the group.

<a id="implementation"></a>

## 7. Implementation guide

### Start with the button-based approach

The `<button>` element is the recommended base for switches:

1. It is natively focusable and activatable.
2. It responds to both `Space` and `Enter`.
3. It has the `button` implicit role which the `switch` role overrides cleanly.
4. It supports accessible name from content.

```html
<!-- Minimal accessible switch -->
<button type="button"
        role="switch"
        aria-checked="false">
  Notifications
</button>
```

```javascript
const switchBtn = document.querySelector('button[role="switch"]');
switchBtn.addEventListener('click', () => {
  const isOn = switchBtn.getAttribute('aria-checked') === 'true';
  switchBtn.setAttribute('aria-checked', String(!isOn));
  // Apply the setting immediately
  applyNotificationSetting(!isOn);
});
```

### When to use checkbox-based

Use `<input type="checkbox" role="switch">` when:

- The switch participates in a `<form>` and needs to submit a value.
- You want the browser to handle checked state natively.
- You are progressively enhancing an existing checkbox into a switch.

**Note:** The checkbox-based approach relies on `Space` only — `Enter` does not toggle native checkboxes. This is expected behavior and consistent with the APG specification.

### Visual state indicators

Always provide a visible "on"/"off" indicator in addition to the graphical toggle position:

```html
<button type="button" role="switch" aria-checked="false">
  <span class="label">Dark mode</span>
  <span class="switch-track">
    <span class="switch-thumb"></span>
  </span>
  <span class="state-text on" aria-hidden="true">On</span>
  <span class="state-text off" aria-hidden="true">Off</span>
</button>
```

The `aria-hidden="true"` on state text prevents redundant announcements. Use CSS attribute selectors to show/hide the correct state:

```css
[aria-checked="true"] .state-text.on { display: inline; }
[aria-checked="true"] .state-text.off { display: none; }
[aria-checked="false"] .state-text.on { display: none; }
[aria-checked="false"] .state-text.off { display: inline; }
```

### Disabled switches

```html
<!-- Button-based disabled switch -->
<button type="button"
        role="switch"
        aria-checked="false"
        aria-disabled="true">
  Premium feature
</button>

<!-- Checkbox-based disabled switch -->
<input type="checkbox" role="switch" disabled>
```

### High contrast and forced colors

When using custom graphics (SVG or CSS) for the switch track and thumb:

- Use `currentcolor` for stroke and fill to inherit text color in high contrast modes.
- Set `forced-color-adjust: auto` on SVG elements for browser compatibility.
- Ensure the thumb and track have sufficient contrast (at least 3:1 against adjacent colors per WCAG 1.4.11 Non-text Contrast).
- Use at least 2px borders/strokes for visibility.

### Framework implementations

When using component libraries, verify their switch components implement the pattern correctly:

| Library | Component | Notes |
|---|---|---|
| [Radix UI](https://www.radix-ui.com/primitives/docs/components/switch) | `Switch.Root` | Uses `role="switch"` with `aria-checked`. Renders as `<button>`. |
| [Headless UI](https://headlessui.com/react/switch) | `Switch` | Uses `role="switch"` with `aria-checked`. Headless — no default styling. |
| [MUI](https://mui.com/material-ui/react-switch/) | `Switch` | Uses `<input type="checkbox" role="switch">`. Includes label integration. |
| [Chakra UI](https://v2.chakra-ui.com/docs/components/switch) | `Switch` | Uses `<input type="checkbox" role="switch">` with a label component. |
| [React Aria](https://react-spectrum.adobe.com/react-aria/Switch.html) | `useSwitch` | Hook-based. Uses `<input type="checkbox" role="switch">`. |
| [Ark UI](https://ark-ui.com/react/docs/components/switch) | `Switch` | Headless, uses `role="switch"` on an internal `<input>`. |

Always inspect the rendered HTML to confirm:

1. `role="switch"` is present on the interactive element.
2. `aria-checked` reflects the current state (or native `checked` for checkbox-based).
3. The accessible name is correctly computed.
4. Keyboard interaction works as expected.

<a id="mistakes"></a>

## 8. Common mistakes

### Mistake 1 — Using `aria-checked="mixed"` on a switch

**Problem:** Setting `aria-checked="mixed"` on a switch. The `mixed` value is invalid for the switch role.

**Fix:** Only use `aria-checked="true"` or `aria-checked="false"`. If you need a tri-state control, use a checkbox instead of a switch.

---

### Mistake 2 — Changing the label with the state

**Problem:** Changing the accessible name between "Enable dark mode" (when off) and "Disable dark mode" (when on). This creates confusing double announcements: the screen reader says both the new label and the new state.

**Fix:** Keep the label constant ("Dark mode"). The role and state convey whether the switch is on or off.

---

### Mistake 3 — Using `aria-pressed` instead of `aria-checked`

**Problem:** Using `aria-pressed` on a `role="switch"` element. `aria-pressed` is for toggle buttons, not switches.

**Fix:** Use `aria-checked="true|false"` with `role="switch"`. If you want pressed semantics, use a `<button>` with `aria-pressed` instead (without `role="switch"`).

---

### Mistake 4 — Missing role on a visual toggle

**Problem:** Building a visually styled toggle control (track + thumb) without `role="switch"` and `aria-checked`. Screen readers see a generic element or a plain button with no state.

**Fix:** Add `role="switch"` and `aria-checked` to the interactive element. Or use `<input type="checkbox" role="switch">`.

---

### Mistake 5 — Not preventing Space key scroll on custom elements

**Problem:** A `<div role="switch" tabindex="0">` toggles on `Space` but the page also scrolls because the default Space behavior was not prevented.

**Fix:** Call `event.preventDefault()` in the `keydown` handler when `Space` or `Enter` is pressed.

---

### Mistake 6 — Including visible state text in the accessible name

**Problem:** Including "On" or "Off" text within the switch's accessible name (e.g. the text is not hidden from AT). Screen reader announces: "Dark mode On, switch, on" — the state is conveyed twice.

**Fix:** Hide the visual state indicator from AT with `aria-hidden="true"`.

---

### Mistake 7 — Forgetting `aria-checked` on button-based switches

**Problem:** Using `<button role="switch">` without `aria-checked`. The screen reader cannot determine or announce the current state.

**Fix:** Always set `aria-checked="true"` or `aria-checked="false"` on button-based and custom-element switches. This is a **required** attribute.

---

### Mistake 8 — Using a link (`<a>`) as the base element

**Problem:** Using `<a href="#" role="switch">` as the switch element. Links have navigation semantics and Enter activates navigation, not toggle. `Space` scrolls the page by default on links.

**Fix:** Use `<button>` or `<input type="checkbox">` as the base element.

---

### Mistake 9 — No visible focus indicator

**Problem:** Overriding or removing the default focus outline on the switch without providing an alternative. Keyboard users cannot see where focus is.

**Fix:** Ensure a visible focus indicator with at least 2px outline or border. Use `:focus-visible` to style focus for keyboard users.

---

### Mistake 10 — Deferring the switch effect to form submission

**Problem:** Placing switches inside a form where their state only takes effect on submit. This violates the switch's semantic expectation of immediate effect.

**Fix:** If the state only applies upon form submission, use `<input type="checkbox">` without `role="switch"`. Reserve the switch role for controls with immediate effect.

<a id="acceptance"></a>

## 9. Acceptance criteria

### Structure

| ID | Criterion | Severity |
|---|---|---|
| S1 | The interactive element has `role="switch"`. | Critical |
| S2 | `aria-checked` is present and set to `"true"` or `"false"` (button-based / custom element). | Critical |
| S3 | For checkbox-based switches, `role="switch"` is on the `<input type="checkbox">` element. | Critical |
| S4 | The switch has an accessible name (from content, `<label>`, `aria-label`, or `aria-labelledby`). | Critical |
| S5 | `aria-checked="mixed"` is **never** used on a switch. | Critical |
| S6 | The accessible name does not change when the state changes. | Major |
| S7 | Visible state text ("On"/"Off") is hidden from AT with `aria-hidden="true"`. | Major |
| S8 | If the switch is disabled, `aria-disabled="true"` is set (and/or native `disabled` for checkboxes). | Major |
| S9 | Grouped switches are wrapped in `role="group"` (or `<fieldset>`) with a visible label. | Minor |

### Keyboard

| ID | Criterion | Severity |
|---|---|---|
| K1 | `Space` toggles the switch between on and off. | Critical |
| K2 | `Tab` moves focus to the switch; `Shift+Tab` moves focus away. | Critical |
| K3 | Focus indicator is visible when the switch has keyboard focus. | Critical |
| K4 | For button-based switches, `Enter` also toggles the switch. | Major |
| K5 | For custom elements, `Space` does not scroll the page (default prevented). | Major |
| K6 | For checkbox-based switches, `Enter` does **not** toggle the switch (native behavior). | Minor |
| K7 | An `aria-disabled="true"` switch does not change state on activation. | Major |

### Screen reader

| ID | Criterion | Severity |
|---|---|---|
| SR1 | The accessible name is announced when the switch receives focus. | Critical |
| SR2 | The role is announced as "switch" (or acceptable fallback "toggle switch" / "checkbox"). | Critical |
| SR3 | The state is announced as "on"/"off" (or fallback "checked"/"not checked"). | Critical |
| SR4 | On toggle, the new state is announced without needing to leave and re-enter the switch. | Critical |
| SR5 | Group label is announced when focus first enters a switch group. | Major |
| SR6 | Disabled state is announced when the switch is disabled. | Major |

### Button-based variant

| ID | Criterion | Severity |
|---|---|---|
| BV1 | The element is a `<button>` (or element with `role="button"` overridden by `role="switch"`). | Major |
| BV2 | `aria-checked` is toggled between `"true"` and `"false"` on each activation. | Critical |
| BV3 | Both `Space` and `Enter` toggle the switch. | Major |
| BV4 | The `<button>` has `type="button"` to prevent form submission. | Minor |

### Checkbox-based variant

| ID | Criterion | Severity |
|---|---|---|
| CV1 | `role="switch"` is on the `<input type="checkbox">` element. | Critical |
| CV2 | The native `checked` state drives the on/off state. | Critical |
| CV3 | A `<label>` is associated with the checkbox (via wrapping or `for`/`id`). | Critical |
| CV4 | `Space` toggles the checkbox; `Enter` does not. | Major |
| CV5 | If in a `<form>`, the name/value pair is submitted correctly. | Minor |

### Form context

| ID | Criterion | Severity |
|---|---|---|
| FC1 | If a switch controls an immediate setting, the effect is applied without a separate submit action. | Major |
| FC2 | If switches must work within a form submission flow, checkbox-based variant is used. | Major |
| FC3 | Visual design clearly communicates whether the switch has immediate effect or requires submission. | Minor |

### Edge cases

| ID | Criterion | Severity |
|---|---|---|
| E1 | When the switch is dynamically added to the DOM, focus management does not break. | Major |
| E2 | Rapid toggling does not leave `aria-checked` in an inconsistent state. | Major |
| E3 | Switch works correctly with browser zoom up to 400%. | Major |
| E4 | Switch is usable in high contrast / forced colors mode (thumb and track remain distinguishable). | Major |
| E5 | Touch targets meet at least 24×24 CSS pixels (WCAG 2.5.8 Target Size Minimum). | Minor |
| E6 | Switch works correctly when CSS is disabled (falls back to recognizable interactive element). | Minor |
| E7 | When a screen reader does not support `role="switch"`, the control still functions as a checkbox. | Critical |
