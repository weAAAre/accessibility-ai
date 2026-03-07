# Combobox Pattern

Source: [WAI-ARIA APG — Combobox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)

## Key Traps — Read These First

1. **ARIA version confusion is the #1 combobox bug.** The pattern changed across ARIA 1.0 → 1.1 → 1.2. Many tutorials and Stack Overflow answers use the deprecated 1.0/1.1 wrapper-div pattern. **Only ARIA 1.2 works**: `role="combobox"` goes on the `<input>` itself, with `aria-controls` (not `aria-owns`). Always warn developers about outdated examples.
2. **VoiceOver/Safari ONLY supports the ARIA 1.2 model** — the old wrapper-div pattern is completely invisible to VoiceOver.
3. **`aria-autocomplete` has very poor AT support** (~20% per a11ysupport.io). Do NOT rely on it alone — always add an `aria-live` region to announce filtered result counts.
4. **`aria-haspopup="dialog"` has partial AT support** — Narrator and TalkBack may not announce the popup type. Still use it, but don't depend on it as the only cue.
5. **`aria-activedescendant` does NOT work for combobox on VoiceOver macOS/Safari** — it is completely unsupported ("none") in combobox context, though it works fine for menus. If you need VoiceOver macOS users to hear which option is highlighted, use **DOM focus** (roving tabindex or programmatic `.focus()` on options) instead of `aria-activedescendant`. This contradicts many tutorials that recommend `aria-activedescendant` universally for combobox.

## Table of Contents

