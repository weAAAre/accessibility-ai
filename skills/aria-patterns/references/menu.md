# Menu and Menubar Pattern

Source: [WAI-ARIA APG — Menu and Menubar Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/)

## Table of Contents

1. [Identity: what is (and isn't) a menu](#identity)
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
## 1. Identity: what is (and isn't) a menu

A **menu** is a widget that offers a list of choices to the user, such as a set of actions or functions. Menu widgets behave like native operating system menus — the pull-down menus found at the top of desktop application windows or the context menus triggered by a right-click. A **menubar** is a visually persistent, typically horizontal container of top-level menu items that each may open a submenu.

> **Critical distinction**: `role="menu"` and `role="menubar"` are for **application-style menus** — command palettes, editor toolbars, context menus, desktop-app-like chrome. They are **NOT** for website navigation. Site navigation uses `<nav>` with lists of links. This is the single most common misuse of ARIA menu roles and the source of most menu-related accessibility bugs in the wild.

### Essential characteristics

A component is an ARIA menu when all of these are true:

- It presents a **list of actionable choices** (commands, functions, settings) — not navigation links
- Items have roles `menuitem`, `menuitemcheckbox`, or `menuitemradio`
- It uses **arrow key navigation** between items (not Tab)
- It is a **composite widget**: Tab moves focus into/out of the entire menu, arrow keys navigate within
- It opens from a **trigger** (menu button, parent menuitem, or keyboard shortcut) and typically closes after an item is activated

### Distinguishing from similar patterns

| Component | Key difference |
|---|---|
| **Navigation (`<nav>` + links)** | Navigation presents links for moving between pages/sections. Uses `<nav>` landmark with `<ul>`/`<li>`/`<a>`. Users navigate with Tab between links. `role="menu"` must **never** be used for site navigation — it changes keyboard behavior (arrow keys instead of Tab) and triggers screen readers to enter a special "menu interaction mode" that confuses users expecting standard link navigation. |
| **Listbox** (`role="listbox"`) | A listbox allows selecting one or more options from a static list — it's a form control for data input. Menus present actions/commands. Listbox uses `aria-selected`; menu uses activation (Enter/Space). |
| **Disclosure** (`<details>`/`<summary>` or button + `aria-expanded`) | A disclosure shows/hides content. A menu button + menu may look similar visually, but the menu contains actionable items with `menuitem` roles and arrow-key navigation, not arbitrary content. If the popup contains links, forms, or mixed content, use disclosure — not menu. |
| **Toolbar** (`role="toolbar"`) | A toolbar groups controls (buttons, toggles, dropdowns) in a horizontal or vertical strip. Items are heterogeneous (buttons, checkboxes, menu buttons). A menubar's items are homogeneous menu items that open submenus. Toolbars and menubars share arrow-key navigation but differ in semantics and item roles. |
| **Combobox** (`role="combobox"`) | A combobox combines a text input with a popup list for filtering/selecting. The popup is typically a `listbox`, not a `menu`. Different interaction model (typing filters the list). |

**Rule of thumb**: if the user is choosing an **action to perform** (like Cut, Copy, Paste, or toggling a setting), it may be a menu. If the user is **navigating to a page**, use `<nav>` with links. If the user is **selecting a value for a form field**, use a listbox or combobox.

---

<a id="variants"></a>
## 2. Variants

### Standalone menu (dropdown menu)

A non-persistent popup opened by a **menu button**. The button has `aria-haspopup="true"` (or `"menu"`) and `aria-expanded`. When the user activates the button, the menu appears; focus moves to the first item. After an item is activated or Escape is pressed, the menu closes and focus returns to the button.

This is the most common variant — action menus, context menus, "more options" menus.

### Menubar

A visually persistent, typically horizontal bar of top-level menu items. Each top-level item may open a vertical submenu. Menubars mimic desktop application menu bars (File, Edit, View, Help). The entire menubar is a single Tab stop — arrow keys navigate between top-level items and into submenus.

`role="menubar"` has a default `aria-orientation` of `horizontal`. Top-level items use Left/Right Arrow; submenus use Up/Down Arrow.

### Submenus

A submenu is a `role="menu"` element nested inside another menu or menubar, opened from a parent `menuitem`. The parent menuitem has `aria-haspopup="true"` and `aria-expanded`. Submenus can nest to multiple levels, though deep nesting harms usability.

### Item types

| Role | Purpose | State attribute | Example |
|---|---|---|---|
| `menuitem` | A standard action or command | (none — activated, not toggled) | "Cut", "Paste", "Open file…" |
| `menuitemcheckbox` | A toggleable option (on/off) | `aria-checked="true"` or `"false"` | "Word Wrap", "Show Toolbar" |
| `menuitemradio` | A mutually exclusive choice within a group | `aria-checked="true"` or `"false"` | "Sort by Name" / "Sort by Date" / "Sort by Size" |

### Behavioral comparison

| Behavior | Standalone menu | Menubar | Submenu |
|---|---|---|---|
| Trigger | Menu button | Always visible (Tab stop) | Parent menuitem |
| Orientation | Vertical (default) | Horizontal (default) | Vertical (default) |
| Persistence | Transient (opens/closes) | Persistent | Transient |
| Top-level navigation keys | Up/Down Arrow | Left/Right Arrow | Up/Down Arrow |
| Tab behavior | Tab closes menu, moves focus out | Tab moves focus out of menubar | Tab closes all menus |
| `aria-orientation` default | `vertical` | `horizontal` | `vertical` |

### Separator

Items in a menu may be divided into groups by an element with `role="separator"`. Separators are not focusable or interactive. Use separators to visually and semantically group related `menuitemradio` elements or to separate categories of commands.

---

<a id="anatomy"></a>
## 3. Anatomy & markup

### Standalone menu with menu button

```
button (trigger)
├── aria-haspopup="true" or "menu"
├── aria-expanded="true|false"
└── aria-controls="[menu-id]" (optional)

menu (popup)
├── role="menu"
├── aria-labelledby="[button-id]" or aria-label
├── menuitem
├── menuitem
├── separator
├── menuitemcheckbox (aria-checked)
└── menuitemradio (aria-checked)
```

### HTML example — standalone menu

```html
<button id="actions-btn"
        aria-haspopup="true"
        aria-expanded="false"
        aria-controls="actions-menu">
  Actions ▾
</button>
<ul id="actions-menu"
    role="menu"
    aria-labelledby="actions-btn"
    hidden>
  <li role="menuitem" tabindex="-1">Cut</li>
  <li role="menuitem" tabindex="-1">Copy</li>
  <li role="menuitem" tabindex="-1">Paste</li>
  <li role="separator"></li>
  <li role="menuitem" tabindex="-1">Select all</li>
</ul>
```

### HTML example — menubar with submenus

```html
<ul role="menubar" aria-label="Text editor">
  <!-- Top-level item with submenu -->
  <li role="menuitem"
      aria-haspopup="true"
      aria-expanded="false"
      tabindex="0">
    File
    <ul role="menu" aria-label="File">
      <li role="menuitem" tabindex="-1">New</li>
      <li role="menuitem" tabindex="-1">Open…</li>
      <li role="menuitem" tabindex="-1">Save</li>
      <li role="separator"></li>
      <li role="menuitem" tabindex="-1">Exit</li>
    </ul>
  </li>

  <!-- Top-level item with submenu containing checkbox/radio items -->
  <li role="menuitem"
      aria-haspopup="true"
      aria-expanded="false"
      tabindex="-1">
    View
    <ul role="menu" aria-label="View">
      <li role="menuitemcheckbox"
          aria-checked="true"
          tabindex="-1">
        Word Wrap
      </li>
      <li role="menuitemcheckbox"
          aria-checked="false"
          tabindex="-1">
        Line Numbers
      </li>
      <li role="separator"></li>
      <li role="group" aria-label="Font Size">
        <li role="menuitemradio"
            aria-checked="true"
            tabindex="-1">
          Small
        </li>
        <li role="menuitemradio"
            aria-checked="false"
            tabindex="-1">
          Medium
        </li>
        <li role="menuitemradio"
            aria-checked="false"
            tabindex="-1">
          Large
        </li>
      </li>
    </ul>
  </li>

  <!-- Top-level item without submenu -->
  <li role="menuitem" tabindex="-1">Help</li>
</ul>
```

### Attribute breakdown

| Attribute | Element | Purpose |
|---|---|---|
| `role="menu"` | Menu container | Identifies the element as a menu widget. Implicit `aria-orientation` is `vertical`. Triggers screen readers to enter menu interaction mode. |
| `role="menubar"` | Menubar container | Identifies a persistent horizontal menu. Implicit `aria-orientation` is `horizontal`. Subclass of `menu`. |
| `role="menuitem"` | Menu item | An actionable choice. Can have `aria-haspopup` and `aria-expanded` if it opens a submenu. Name required (from contents or author). |
| `role="menuitemcheckbox"` | Toggleable item | A menu item with a checkable state. Requires `aria-checked`. Values: `"true"`, `"false"`, or `"mixed"`. |
| `role="menuitemradio"` | Exclusive-choice item | A checkable item where only one in its group can be checked. Requires `aria-checked`. Must be grouped (via `role="group"` or within the same `menu`). |
| `aria-haspopup` | Menu button or parent menuitem | Indicates this element opens a popup. Value `"true"` or `"menu"` for menus (both are equivalent per spec — `true` maps to `menu` for backward compatibility). |
| `aria-expanded` | Menu button or parent menuitem | `"true"` when the child menu is visible, `"false"` when hidden. Not set (attribute absent) when the element does not control an expandable region. |
| `aria-checked` | `menuitemcheckbox` / `menuitemradio` | Current checked state. Required on these roles. `"true"`, `"false"`, or `"mixed"` (mixed only on `menuitemcheckbox`). |
| `aria-controls` | Menu button | References the `id` of the controlled `menu`. Optional — support outside JAWS is minimal per a11ysupport.io, but recommended for semantic clarity. |
| `aria-labelledby` / `aria-label` | `menu` or `menubar` | Provides the accessible name. Typically `aria-labelledby` referencing the trigger button for standalone menus, or `aria-label` for menubars. |
| `aria-orientation` | `menu` or `menubar` | Override the default orientation. Menu defaults to `vertical`; menubar defaults to `horizontal`. Set explicitly only when the orientation differs from the default. |
| `aria-disabled` | Any menu item | Marks the item as non-operable. Disabled items remain focusable but cannot be activated. |
| `role="separator"` | Divider between groups | Non-focusable, non-interactive divider. Should have `aria-orientation` consistent with its visual direction. |
| `role="group"` | Container for related `menuitemradio` items | Groups a set of radio items so only one can be checked at a time. Should have `aria-label` or `aria-labelledby`. |
| `tabindex` | Menu items | First item in a menubar: `tabindex="0"`. All other items: `tabindex="-1"`. Focus is managed programmatically via roving tabindex or `aria-activedescendant`. |

### Focus management approaches

The APG describes two approaches for managing focus within a menu:

1. **Roving tabindex**: The currently focused item has `tabindex="0"`; all others have `tabindex="-1"`. On arrow key press, move `tabindex="0"` to the target item and call `element.focus()`.
2. **`aria-activedescendant`**: The menu container has `tabindex="-1"` (or `0`) and `aria-activedescendant` set to the `id` of the visually focused item. The DOM focus stays on the container; the screen reader follows `aria-activedescendant`.

Both are valid. Roving tabindex is more widely supported and simpler to debug. `aria-activedescendant` is useful when the menu container needs to maintain DOM focus (e.g., for keyboard event handling on a single element).

---

<a id="keyboard"></a>
## 4. Keyboard interaction

The following assumes a horizontal menubar with vertical submenus. When orientation is reversed, swap the axis of the arrow keys accordingly.

### Menu button (trigger)

| Key | Behavior |
|---|---|
| **Enter** | Opens the menu, places focus on the first item. |
| **Space** | Opens the menu, places focus on the first item. |
| **Down Arrow** (optional) | Opens the menu, places focus on the first item. |
| **Up Arrow** (optional) | Opens the menu, places focus on the last item. |

### Inside a menu or menubar (after opening)

| Key | Context | Behavior |
|---|---|---|
| **Enter** | On a `menuitem` with a submenu | Opens the submenu, places focus on its first item. |
| **Enter** | On a `menuitem` without a submenu | Activates the item and closes the menu. |
| **Space** | On a `menuitemcheckbox` | Toggles checked state without closing the menu (optional: may close). |
| **Space** | On a `menuitemradio` (unchecked) | Checks this item, unchecks the previously checked item in the group, without closing (optional). |
| **Space** | On a `menuitem` with a submenu | Opens the submenu, places focus on its first item (optional). |
| **Space** | On a `menuitem` without a submenu | Activates the item and closes the menu (optional). |
| **Down Arrow** | In a vertical menu | Moves focus to the next item. Optionally wraps from last to first. |
| **Down Arrow** | On a menubar item with a submenu | Opens the submenu, places focus on the first item. |
| **Up Arrow** | In a vertical menu | Moves focus to the previous item. Optionally wraps from first to last. |
| **Up Arrow** | On a menubar item with a submenu (optional) | Opens the submenu, places focus on the last item. |
| **Right Arrow** | In a menubar | Moves focus to the next top-level item. Optionally wraps. |
| **Right Arrow** | On a `menuitem` with a submenu (in a vertical menu) | Opens the submenu, places focus on its first item. |
| **Right Arrow** | On an item without a submenu (in a vertical menu within a menubar) | Closes the current submenu(s), moves to the next menubar item, and optionally opens that item's submenu. |
| **Left Arrow** | In a menubar | Moves focus to the previous top-level item. Optionally wraps. |
| **Left Arrow** | In a submenu | Closes the submenu, returns focus to the parent menuitem. |
| **Left Arrow** | In a submenu of a menubar item | Closes the submenu, moves to the previous menubar item, and optionally opens that item's submenu. |
| **Home** | In a menu or menubar | Moves focus to the first item (if wrapping is not implemented). |
| **End** | In a menu or menubar | Moves focus to the last item (if wrapping is not implemented). |
| **Escape** | In any menu | Closes the current menu. Focus returns to the trigger (menu button or parent menuitem). If in a submenu, closes only that submenu level. |
| **Tab** / **Shift+Tab** | In a menubar | Moves focus out of the menubar (to the next/previous focusable element on the page). |
| **Tab** / **Shift+Tab** | In a menu (opened from a button) | Closes all menus and moves focus out. |
| **Printable character** (optional) | In a menu | **Type-ahead**: moves focus to the next item whose label starts with that character. If multiple items share the same starting character, cycles through them. |

### Notes on keyboard behavior

1. **Disabled items are focusable** but cannot be activated. Arrow keys do not skip them.
2. **Separators are not focusable**. Arrow keys skip over them.
3. If a menubar receives focus via a keyboard shortcut (e.g., Alt+F10 in a rich text editor), Escape may return focus to the invoking context instead of the previous focus position.
4. When items in a menubar are arranged vertically and submenu items horizontally, the arrow key axes swap accordingly.
5. Tab and Shift+Tab **never** move focus between items within a menu. This is a fundamental behavioral difference from navigation link lists.

### Focus flow on open/close

**Opening a standalone menu:**
```
1. User activates menu button (Enter, Space, or Down Arrow)
2. Menu appears
3. Focus moves to the first menuitem inside the menu
4. Button's aria-expanded → "true"
```

**Opening a submenu:**
```
1. User presses Right Arrow (or Enter) on a parent menuitem
2. Submenu appears
3. Focus moves to the first item in the submenu
4. Parent menuitem's aria-expanded → "true"
```

**Closing via Escape:**
```
1. User presses Escape
2. Current menu closes
3. Focus returns to the trigger (menu button or parent menuitem)
4. Trigger's aria-expanded → "false"
```

**Closing via item activation:**
```
1. User presses Enter on a menuitem (without submenu)
2. The action is performed
3. All open menus close
4. Focus returns to the menu button (or the menubar item)
5. All aria-expanded attributes → "false"
```

---

<a id="state-management"></a>
## 5. State management

### Menu open/close states

The primary state is `aria-expanded` on the trigger element (menu button or parent menuitem).

**Standalone menu:**
```
User activates menu button:
  1. Button: aria-expanded="false" → "true"
  2. Menu: hidden → visible
  3. Focus: button → first menuitem

User presses Escape or activates an item:
  1. Button: aria-expanded="true" → "false"
  2. Menu: visible → hidden
  3. Focus: menuitem → button
```

**Menubar submenu:**
```
User opens submenu from menubar item:
  1. Menubar item: aria-expanded="false" → "true"
  2. Submenu: hidden → visible
  3. Focus: menubar item → first item in submenu

User navigates Right Arrow from one menubar item to the next:
  1. Previous item: aria-expanded="true" → "false"
  2. Previous submenu: visible → hidden
  3. Next item receives focus
  4. If next item has a submenu, it optionally opens:
     Next item: aria-expanded → "true"
     Next submenu: hidden → visible
```

**Nested submenus:**
```
User opens nested submenu (Right Arrow on parent menuitem):
  1. Parent menuitem: aria-expanded="false" → "true"
  2. Nested submenu: hidden → visible
  3. Focus: parent menuitem → first item in nested submenu

User presses Escape in nested submenu:
  1. Only the nested submenu closes
  2. Parent menuitem: aria-expanded="true" → "false"
  3. Focus returns to the parent menuitem
  4. Parent menu remains open
```

### Menuitemcheckbox state transitions

```
Space on unchecked menuitemcheckbox:
  aria-checked: "false" → "true"
  Menu remains open (recommended)

Space on checked menuitemcheckbox:
  aria-checked: "true" → "false"
  Menu remains open (recommended)
```

Checkbox items toggle independently — checking one does not affect others.

### Menuitemradio state transitions

```
Space on unchecked menuitemradio:
  This item: aria-checked: "false" → "true"
  Previously checked item in the same group: aria-checked: "true" → "false"
  Menu remains open (recommended)
```

Only one `menuitemradio` in a group can have `aria-checked="true"` at a time. The group is defined by the nearest ancestor `role="group"`, `role="menu"`, or `role="menubar"`.

### Hiding closed menus

Closed menus must be hidden from both visual rendering and the accessibility tree:

| Technique | Visual | Accessibility tree | Tab order |
|---|---|---|---|
| `hidden` attribute | Hidden | Removed | Skipped |
| `display: none` | Hidden | Removed | Skipped |
| Remove from DOM | Hidden | Removed | Skipped |
| `visibility: hidden` | Hidden (space preserved) | Removed | Skipped |
| `aria-hidden="true"` + visual hiding | Hidden | Removed | **Not skipped** — focus can still land on items |

Use `hidden`, `display: none`, or DOM removal. Avoid `aria-hidden="true"` alone — it removes from the accessibility tree but does not prevent focus, creating ghost focus traps.

---

<a id="screen-reader"></a>
## 6. Screen reader expectations

### When focus lands on a menu button

The screen reader announces:

1. **Accessible name** — the button's text (e.g., "Actions")
2. **Role** — "button"
3. **Has-popup indicator** — "menu" or "has popup" or "pop-up menu" (varies by screen reader)
4. **State** — "collapsed" or "expanded"

Example: *"Actions, button, menu, collapsed"*

### When the menu opens and focus lands on a menuitem

The screen reader announces:

1. **Accessible name** — the item's text (e.g., "Cut")
2. **Role** — "menu item"
3. **Position** — "1 of 5" (item count within the menu)
4. **Menu context** — some screen readers announce the menu name or that the user is inside a menu

Example (NVDA): *"Cut, menu item, 1 of 5"*
Example (JAWS): *"Actions menu, Cut, 1 of 5"*
Example (VoiceOver): *"Cut, menu item, 1 of 5"*

### Menubar announcements

When focus lands on a menubar item:

- JAWS: *"Menu bar, File, submenu"*
- NVDA: *"File, menu item, submenu, 1 of 4"*
- VoiceOver (macOS): *"File, menu bar item, 1 of 4"*

The "submenu" or "has submenu" hint is driven by `aria-haspopup="true"` on the menuitem.

### Menuitemcheckbox and menuitemradio

When focused:
- Checked: *"Word Wrap, menu item checkbox, ticked"* (VoiceOver) / *"Word Wrap, checked"* (JAWS/NVDA)
- Unchecked: *"Line Numbers, menu item checkbox, unticked"* (VoiceOver) / *"Line Numbers, not checked"* (JAWS/NVDA)
- Radio: *"Small, menu item radio, selected"* or *"Small, radio menu item, checked, 1 of 3"*

### Screen reader differences

| Aspect | JAWS | NVDA | VoiceOver (macOS) |
|---|---|---|---|
| Menu open announcement | Announces menu name and first item | Announces first item with position | Announces first item with position |
| `aria-haspopup` announcement | "submenu" or "opens menu" | "submenu" | "has submenu" or (sometimes silent) |
| Item position | "X of Y" | "X of Y" | "X of Y" |
| Checkbox state | "checked" / "not checked" | "checked" / "not checked" | "ticked" / "unticked" |
| Disabled item | "unavailable" | "unavailable" | "dimmed" |
| Submenu navigation context | Announces parent menu context | Does not always announce nesting depth | Announces submenu separately |
| `aria-controls` navigation | Supports (Ctrl+Alt+M to jump) | Does not expose to users | Does not expose to users |

### AT support notes from a11ysupport.io

- **`menu` role**: partial support (25/33 MUST expectations). Weaker in TalkBack and VoiceOver iOS. Strongest in JAWS, NVDA, and desktop VoiceOver.
- **`menubar` role**: no test data available on a11ysupport.io. Treat as less reliably supported — test thoroughly.
- **`menuitem` role**: partial support (20/22 MUST). TalkBack has weaker support.
- **`menuitemcheckbox` / `menuitemradio`**: no test data available. These roles are less commonly used and tested. Assume partial support; always verify with real AT.
- **`aria-haspopup`**: partial support (79/99 MUST). Most screen readers support the `"true"` and `"menu"` values. The `"dialog"`, `"grid"`, `"listbox"`, and `"tree"` values have notably weaker support, especially in Narrator and TalkBack.
- **`aria-expanded`**: partial support (80/88 MUST). Well-supported overall, with minor gaps in VoiceOver macOS and Orca.
- **`aria-checked`**: fully supported across all tested screen readers.
- **`aria-controls`**: very poor support (9/41 MUST). Only JAWS provides user-facing navigation. Include it for semantic correctness, but do not rely on it for usability.

---

<a id="implementation"></a>
## 7. Implementation guide

### When to use the menu pattern

Use `role="menu"` **only** when building an **application-style menu** — a widget that behaves like a desktop application menu:

- Action menus (Cut, Copy, Paste)
- Context menus (right-click menus)
- Editor toolbars (Font, Format, Insert)
- Settings menus with checkbox/radio items
- Command palettes

### When NOT to use the menu pattern

| Instead of menu, use… | When… |
|---|---|
| `<nav>` + `<ul>` + `<a>` links | Building site navigation (header nav, sidebar nav, footer nav). Use lists of links inside a `<nav>` landmark. |
| Disclosure (`<button>` + `aria-expanded` + content) | Building a dropdown that reveals arbitrary content (links, text, forms) — not a list of commands. |
| Listbox (`role="listbox"`) | Building a value selector (e.g., choosing a color, selecting a timezone). |
| Combobox (`role="combobox"`) | Building a filterable/searchable selector with text input. |
| `<select>` | Building a simple native dropdown for form values. |

**The litmus test**: if cursor/arrow key navigation between items and "menu interaction mode" in screen readers would **confuse** users (because users expect Tab-navigable links), do not use `role="menu"`.

### Step-by-step: standalone menu (menu button pattern)

1. **Create the trigger button**:
   ```html
   <button id="menu-btn"
           aria-haspopup="true"
           aria-expanded="false"
           aria-controls="action-menu">
     Actions
   </button>
   ```
   Use a real `<button>` for free keyboard support (Enter, Space, focus).

2. **Create the menu container**:
   ```html
   <ul id="action-menu"
       role="menu"
       aria-labelledby="menu-btn"
       hidden>
   ```
   Label the menu with `aria-labelledby` referencing the button.

3. **Add menu items**:
   ```html
     <li role="menuitem" tabindex="-1">Cut</li>
     <li role="menuitem" tabindex="-1">Copy</li>
     <li role="menuitem" tabindex="-1">Paste</li>
   </ul>
   ```
   All items start with `tabindex="-1"`. Focus is managed programmatically.

4. **Handle button activation**:
   - On Enter, Space, or (optionally) Down Arrow: remove `hidden`, set `aria-expanded="true"`, call `focus()` on the first menuitem.
   - On (optionally) Up Arrow: open menu, focus the last item.

5. **Handle keyboard inside the menu**:
   - Arrow keys: move focus between items (update `tabindex` via roving tabindex or use `aria-activedescendant`).
   - Enter: activate the item, close the menu, return focus to the button.
   - Escape: close the menu, return focus to the button.
   - Tab/Shift+Tab: close the menu, let focus move naturally.

6. **Handle closing**:
   - On close: set `hidden`, set `aria-expanded="false"`, return focus to the button.
   - Also close on click outside the menu (mouse users).

7. **Handle disabled items**:
   - Set `aria-disabled="true"` on the item.
   - Arrow keys still move focus to/through disabled items.
   - Enter/Space on a disabled item does nothing.

### Focus management details

- **Opening**: focus **must** move into the menu. A menu that opens but leaves focus on the button is invisible to keyboard-only users.
- **Closing via Escape or activation**: focus **must** return to the trigger. If the trigger no longer exists (dynamically removed), move focus to a sensible fallback.
- **Closing via Tab**: focus moves to the next focusable element on the page; the menu closes. Do not trap focus.
- **Click outside**: close all open menus. Return focus only if appropriate (typically the menu just closes and the user's click target receives focus).

### Animation considerations

If menus animate open/close:
- `aria-expanded` updates **immediately** at the start of the transition, not at the end.
- Focus moves at the start — do not delay focusing the first item until animation completes.
- Users with `prefers-reduced-motion: reduce` see instant transitions.
- During the "closing" animation, items must not be focusable or announced.

### Framework-specific notes

| Library | Component | Notes |
|---|---|---|
| **Radix UI** | `DropdownMenu` | Good ARIA support. Uses `role="menu"` and `role="menuitem"`. Manages focus, keyboard, and `aria-expanded` automatically. Verify: submenu keyboard navigation, `menuitemcheckbox`/`menuitemradio` use `aria-checked`. |
| **Headless UI** | `Menu` | Solid APG-aligned implementation. Items use roving tabindex. Check: type-ahead support, `aria-haspopup` on trigger. Note: their `Menu` is for actions; for navigation dropdowns they recommend Disclosure. |
| **MUI (Material UI)** | `Menu` / `MenuItem` | Uses `role="menu"` and `role="menuitem"`. Focus management is built-in. Verify: `aria-haspopup` on the trigger, `aria-expanded` toggling, nested menu support. Checkbox/radio items need manual `role` overrides. |
| **Chakra UI** | `Menu` | Provides `Menu`, `MenuButton`, `MenuList`, `MenuItem`. Good ARIA defaults. Verify: `aria-haspopup` value, keyboard behavior matches APG (especially Escape and arrow keys in submenus). |
| **Adobe React Aria** | `useMenu`, `useMenuTrigger` | Low-level hooks with excellent APG compliance. Handles roving tabindex, type-ahead, submenus. Recommended when full control is needed. |

When using any library:
- Test with NVDA + Chrome, JAWS + Chrome, and VoiceOver + Safari
- Verify arrow key navigation, Enter/Space activation, Escape closing
- Confirm `aria-expanded` toggles on the trigger
- Check that `menuitemcheckbox`/`menuitemradio` expose correct `aria-checked`
- Ensure Tab closes the menu (not trapped)

---

<a id="common-mistakes"></a>
## 8. Common mistakes

### Using `role="menu"` for site navigation

**Problem**: A website's main navigation bar uses `role="menubar"` and `role="menuitem"` on its links. Screen readers switch to menu interaction mode, where users expect arrow keys (not Tab) to navigate and expect items to be actions (not links). Users cannot Tab between navigation links as they would on any other site. This is the **#1 most common misuse** of the menu pattern.

**Fix**: Use `<nav>` with a `<ul>` of `<a>` links. No ARIA menu roles. If dropdowns are needed for sub-navigation, use disclosure buttons (`<button>` with `aria-expanded`) that reveal nested link lists — still within `<nav>`, still using `<a>` elements. Users navigate with Tab, which is the expected behavior for website links.

### Missing focus management on open

**Problem**: The menu button opens the menu visually but focus stays on the button. Keyboard and screen reader users cannot reach the menu items — they have to Tab past the button to find the items (if they're even in the tab order, which they shouldn't be). The menu is effectively invisible to non-mouse users.

**Fix**: On menu open, programmatically call `focus()` on the first `menuitem`. Ensure each item has `tabindex="-1"` so it can receive focus. Focus must move **immediately** when the menu appears.

### Missing focus management on close

**Problem**: The menu closes (via Escape or item activation) but focus is not returned to the trigger button. Focus falls to `<body>` or an unpredictable element. The user loses their place on the page.

**Fix**: On close, always return focus to the trigger element (the menu button or the parent menuitem that opened the submenu). If the trigger was dynamically removed, move focus to the nearest logical ancestor or the next focusable element.

### Using wrong item roles

**Problem**: Menu items use `role="option"`, `role="listitem"`, or bare `<li>` elements (with no role) instead of `menuitem`, `menuitemcheckbox`, or `menuitemradio`. The screen reader does not announce items as menu items, and keyboard behavior does not match user expectations.

**Fix**: Every actionable item inside a `role="menu"` or `role="menubar"` must have one of the three allowed item roles: `menuitem`, `menuitemcheckbox`, or `menuitemradio`. No other roles are valid as direct children (except `group` and `separator`).

### Making menu items tabbable

**Problem**: Menu items have `tabindex="0"`, making each item a separate Tab stop. Users expect Tab to exit the menu entirely (since menus are composite widgets), but instead Tab walks through every item. This breaks the expected interaction model and confuses screen reader users who are in menu mode.

**Fix**: All items should have `tabindex="-1"`. Use roving tabindex (only the "current" item gets `tabindex="0"`) or `aria-activedescendant`. Tab must always exit the menu.

### Forgetting `aria-haspopup` on the trigger

**Problem**: The menu button opens a menu but lacks `aria-haspopup="true"`. Screen readers announce it as a plain button with no hint that activating it will open a menu. Users don't know a menu is available.

**Fix**: Add `aria-haspopup="true"` (or `aria-haspopup="menu"`) to the trigger button. Also add `aria-expanded` to communicate the open/closed state.

### Not closing the menu on outside click

**Problem**: The menu stays open when the user clicks elsewhere on the page. The menu obscures content and the user has no obvious way to dismiss it (other than pressing Escape, which mouse users may not think to do).

**Fix**: Listen for clicks outside the menu (and outside the trigger) and close the menu. Also close on `focusout` if focus moves outside the menu tree.

### Submenu does not close on Left Arrow

**Problem**: A submenu opens but Left Arrow does not close it and return focus to the parent. Users get trapped in the submenu with no keyboard mechanism to go back.

**Fix**: When focus is inside a submenu and the user presses Left Arrow, close the submenu and return focus to the parent `menuitem`. If the menu is within a menubar, Left Arrow should also advance to the previous menubar item.

### `aria-expanded` not updated

**Problem**: The `aria-expanded` attribute on the trigger or parent `menuitem` is not toggled when the menu opens or closes. The screen reader announces an incorrect state — "collapsed" when the menu is actually open, or vice versa.

**Fix**: Update `aria-expanded` synchronously with the menu's visibility. Set `"true"` when the menu appears, `"false"` when it disappears. Test by toggling and inspecting both the attribute and the visual state.

### Using `aria-haspopup="true"` on non-menu popups

**Problem**: A button that opens a dialog, tooltip, or disclosure panel has `aria-haspopup="true"`. Per spec, `"true"` maps to `"menu"`, so the screen reader announces "menu". Users expect a menu, get something different, and are confused.

**Fix**: Use the correct `aria-haspopup` value: `"dialog"` for dialogs, `"listbox"` for listboxes, `"tree"` for trees, `"grid"` for grids. If the popup is arbitrary content (not one of these roles), do not use `aria-haspopup` at all — use a disclosure pattern with `aria-expanded`.

---

<a id="acceptance-criteria"></a>
## 9. Acceptance criteria

Concise, verifiable checks for auditing a menu implementation. Each criterion includes its severity.

### Structure

| # | Criterion | Severity |
|---|---|---|
| S1 | The menu container has `role="menu"` (or `role="menubar"` for a persistent menu bar). | Critical |
| S2 | Every actionable item inside the menu has `role="menuitem"`, `role="menuitemcheckbox"`, or `role="menuitemradio"`. No other interactive roles are used for items. | Critical |
| S3 | The menu has an accessible name via `aria-labelledby` (referencing the trigger) or `aria-label`. | Critical |
| S4 | The trigger button has `aria-haspopup="true"` or `aria-haspopup="menu"`. | Critical |
| S5 | The trigger button has `aria-expanded="true"` when the menu is open and `"false"` when closed. | Critical |
| S6 | Parent menuitems that open submenus have `aria-haspopup="true"` and `aria-expanded` toggled correctly. | Critical |
| S7 | `role="menu"` is **not** used for site navigation. Navigation uses `<nav>` with links. | Critical |
| S8 | Items use `tabindex="-1"` (except the first item in a menubar, which uses `tabindex="0"`). | Major |
| S9 | Disabled items have `aria-disabled="true"` and remain focusable. | Major |
| S10 | Separators have `role="separator"` and are not focusable. | Minor |
| S11 | `menuitemradio` items in the same group are wrapped in `role="group"` with an accessible name (or correctly grouped within the same menu). | Major |

### Keyboard

| # | Criterion | Severity |
|---|---|---|
| K1 | Enter or Space on the menu button opens the menu and places focus on the first item. | Critical |
| K2 | Down Arrow in a vertical menu moves focus to the next item. | Critical |
| K3 | Up Arrow in a vertical menu moves focus to the previous item. | Critical |
| K4 | Enter on a `menuitem` (without submenu) activates it and closes the menu. | Critical |
| K5 | Escape closes the current menu and returns focus to the trigger (button or parent menuitem). | Critical |
| K6 | Tab closes all open menus and moves focus to the next focusable element on the page. Focus is not trapped. | Critical |
| K7 | Arrow keys do not move focus to separator elements. | Major |
| K8 | Home moves focus to the first item; End moves focus to the last item (if wrapping is not implemented). | Minor |
| K9 | Type-ahead: pressing a printable character moves focus to the next item whose label starts with that character (optional but recommended). | Minor |
| K10 | Disabled items receive focus via arrow keys but cannot be activated with Enter or Space. | Major |
| K11 | A visible focus indicator is displayed on the currently focused menu item (WCAG 2.4.7). | Critical |

### Screen reader

| # | Criterion | Severity |
|---|---|---|
| SR1 | The menu button announces: name, role ("button"), has-popup hint ("menu"), and expanded/collapsed state. | Critical |
| SR2 | When focus lands on a menuitem, the screen reader announces: name, role ("menu item"), and position ("X of Y"). | Critical |
| SR3 | Activating a menuitem triggers a state change or action without leaving the user in an orphaned state. | Critical |
| SR4 | Closed menus produce no screen reader announcements — they are fully removed from the accessibility tree. | Critical |
| SR5 | When a submenu opens, the screen reader announces the first item with its role and position within the submenu. | Major |
| SR6 | Disabled items are announced as "unavailable" or "dimmed". | Major |

### Menubar-specific

| # | Criterion | Severity |
|---|---|---|
| MB1 | The menubar element has `role="menubar"`. | Critical |
| MB2 | The menubar has an accessible name via `aria-label` or `aria-labelledby`. | Critical |
| MB3 | Left/Right Arrow moves focus between top-level menubar items. | Critical |
| MB4 | Down Arrow on a menubar item with a submenu opens it and moves focus to the first submenu item. | Critical |
| MB5 | Tab moves focus out of the menubar entirely. | Critical |
| MB6 | The first top-level item has `tabindex="0"`; all others have `tabindex="-1"`. | Major |
| MB7 | When navigating between menubar items with open submenus, the previous submenu closes and the new one optionally opens. | Major |

### Submenu

| # | Criterion | Severity |
|---|---|---|
| SM1 | The parent menuitem has `aria-haspopup="true"` and `aria-expanded` toggles on open/close. | Critical |
| SM2 | Right Arrow (in a vertical menu) on a parent menuitem opens its submenu and focuses the first item. | Critical |
| SM3 | Left Arrow inside a submenu closes it and returns focus to the parent menuitem. | Critical |
| SM4 | Escape inside a submenu closes only that submenu level (not the entire menu tree). | Critical |
| SM5 | The submenu element has `role="menu"` and an accessible name (via `aria-label` or `aria-labelledby`). | Major |
| SM6 | Nested submenus beyond 2 levels deep are avoided for usability. | Minor |

### Checkbox and radio items

| # | Criterion | Severity |
|---|---|---|
| CR1 | `menuitemcheckbox` items have `aria-checked="true"` or `"false"` reflecting their current state. | Critical |
| CR2 | `menuitemradio` items have `aria-checked="true"` (selected) or `"false"` (not selected). | Critical |
| CR3 | Activating a `menuitemcheckbox` toggles `aria-checked` between `"true"` and `"false"`. | Critical |
| CR4 | Activating an unchecked `menuitemradio` checks it and unchecks the previously checked item in the same group. | Critical |
| CR5 | Toggling checkbox/radio items does not close the menu (recommended behavior). | Major |
| CR6 | The visual indicator (checkmark, dot) matches `aria-checked` at all times. | Critical |
| CR7 | Radio items are grouped with `role="group"` and the group has an accessible name. | Major |

### Edge cases

| # | Criterion | Severity |
|---|---|---|
| E1 | Clicking outside the menu closes it. | Critical |
| E2 | If the trigger element is removed while the menu is open, focus is managed gracefully (moved to a sensible fallback). | Major |
| E3 | Dynamically added menu items are reachable via arrow keys and have correct roles and accessible names. | Major |
| E4 | A menu with a single item still announces position as "1 of 1". | Minor |
| E5 | Long menus do not cause the page to scroll unexpectedly when navigating with arrow keys. | Major |
| E6 | Right-to-left (RTL) layouts swap Left Arrow and Right Arrow behaviors. | Major |
| E7 | Context-menu-style menus (opened via keyboard shortcut like Shift+F10) return focus to the original context on close. | Major |
| E8 | The menu does not intercept keyboard shortcuts that should pass through to the application (e.g., Ctrl+C should not be caught by the menu widget). | Major |
| E9 | Menus opened from within a dialog respect the dialog's focus trap — closing the menu keeps focus inside the dialog. | Critical |
