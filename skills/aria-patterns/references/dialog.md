# Dialog (Modal) Pattern

Source: [WAI-ARIA APG — Dialog (Modal) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)

## Key Traps — Read These First

1. **`aria-modal` is broken on TalkBack, Narrator, and Orca.** These screen readers ignore it completely — users can browse past the modal to background content.
2. **Always use BOTH `inert` AND `aria-hidden="true"` on siblings as layered defense.** `inert` is the best modern approach, but `aria-hidden="true"` on siblings is the essential fallback for older browsers/AT. Recommend both.
3. **`aria-modal` does NOT create a focus trap.** A JavaScript focus trap (Tab/Shift+Tab cycling) is always required separately.
4. **Native `<dialog>` with `.showModal()` is the most reliable approach** — it bypasses all `aria-modal` gaps via the browser's top layer mechanism.

## Table of Contents

1. [Identity: what is (and isn't) a dialog](#identity)
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
## 1. Identity: what is (and isn't) a dialog

A **dialog** is a window overlaid on either the primary window or another dialog window. It diverts the user's attention to a specific task or piece of information, expecting a response or acknowledgment before the user can return to the underlying content. In the ARIA spec, `dialog` is a **window role** — a descendant of the abstract `window` role — not a widget role or a landmark role.

### Essential characteristics

A component is a dialog when all of these are true:

- It presents **content in a separate layer** overlaid on the primary page or another dialog
- It has an **accessible name** (via `aria-labelledby` or `aria-label`) — the ARIA spec requires this
- It contains **at least one focusable descendant** element
- It **manages focus** — moving focus into the dialog on open and restoring it on close
- It **communicates its role** to assistive technologies (`role="dialog"` or the native `<dialog>` element)

A **modal** dialog additionally:

- Makes all content outside the dialog **inert** — users cannot interact with it by any means (keyboard, pointer, AT)
- Visually **obscures or dims** background content
- **Traps focus** — Tab and Shift+Tab cycle only through elements inside the dialog

### Distinguishing from similar patterns

| Component | Key difference |
|---|---|
| **Sheet / Drawer** | A panel that slides in from an edge (bottom, side). Visually distinct from a centered dialog, but if it blocks interaction with the rest of the page, it is semantically a modal dialog and should use `role="dialog"` with `aria-modal="true"`. |
| **Popover** (`[popover]`) | A lightweight, non-modal overlay attached to a trigger element. Popovers close on light dismiss (clicking outside or pressing Escape). They do not trap focus and do not use `role="dialog"` unless they contain complex interactions that merit dialog semantics. |
| **Alert** (`role="alert"`) | A live region that announces a message without requiring user interaction. Alerts do not receive focus, do not trap focus, and are not overlaid windows. If the alert requires a response, use `role="alertdialog"` instead. |
| **Toast / Snackbar** | A transient notification, typically a `role="status"` or `role="alert"` live region. It auto-dismisses and does not block interaction. Not a dialog. |
| **Tooltip** (`role="tooltip"`) | A non-interactive popup that describes an element. Appears on hover/focus and disappears when the trigger loses hover/focus. Never modal, never receives focus. |
| **Menu** (`role="menu"`) | A list of actions or choices. While a menu may visually overlay content, its interaction model (arrow-key navigation, type-ahead) is entirely different from a dialog. |
| **Non-modal dialog** | Uses `role="dialog"` without `aria-modal="true"`. Users can still interact with content outside the dialog. Focus is contained within the dialog's tab sequence but can leave via non-Tab means (e.g., screen reader browse mode). |

**Rule of thumb**: if the overlay requires the user to respond or complete a task before returning to the underlying content and blocks all background interaction, it is a modal dialog. If it overlays content but allows background interaction, it is a non-modal dialog. If it is a simple, auto-dismissing message, it is an alert or status, not a dialog.

---

<a id="variants"></a>
## 2. Variants

### Modal dialog

The most common variant. A window overlaid on the primary content that makes everything behind it inert. The user must interact with the dialog (complete, dismiss, or cancel) before returning to the page.

Uses `role="dialog"` with `aria-modal="true"`. Requires a focus trap — Tab and Shift+Tab cycle only within the dialog. Escape closes the dialog.

Common use cases: forms, confirmation prompts, settings panels, file pickers, image lightboxes.

### Non-modal dialog

A dialog window that does **not** block interaction with the rest of the page. The user can interact with both the dialog and the underlying content simultaneously.

Uses `role="dialog"` without `aria-modal="true"` (or with `aria-modal="false"`). Tab and Shift+Tab cycle within the dialog's own tab sequence, but the user can move focus outside the dialog through other means (e.g., clicking outside, screen reader landmark navigation).

Common use cases: find-and-replace dialogs, persistent chat windows, floating tool palettes, property inspectors.

Non-modal dialogs are rarer in web applications and more complex to implement accessibly because the relationship between the dialog and the background content must remain clear. The APG dialog pattern focuses primarily on modal dialogs.

### Alert dialog (`role="alertdialog"`)

A specialized modal dialog designed to **interrupt the user's workflow** with a brief, important message and acquire a response. It inherits from both the `alert` and `dialog` roles in the ARIA ontology.

Uses `role="alertdialog"` with `aria-modal="true"`. The key behavioral difference from a regular modal dialog: when the alert dialog opens, assistive technologies **SHOULD fire a system alert event**, making the announcement more urgent than a standard dialog.

Authors SHOULD use `aria-describedby` to reference the alert message element so that screen readers announce the message when the dialog opens.

Common use cases: delete confirmations ("Are you sure?"), unsaved changes warnings, session timeout prompts, destructive action confirmations.

### Behavioral comparison

| Behavior | Modal dialog | Non-modal dialog | Alert dialog |
|---|---|---|---|
| ARIA role | `dialog` | `dialog` | `alertdialog` |
| `aria-modal` | `"true"` | `"false"` or omitted | `"true"` |
| Background content inert | Yes | No | Yes |
| Focus trapped | Yes | No (focus cycles within dialog tab sequence but can leave) | Yes |
| Escape closes dialog | Yes | Yes (typically) | Yes |
| System alert event | No | No | Yes (AT SHOULD fire one) |
| `aria-describedby` usage | Optional (for simple descriptive content) | Optional | Strongly recommended (references the alert message) |
| Accessible name required | Yes | Yes | Yes |
| Typical content | Forms, complex interactions | Persistent tools, search | Brief message + action buttons |

---

<a id="anatomy"></a>
## 3. Anatomy & markup

### Preferred: native `<dialog>` element

The HTML `<dialog>` element maps to `role="dialog"` in the accessibility tree (per HTML-AAM). When opened via `showModal()`, the browser automatically:

- Sets `aria-modal="true"` in the accessibility mapping
- Creates a top-layer stacking context (above all other content)
- Applies the `::backdrop` pseudo-element for visual dimming
- Makes content outside the dialog inert (HTML `inert` behavior)
- Traps Tab/Shift+Tab within the dialog

When opened via `show()` or by adding the `open` attribute directly, the dialog is non-modal (`aria-modal="false"` in the mapping).

```html
<dialog id="confirm-dialog"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-desc">
  <h2 id="dialog-title">Confirm deletion</h2>
  <p id="dialog-desc">
    Are you sure you want to delete this item? This action cannot be undone.
  </p>
  <div class="dialog-actions">
    <button type="button" id="cancel-btn">Cancel</button>
    <button type="button" id="confirm-btn">Delete</button>
  </div>
</dialog>

<button type="button" id="open-dialog-btn">Delete item</button>

<script>
  const dialog = document.getElementById('confirm-dialog');
  const openBtn = document.getElementById('open-dialog-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const confirmBtn = document.getElementById('confirm-btn');

  openBtn.addEventListener('click', () => {
    dialog.showModal();
    cancelBtn.focus();
  });

  cancelBtn.addEventListener('click', () => dialog.close());
  confirmBtn.addEventListener('click', () => {
    // perform deletion
    dialog.close();
  });

  dialog.addEventListener('close', () => openBtn.focus());
</script>
```

### Custom ARIA fallback with `role="dialog"`

Use only when the native `<dialog>` element cannot achieve the required design (e.g., older browser support, frameworks that cannot render `<dialog>`):

```html
<div role="dialog"
     id="address-dialog"
     aria-labelledby="address-dialog-title"
     aria-describedby="address-dialog-desc"
     aria-modal="true"
     tabindex="-1">
  <h2 id="address-dialog-title">Add Delivery Address</h2>
  <p id="address-dialog-desc">
    Enter your delivery address below.
  </p>
  <form>
    <label>
      Street: <input type="text" name="street">
    </label>
    <label>
      City: <input type="text" name="city">
    </label>
    <div class="dialog-actions">
      <button type="submit">Add</button>
      <button type="button" class="close-btn">Cancel</button>
    </div>
  </form>
</div>
<div class="backdrop" aria-hidden="true"></div>
```

A custom dialog requires manually implementing everything that native `<dialog>` with `showModal()` provides for free: focus trapping, Escape key handling, backdrop rendering, inert management for background content, and `aria-modal` state.

### Alert dialog example

```html
<div role="alertdialog"
     id="delete-confirm"
     aria-labelledby="alert-title"
     aria-describedby="alert-desc"
     aria-modal="true">
  <h2 id="alert-title">Delete account?</h2>
  <p id="alert-desc">
    This will permanently delete your account and all associated data. This action cannot be undone.
  </p>
  <div class="dialog-actions">
    <button type="button" class="cancel-btn">Cancel</button>
    <button type="button" class="delete-btn">Delete permanently</button>
  </div>
</div>
```

For alert dialogs, initial focus SHOULD go to the least destructive action (e.g., "Cancel") to prevent accidental confirmation of irreversible actions.

### Non-modal dialog example

```html
<dialog id="find-replace"
        aria-labelledby="find-replace-title">
  <h2 id="find-replace-title">Find and Replace</h2>
  <label>
    Find: <input type="text" name="find">
  </label>
  <label>
    Replace: <input type="text" name="replace">
  </label>
  <div class="dialog-actions">
    <button type="button">Find Next</button>
    <button type="button">Replace</button>
    <button type="button">Replace All</button>
    <button type="button" class="close-btn">Close</button>
  </div>
</dialog>

<script>
  // Non-modal: use show() instead of showModal()
  document.getElementById('find-replace').show();
</script>
```

### Required structure

```
dialog container (role="dialog" or <dialog>)
├── accessible name source (h2 referenced by aria-labelledby, or aria-label)
├── [optional] description (p/div referenced by aria-describedby)
├── dialog content (form fields, text, etc.)
└── action buttons (at least one — close/cancel/confirm)
    └── [recommended] visible close button
```

### Attribute breakdown

| Attribute | Element | Purpose |
|---|---|---|
| `role="dialog"` | Dialog container | Identifies the element as a dialog. Not needed on native `<dialog>`. |
| `role="alertdialog"` | Dialog container | Identifies the element as an alert dialog (inherits from both `alert` and `dialog`). Used for urgent interruptions requiring a response. |
| `aria-modal="true"` | Dialog container | Tells assistive technologies that content outside the dialog is inert. Set automatically when using `<dialog>.showModal()`. For custom dialogs, must be set explicitly. |
| `aria-labelledby` | Dialog container | References the element (usually a heading) that provides the dialog's accessible name. Required — every dialog MUST have an accessible name. |
| `aria-label` | Dialog container | Alternative to `aria-labelledby` when no visible title element exists. Prefer `aria-labelledby` with a visible heading. |
| `aria-describedby` | Dialog container | References the element(s) containing the dialog's descriptive content. Screen readers announce this when the dialog opens. Omit when content has complex semantic structures (lists, tables, multiple paragraphs). |
| `tabindex="-1"` | Static element receiving initial focus | Makes a non-interactive element (paragraph, heading) programmatically focusable for initial focus placement. Not needed on interactive elements. |

---

<a id="keyboard"></a>
## 4. Keyboard interaction

### Required keys

| Key | Behavior |
|---|---|
| **Tab** | Moves focus to the next tabbable element inside the dialog. If focus is on the **last** tabbable element, wraps to the **first** tabbable element inside the dialog. Focus never leaves the dialog (modal only). |
| **Shift+Tab** | Moves focus to the previous tabbable element inside the dialog. If focus is on the **first** tabbable element, wraps to the **last** tabbable element inside the dialog. Focus never leaves the dialog (modal only). |
| **Escape** | Closes the dialog. Focus returns to the element that invoked the dialog (see focus restoration rules below). |

### Optional keys

| Key | Behavior |
|---|---|
| **Enter** | When focus is on a button, activates it. If the dialog has a default action button (e.g., a submit or confirm button), some implementations allow Enter to trigger the default action from any element. This is optional and context-dependent. |

### Focus trap details (modal dialogs only)

The focus trap is the defining keyboard characteristic of a modal dialog. It ensures:

1. **Tab wraps forward**: from the last tabbable element to the first tabbable element inside the dialog.
2. **Shift+Tab wraps backward**: from the first tabbable element to the last tabbable element inside the dialog.
3. **No focus escape**: focus cannot leave the dialog via Tab or Shift+Tab under any circumstances while the dialog is open.

The native `<dialog>` element with `showModal()` provides the focus trap automatically in all modern browsers. Custom implementations must build it manually.

**What counts as a "tabbable element"**: any element with `tabindex` of 0 or greater, plus natively interactive elements (`<button>`, `<input>`, `<select>`, `<textarea>`, `<a href>`, etc.) that are not disabled or hidden. Elements with `tabindex="-1"` are programmatically focusable but not in the tab order — they do not participate in the focus trap cycle.

### Initial focus placement

When a dialog opens, focus MUST move to an element inside the dialog. The APG provides these guidelines for choosing where initial focus goes:

1. **First focusable element** — the default choice for most dialogs (e.g., the first form input).
2. **A static element at the start of content** (with `tabindex="-1"`) — when the dialog content includes semantic structures (lists, tables, paragraphs) that must be read to be understood. This helps AT users navigate the content. In this case, omit `aria-describedby` on the dialog container.
3. **A static element at the top** (with `tabindex="-1"`) — when content is large enough that focusing the first interactive element would scroll the beginning out of view.
4. **The least destructive action button** — for alert dialogs or dialogs representing irreversible actions (e.g., focus "Cancel" instead of "Delete").
5. **The most frequently used element** — for informational dialogs with a single primary action (e.g., focus "OK" or "Continue").

**Never** make the dialog container itself (`role="dialog"`) focusable. The larger a focusable element is, the harder it is to visually identify focus location, and screen readers would read the entire dialog label and description as one announcement.

### Focus restoration on close

When a dialog closes, focus MUST return to the element that invoked the dialog, unless:

- The invoking element no longer exists in the DOM — focus should move to a logical alternative in the workflow.
- The workflow design makes a different target more logical (e.g., after adding a row via dialog, focus moves to the first cell of the new row).

Focus restoration is essential for maintaining the user's point of regard. Without it, focus falls to the `<body>`, and screen reader users lose their place entirely.

### Edge cases

- **Dialog with no focusable elements**: violates the spec requirement. Every dialog MUST have at least one focusable descendant. Add a close button at minimum.
- **Nested dialogs**: when a dialog opens another dialog, the outer dialog becomes inert. Focus traps in the inner dialog. When the inner dialog closes, focus returns to the element in the outer dialog that triggered it.
- **Dialog open during page load**: if a dialog is rendered open on page load (e.g., a cookie consent modal), focus should move into it after the page finishes loading. Ensure the trigger element for focus restoration is defined (or handle the no-trigger case).

---

<a id="state-management"></a>
## 5. State management

### State transitions: opening a modal dialog

```
User activates trigger button:
  1. Dialog container: becomes visible (display: block / open attribute added)
  2. aria-modal: set to "true" (automatic with showModal(), manual for custom)
  3. Background content: becomes inert (native inert with showModal(), or
     aria-hidden="true" + tabindex="-1" on background for custom)
  4. Backdrop: rendered (::backdrop for native, custom overlay div for ARIA)
  5. Scroll lock: page scroll is disabled (prevent background scrolling)
  6. Focus: moves to the appropriate element inside the dialog
  7. Focus trap: activated (Tab/Shift+Tab cycle within dialog)
```

### State transitions: closing a modal dialog

```
User presses Escape or activates a close/cancel/confirm button:
  1. Focus trap: deactivated
  2. Focus: returned to the invoking element (or logical alternative)
  3. Dialog container: becomes hidden (display: none / open attribute removed)
  4. aria-modal: no longer applies (dialog is hidden)
  5. Background content: becomes interactive again (inert removed)
  6. Backdrop: removed
  7. Scroll lock: released (page scrolling re-enabled)
```

### State transitions: opening a non-modal dialog

```
User activates trigger button:
  1. Dialog container: becomes visible
  2. aria-modal: "false" or omitted
  3. Background content: remains interactive
  4. Focus: moves to an element inside the dialog
  5. No focus trap: Tab can leave the dialog's tab order
```

### Backdrop and inert management

For **native `<dialog>` with `showModal()`**: the browser handles both automatically. The `::backdrop` pseudo-element appears behind the dialog, and all content outside the dialog's top-layer stacking context becomes inert (cannot receive focus or pointer events).

For **custom `role="dialog"` implementations**, inert management requires one of two approaches:

1. **`aria-modal="true"` approach (modern)**: set `aria-modal="true"` on the dialog. Assistive technologies that support `aria-modal` will limit navigation to the dialog's contents. However, `aria-modal` alone does not prevent keyboard focus from reaching background elements — you must still implement a JavaScript focus trap and may need to apply the HTML `inert` attribute to background containers.

2. **`aria-hidden` approach (legacy)**: set `aria-hidden="true"` on each sibling element containing background content. The dialog element must NOT be a descendant of any element with `aria-hidden="true"`. This approach is more work but has broader AT support. It still requires a JavaScript focus trap for keyboard users.

In both cases, a visual backdrop (semi-transparent overlay) should cover background content to signal inertness to sighted users.

### Scroll lock

When a modal dialog opens, page scroll should be disabled to prevent the background from scrolling while the user interacts with the dialog. Common technique: apply `overflow: hidden` to `<body>` or `<html>` when the dialog opens, and remove it when the dialog closes. Preserve the scroll position so the page does not jump when scroll is restored.

Native `<dialog>` with `showModal()` does NOT automatically prevent background scrolling in all browsers — this must still be handled by authors in many cases.

### Valid initial states

A dialog can be in one of two states at any time:

| State | Dialog visible | Background inert (modal) | Focus location |
|---|---|---|---|
| **Closed** (default) | No — `display: none` or no `open` attribute | No | Anywhere in the page |
| **Open** | Yes | Yes (modal) / No (non-modal) | Inside the dialog |

A dialog should always start in the closed state and be opened programmatically in response to a user action (button click, keyboard shortcut, etc.).

---

<a id="screen-reader"></a>
## 6. Screen reader expectations

### When a dialog opens

The screen reader should announce:

1. **Role** — "dialog" or "alert dialog" (wording varies by SR)
2. **Accessible name** — from `aria-labelledby` or `aria-label`
3. **Description** — from `aria-describedby` (if provided and content is simple)
4. **Initially focused element** — the name and role of the element that receives focus

The exact announcement order and wording vary by screen reader:

| Screen reader | Typical announcement on dialog open |
|---|---|
| **NVDA** | "(dialog name), dialog. (focused element name and role)" — then reads `aria-describedby` content |
| **JAWS** | "(dialog name) dialog. (aria-describedby content). (focused element name and role)" |
| **VoiceOver (macOS)** | "(dialog name), web dialog. (focused element details)" |
| **VoiceOver (iOS)** | Support is partial — may not consistently announce the dialog role |
| **TalkBack** | Does not consistently convey dialog role per a11ysupport.io data |
| **Narrator** | Announces dialog role, name, and focused element |

### `aria-modal` behavior across screen readers

Per a11ysupport.io (tested against the APG modal dialog example):

| Expectation | JAWS (Chrome/Edge/Firefox) | NVDA (Chrome/Edge/Firefox) | VoiceOver (macOS/Safari) | VoiceOver (iOS/Safari) | TalkBack (Chrome) | Narrator (Edge) | Orca (Firefox) |
|---|---|---|---|---|---|---|---|
| Convey presence of `aria-modal="true"` | Supported | Supported | Partial | Supported | None | None | None |
| Limit reading to modal children | Supported | Supported | Partial | Partial | None | None | None |
| Remove outside content from nav shortcuts | Supported / Partial (Firefox) | Supported | Supported | Supported | None | None | Partial |

**Key divergence from spec**: the ARIA spec says assistive technologies SHOULD limit navigation to `aria-modal="true"` content, but TalkBack (Android), Orca (Linux), and Narrator (Windows) do not support this at all. VoiceOver has partial support — it may allow virtual cursor navigation outside the dialog in some contexts. This is why a JavaScript focus trap is essential even when `aria-modal="true"` is set — relying on AT to enforce the modal boundary is insufficient.

### Workarounds for `aria-modal` gaps

Because `aria-modal` is unreliable in 3+ major screen readers, **always implement complementary containment**:

1. **HTML `inert` attribute (best option)** — Add `inert` to all sibling containers of the dialog when it opens. This makes background content unfocusable AND invisible to AT at the platform level. Browser support is now universal (Chrome 102+, Firefox 112+, Safari 15.5+).

   ```html
   <body>
     <div id="app" inert><!-- all app content --></div>
     <dialog open aria-labelledby="dialog-title">
       <!-- modal content -->
     </dialog>
   </body>
   ```

2. **`aria-hidden="true"` on siblings** — If you can't use `inert`, set `aria-hidden="true"` on all sibling containers. This hides them from the accessibility tree but does NOT prevent focus — combine with disabling focusable elements.

3. **Native `<dialog>` with `.showModal()` (most reliable)** — The native dialog element with `.showModal()` automatically makes background content inert via the browser's top layer mechanism. This bypasses `aria-modal` gaps entirely.

4. **Focus trap (always required regardless)** — `aria-modal` does NOT create a focus trap. Always implement a JavaScript focus trap that prevents Tab/Shift+Tab from leaving the dialog.

### `role="dialog"` support across screen readers

Per a11ysupport.io:

| Expectation | JAWS | NVDA | VoiceOver (macOS) | VoiceOver (iOS) | TalkBack | Narrator | Orca |
|---|---|---|---|---|---|---|---|
| Convey dialog role | Supported | Supported | Supported | None | None | Supported | Supported |
| Convey dialog name | Supported | Supported | Supported | None | None | Supported | Supported |
| Convey dialog boundaries | Supported | Supported | Supported | Partial | None | None | None |
| Document/reading mode (not forced) | Supported | Supported | Supported | Supported | Supported | Supported | Supported |

**Critical finding**: TalkBack and VoiceOver (iOS) do not convey the dialog role. This means mobile screen reader users will not be informed they are in a dialog unless other cues are present (such as the focus moving and the dialog name being read). This makes the accessible name and `aria-describedby` even more important for mobile contexts.

### When a dialog closes

- Screen readers announce the element that receives focus after the dialog closes — they announce its name, role, and state.
- There is no explicit "dialog closed" announcement in most screen readers. The user infers closure from the focus moving back to the triggering context.
- If focus is not properly restored, the screen reader may announce "blank" or read the entire page from the top, severely disorienting the user.

### Alert dialog specifics

When `role="alertdialog"` is used:
- JAWS and NVDA fire a system alert sound/event, making the announcement more urgent.
- The content referenced by `aria-describedby` is announced with higher priority.
- Screen readers treat it as both an alert and a dialog — the alert semantics ensure the message is conveyed immediately.

### Browse mode / reading mode behavior

Screen readers MUST NOT automatically switch away from reading/browse mode when a dialog opens. The dialog uses document mode, allowing users to navigate its content with arrow keys, heading shortcuts, etc. This is confirmed as supported across all tested screen readers per a11ysupport.io.

---

<a id="implementation"></a>
## 7. Implementation guide

### Use native `<dialog>` first

The native `<dialog>` element with `showModal()` is the preferred implementation because the browser handles:

- Focus trapping (Tab/Shift+Tab cycle within the dialog)
- Top-layer rendering (dialog is above all other content)
- `::backdrop` pseudo-element (visual dimming)
- Inert management for background content
- Escape key to close (fires a `cancel` event)
- Accessibility mapping: `role="dialog"`, `aria-modal="true"` when opened via `showModal()`

What authors still need to handle:

1. **Accessible name**: add `aria-labelledby` or `aria-label`.
2. **Initial focus**: while the browser focuses the first focusable element by default, you may want to override this (e.g., focus a non-destructive button in a confirmation dialog). Use `autofocus` on the target element or call `.focus()` after `showModal()`.
3. **Focus restoration**: save a reference to the triggering element before opening. In the `close` event handler, call `triggerElement.focus()`.
4. **Scroll lock**: apply `overflow: hidden` to `<body>` when the dialog opens and remove it on close. Not all browsers prevent background scrolling automatically.
5. **`aria-describedby`**: add when the dialog has simple descriptive content.

### Step-by-step: native modal dialog

```javascript
const dialog = document.querySelector('#my-dialog');
const trigger = document.querySelector('#open-btn');
const closeBtn = dialog.querySelector('.close-btn');
let previouslyFocused = null;

// Open
trigger.addEventListener('click', () => {
  previouslyFocused = document.activeElement;
  dialog.showModal();
  // Override initial focus if needed:
  dialog.querySelector('.cancel-btn')?.focus();
  document.body.style.overflow = 'hidden';
});

// Close via button
closeBtn.addEventListener('click', () => {
  dialog.close();
});

// Close via Escape (native <dialog> fires 'cancel' event)
dialog.addEventListener('cancel', (event) => {
  // Optionally prevent close: event.preventDefault();
});

// Restore focus and scroll on close
dialog.addEventListener('close', () => {
  document.body.style.overflow = '';
  previouslyFocused?.focus();
});
```

### Focus trap implementation (custom dialogs)

When a custom `role="dialog"` is used instead of native `<dialog>`, implement a focus trap:

```javascript
const trapFocus = (dialogElement) => {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  const focusableElements = [
    ...dialogElement.querySelectorAll(focusableSelectors),
  ];
  const first = focusableElements[0];
  const last = focusableElements[focusableElements.length - 1];

  const handleKeydown = (event) => {
    if (event.key === 'Tab') {
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    if (event.key === 'Escape') {
      closeDialog();
    }
  };

  dialogElement.addEventListener('keydown', handleKeydown);

  // Return cleanup function
  return () => dialogElement.removeEventListener('keydown', handleKeydown);
};
```

**Important caveats for custom focus traps**:

- Recalculate focusable elements if dialog content changes dynamically (e.g., form validation adds/removes fields).
- Account for elements becoming hidden or disabled during the dialog's lifetime.
- Shadow DOM boundaries may require special handling — `querySelectorAll` does not pierce shadow roots.

### Inert management (custom dialogs)

For custom dialogs, make background content inert:

```javascript
// Modern: use the HTML inert attribute
const makeBackgroundInert = (dialogElement) => {
  const siblings = [...document.body.children].filter(
    (el) => el !== dialogElement && el !== dialogElement.closest('.dialog-layer')
  );
  for (const el of siblings) {
    el.inert = true;
  }

  return () => {
    for (const el of siblings) {
      el.inert = false;
    }
  };
};
```

The `inert` attribute is now supported in all modern browsers and handles: removing from tab order, removing from accessibility tree, and preventing pointer events. This is preferred over manually setting `aria-hidden="true"` on siblings.

### Scroll lock

```javascript
let scrollPosition = 0;

const lockScroll = () => {
  scrollPosition = window.scrollY;
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollPosition}px`;
  document.body.style.width = '100%';
};

const unlockScroll = () => {
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  window.scrollTo(0, scrollPosition);
};
```

The `position: fixed` technique prevents the scroll-to-top jump that occurs with `overflow: hidden` alone on iOS Safari.

### Animation considerations

If the dialog animates in/out (fade, scale, slide):

- **Announce immediately**: the dialog role and name should be conveyed as soon as the dialog opens, not after the animation completes. Focus should move at the start of the animation.
- **Prevent interaction during close animation**: once the close is triggered, remove the dialog from the tab order and accessibility tree even if the visual animation is still playing. Otherwise, users might interact with a closing dialog.
- **Respect `prefers-reduced-motion`**: if the user prefers reduced motion, skip the animation entirely.
- **Consider `display` transitions**: CSS `@starting-style` and `transition-behavior: allow-discrete` enable animating `display: none` to `display: block`. Use with native `<dialog>` for smooth animations while preserving correct hide/show semantics.

### Backdrop click (click outside to close)

A common pattern where clicking the backdrop closes the dialog. Implementation:

```javascript
dialog.addEventListener('click', (event) => {
  // The dialog element itself is the target when clicking the backdrop
  if (event.target === dialog) {
    dialog.close();
  }
});
```

**Accessibility requirement**: if backdrop click closes the dialog, Escape MUST also close it. Users who cannot use a pointer rely on Escape as the equivalent dismiss mechanism. Never support backdrop-click-to-close without also supporting Escape-to-close.

### Framework-specific notes

| Framework / Library | Key considerations |
|---|---|
| **Radix Dialog** | Renders native-like semantics. Supports modal/non-modal. Manages focus trap, Escape, focus restoration. Verify `aria-describedby` is set when needed. Provides `Portal` for rendering outside the DOM tree. |
| **Headless UI Dialog** | Provides `Dialog`, `DialogPanel`, `DialogTitle`, `DialogDescription` components. Maps to correct ARIA roles. Manages focus trap and Escape. Ensure title component is rendered for accessible name. |
| **MUI Dialog** | Uses `role="dialog"` by default. Supports `aria-labelledby` and `aria-describedby` via component props. Manages focus trap. Watch for `disablePortal` — can cause stacking issues affecting inert management. |
| **Chakra UI Modal** | Wraps focus on open, restores on close. Provides `ModalHeader`, `ModalBody`, `ModalFooter` structure. Auto-sets `aria-labelledby` from `ModalHeader` and `aria-describedby` from `ModalBody`. Test scroll lock on iOS. |
| **React/Vue/Svelte (manual)** | If not using a library: use native `<dialog>` where possible. For custom implementations, use the `inert` attribute on background siblings, implement focus trap manually, handle Escape, save/restore focus, and add all required ARIA attributes. |

---

<a id="common-mistakes"></a>
## 8. Common mistakes

### Focus is not trapped within a modal dialog

**Problem**: Tab or Shift+Tab moves focus to elements outside the modal dialog — the browser's address bar, background page elements, or toolbar buttons. Keyboard users can interact with inert content, causing confusion and potential data loss.

**Fix**: Implement a focus trap that wraps Tab from the last to the first focusable element and Shift+Tab from the first to the last. Use native `<dialog>` with `showModal()` which provides this for free. For custom dialogs, implement a `keydown` listener that intercepts Tab at the boundaries. Also apply the `inert` attribute to background content to prevent programmatic focus.

### Focus is not restored when the dialog closes

**Problem**: When the dialog closes, focus falls to `<body>` or the top of the page. Screen reader users lose their place entirely and must navigate from the beginning. Keyboard users must Tab through the entire page to return to where they were.

**Fix**: Before opening the dialog, save a reference to `document.activeElement`. In the close handler, call `.focus()` on the saved element. Handle the edge case where the saved element no longer exists (e.g., it was removed from the DOM while the dialog was open) — in that case, focus a logical nearby element.

### No accessible name

**Problem**: The dialog has no `aria-labelledby` and no `aria-label`. Screen readers announce "dialog" with no name, giving users no indication of the dialog's purpose. Per the ARIA spec, an accessible name is **required** for the `dialog` role.

**Fix**: Add a visible heading inside the dialog and reference it with `aria-labelledby`. If a visible heading is not possible, use `aria-label`. Prefer `aria-labelledby` because it uses visible text — consistent for both sighted and AT users.

### `aria-modal` used without JavaScript focus trap

**Problem**: The dialog has `aria-modal="true"` but no focus trap. `aria-modal` only informs assistive technologies that content outside is inert — it does NOT prevent keyboard focus from reaching background elements. Users who rely on Tab (rather than AT browse mode) can still focus outside the dialog. And as shown in AT support data, not all screen readers respect `aria-modal`.

**Fix**: Always pair `aria-modal="true"` with a JavaScript focus trap. Use the `inert` attribute on background content for defense in depth. Never rely on `aria-modal` alone to enforce modality.

### Backdrop click works but Escape does not close the dialog

**Problem**: Users can click outside the dialog to close it, but pressing Escape does nothing. Keyboard-only users and screen reader users have no equivalent way to dismiss the dialog.

**Fix**: If the dialog supports backdrop-click-to-close, also implement Escape-to-close. They are equivalent dismiss mechanisms. Native `<dialog>` handles Escape automatically (fires a `cancel` event).

### Background scroll is not locked

**Problem**: While the modal dialog is open, users can scroll the background page — either via mouse wheel, touch scrolling on mobile, or keyboard (Space, Page Down). This creates visual confusion (the background moves under the dialog) and can cause disorientation.

**Fix**: Lock `<body>` scrolling when the dialog opens (apply `overflow: hidden`). On iOS Safari, use the `position: fixed` + `top` technique to prevent scroll-to-top. Restore scroll position when the dialog closes.

### Nested dialogs cause focus management issues

**Problem**: A dialog opens another dialog (e.g., "Confirm deletion" inside an "Edit item" dialog). The outer dialog's focus trap conflicts with the inner dialog's focus trap, or closing the inner dialog restores focus to the wrong element.

**Fix**: Maintain a stack of open dialogs. Each new dialog pushes to the stack and takes over the focus trap. When a dialog closes, pop it from the stack and restore focus to the element in the previous dialog that triggered it. Make sure only the topmost dialog's focus trap is active — deactivate the outer dialog's trap while an inner dialog is open.

### Dialog container is made focusable

**Problem**: The element with `role="dialog"` has `tabindex="0"`, making the entire dialog focusable. When the user tabs to it, the screen reader announces the entire dialog label and description, and the visual focus indicator surrounds the entire dialog (which may be very large), making focus location hard to identify.

**Fix**: Never make the dialog container focusable. If you need to place initial focus on a non-interactive element (like the first paragraph or the title), give that specific element `tabindex="-1"` and call `.focus()` on it. The dialog container itself should not be in the tab order.

### Using `aria-hidden="true"` incorrectly with nested DOM

**Problem**: When using the legacy `aria-hidden` approach to make background content inert, `aria-hidden="true"` is set on an ancestor of the dialog element. This hides the dialog itself from assistive technologies.

**Fix**: The dialog element must NOT be a descendant of any element with `aria-hidden="true"`. Either render the dialog as a direct child of `<body>`, use a portal to move it out of the hidden subtree, or use the modern `inert` attribute instead of `aria-hidden`.

---

<a id="acceptance-criteria"></a>
## 9. Acceptance criteria

Concise, verifiable checks for auditing a dialog implementation. Each criterion includes its severity.

**Severity levels**: **Critical** (unusable for AT users) | **Major** (significantly degrades experience) | **Minor** (inconvenience).

### Structure

| # | Criterion | Severity |
|---|---|---|
| S1 | The dialog container has `role="dialog"` (explicit for custom, implicit for native `<dialog>`). | Critical |
| S2 | The dialog has a non-empty accessible name (via `aria-labelledby` referencing a visible heading, or `aria-label`). | Critical |
| S3 | All elements required to operate the dialog are descendants of the dialog container. | Critical |
| S4 | The dialog contains at least one focusable descendant element. | Critical |
| S5 | The dialog includes a visible close mechanism (button with "Close"/"Cancel"/"X" label). | Critical |
| S6 | When the dialog has simple descriptive content, `aria-describedby` references the element containing that description. | Major |
| S7 | When the dialog content contains complex semantic structures (lists, tables, multiple paragraphs), `aria-describedby` is omitted to avoid an unbroken announcement. | Major |
| S8 | The dialog is not a descendant of any element with `aria-hidden="true"`. | Critical |

### Keyboard

| # | Criterion | Severity |
|---|---|---|
| K1 | When the dialog opens, focus moves to an element inside the dialog (per focus placement guidelines: first focusable, static element, or least destructive action). | Critical |
| K2 | Tab moves focus to the next tabbable element inside the dialog; from the last tabbable element, focus wraps to the first (modal only). | Critical |
| K3 | Shift+Tab moves focus to the previous tabbable element inside the dialog; from the first tabbable element, focus wraps to the last (modal only). | Critical |
| K4 | Escape closes the dialog. | Critical |
| K5 | When the dialog closes, focus returns to the element that triggered the dialog (or a logical alternative if that element no longer exists). | Critical |
| K6 | No element outside the dialog receives focus via Tab or Shift+Tab while the dialog is open (modal only). | Critical |
| K7 | A visible focus indicator is present on the focused element inside the dialog at all times. | Critical |

### Screen reader

| # | Criterion | Severity |
|---|---|---|
| SR1 | When the dialog opens, the screen reader announces the dialog role and accessible name. | Critical |
| SR2 | The `aria-describedby` content (when present) is announced when the dialog opens. | Major |
| SR3 | The initially focused element's name and role are announced after the dialog information. | Critical |
| SR4 | Screen readers can navigate the dialog content using browse/reading mode (headings, links, etc.). | Critical |
| SR5 | When the dialog closes, the screen reader announces the element that receives focus (confirming return to the invoking context). | Critical |
| SR6 | Content outside the modal dialog is not reachable via screen reader browse mode (where `aria-modal` is supported — fallback: use `inert` or `aria-hidden`). | Major |

### Modal-specific

| # | Criterion | Severity |
|---|---|---|
| M1 | The dialog has `aria-modal="true"` (set automatically by `showModal()` or explicitly for custom dialogs). | Critical |
| M2 | Background content is visually obscured (backdrop/overlay is rendered). | Major |
| M3 | Background content is inert — cannot receive focus or pointer events (via native `showModal()`, `inert` attribute, or `aria-hidden` + focus management). | Critical |
| M4 | Page scroll is disabled while the modal is open. | Major |
| M5 | Page scroll position is preserved and restored when the modal closes. | Minor |
| M6 | If the dialog supports backdrop-click-to-close, it also supports Escape-to-close. | Critical |

### Alert dialog

| # | Criterion | Severity |
|---|---|---|
| A1 | The dialog container has `role="alertdialog"`. | Critical |
| A2 | `aria-describedby` references the element containing the alert message. | Critical |
| A3 | Initial focus is set on an element inside the dialog (preferably the least destructive action for irreversible operations). | Critical |
| A4 | The alert message is concise and immediately understandable. | Major |
| A5 | The dialog has `aria-modal="true"` and implements all modal behaviors (focus trap, inert background, Escape to close). | Critical |

### Non-modal dialog

| # | Criterion | Severity |
|---|---|---|
| NM1 | The dialog has `role="dialog"` and does NOT have `aria-modal="true"`. | Critical |
| NM2 | Focus moves into the dialog on open. | Critical |
| NM3 | Tab and Shift+Tab cycle within the dialog's tab sequence. | Major |
| NM4 | Users can move focus outside the dialog via means other than Tab (e.g., clicking outside, using AT landmarks). | Critical |
| NM5 | The dialog can be closed without affecting the state of the underlying page. | Major |
| NM6 | Focus returns to the invoking element (or a logical alternative) when the dialog closes. | Critical |

### Edge cases

| # | Criterion | Severity |
|---|---|---|
| E1 | Nested dialogs: opening a second dialog from within a first dialog correctly stacks focus traps — only the topmost dialog receives focus. | Critical |
| E2 | Nested dialogs: closing the inner dialog restores focus to the triggering element in the outer dialog. | Critical |
| E3 | If the element that triggered the dialog is removed while the dialog is open, closing the dialog moves focus to a logical alternative element. | Major |
| E4 | Dialogs rendered open on page load move focus into the dialog after the page finishes loading. | Major |
| E5 | Dynamic content inside the dialog (e.g., form validation errors, loading states) does not break the focus trap — newly added focusable elements are included in the Tab cycle. | Major |
| E6 | The dialog works correctly when rendered via a portal (React Portal, Vue Teleport, etc.) — it is not a descendant of an `aria-hidden` or `inert` element. | Critical |
| E7 | Animations (open/close) do not delay focus movement or accessibility announcements. `prefers-reduced-motion` is respected. | Minor |
| E8 | On mobile viewports, the dialog is scrollable when its content exceeds the viewport height, and the scroll is contained within the dialog (not the background page). | Major |
| E9 | Multiple simultaneous non-modal dialogs each maintain independent focus management and accessible names. | Major |
