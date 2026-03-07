# Checkbox Pattern

Source: [WAI-ARIA APG — Checkbox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/)

## Table of Contents

1. [Identity: what is (and isn't) a checkbox](#identity)
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
## 1. Identity: what is (and isn't) a checkbox

A **checkbox** is a form control that lets the user toggle a binary option — checked or not checked. A special variant, the **tri-state (mixed) checkbox**, adds a third state representing partial selection across a group of sub-checkboxes it controls.

### Essential characteristics

A component is a checkbox when all of these are true:

- It toggles a **binary option** (on/off, yes/no, selected/unselected)
- It is **independently selectable** — checking one does not uncheck another (unlike radio buttons)
- It **communicates its checked state** to assistive technologies (`aria-checked` or native `checked`)
- It is **keyboard operable** (can be toggled with Space)

### Distinguishing from similar patterns

| Component | Key difference |
|---|---|
| **Toggle switch** (`role="switch"`) | A switch represents an on/off state for a setting that takes **immediate effect** (like a light switch). A checkbox represents a selection that may be submitted later. Switches use `role="switch"`, not `role="checkbox"`. |
| **Radio button** (`role="radio"`) | Radio buttons are **mutually exclusive** within a group — only one can be selected. Checkboxes are independent. Radio groups use arrow keys for internal navigation; checkboxes use Tab between each one. |
| **Button** (`role="button"`) | Buttons trigger actions. Checkboxes toggle state. Even toggle buttons (`aria-pressed`) are semantically different — they represent an activated action, not a selected option. |
| **Menu item checkbox** (`role="menuitemcheckbox"`) | A checkbox inside a menu widget. Uses different keyboard interaction (within a menu context) and a different ARIA role. |
| **Selectable list item** (`role="option"` with `aria-selected`) | List items in a listbox use `aria-selected` within a listbox context, not `aria-checked`. Different interaction model entirely. |

**Rule of thumb**: if the control toggles a binary option independently of other controls and the selection is not immediately effectful (unlike a switch), it's a checkbox. If it controls a group of sub-options and reflects their aggregate state, it's a tri-state checkbox.

---

<a id="variants"></a>
## 2. Variants

### Two-state checkbox

The standard checkbox. Exactly two states: **checked** (`aria-checked="true"`) and **unchecked** (`aria-checked="false"`).

Can appear standalone or as part of a group of independent checkboxes. Native `<input type="checkbox">` is the preferred implementation.

### Tri-state (mixed) checkbox

Has three visual states: **checked**, **unchecked**, and **mixed** (`aria-checked="mixed"`).

Acts as a **group controller** — its state reflects the aggregate of its sub-checkboxes:

| Sub-checkbox state | Controller state |
|---|---|
| All checked | `aria-checked="true"` (checked) |
| None checked | `aria-checked="false"` (unchecked) |
| Some checked, some not | `aria-checked="mixed"` (indeterminate) |

When the user activates the controller:
- From **mixed** or **unchecked** → all sub-checkboxes become **checked**
- From **checked** → all sub-checkboxes become **unchecked**

Some implementations cycle through mixed → checked → unchecked → mixed (restoring the previous partial selection), but the APG's primary recommendation is the two-step behavior above.

The controller references its sub-checkboxes via `aria-controls`.

### Behavioral comparison

| Behavior | Two-state | Tri-state (mixed) |
|---|---|---|
| Possible `aria-checked` values | `"true"`, `"false"` | `"true"`, `"false"`, `"mixed"` |
| Controls other checkboxes | No | Yes (via `aria-controls`) |
| State depends on other controls | No | Yes (reflects sub-checkbox states) |
| Native HTML | `<input type="checkbox">` | `<input type="checkbox">` + `indeterminate` IDL property |
| Custom ARIA | `role="checkbox"` + `aria-checked` | `role="checkbox"` + `aria-checked="mixed"` + `aria-controls` |

---

<a id="anatomy"></a>
## 3. Anatomy & markup

### Native HTML checkbox (preferred)

Wrapping label:
```html
<label>
  <input type="checkbox" name="agree" value="yes">
  I agree to the terms
</label>
```

Explicit label association:
```html
<input type="checkbox" id="agree" name="agree" value="yes">
<label for="agree">I agree to the terms</label>
```

Both approaches are valid. The wrapping label has a larger click/tap target because the entire label text also triggers the checkbox.

### Custom ARIA checkbox

Use only when native `<input type="checkbox">` cannot achieve the required design:

```html
<div role="checkbox"
     aria-checked="false"
     tabindex="0"
     aria-labelledby="label-1">
</div>
<span id="label-1">Option text</span>
```

A custom checkbox requires manually implementing everything that native provides for free: keyboard handling (Space), focus management (`tabindex`), click handling, form participation, and ARIA state management.

### Checkbox group

Native with `<fieldset>`/`<legend>`:
```html
<fieldset>
  <legend>Notification preferences</legend>
  <label><input type="checkbox" name="notif" value="email"> Email</label>
  <label><input type="checkbox" name="notif" value="sms"> SMS</label>
  <label><input type="checkbox" name="notif" value="push"> Push</label>
</fieldset>
```

Custom with `role="group"`:
```html
<div role="group" aria-labelledby="group-label">
  <h3 id="group-label">Notification preferences</h3>
  <div role="checkbox" aria-checked="false" tabindex="0">Email</div>
  <div role="checkbox" aria-checked="false" tabindex="0">SMS</div>
  <div role="checkbox" aria-checked="false" tabindex="0">Push</div>
</div>
```

### Tri-state controller with sub-checkboxes

```html
<fieldset>
  <legend>Toppings</legend>
  <label>
    <input type="checkbox" id="all-toppings" aria-controls="topping-1 topping-2 topping-3">
    Select all
  </label>
  <label><input type="checkbox" id="topping-1" name="topping" value="cheese"> Cheese</label>
  <label><input type="checkbox" id="topping-2" name="topping" value="peppers"> Peppers</label>
  <label><input type="checkbox" id="topping-3" name="topping" value="olives"> Olives</label>
</fieldset>
```

The `indeterminate` property on the controller is set via JavaScript: `document.getElementById('all-toppings').indeterminate = true`. There is no HTML attribute for `indeterminate` — it's a JavaScript-only IDL property.

### Attribute breakdown

| Attribute/property | Element | Purpose |
|---|---|---|
| `aria-checked` | Custom checkbox | Communicates the current state: `"true"`, `"false"`, or `"mixed"`. Not needed on native `<input type="checkbox">` — the native `checked` property maps automatically. |
| `checked` | Native checkbox | The native boolean attribute/property. Maps to `aria-checked="true"` in the accessibility tree. |
| `indeterminate` | Native checkbox | JavaScript-only IDL property. When `true`, maps to `aria-checked="mixed"` per HTML-AAM. Does **not** change the underlying `checked` value — it's a visual + a11y overlay. |
| `tabindex="0"` | Custom checkbox | Makes a non-interactive element (`div`, `span`) focusable. Not needed on native `<input>`. |
| `aria-controls` | Tri-state controller | Space-separated list of IDs of the sub-checkboxes this controller manages. |
| `role="group"` | Group container | Groups related checkboxes. Native `<fieldset>` provides this automatically. |
| `aria-labelledby` / `aria-label` | Custom checkbox or group | Provides the accessible name. Native checkboxes get their name from `<label>`. |
| `aria-required` | Checkbox | Indicates the checkbox must be checked before form submission. Native `required` attribute maps to this. |
| `aria-invalid` | Checkbox | Indicates validation failure. Use alongside `aria-describedby` or `aria-errormessage` pointing to error text. |
| `aria-disabled` | Custom checkbox | Marks the checkbox as non-operable while keeping it focusable (unlike native `disabled`, which removes it from tab order). |

---

<a id="keyboard"></a>
## 4. Keyboard interaction

### Required keys

| Key | Behavior |
|---|---|
| **Space** | Toggles the checkbox between checked and unchecked (or cycles through states for tri-state). |
| **Tab** | Moves focus to the next focusable element. Each checkbox in a group is an independent tab stop (unlike radio buttons, which use arrow keys within the group). |
| **Shift+Tab** | Moves focus to the previous focusable element. |

### Keys that intentionally do nothing

| Key | Behavior |
|---|---|
| **Enter** | Does **not** toggle the checkbox. This is intentional and different from buttons (which respond to both Enter and Space). Enter may submit the form if the checkbox is inside one. |

The Enter distinction matters because it's a common implementation mistake to handle Enter the same as Space on checkboxes. The APG specifies only Space for toggling. When auditing, verify that Enter does not change the checkbox state (unless the checkbox is configured as part of a form where Enter submits).

### Focus behavior

- Each checkbox is a **separate tab stop**. In a group of 5 checkboxes, Tab visits all 5 in sequence. This is different from radio groups (where arrow keys navigate within the group and Tab moves in/out of the group as a whole).
- A visible **focus indicator** must be present on the focused checkbox (WCAG 2.4.7 Focus Visible).
- Native `disabled` checkboxes are **removed from tab order** entirely. A user pressing Tab will skip them.
- Custom checkboxes with `aria-disabled="true"` **remain focusable** but do not respond to Space. This lets screen reader users discover and understand the disabled control rather than having it silently disappear.

---

<a id="state-management"></a>
## 5. State management

### Two-state transitions

```
Space on unchecked checkbox:
  aria-checked: "false" → "true"
  Visual: empty → checkmark

Space on checked checkbox:
  aria-checked: "true" → "false"
  Visual: checkmark → empty
```

Simple alternation. No other states.

### Tri-state transitions

The controller's state is derived from its sub-checkboxes and also drives them:

**User activates the controller:**
```
From mixed or unchecked:
  Controller: aria-checked → "true"
  All sub-checkboxes: aria-checked → "true"

From checked:
  Controller: aria-checked → "false"
  All sub-checkboxes: aria-checked → "false"
```

**User changes a sub-checkbox:**
```
All sub-checkboxes now checked:
  Controller: aria-checked → "true"

No sub-checkboxes checked:
  Controller: aria-checked → "false"

Some checked, some not:
  Controller: aria-checked → "mixed"
```

### Native `indeterminate` vs `aria-checked="mixed"`

For native `<input type="checkbox">`:
- The mixed state is set via JavaScript: `checkbox.indeterminate = true`
- This is a **visual and accessibility overlay** — it does not change the underlying `checked` property. The checkbox still has a `true` or `false` `checked` value underneath.
- Per HTML-AAM, when `indeterminate` is `true`, the accessibility mapping is `aria-checked="mixed"`
- When the user clicks or presses Space, the browser **clears** `indeterminate` (sets it to `false`) and toggles `checked`. The visual changes from indeterminate to checked or unchecked.
- There is **no** `indeterminate` HTML content attribute — only the JavaScript IDL property.

For custom `role="checkbox"`:
- Set `aria-checked="mixed"` directly as an attribute.

### Form submission

Native checkboxes participate in form submission:
- **Checked**: the form data includes `name=value` (e.g., `agree=yes`)
- **Unchecked**: the field is **omitted** from form data entirely (not sent as `agree=` or `agree=false`)
- The `indeterminate` visual state has no effect on submission — only `checked` matters

Custom ARIA checkboxes do not participate in native form submission. To include them, use a hidden `<input>` that mirrors the custom checkbox's state, or handle submission via JavaScript.

---

<a id="screen-reader"></a>
## 6. Screen reader expectations

### When focus lands on a checkbox

The screen reader should convey:

1. **Accessible name** — the label text
2. **Role** — "checkbox" (or "check box" depending on the screen reader)
3. **State** — "checked", "not checked", or "partially checked" / "mixed" / "half checked"

Example announcements by screen reader:
- NVDA: *"I agree to the terms, checkbox, not checked"*
- JAWS: *"I agree to the terms, check box, not checked"*
- VoiceOver: *"I agree to the terms, unticked, checkbox"*

The exact wording and order differ, but all three pieces of information must be present.

### When the user toggles the checkbox

The screen reader announces the new state:
- Checking: "checked" / "ticked"
- Unchecking: "not checked" / "unticked"
- Entering mixed state (if navigating away and back after sub-checkboxes change): "partially checked" / "half checked" / "mixed"

### Mixed state announcement

When a tri-state checkbox is in the mixed state:
- JAWS: "half checked"
- NVDA: "half checked"
- VoiceOver: "mixed"

The semantic meaning of partial selection must come through, though the exact words differ.

### Group context

When checkboxes are in a group (`<fieldset>`/`<legend>` or `role="group"` + `aria-labelledby`):
- The screen reader announces the group name when focus first enters the group
- The announcement typically happens on the first checkbox in the group, not repeated for every checkbox

### Additional states

| State | Announcement |
|---|---|
| Disabled (`disabled` or `aria-disabled="true"`) | "disabled" / "dimmed" / "unavailable" |
| Required (`required` or `aria-required="true"`) | "required" (support varies: JAWS and NVDA announce it; VoiceOver may not always) |
| Invalid (`aria-invalid="true"`) | "invalid" or associated error message (via `aria-describedby` or `aria-errormessage`) |
| Description (`aria-describedby`) | Additional description read after name, role, and state |

### Discoverability

Checkboxes appear in screen reader form controls lists. Users can navigate to them via the form controls shortcut (typically `F` in NVDA/JAWS browse mode).

---

<a id="implementation"></a>
## 7. Implementation guide

### Native first

Always start with `<input type="checkbox">`. It provides:
- Keyboard interaction (Space to toggle) — no JavaScript needed
- Form participation (`name`/`value` submission, `required` validation)
- Correct accessibility mappings without any ARIA attributes
- `disabled` state with automatic tab order removal
- Click-on-label behavior (with proper `<label>` association)

Reserve custom `role="checkbox"` for cases where native truly cannot work — complex visual designs that cannot be achieved with CSS on a native checkbox, or integration with a rendering system that cannot output `<input>` elements.

### Custom checkbox implementation checklist

If building a custom checkbox, implement all of these:

1. **Role**: `role="checkbox"` on the element
2. **State**: `aria-checked="true"` or `"false"` (or `"mixed"` for tri-state), updated on every toggle
3. **Focus**: `tabindex="0"` to make the element focusable
4. **Accessible name**: `aria-label`, `aria-labelledby`, or text content
5. **Space key handler**: toggle state on `keydown` for Space, call `event.preventDefault()` to prevent page scrolling
6. **Click handler**: toggle state on click (and on the associated label if one exists)
7. **Disabled state**: `aria-disabled="true"` when non-operable, with state-change handlers skipped
8. **Visual indicator**: the visual (checkmark, dash, empty) must match `aria-checked` at all times

### Tri-state controller logic

```
function updateController(controller, subCheckboxes) {
  const checked = subCheckboxes.filter(cb => cb.checked);

  if (checked.length === subCheckboxes.length) {
    controller.checked = true;
    controller.indeterminate = false;
  } else if (checked.length === 0) {
    controller.checked = false;
    controller.indeterminate = false;
  } else {
    controller.indeterminate = true;
  }
}
```

Wire this function to the `change` event of each sub-checkbox. When the controller itself is activated, set all sub-checkboxes to the new state and call the update function.

### Grouping

Use `<fieldset>` + `<legend>` for native checkbox groups. The `<fieldset>` provides `role="group"` automatically and `<legend>` provides the group name. No extra ARIA is needed.

For custom groups, wrap in a container with `role="group"` and give it `aria-labelledby` pointing to a visible heading or label element.

### Validation and errors

When a required checkbox is not checked on form submission:
1. Set `aria-invalid="true"` on the checkbox
2. Display an error message and associate it with the checkbox via `aria-describedby` or `aria-errormessage`
3. Move focus to the first invalid checkbox so screen reader users hear the error

---

<a id="common-mistakes"></a>
## 8. Common mistakes

### Using `div` or `span` without role or keyboard support

**Problem**: A styled `div` looks like a checkbox visually but has no `role="checkbox"`, no `tabindex`, and no `keydown` handler. AT users cannot perceive or interact with it.

**Fix**: Use `<input type="checkbox">` instead. If custom styling requires a `div`, add `role="checkbox"`, `tabindex="0"`, `aria-checked`, and Space/click handlers.

### Missing label

**Problem**: The checkbox has no associated `<label>`, no `aria-label`, and no `aria-labelledby`. The screen reader announces the role and state but not what the option is.

**Fix**: Associate a `<label>` (wrapping or `for="..."`) for native checkboxes. Use `aria-label` or `aria-labelledby` for custom ones.

### Handling Enter like Space

**Problem**: The custom checkbox toggles on both Enter and Space. The WAI-ARIA pattern specifies only Space for checkbox toggling. Enter inside a form is expected to submit the form, not toggle a checkbox.

**Fix**: Only handle Space in the `keydown` handler. Do not bind Enter to toggle.

### `aria-checked` on native checkboxes

**Problem**: A native `<input type="checkbox">` has an explicit `aria-checked` attribute that conflicts with its `checked` property. Per HTML-AAM, user agents expose only the native `checked` state — the `aria-checked` attribute is either redundant or misleading.

**Fix**: Do not set `aria-checked` on native checkboxes. Use the `checked` property/attribute. For mixed state, set the `indeterminate` IDL property via JavaScript.

### Forgetting `preventDefault()` on Space

**Problem**: A custom checkbox toggles on Space but doesn't prevent the default browser behavior. The page scrolls down when the user presses Space.

**Fix**: Call `event.preventDefault()` in the Space key handler.

### Visual state not matching `aria-checked`

**Problem**: The visual indicator (checkmark icon, CSS pseudo-element) doesn't sync with the `aria-checked` value. Sighted users see one state; screen reader users hear another.

**Fix**: Derive the visual from the same source of truth as `aria-checked`. Test by toggling and comparing the visual presentation with the accessibility tree value.

### Tri-state controller not updating when sub-checkboxes change

**Problem**: Checking/unchecking individual sub-checkboxes doesn't update the controller's state. The controller shows "checked" even though only 2 of 5 sub-checkboxes are checked.

**Fix**: Listen to `change` events on all sub-checkboxes and recalculate the controller's state: all checked → `true`, none → `false`, some → `mixed`/`indeterminate`.

### Group without accessible name

**Problem**: Checkboxes are visually grouped but the group has no `<fieldset>`/`<legend>`, no `role="group"`, and no accessible name. Screen reader users encounter individual checkboxes with no group context.

**Fix**: Wrap in `<fieldset>` + `<legend>` (native) or `role="group"` + `aria-labelledby` (custom).

---

<a id="acceptance-criteria"></a>
## 9. Acceptance criteria

Concise, verifiable checks for auditing a checkbox implementation. Each criterion includes its severity.

### Structure

| # | Criterion | Severity |
|---|---|---|
| S1 | The element has `role="checkbox"` (explicit for custom, implicit for native `<input type="checkbox">`). | Critical |
| S2 | The checkbox has a non-empty accessible name (via `<label>`, `aria-label`, or `aria-labelledby`). | Critical |
| S3 | A checked checkbox exposes `aria-checked="true"` in the accessibility tree. | Critical |
| S4 | An unchecked checkbox exposes `aria-checked="false"` in the accessibility tree. | Critical |
| S5 | A custom checkbox has `tabindex="0"` for keyboard focus. | Critical |
| S6 | The visual state (checkmark, dash, empty) matches `aria-checked` at all times. | Critical |
| S7 | Disabled state is conveyed: native `disabled` or `aria-disabled="true"`. | Major |
| S8 | Required state is conveyed: native `required` or `aria-required="true"`. | Major |
| S9 | Grouped checkboxes have a group container (`<fieldset>` or `role="group"`) with an accessible name. | Major |

### Keyboard

| # | Criterion | Severity |
|---|---|---|
| K1 | Space toggles the checkbox between checked and unchecked. | Critical |
| K2 | Enter does **not** toggle the checkbox. | Critical |
| K3 | Tab moves focus to the next focusable element; each checkbox in a group is a separate tab stop. | Critical |
| K4 | Shift+Tab moves focus to the previous focusable element. | Critical |
| K5 | A visible focus indicator is displayed on the focused checkbox. | Critical |
| K6 | Native `disabled` checkboxes are skipped by Tab; `aria-disabled` checkboxes remain focusable but non-operable. | Major |
| K7 | Custom checkboxes call `preventDefault()` on Space to prevent page scrolling. | Major |

### Screen reader

| # | Criterion | Severity |
|---|---|---|
| SR1 | When focus lands on a checkbox, the screen reader announces: accessible name, role ("checkbox"), and state ("checked" / "not checked" / "mixed"). | Critical |
| SR2 | Toggling a checkbox triggers a state change announcement. | Critical |
| SR3 | The mixed state is announced as "partially checked", "half checked", or "mixed" (wording varies by screen reader). | Critical |
| SR4 | Group name is announced when focus enters a checkbox group. | Major |
| SR5 | Disabled, required, and invalid states are announced when present. | Major |
| SR6 | Associated descriptions (`aria-describedby`) are announced after name, role, and state. | Major |

### Two-state specific

| # | Criterion | Severity |
|---|---|---|
| TS1 | The checkbox alternates between exactly two states: checked ↔ unchecked. No mixed state appears. | Critical |
| TS2 | Native checkbox: form submission includes `name=value` when checked and omits the field when unchecked. | Critical |
| TS3 | Clicking the associated label toggles the checkbox. | Critical |
| TS4 | Checkboxes in a group operate independently — checking one does not affect others. | Critical |

### Tri-state specific

| # | Criterion | Severity |
|---|---|---|
| TRI1 | The controller shows `aria-checked="true"` when all sub-checkboxes are checked. | Critical |
| TRI2 | The controller shows `aria-checked="false"` when no sub-checkboxes are checked. | Critical |
| TRI3 | The controller shows `aria-checked="mixed"` when some (but not all) sub-checkboxes are checked. | Critical |
| TRI4 | Activating the controller from mixed or unchecked checks all sub-checkboxes. | Critical |
| TRI5 | Activating the controller from checked unchecks all sub-checkboxes. | Critical |
| TRI6 | Checking/unchecking individual sub-checkboxes updates the controller's state. | Critical |
| TRI7 | The controller has `aria-controls` with a space-separated list of sub-checkbox IDs. | Critical |
| TRI8 | Controller and sub-checkboxes are in a labeled group (`<fieldset>` + `<legend>` or `role="group"` + `aria-labelledby`). | Major |
| TRI9 | For native checkboxes: the controller uses `indeterminate` IDL property (not an HTML attribute) for the mixed visual state. | Major |

### Edge cases

| # | Criterion | Severity |
|---|---|---|
| E1 | A custom checkbox handles both click and Space activation, updating `aria-checked` in both cases. | Critical |
| E2 | A dynamically added checkbox is focusable via Tab and has correct role and accessible name. | Major |
| E3 | Checkbox state persists across component re-renders. | Major |
| E4 | When validation fails, `aria-invalid="true"` is set and an error message is associated via `aria-describedby` or `aria-errormessage`. | Major |
| E5 | Hidden checkboxes (`display: none`, `hidden` attribute) are not in the accessibility tree or tab order. | Major |
| E6 | Checkboxes using SVG/icon indicators mark the visual element as decorative (`aria-hidden="true"`) and rely on `aria-checked` for state, not the icon's alt text. | Major |
| E7 | `aria-checked` is not set on native `<input type="checkbox">` — the native `checked` property is the source of truth. | Major |