1. [Identity: what is (and isn't) a combobox](#identity)
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
## 1. Identity: what is (and isn't) a combobox

A **combobox** is an input widget that has an associated popup enabling users to choose a value from a collection. The popup may be a listbox, grid, tree, or dialog. Some comboboxes allow users to type and edit text (editable), while others only allow selecting from the popup (select-only). The combobox is one of the most complex ARIA patterns due to its many behavioral variations and its troubled specification history across ARIA versions.

### Essential characteristics

A component is a combobox when all of these are true:

- It has an **input element** (editable text field or display-only value) with `role="combobox"`
- It has an **associated popup** (listbox, grid, tree, or dialog) that helps the user set the value
- The popup is **togglable** — collapsed by default, expanded on demand
- It **communicates its expanded/collapsed state** via `aria-expanded`
- It provides a mechanism to **select a value** from the popup and place it in the input

### ARIA version history — use the ARIA 1.2 model

The combobox pattern changed significantly across ARIA versions. Only the **ARIA 1.2 model** should be used:

| ARIA version | Model | Status |
|---|---|---|
| **ARIA 1.0** | `role="combobox"` on a text input; popup referenced via `aria-owns` | Deprecated — do not use |
| **ARIA 1.1** | `role="combobox"` on a non-focusable container wrapping a textbox and a popup | Deprecated — never widely supported by AT |
| **ARIA 1.2 (current)** | `role="combobox"` directly on the input element; popup referenced via `aria-controls` | **Use this model** |

The ARIA 1.2 model places `role="combobox"` on the input element itself, uses `aria-controls` (not `aria-owns`) to reference the popup, and supports both editable and select-only presentations. This is the only model with broad assistive technology support.

### Distinguishing from similar patterns

| Component | Key difference |
|---|---|
| **Listbox** (`role="listbox"`) | A listbox presents options directly without a collapsed/expanded toggle. Navigating options in a single-select listbox immediately changes its value; Escape does not provide undo. A combobox wraps a listbox (or other popup) behind an expand/collapse mechanism and lets users explore options without committing. |
| **Select element** (`<select>`) | A native `<select>` with `size="1"` maps to `role="combobox"` per HTML-AAM. A custom combobox is appropriate when the native `<select>` cannot achieve the required UX (filtering, autocomplete, multi-column suggestions). |
| **Menu button** (`role="button"` + `role="menu"`) | A menu button triggers a menu of **actions**. A combobox presents **values** to choose from and can display the selected value in the input. Menu buttons cannot be marked `aria-required` and do not expose a value. |
| **Search input** (`role="searchbox"`) | A search box accepts free-form text but does not inherently have a popup of predefined options. If a search box acquires an autocomplete popup, it becomes a combobox. |
| **Autocomplete** (generic concept) | "Autocomplete" describes a behavior, not a widget. A combobox is the ARIA widget that implements autocomplete patterns. Browser-native autocomplete (e.g., saved form values) is not the same as a combobox. |
| **Datalist** (`<input>` + `<datalist>`) | Per HTML-AAM, an `<input>` with a `<datalist>` maps to `role="combobox"` with `aria-controls` pointing to the datalist. However, native datalist has limited styling and behavioral control — most custom combobox implementations replace it entirely. |

---

<a id="variants"></a>
## 2. Variants

### Select-only combobox

The input does **not** accept typed text. The user opens a popup and picks a value — functionally similar to a native `<select>` element. The combobox element displays the current value but is not editable. Type-ahead is supported: typing characters moves focus to matching options.

### Editable combobox — no autocomplete

The input accepts arbitrary text. When the popup is triggered, it presents suggested values that are the **same regardless of what the user types** (e.g., recent entries). The user's typed text becomes the value unless they explicitly select a suggestion. Set `aria-autocomplete="none"`.

### Editable combobox — list autocomplete with manual selection

The popup presents values that **filter or correspond to the typed text**. No suggestion is automatically selected — the user must explicitly choose one, or their typed text becomes the value. Set `aria-autocomplete="list"`.

### Editable combobox — list autocomplete with automatic selection

Like list autocomplete, but the **first matching suggestion is automatically highlighted as selected**. If the user leaves the field without choosing a different suggestion, the automatically selected value is accepted. Set `aria-autocomplete="list"` (the automatic selection behavior is a UX decision, not a separate `aria-autocomplete` value).

### Editable combobox — list with inline autocomplete

Same as automatic selection, plus the **completion string appears inline** in the input after the cursor, visually highlighted and selected. The inline text is the portion of the suggestion not yet typed. Set `aria-autocomplete="both"`.

### Popup types

| Popup type | Role | Use case | `aria-haspopup` value |
|---|---|---|---|
| **Listbox** | `listbox` | Flat list of options (most common) | Omit (implicit default for combobox is `listbox`) |
| **Grid** | `grid` | Multi-column suggestions (e.g., name + description) | `grid` |
| **Tree** | `tree` | Hierarchical/categorized suggestions | `tree` |
| **Dialog** | `dialog` | Complex selection UI (e.g., date picker with calendar) | `dialog` |

### Behavioral comparison

| Behavior | Select-only | Editable (no autocomplete) | Editable (list) | Editable (both/inline) |
|---|---|---|---|---|
| User can type text | No | Yes | Yes | Yes |
| Popup content filters on input | No | No | Yes | Yes |
| Suggestion auto-selected | N/A | No | Optional | Yes |
| Inline completion string | No | No | No | Yes |
| `aria-autocomplete` value | `none` or omit | `none` | `list` | `both` |
| Typed text can be the value | No (must select) | Yes | Yes | Yes (but auto-selection may override) |

---

<a id="anatomy"></a>
## 3. Anatomy & markup

### Required structure

```
combobox container (wrapper div — no ARIA role needed)
├── label
├── input element (role="combobox")
│   ├── aria-expanded="true|false"
│   ├── aria-controls="[popup-id]"
│   ├── aria-activedescendant="[active-option-id]" (when popup is open and option is active)
│   ├── aria-autocomplete="none|list|both" (for editable comboboxes)
│   └── aria-haspopup="grid|tree|dialog" (only if popup is NOT a listbox)
├── optional open button (role="button", not in tab order)
└── popup element (role="listbox|grid|tree|dialog")
    ├── option 1 (role="option")
    │   └── aria-selected="true|false"
    ├── option 2 ...
    └── ...
```

### Editable combobox with listbox popup (HTML example)

```html
<label for="city-input">City</label>
<div class="combobox-wrapper">
  <input type="text"
         id="city-input"
         role="combobox"
         aria-expanded="false"
         aria-controls="city-listbox"
         aria-autocomplete="list"
         aria-activedescendant="">
  <button type="button"
          tabindex="-1"
          aria-label="Show city suggestions"
          aria-expanded="false">
    ▼
  </button>
  <ul id="city-listbox"
      role="listbox"
      aria-label="City suggestions"
      hidden>
    <li id="city-opt-1" role="option">Amsterdam</li>
    <li id="city-opt-2" role="option">Berlin</li>
    <li id="city-opt-3" role="option">Copenhagen</li>
  </ul>
</div>
```

### Select-only combobox (HTML example)

```html
<label id="color-label">Favorite color</label>
<div class="combobox-wrapper">
  <div id="color-combobox"
       role="combobox"
       tabindex="0"
       aria-expanded="false"
       aria-controls="color-listbox"
       aria-haspopup="listbox"
       aria-labelledby="color-label">
    Select a color
  </div>
  <ul id="color-listbox"
      role="listbox"
      aria-labelledby="color-label"
      hidden>
    <li id="color-opt-1" role="option" aria-selected="true">Red</li>
    <li id="color-opt-2" role="option">Green</li>
    <li id="color-opt-3" role="option">Blue</li>
  </ul>
</div>
```

For a select-only combobox, the combobox element is typically a `<div>` with `tabindex="0"` because there is no text input. Its text content displays the currently selected value. Type-ahead characters move visual focus within the popup.

### Attribute breakdown

| Attribute | Element | Purpose |
|---|---|---|
| `role="combobox"` | Input element | Identifies the widget as a combobox. In the ARIA 1.2 model, this goes directly on the input (or the display-only element for select-only). |
| `aria-expanded` | Combobox element | **Required.** `"true"` when the popup is visible, `"false"` when collapsed. Must update on every open/close. |
| `aria-controls` | Combobox element | **Required.** References the `id` of the popup element. Tells AT which element the combobox controls. Valid to set even when the popup is hidden. |
| `aria-activedescendant` | Combobox element | References the `id` of the currently active option in the popup. DOM focus stays on the combobox; AT focus follows `aria-activedescendant`. Set to `""` or remove when no option is active. |
| `aria-autocomplete` | Combobox element | Describes the autocomplete behavior: `"none"` (no filtering), `"list"` (filtered list), `"both"` (filtered list with inline completion). Omit for select-only. |
| `aria-haspopup` | Combobox element | Indicates the popup type. Combobox has an implicit value of `"listbox"`, so only set this when the popup is a `grid`, `tree`, or `dialog`. |
| `aria-labelledby` / `aria-label` | Combobox element | Provides the accessible name. For editable comboboxes using `<input>`, prefer `<label for="...">`. |
| `aria-required` | Combobox element | Indicates the field must have a value before form submission. |
| `aria-invalid` | Combobox element | Indicates validation failure. Use with `aria-describedby` or `aria-errormessage` pointing to error text. |
| `role="listbox"` | Popup element | Identifies the popup as a list of selectable options (most common popup type). |
| `role="option"` | Each option | Identifies an item in the listbox. Must be owned by the listbox. |
| `aria-selected` | Option element | `"true"` on the visually indicated/active option. Selection follows focus in the popup — the option referenced by `aria-activedescendant` should have `aria-selected="true"`. |
| `hidden` | Popup element | Hides the collapsed popup from both visual rendering and the accessibility tree. Alternatives: `display: none`. |

### The open/toggle button

An optional graphical button (▼ chevron) adjacent to the input can toggle the popup. Per the APG:

- It should have `role="button"` (or be a `<button>`)
- It must be focusable but **not** in the page Tab sequence (`tabindex="-1"`)
- It must **not** be a descendant of the combobox element
- It should mirror the combobox's `aria-expanded` state for visual consistency
- It should have an accessible name (e.g., `aria-label="Show suggestions"`)

---

<a id="keyboard"></a>
## 4. Keyboard interaction

### Tab behavior

The combobox is a **single tab stop** in the page. The popup, the popup's options, and the optional open button are all excluded from the page Tab sequence.

### Combobox keys (focus on the input)

| Key | Behavior |
|---|---|
| **Down Arrow** | If popup is available, opens it and moves focus into the popup. If autocomplete auto-selected a suggestion, focus moves to the suggestion *after* the auto-selected one. Otherwise, focus goes to the first option. |
| **Up Arrow** (optional) | If popup is available, opens it and places focus on the last option. |
| **Alt + Down Arrow** (optional) | Opens the popup without moving focus into it. Focus stays on the combobox. |
| **Alt + Up Arrow** (optional) | If popup is open: returns focus to combobox (if focus was in popup) and closes the popup. |
| **Enter** | If an autocomplete suggestion is selected in the popup, accepts it — places the value in the input and closes the popup. If no suggestion is selected, may submit the form (default behavior). |
| **Escape** | Closes the popup if visible. Optionally clears the input if the popup was already hidden. |
| **Printable characters** | Editable: types into the input. Select-only: moves focus to the option starting with the typed character(s) (type-ahead). |
| **Standard text editing keys** | Editable comboboxes support all platform text-editing keys (Home, End, Ctrl+A, etc.). Do not intercept these with JavaScript. |

### Listbox popup keys (focus in popup via `aria-activedescendant`)

DOM focus remains on the combobox. The visual/AT focus moves within the popup via `aria-activedescendant`.

| Key | Behavior |
|---|---|
| **Down Arrow** | Moves to the next option. On the last option: returns to combobox or does nothing. |
| **Up Arrow** | Moves to the previous option. On the first option: returns to combobox or does nothing. |
| **Enter** | Accepts the focused option: closes popup, places value in combobox, moves cursor to end of value. |
| **Escape** | Closes popup, returns focus to combobox. Optionally clears combobox content. |
| **Right Arrow** | Editable: returns focus to combobox, moves text cursor one character right. Select-only: no action. |
| **Left Arrow** | Editable: returns focus to combobox, moves text cursor one character left. Select-only: no action. |
| **Home** (optional) | Moves to first option, or (editable) returns focus to combobox and places cursor at start. |
| **End** (optional) | Moves to last option, or (editable) returns focus to combobox and places cursor at end. |
| **Printable characters** | Editable: returns focus to combobox and types the character. Select-only: moves to next option starting with that character. |
| **Backspace** (optional) | Editable: returns focus to combobox and deletes the character before the cursor. |

### Grid popup keys

When the popup is a grid, navigation uses both horizontal and vertical arrows:

| Key | Behavior |
|---|---|
| **Right/Left Arrow** | Moves focus one cell horizontally. May wrap between rows. |
| **Down/Up Arrow** | Moves focus one cell vertically. |
| **Page Down/Up** (optional) | Moves focus down/up a page of rows. |
| **Ctrl+Home/End** (optional) | Moves to the first/last row. |

### Tree popup keys

When the popup is a tree:

| Key | Behavior |
|---|---|
| **Right Arrow** | Opens a closed node; moves to first child of an open node; does nothing on an end node. |
| **Left Arrow** | Closes an open node; moves to parent of a closed/end node. |
| **Down/Up Arrow** | Moves to next/previous visible node. |
| **Home/End** | Moves to first/last visible node. |

### Dialog popup keys

When the popup is a dialog, it follows the modal dialog keyboard pattern. DOM focus actually **moves into the dialog** (unlike other popup types which use `aria-activedescendant`). The dialog handles its own keyboard interaction.

### Select-only type-ahead

In a select-only combobox, typing characters performs type-ahead:

- A single character moves focus to the next option starting with that character
- Typing multiple characters quickly matches against option text prefixes
- Type-ahead works both when the popup is open and when it is closed (updating the displayed value)

---

<a id="state-management"></a>
## 5. State management

### Popup open/close transitions

**Opening the popup:**
```
User presses Down Arrow (or clicks open button, or types in editable combobox):
  1. aria-expanded: "false" → "true"
  2. Popup: hidden → visible
  3. If applicable: aria-activedescendant set to first/matching option
  4. Focused option: aria-selected → "true"
```

**Closing the popup (Escape or selection):**
```
User presses Escape or selects an option:
  1. aria-expanded: "true" → "false"
  2. Popup: visible → hidden
  3. aria-activedescendant: cleared (set to "" or removed)
  4. If option was selected: combobox value updated
```

### `aria-activedescendant` tracking

DOM focus **always stays on the combobox element**. The `aria-activedescendant` attribute on the combobox references the `id` of the currently highlighted option in the popup. As the user arrows through options:

1. Previous option: `aria-selected="false"`
2. `aria-activedescendant` updates to new option's `id`
3. New option: `aria-selected="true"`

When no option is active (popup closed, or user returns focus to combobox text), `aria-activedescendant` should be set to `""` or removed entirely.

**Exception:** Dialog popups do not use `aria-activedescendant`. DOM focus moves into the dialog.

### Filter state (editable comboboxes with autocomplete)

As the user types:

1. The option list filters to match the typed text
2. Options that no longer match are removed or hidden
3. If autocomplete has automatic selection, the first match gets `aria-selected="true"` and `aria-activedescendant` points to it
4. If no options match, the popup may close or show a "no results" message
5. A live region should announce the number of available results (see Screen reader expectations)

### Inline autocomplete state (`aria-autocomplete="both"`)

When the first matching suggestion is auto-selected:

1. The completion string (untyped portion) is inserted after the cursor in the input
2. The completion string is **text-selected** (highlighted) so the next keystroke replaces it
3. The input's value includes both the user's text and the completion string
4. `aria-activedescendant` points to the matching option

### Selected value

When the user accepts a suggestion (Enter or click):

1. The combobox value updates to the selected option's text
2. The popup closes (`aria-expanded="false"`)
3. `aria-activedescendant` is cleared
4. For editable comboboxes, the cursor is placed at the end of the value
5. Focus remains on the combobox

---

<a id="screen-reader"></a>
## 6. Screen reader expectations

### When focus lands on the combobox

The screen reader should convey:

1. **Accessible name** — the label text
2. **Role** — "combo box" or "combobox"
3. **Value** — the current input value (if any)
4. **State** — "expanded" or "collapsed"
5. **Editable** — whether the user can type into it

Example announcements by screen reader:
- NVDA: *"City, combo box, editable, collapsed, blank"*
- JAWS: *"City, combo box, edit, type in text"*
- VoiceOver (macOS): *"City, combo box, text field"*

### When the popup opens

Screen readers typically announce the expanded state change and may announce available options or the number of suggestions.

### When navigating options via `aria-activedescendant`

As `aria-activedescendant` changes, the screen reader announces:

1. **Option text** — the content of the newly focused option
2. **Selected state** — "selected" if `aria-selected="true"`
3. **Position** — some screen readers announce "N of M" (e.g., "3 of 10")

Example: *"Berlin, selected, 2 of 3"*

### When an option is accepted

The screen reader announces the new value in the combobox after the popup closes.

### Announcing filtered results count

When the option list filters as the user types, screen reader users have no visual cue for the number of remaining matches. Use an `aria-live="polite"` region to announce the count:

```html
<div aria-live="polite" aria-atomic="true" class="visually-hidden">
  3 suggestions available.
</div>
```

Update this region as the filter changes. Use debouncing to avoid excessive announcements during rapid typing.

### Screen reader differences

| Behavior | NVDA | JAWS | VoiceOver (macOS) | VoiceOver (iOS) | TalkBack |
|---|---|---|---|---|---|
| Announces role | "combo box" | "combo box, edit" | "combo box" | "combo box" | "combo box" |
| Announces editable | "editable" | "type in text" | Implied by "text field" | Implied | "editable" |
| Announces expanded/collapsed | Yes | Yes | Yes | Yes | Yes |
| Announces current value | Yes | Yes | Yes | Yes | Yes |
| Reads `aria-activedescendant` changes | Yes | Yes | Yes | Yes | Yes |
| Announces option position (N of M) | Yes (if `aria-setsize`/`aria-posinset` present) | Yes | Sometimes | Sometimes | Varies |

### AT support status

Per a11ysupport.io, the combobox role has **supported** status across all major screen readers (JAWS, NVDA, VoiceOver, TalkBack, Narrator) for conveying name, role, editable state, value changes, and current value. However, critical nuances exist:

- **`aria-activedescendant`**: Broadly supported and the **most reliable** way to convey which option is visually focused. Always use this for combobox option navigation.
- **`aria-autocomplete`**: **Near-zero practical support — only 11/55 MUST expectations pass (20%) on a11ysupport.io.** Setting `aria-autocomplete="list"` or `"both"` has no effect in most screen readers. JAWS may announce it, but NVDA, VoiceOver, TalkBack, and Narrator effectively ignore it. **Always use an `aria-live="polite"` region** to announce result count (e.g., "3 suggestions available") — this is the only reliable way to communicate filtering behavior.
- **`aria-controls`**: Only JAWS supports navigation via `aria-controls` (9/41 MUST pass on a11ysupport.io). Keep it for spec compliance, but ensure the popup is immediately after the input in DOM order so users can reach it naturally.
- **Select-only combobox**: Some screen readers may not clearly distinguish it from a native `<select>`. This is generally acceptable since the interaction model is similar.
- **Grid/tree popups**: Less commonly tested by AT. Stick to listbox popups unless there is a strong UX reason.
- **ARIA version confusion**: The combobox pattern changed significantly across ARIA 1.0, 1.1, and 1.2. Use the ARIA 1.2 pattern: `role="combobox"` on the `<input>` element (not a wrapper div), linked to the popup via `aria-controls`. Code using the old 1.0 wrapper pattern should be flagged as deprecated.

---

<a id="implementation"></a>
## 7. Implementation guide

### Native `<datalist>` — limitations

```html
<label for="browser">Browser:</label>
<input list="browsers" id="browser" name="browser">
<datalist id="browsers">
  <option value="Chrome">
  <option value="Firefox">
  <option value="Safari">
</datalist>
```

Per HTML-AAM, an `<input>` with a `<datalist>` maps to `role="combobox"`. However, native datalist has severe limitations:

- **No styling control** — the dropdown appearance is browser-defined and cannot be customized
- **Inconsistent behavior** — filtering, matching, and display differ across browsers
- **No "no results" feedback** — the list silently disappears when nothing matches
- **No option grouping** — cannot use `<optgroup>` or rich option content
- **No keyboard customization** — browser handles all keyboard interaction
- **Mobile inconsistencies** — some mobile browsers ignore `<datalist>` entirely

For anything beyond the simplest autocomplete, build a custom combobox.

### Step-by-step implementation

1. **Label**: Associate a `<label>` with the input via `for`/`id`
2. **Input**: Add `role="combobox"`, `aria-expanded="false"`, `aria-controls="[popup-id]"` to the input
3. **Popup**: Create the popup element with `role="listbox"` (or `grid`/`tree`/`dialog`) and matching `id`; hide it initially with `hidden` or `display: none`
4. **Options**: Each option gets `role="option"` and a unique `id`
5. **Open logic**: On trigger (Down Arrow, click, typing), show the popup, set `aria-expanded="true"`, set `aria-activedescendant` to the first relevant option, set that option's `aria-selected="true"`
6. **Navigate**: On arrow keys, update `aria-activedescendant` and `aria-selected` to track the active option
7. **Select**: On Enter, copy the option's value to the input, close the popup
8. **Close**: On Escape, close the popup without changing the value, clear `aria-activedescendant`
9. **Filter** (if editable with autocomplete): On each keystroke, filter options, update result count in a live region
10. **Click outside**: Close the popup when focus leaves the combobox

### Filtering logic

For editable comboboxes with `aria-autocomplete="list"` or `"both"`:

- Filter options by matching the typed string against option text (case-insensitive)
- Decide between "starts with" or "contains" matching based on UX needs
- Hide non-matching options (remove from DOM or set `hidden`)
- Update `aria-setsize` and `aria-posinset` on visible options if you use them
- Announce the result count via `aria-live` region
- If no results match, optionally show a non-selectable "No results found" message (not `role="option"`)

### Live region for result count

```html
<div class="visually-hidden"
     aria-live="polite"
     aria-atomic="true"
     id="combo-status">
</div>
```

Update on filter change (debounced):
```
"5 suggestions available"
"No suggestions available"
"1 suggestion available"
```

This is critical for screen reader users who cannot see the popup updating.

### Focus management with `aria-activedescendant`

DOM focus never leaves the combobox input. This is essential because:

- It allows the user to continue typing while browsing options
- It avoids complex focus-trapping logic
- It keeps the text cursor position intact

The `aria-activedescendant` approach works for listbox, grid, and tree popups. For dialog popups, DOM focus must actually move into the dialog (since dialogs require focus trapping).

### Framework-specific notes

| Framework | Component | Notes |
|---|---|---|
| **Radix UI** | `Combobox` | Built on ARIA 1.2 pattern. Verify `aria-activedescendant` updates and live region for result count. |
| **Headless UI** | `Combobox` | Good ARIA compliance. Check that select-only variant is handled if needed. |
| **MUI** | `Autocomplete` | Maps to combobox pattern. Includes `aria-autocomplete`, live region. Test with screen readers — some older versions had `aria-owns` instead of `aria-controls`. |
| **Downshift** | `useCombobox`, `useSelect` | Hooks-based, gives full control. `useSelect` for select-only, `useCombobox` for editable. Extensively tested with AT. |
| **React Aria** | `useComboBox` | Adobe's hooks. Solid ARIA spec compliance. Includes virtual focus management and live announcements. |

When using any library:

- Verify `role="combobox"` is on the input element (not a wrapper)
- Test that `aria-expanded` toggles correctly
- Confirm `aria-activedescendant` updates match visual highlighting
- Check for a live region announcing filtered result counts
- Test on mobile — touch interaction with comboboxes often has library-specific issues

### Mobile considerations

- On iOS, VoiceOver users interact differently: double-tap to activate, swipe to navigate options
- On Android, TalkBack uses explore-by-touch; the popup must be positioned where the user can reach it
- Virtual keyboards may change layout when the combobox receives focus — ensure the popup does not get hidden behind the keyboard
- Some mobile browsers do not support `aria-activedescendant` reliably; test thoroughly
- Consider using `role="dialog"` for the popup on mobile if the listbox approach has AT issues

---

<a id="common-mistakes"></a>
## 8. Common mistakes

### Using the ARIA 1.0 or 1.1 combobox model

**Problem**: `role="combobox"` is placed on a wrapper `<div>` containing a separate textbox and listbox (ARIA 1.1), or `aria-owns` is used instead of `aria-controls` (ARIA 1.0). These patterns are deprecated and were never broadly supported by assistive technologies.

**Fix**: Use the ARIA 1.2 model — place `role="combobox"` directly on the input element. Use `aria-controls` to reference the popup.

### Missing `aria-activedescendant` updates

**Problem**: The user arrows through options in the popup, the visual highlight moves, but `aria-activedescendant` on the combobox is not updated. Screen reader users hear nothing as they navigate.

**Fix**: Update `aria-activedescendant` on the combobox element every time the active option changes. Simultaneously update `aria-selected` on the options.

### No results announcement

**Problem**: As the user types in an editable combobox with autocomplete, the options filter down and eventually show zero results. Sighted users see the popup shrink or disappear; screen reader users get no feedback.

**Fix**: Add an `aria-live="polite"` region that announces the count of available suggestions whenever the filtered list changes. Debounce updates to avoid chattiness.

### Popup options not hidden from the accessibility tree when closed

**Problem**: The popup is visually hidden with `opacity: 0` or `transform: scale(0)` but remains in the accessibility tree. Screen reader users can navigate to "invisible" options.

**Fix**: Use `hidden`, `display: none`, or `visibility: hidden` to hide the popup. These remove it from both visual rendering and the accessibility tree. If CSS animation is needed, toggle `display: none` after the animation completes.

### Missing `aria-expanded`

**Problem**: The combobox element does not have `aria-expanded`, or it is not updated when the popup opens/closes. Screen reader users cannot tell whether the popup is visible.

**Fix**: Always set `aria-expanded="false"` initially and toggle it to `"true"` when the popup is shown. This is a **required** attribute for the combobox role.

### `aria-controls` pointing to a nonexistent element

**Problem**: The popup is rendered conditionally (e.g., React portal) and may not exist in the DOM when the combobox is first rendered. `aria-controls` references an `id` that does not exist.

**Fix**: Either keep the popup in the DOM but hidden (`hidden` attribute), or set `aria-controls` only when the popup is rendered. Both approaches are valid per the spec.

### Open button is in the tab order

**Problem**: The chevron/arrow button next to the combobox input has `tabindex="0"` or is a native `<button>` without `tabindex="-1"`. Users must tab through it as a separate stop.

**Fix**: Set `tabindex="-1"` on the open button. The combobox should be a single tab stop. The button is operable by click/touch but not via Tab.

### Select-only combobox missing keyboard support

**Problem**: A select-only combobox opens on click but does not respond to Down Arrow, Enter, Escape, or type-ahead characters. Keyboard-only users are locked out.

**Fix**: Implement the full keyboard interaction specified by the APG: Down Arrow opens the popup and moves to first option, Enter selects, Escape closes, printable characters perform type-ahead.

### Focus moves into the popup (for non-dialog popups)

**Problem**: When the user opens a listbox/grid/tree popup, DOM focus moves from the combobox into the popup. This breaks the `aria-activedescendant` model and may prevent the user from typing in editable comboboxes.

**Fix**: DOM focus must stay on the combobox element. Use `aria-activedescendant` to manage AT focus within the popup. Only dialog popups should receive DOM focus.

### Mobile touch targets are too small or popup is inaccessible

**Problem**: The combobox and its options have tiny touch targets. On mobile, the popup may be positioned off-screen or behind the virtual keyboard.

**Fix**: Ensure touch targets are at least 44×44 CSS pixels. Position the popup so it remains visible when the virtual keyboard is open. Test with VoiceOver and TalkBack.

---

<a id="acceptance-criteria"></a>
## 9. Acceptance criteria

Concise, verifiable checks for auditing a combobox implementation. Each criterion includes its severity.

### Structure

| # | Criterion | Severity |
|---|---|---|
| S1 | The input element has `role="combobox"` (explicit for custom, implicit when using `<input>` with `<datalist>`). | Critical |
| S2 | The combobox has a non-empty accessible name (via `<label>`, `aria-label`, or `aria-labelledby`). | Critical |
| S3 | The combobox has `aria-expanded="true"` when the popup is visible and `"false"` when hidden. | Critical |
| S4 | The combobox has `aria-controls` referencing the popup element's `id`. | Critical |
| S5 | The popup element has the correct role: `listbox`, `grid`, `tree`, or `dialog`. | Critical |
| S6 | If the popup role is not `listbox`, `aria-haspopup` on the combobox is set to the matching value (`grid`, `tree`, or `dialog`). | Critical |
| S7 | Each option in a listbox popup has `role="option"` and a unique `id`. | Critical |
| S8 | The visual state of the popup (visible/hidden) matches `aria-expanded` at all times. | Critical |
| S9 | The collapsed popup is hidden from the accessibility tree (via `hidden`, `display: none`, or equivalent). | Critical |
| S10 | The combobox element is labeled using `<label>`, `aria-label`, or `aria-labelledby`. | Critical |

### Keyboard

| # | Criterion | Severity |
|---|---|---|
| K1 | The combobox is reachable via Tab as a single tab stop. | Critical |
| K2 | Down Arrow opens the popup (if closed) and moves active focus to the first option. | Critical |
| K3 | Up/Down Arrow in the popup moves active focus between options. | Critical |
| K4 | Enter on an active option accepts the value, closes the popup, and places focus on the combobox. | Critical |
| K5 | Escape closes the popup without changing the committed value and returns focus to the combobox. | Critical |
| K6 | The popup, its options, and the optional open button are **not** in the page Tab sequence. | Critical |
| K7 | In editable comboboxes, typing characters enters text into the input (not intercepted by popup navigation). | Critical |
| K8 | Left/Right Arrow in the popup (editable combobox) returns focus to the input and moves the text cursor. | Major |
| K9 | Alt+Down Arrow opens the popup without moving focus into it. | Minor |
| K10 | Alt+Up Arrow closes the popup and returns focus to the combobox. | Minor |

### Screen reader

| # | Criterion | Severity |
|---|---|---|
| SR1 | When focus lands on the combobox, the screen reader announces: accessible name, role ("combo box"), current value, and expanded/collapsed state. | Critical |
| SR2 | Navigating options with arrow keys triggers option text announcements via `aria-activedescendant`. | Critical |
| SR3 | Accepting an option triggers an announcement of the new combobox value. | Critical |
| SR4 | The expanded/collapsed state change is announced when the popup opens or closes. | Critical |
| SR5 | A live region announces the number of filtered results when the list changes (editable combobox with autocomplete). | Major |
| SR6 | Editable comboboxes are announced as editable so the user knows they can type. | Major |
| SR7 | If the combobox is required (`aria-required="true"`), the required state is announced. | Major |
| SR8 | If the combobox is invalid (`aria-invalid="true"`), the invalid state and associated error message are announced. | Major |

### Select-only specific

| # | Criterion | Severity |
|---|---|---|
| SO1 | Typing printable characters performs type-ahead — focus moves to the first option starting with the typed character(s). | Critical |
| SO2 | The combobox displays the currently selected value as its text content. | Critical |
| SO3 | Down Arrow opens the popup and highlights the first or currently selected option. | Critical |
| SO4 | The combobox element is focusable (`tabindex="0"` if not a native focusable element). | Critical |
| SO5 | Closing the popup without selecting retains the previously committed value. | Major |

### Editable specific

| # | Criterion | Severity |
|---|---|---|
| ED1 | The `aria-autocomplete` attribute is set to the correct value (`"none"`, `"list"`, or `"both"`). | Critical |
| ED2 | For list autocomplete: the popup filters options to match the typed text. | Critical |
| ED3 | For inline autocomplete (`aria-autocomplete="both"`): the completion string appears inline after the cursor, is visually highlighted, and is text-selected. | Major |
| ED4 | Standard text editing keys (Home, End, Select All, etc.) work in the input and are not intercepted by the combobox. | Critical |
| ED5 | Typing in the combobox while the popup is open updates the filter without closing the popup. | Major |

### Autocomplete

| # | Criterion | Severity |
|---|---|---|
| AC1 | When the popup filters and the result count changes, a live region announces the count (e.g., "5 suggestions available"). | Major |
| AC2 | When no results match, the user is informed ("No suggestions available" via live region or a visible non-selectable message). | Major |
| AC3 | Automatic selection (if implemented) highlights the first matching option and updates `aria-activedescendant`. | Major |
| AC4 | The inline completion string (if present) is replaced when the user types the next character. | Major |
| AC5 | Selecting an option with autocomplete places the full option text in the input and moves the cursor to the end. | Critical |

### Edge cases

| # | Criterion | Severity |
|---|---|---|
| E1 | Dynamically loaded options (e.g., from an API) are announced via the live region when they arrive. | Major |
| E2 | If a combobox is inside a form, Enter does not submit the form while the popup is open and an option is focused — it selects the option instead. | Critical |
| E3 | Clicking outside the combobox closes the popup and does not leave stale ARIA state (`aria-expanded` must be `"false"`, `aria-activedescendant` must be cleared). | Critical |
| E4 | The combobox works correctly in a dialog/modal — focus trapping does not interfere with popup interaction. | Major |
| E5 | On mobile devices, the popup is positioned within the viewport and accessible via touch/swipe gestures. | Major |
| E6 | Multiple comboboxes on the same page operate independently — opening one does not interfere with another. | Critical |
| E7 | The combobox functions correctly when options are grouped (e.g., `role="group"` within the listbox with `aria-label` on each group). | Minor |
| E8 | Grid and tree popups follow their respective pattern's keyboard interaction in addition to the combobox keys. | Major |
| E9 | Dialog popups move DOM focus into the dialog and trap focus per the modal dialog pattern. | Critical |
| E10 | When the combobox is disabled (`aria-disabled="true"`), the popup cannot be opened and the combobox is announced as disabled. | Major |
