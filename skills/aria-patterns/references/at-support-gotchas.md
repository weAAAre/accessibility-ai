# AT Support Gotchas — What the Spec Promises vs What Actually Works

> Data sourced from [a11ysupport.io](https://a11ysupport.io/) (community-driven testing across 189 ARIA features). Always confirm with your own testing — data may be dated.

This reference covers ARIA features where the specification and real-world assistive technology (AT) support diverge significantly. These are the gaps that cause accessible-looking code to fail for real screen reader users.

---

## Critical: Features with near-zero support

### `role="tooltip"` — 3/33 MUST expectations pass (9%)

**Reality**: The tooltip role is essentially dead across assistive technologies. Only VoiceOver on macOS in some configurations recognizes it.

**What this means**: Setting `role="tooltip"` on an element does NOT cause screen readers to announce it as a tooltip or to read its content when it appears. The role provides almost no practical benefit.

**What to do instead**:
- For **labelling tooltips** (tooltip IS the element's name): Use `aria-labelledby` pointing to the tooltip element, or `aria-label` directly on the trigger. The label association works regardless of the tooltip role.
- For **describing tooltips** (tooltip adds supplementary info): Use `aria-describedby` pointing to the tooltip element. The description association works without the tooltip role.
- Keep `role="tooltip"` anyway — it causes no harm, satisfies the spec, and may gain support in the future. But **never RELY on it** to convey information.
- For **rich/interactive content**: Use a toggletip pattern (disclosure widget with `role="status"` live region) instead.

### `aria-autocomplete` — 11/55 MUST expectations pass (20%)

**Reality**: Almost no screen reader conveys the autocomplete behavior to users. Setting `aria-autocomplete="list"` or `"both"` on a combobox input has no practical effect in most AT.

**What this means**: Screen reader users will NOT be told that the list filters as they type, or that inline completion is available.

**What to do instead**:
- Keep `aria-autocomplete` for spec compliance (JAWS may announce it).
- Use an **`aria-live="polite"` region** to announce the number of filtered results as the user types: `"3 suggestions available"`. This is the only reliable cross-AT method to communicate filtering behavior.
- Debounce the live region updates (300-500ms) to avoid overwhelming the user during rapid typing.
- Use `aria-activedescendant` for virtual focus on options — but **beware**: VoiceOver macOS/Safari does NOT support `aria-activedescendant` in combobox context (see section below). For cross-AT compatibility, consider DOM focus (roving tabindex) instead.

### `aria-controls` — 9/41 MUST expectations pass (22%)

**Reality**: The `aria-controls` attribute is supposed to let screen reader users navigate to the controlled element. **Only JAWS supports this** (via Insert+Alt+M). NVDA, VoiceOver (all platforms), TalkBack, Narrator, and Orca do not expose this navigation.

**What this means**: If your accessible tab, accordion, or disclosure relies on `aria-controls` for users to find the associated content, it fails silently for ~80% of screen reader users.

**What to do instead**:
- Keep `aria-controls` — it's required by the spec, JAWS uses it, and it causes no harm.
- **Never rely on it for usability**. Ensure the controlled content is either:
  - Immediately after the trigger in DOM order (so arrow/Tab reaches it naturally)
  - Programmatically focused when revealed (e.g., focus moves to the first element in a newly opened panel)
- For tabs: the panel should follow the tablist in DOM order. When a tab is activated, move focus into the panel.

---

## High risk: Features with significant gaps

### `aria-modal="true"` — 7/11 MUST, 13/22 SHOULD

**Support matrix**:

| Screen Reader | Limits reading to modal? | Removes outside content from nav shortcuts? |
|---|---|---|
| JAWS (Chrome/Edge) | ✅ Yes | ✅ Yes |
| NVDA (Chrome/Edge) | ✅ Yes | ✅ Yes |
| VoiceOver macOS (Safari) | ⚠️ Partial | ✅ Yes |
| VoiceOver iOS (Safari) | ⚠️ Partial | ✅ Yes |
| Narrator (Edge) | ❌ None | ❌ None |
| TalkBack (Chrome) | ❌ None | ❌ None |
| Orca (Firefox) | ❌ None | ⚠️ Partial |

**Reality**: On Narrator, TalkBack, and Orca, `aria-modal="true"` has NO effect. The screen reader can still navigate to background content via virtual cursor, swipe gestures (mobile), or heading/landmark shortcuts.

**Workarounds (use ALL of these)**:

1. **HTML `inert` attribute (best option)** — Add `inert` to all sibling containers of the dialog when it opens. This makes background content unfocusable AND invisible to AT at the platform level. Browser support: Chrome 102+, Firefox 112+, Safari 15.5+.

   ```html
   <body>
     <div id="app" inert><!-- all app content --></div>
     <dialog open aria-labelledby="dialog-title">
       <!-- modal content -->
     </dialog>
   </body>
   ```

2. **`aria-hidden="true"` on siblings** — If you can't use `inert`, set `aria-hidden="true"` on all sibling containers. This hides them from the accessibility tree but does NOT prevent focus — combine with disabling focusable elements or using `tabindex="-1"`.

3. **Native `<dialog>` with `.showModal()`** — The native dialog element with `.showModal()` automatically moves the dialog to the top layer and makes background content inert via the browser's built-in mechanism. This is the **most reliable cross-AT approach**.

4. **Focus trap (always required)** — `aria-modal` does NOT create a focus trap. Always implement a JavaScript focus trap that prevents Tab/Shift+Tab from leaving the dialog. This is orthogonal to `aria-modal`.

### `aria-haspopup` values — 79/99 MUST (80%, but value-dependent)

The `"true"` and `"menu"` values are well-supported. Other values have significant gaps:

| Value | Support level | Notes |
|---|---|---|
| `"true"` / `"menu"` | ✅ Well-supported | Safest choice |
| `"dialog"` | ⚠️ Partial | Narrator, TalkBack may not announce |
| `"listbox"` | ⚠️ Partial | Limited support outside JAWS/NVDA |
| `"grid"` | ❌ Poor | Minimal AT support |
| `"tree"` | ❌ Poor | Minimal AT support |

**What to do**: Use `aria-haspopup="dialog"` for dialog triggers (some support is better than none), but don't rely on the announcement alone. Ensure the popup type is clear from context (button label, visual cues).

### `aria-pressed` — 42/55 MUST (76%, partial everywhere)

**Reality**: `aria-pressed` is recognized by all major screen readers for the **`"true"`** and **`"false"`** values, but the announcement varies:

- JAWS: "pressed" / "not pressed"
- NVDA: "pressed" / "not pressed" (but may miss state changes in some contexts)
- VoiceOver: "selected" or uses a different phrasing
- TalkBack: may announce "checked" (confusing — toggle button sounds like checkbox)

**What this means**: Toggle buttons work, but users hear inconsistent language. This is generally acceptable — the binary semantic is still conveyed.

#### `aria-pressed="mixed"` — near-dead (only 3/11 combos support it)

**Critical**: The `"mixed"` value (for tri-state "partially pressed" toggle buttons) has **near-zero support**:

| Screen Reader | Browser | `"mixed"` support |
|---|---|---|
| JAWS | Chrome | ✅ Supported |
| JAWS | Edge | ❌ **None** |
| JAWS | Firefox | ✅ Supported |
| Narrator | Edge | ❌ **None** |
| NVDA | Chrome | ❌ **None** |
| NVDA | Edge | ❌ **None** |
| NVDA | Firefox | ❌ **None** |
| Orca | Firefox | ❌ **None** |
| TalkBack | Chrome | ❌ **None** |
| VoiceOver iOS | Safari | ❌ **None** |
| VoiceOver macOS | Safari | ✅ Supported |

**NVDA** (the most popular free screen reader) has **zero** support. Narrator, Orca, TalkBack, and VoiceOver iOS all have **zero** support. Even JAWS fails on Edge.

**What to do**: Do NOT use `aria-pressed="mixed"` expecting screen readers to announce it. Instead:
- Change the button's accessible name to include the mixed state: `<button aria-pressed="true" aria-label="Bold (partially applied)">Bold</button>`
- Or inject visually hidden text into the button: `<button aria-pressed="true">Bold <span class="sr-only">(partially applied)</span></button>`
- Keep `aria-pressed` as `"true"` or `"false"` for the binary semantic (well-supported), and convey the "mixed" nuance textually.

**Key distinction from `aria-checked`**: `aria-pressed` is for **action toggles** (Bold button in a toolbar). `aria-checked` is for **value states** (switch, checkbox). Using the wrong one causes semantically incorrect announcements and confuses users who depend on the role + state combination to understand the element's purpose.

---

## Moderate risk: Features with uneven support

### `role="switch"` — NO DATA on a11ysupport.io

**Reality**: The switch role is relatively new and has NOT been formally tested on a11ysupport.io. Anecdotal evidence suggests:

- JAWS + Chrome/Edge: "switch" — good support
- VoiceOver macOS + Safari: "switch" — good support
- VoiceOver iOS + Safari: "switch" or "toggle" — good support
- TalkBack + Chrome: "switch" — good support
- NVDA + Firefox: may fall back to "checkbox"
- Narrator + Edge: "toggle switch"
- Older AT versions: fall back to "checkbox" (switch extends checkbox in the ARIA ontology)

**Graceful degradation**: The fallback to "checkbox" is acceptable — users hear "checked/not checked" instead of "on/off", but the widget remains operable. Design labels that work for both semantics (e.g., "Dark mode" works whether announced as switch or checkbox).

**Recommendation**: Use `role="switch"` on a `<button>` element. The button provides keyboard support natively; the role provides the semantic; the fallback is safe. The label must NOT change when the state changes — the state is conveyed by "on/off" or "checked/unchecked", not by the label.

### `role="menu"` / `role="menubar"` — 25/33 MUST (76%)

**The #1 ARIA misuse**: Using `role="menu"` for **site navigation dropdowns**. The menu pattern is exclusively for **application-style command menus** (like File > Edit > View in a desktop app).

**Why this matters**:
- Menu role changes keyboard expectations: users expect **arrow keys** to navigate (not Tab)
- Menu items should trigger actions (Cut, Paste, Save), not navigate to pages
- Screen readers enter a special "menu interaction mode" that changes how other keys work
- TalkBack has weaker menu support (partial), making this worse on mobile

**What to use for site navigation**:
- A **disclosure pattern**: `<button aria-expanded>` toggling a `<nav>` containing a `<ul>` of `<a>` links
- Users navigate links with Tab (expected web behavior)
- Screen readers announce links normally — no special interaction mode
- No keyboard model confusion

### `radiogroup` role — 23/33 MUST (70%)

**TalkBack and VoiceOver iOS** do not convey the radiogroup role or its label. Mobile screen reader users may not understand radio buttons are grouped or what the group represents.

**Workaround**: Use native `<fieldset>` + `<legend>` + `<input type="radio">`. Native radio groups have better AT support because browsers expose them through platform accessibility APIs that predate ARIA.

---

## The `aria-pressed` vs `aria-checked` distinction

This is a subtle but important semantic distinction that is commonly confused:

| Attribute | Used for | Role context | Screen reader announces | Example |
|---|---|---|---|---|
| `aria-pressed` | **Action toggles** — the button performs an action that can be toggled | `button` with toggle | "pressed" / "not pressed" | Bold, Italic, Mute in a toolbar |
| `aria-checked` | **Value states** — the element represents a setting that is on or off | `switch`, `checkbox`, `radio` | "on/off" or "checked/unchecked" | Dark Mode, Notifications toggle |

**Why it matters**: A toolbar Bold button with `aria-checked` would confuse screen reader users — it sounds like a checkbox in a form, not a formatting action. A settings toggle with `aria-pressed` sounds like a button you press for an action, not a persistent setting.

**Rule of thumb**: If toggling it changes a VALUE or SETTING → `aria-checked` on `role="switch"`. If toggling it activates/deactivates an ACTION → `aria-pressed` on `<button>`.

---

## ARIA version confusion — combobox

The `combobox` pattern has been redesigned across ARIA versions, causing widespread confusion:

| ARIA Version | Combobox structure | Status |
|---|---|---|
| ARIA 1.0 | `role="combobox"` on a **wrapper `<div>`** containing the input and popup | ❌ Deprecated |
| ARIA 1.1 | `role="combobox"` on the **`<input>` element** itself, popup linked via `aria-owns` | ⚠️ Transitional |
| ARIA 1.2 (current) | `role="combobox"` on the **`<input>` element** itself, popup linked via `aria-controls` | ✅ Current spec |

**What to do**: Use the ARIA 1.2 pattern (combobox role on the input, `aria-controls` to the popup). If you encounter code using the 1.0 wrapper pattern, flag it as outdated and recommend migration.

**Key attributes for the current pattern**:
- `role="combobox"` on the `<input>`
- `aria-expanded="true/false"` on the input
- `aria-controls="popup-id"` on the input (pointing to the popup)
- `aria-activedescendant="option-id"` on the input (pointing to the visually focused option)
- `aria-autocomplete="list|both|inline|none"` on the input (though AT support is poor — see above)

---

## Critical: Features with deceptive spec support

### `aria-errormessage` — ~20% MUST expectations pass

**Reality**: The `aria-errormessage` attribute was designed to associate error messages with form controls (like `aria-describedby` but specifically for error state). Despite being in the ARIA 1.1+ spec, **almost no screen reader reads the referenced error text** when `aria-invalid="true"` is set and the error appears.

**What fails**: When a user submits an invalid field, setting `aria-invalid="true"` and pointing `aria-errormessage="error-id"` to the error element should cause the screen reader to announce the error. In practice:

| Screen Reader | Reads aria-errormessage content? |
|---|---|
| JAWS (Chrome/Edge) | ⚠️ Partial (recent versions only) |
| NVDA (Chrome/Firefox) | ❌ No |
| VoiceOver macOS (Safari) | ❌ No |
| VoiceOver iOS (Safari) | ❌ No |
| TalkBack (Chrome) | ❌ No |
| Narrator (Edge) | ⚠️ Partial |

**What to do instead**:
1. **Use `aria-describedby`** pointing to the error message element. This is well-supported and causes screen readers to announce the error text as a description when the field receives focus.
2. **Keep `aria-invalid="true"`** — this IS well-supported and causes screen readers to announce "invalid" when the field is focused.
3. **Use an `aria-live="assertive"` region** (or inject error text into an existing live region) to announce errors dynamically when they appear, without requiring the user to re-focus the field.
4. Keep `aria-errormessage` in the markup for progressive enhancement — JAWS and Narrator may use it, and support will improve over time. But **never rely on it alone**.

**Why this is deceptive**: The spec created `aria-errormessage` specifically for this use case. Developers assume it works because it exists. The fallback to `aria-describedby` feels like a hack, but it's the only reliable cross-AT method.

### `aria-relevant` values — ONLY `"additions text"` (default) works; ALL other values are broken

**Reality**: The `aria-relevant` attribute on live regions is supposed to control WHAT changes are announced: additions (new nodes), removals (removed nodes), text (changed text content), or all. In practice, **every non-default value is broken**:

| Value | AT Support | Details |
|---|---|---|
| `"additions text"` (default) | ✅ 11/11 fully supported | This is what screen readers do by default anyway |
| `"additions"` | ❌ **0/11 fully supported** | NVDA has **ZERO** support (all 3 browsers — stops announcing entirely); JAWS, Narrator, Orca, TalkBack, VoiceOver all **partial** (still announce text changes too, defeating the filter) |
| `"text"` | ❌ **0/11 fully supported** | Narrator = **none**; VoiceOver iOS = **none**; VoiceOver macOS = **none**; all others partial |
| `"removals"` | ❌ **2/11** (VoiceOver only) | JAWS partial; Narrator, NVDA, Orca, TalkBack = **none** — completely ignore removed nodes |
| `"all"` | ❌ **2/11** (VoiceOver only) | Additions/text part works, but removals part ignored by all except VoiceOver; JAWS partial |

Full support matrix for `aria-relevant` (MUST expectations):

| Value | JAWS Ch | JAWS Ed | JAWS Fx | Narrator | NVDA Ch | NVDA Ed | NVDA Fx | Orca | TalkBack | VO iOS | VO macOS |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `"additions"` | partial | partial | partial | partial | **none** | **none** | **none** | partial | partial | partial | partial |
| `"text"` | partial | partial | partial | **none** | partial | partial | partial | partial | partial | **none** | **none** |
| `"removals"` | partial | partial | **none** | **none** | **none** | **none** | **none** | **none** | **none** | supported | supported |
| `"all"` | partial | partial | partial | partial | partial | partial | partial | partial | partial | supported | supported |
| `"additions text"` | supported | supported | supported | supported | supported | supported | supported | supported | supported | supported | supported |

**What this means**: `aria-relevant` is essentially a no-op for filtering. The ONLY working value is the default `"additions text"`, which is redundant since that's what screen readers do without any `aria-relevant` at all. The most dangerous trap is `aria-relevant="additions"` — developers set it to ONLY hear new nodes (not text changes), but **NVDA stops announcing everything** (zero support). Other SRs still announce text changes too (partial), so the filter has no effect. `aria-relevant="removals"` is equally broken: only VoiceOver (macOS/iOS) actually announces removed nodes.

**What to do instead**:
- **Never use `aria-relevant` to filter announcement types** — it doesn't work. Leave it at the default or omit it entirely.
- To announce removals, **inject a text announcement** into the live region: insert a status message like "Notification dismissed" before removing the node.
- To reduce noise from text changes, **manage content programmatically**: replace entire live region content as a single atomic operation, or use a dedicated `role="status"` region for targeted announcements.
- For notification dismiss patterns, use a separate `role="status"` live region that receives explicit removal messages.
- Auto-dismissing content that disappears without user action may also violate **WCAG 2.2.1 Timing Adjustable**.

### `aria-activedescendant` — Context-dependent support (33/38 MUST overall, but 0% on VoiceOver macOS for combobox)

**Reality**: `aria-activedescendant` is well-supported in **menu** context but has a critical gap in **combobox** context:

| Context | JAWS | NVDA | Narrator | Orca | TalkBack | VoiceOver iOS | VoiceOver macOS |
|---|---|---|---|---|---|---|---|
| **Combobox** — convey active | Supported | Supported | Partial | Supported | Supported* | Supported* | **None** |
| **Combobox** — convey change | Supported | Supported | Partial | Supported | Supported* | Supported* | **None** |
| **Menu** — convey active | Supported | Supported | None | Supported | Supported | Supported | Supported |
| **Menu** — convey change | Supported | Supported | Supported | Supported | Supported | Supported | Supported |

\* TalkBack (Android/Chrome) and VoiceOver iOS support `aria-activedescendant` in combobox context. The gap is **exclusively VoiceOver macOS/Safari**.

**What this means**: VoiceOver macOS/Safari users will hear **nothing** when arrowing through combobox options managed via `aria-activedescendant`. The highlighted option is invisible to them. This affects autocomplete search boxes, select replacements, and any combobox using virtual focus.

**Why this is dangerous**: Most combobox tutorials recommend `aria-activedescendant` as the standard way to manage focus. JAWS, NVDA, Narrator (partially), TalkBack, and VoiceOver iOS all support it in combobox context — **VoiceOver macOS is the sole outlier**. Developers test on Windows/Android and assume it works everywhere. VoiceOver macOS is the #2 desktop screen reader and it completely fails.

**What to do instead**:
- For **combobox**: Use **DOM focus** (roving tabindex or programmatic `.focus()` on each option) instead of `aria-activedescendant`. When the user arrows down, move actual keyboard focus to the option element. This works universally.
- For **menu** (application-style command menus): `aria-activedescendant` is safe — VoiceOver supports it in menu context.
- If you must use `aria-activedescendant` for combobox (e.g., to preserve typing position in the input), document the VoiceOver macOS limitation and test with DOM focus as a fallback strategy.

---

## Testing recommendations

### `aria-details` — 7/11 MUST expectations pass (64%) — Broken on Apple + Narrator

**Reality**: `aria-details` is supposed to link an element to extended/structured descriptions (data tables, complex diagrams, math notation). In practice, Apple screen readers and Narrator completely ignore it.

| Expectation | JAWS | NVDA | Narrator | Orca | TalkBack | VoiceOver iOS | VoiceOver macOS |
|---|---|---|---|---|---|---|---|
| Convey presence of aria-details | Supported | Supported | **None** | Supported | **None** | **None** | **None** |
| Jump to/convey referenced content | **None** | **None** | **None** | Supported | **None** | **None** | **None** |
| Convey boundaries of details | Supported | **None** | **None** | Supported | **None** | **None** | **None** |

**What this means**: On VoiceOver (macOS and iOS), Narrator, and TalkBack, users will have NO indication that a linked description exists. Even JAWS and NVDA only announce presence — they can't actually navigate to the details.

**Why this is dangerous**: The spec presents `aria-details` as the correct way to link complex descriptions. Developers read the spec and use it as their ONLY description mechanism. Then 60%+ of screen reader users never discover the description.

**What to do instead**:
- Use `aria-describedby` as the primary association — it is fully supported across all major AT. For short descriptions, this is sufficient.
- For long/complex descriptions, place the description visually nearby OR in a visually hidden but DOM-present section linked via `aria-describedby`.
- Add `aria-details` as progressive enhancement — it allows future AT to provide richer navigation to the description.
- **Never use `aria-details` as the ONLY link to critical content.** Always have a fallback that works without it.
- Consider also adding a visible "Show description" disclosure button that reveals the details, providing a universal fallback.

### `aria-current` — Narrator and Orca have ZERO support (53/66 MUST overall)

**Reality**: `aria-current` is widely recommended for navigation patterns (breadcrumbs, pagination, step indicators, sidebar nav). Despite being in ARIA 1.1, **Narrator (Windows built-in) and Orca (Linux) completely ignore it** for ALL values (`page`, `step`, `date`, `location`, `time`, `true`).

| Value | JAWS | NVDA | Narrator | Orca | TalkBack | VoiceOver iOS | VoiceOver macOS |
|---|---|---|---|---|---|---|---|
| `"page"` | ✅ | ✅ | ❌ None | ❌ None | ✅ | ✅ | ✅ |
| `"step"` | ✅ | ✅ | ❌ None | ❌ None | ✅ | ✅ | ✅ |
| `"date"` | ✅ | ✅ | ❌ None | ❌ None | ✅ | ✅ | ✅ |
| `"location"` | ✅ | ✅ | ❌ None | ❌ None | ✅ | ✅ | ✅ |
| `"time"` | ✅ | ✅ | ❌ None | ❌ None | ❌ None | ✅ | ✅ |
| `"true"` | ✅ | ✅ | ❌ None | ❌ None | ✅ | ✅ | ✅ |
| Dynamic change (SHOULD) | ❌ None | ✅ | ❌ None | ❌ None | ❌ None | ✅ | ❌ None |

**What this means**: Narrator users (a significant Windows population — Narrator is pre-installed on every Windows machine) will have **no indication** that a link or step is "current." They see identical links with no way to know which is active. Orca users on Linux face the same problem.

**Critical additional gap — dynamic state changes**: Removing `aria-current` from one element and adding it to another (e.g., after navigating in a SPA or completing a wizard step) is announced by **only NVDA and VoiceOver iOS**. JAWS, Narrator, Orca, TalkBack, and VoiceOver macOS will NOT announce when `aria-current` changes — the user must manually re-navigate to discover the change.

**What to do**:
- Keep `aria-current` as progressive enhancement — JAWS, NVDA, TalkBack, and VoiceOver DO use the static value.
- **Never rely on `aria-current` as the sole indication of "current"**. Supplement with **visually hidden text** like `<span class="sr-only">(current page)</span>` inside the link for Narrator/Orca users.
- For SPA navigation or wizard steps, after changing `aria-current` to a new element, also inject a brief announcement into an `aria-live="polite"` region (e.g., "Step 2 of 4") to ensure all screen readers hear the change.
- For step indicators/wizards, the step's visible label + visually hidden "(current step)" text is the most reliable cross-AT approach.

### `aria-sort` dynamic changes — only NVDA+Firefox announces sort direction changes (1/11 combos)

**Reality**: Sortable data tables are ubiquitous. The `aria-sort` attribute conveys sort direction (`ascending`, `descending`, `other`, `none`) on `<th>` elements. While static values are reasonably supported, **dynamic changes to `aria-sort` are announced by only NVDA+Firefox** — the one combination out of eleven tested. JAWS, Narrator, Orca, TalkBack, and VoiceOver (all platforms) are all silent when `aria-sort` changes.

| Expectation | JAWS (Chrome/Edge/Firefox) | Narrator (Edge) | NVDA (Chrome/Edge/Firefox) | Orca (Firefox) | TalkBack (Chrome) | VoiceOver iOS (Safari) | VoiceOver macOS (Safari) |
|---|---|---|---|---|---|---|---|
| Static `ascending` | ✅ | ✅ | ✅ | ❌ None | ❌ None | ✅ | ✅ |
| Static `descending` | ✅ | ✅ | ✅ | ❌ None | ❌ None | ✅ | ✅ |
| Static `other` | ✅ | ✅ | ✅ | ❌ None | ❌ None | ❌ None | ❌ None |
| "Sortable but unsorted" hint | ❌ None | ❌ None | ❌ None | ❌ None | ❌ None | ❌ None | ❌ None |
| **Dynamic change announcement** | **❌ None** | unknown | **✅ Firefox only** | **❌ None** | **❌ None** | **❌ None** | **❌ None** |

**Why this is dangerous**: Developers build a sortable table, toggle `aria-sort` when the user clicks a column header, and assume screen readers will say "sorted ascending" or "sorted descending." In reality:

1. **JAWS users** — hear the static value when they navigate to the header, but get **NO announcement** when the sort changes after clicking. They must manually re-navigate to the header to discover the new direction.
2. **Orca and TalkBack users** — don't even hear the static ascending/descending value. Sort direction is completely invisible to them.
3. **VoiceOver users** — hear static values on both macOS and iOS, but get NO announcement on dynamic changes.
4. **"Sort by: none"** hint (indicating a column IS sortable but currently unsorted) — NO screen reader conveys this to users.

**What to do instead**:
- Keep `aria-sort` on `<th>` elements — JAWS, NVDA, VoiceOver, and Narrator DO use the static value when navigating to the header.
- After changing the sort direction, **inject an announcement into an `aria-live="polite"` region**: e.g., `"Table sorted by Name, ascending"`. This is the ONLY cross-AT method to announce sort changes.
- For Orca and TalkBack users (who can't even read static `aria-sort`), consider adding **visually hidden text** inside the `<th>`: `<span class="sr-only">, sorted ascending</span>`, updated with JavaScript when the sort changes.
- Never use `aria-sort="other"` on mobile — VoiceOver iOS and TalkBack don't support it.
- Don't rely on `aria-sort="none"` to indicate "sortable" — no AT announces it.

### `aria-colcount` — VoiceOver/TalkBack ignore it, and `aria-colcount="-1"` is broken in ALL screen readers (0/11)

**Reality**: `aria-colcount` defines the total number of columns in a `table`, `grid`, or `treegrid` when some columns are hidden (e.g., virtualized data grids showing columns 5-10 of 50). The attribute has two use cases: a known count (e.g., `aria-colcount="50"`) and an unknown count (`aria-colcount="-1"`). Both have serious AT gaps.

| Expectation | JAWS (Chrome/Edge/Firefox) | Narrator (Edge) | NVDA (Chrome/Edge/Firefox) | Orca (Firefox) | TalkBack (Chrome) | VoiceOver iOS (Safari) | VoiceOver macOS (Safari) |
|---|---|---|---|---|---|---|---|
| Convey total column count (known) | ✅ | ✅ | ✅ | unknown | ❌ None | ❌ None | ❌ None |
| **MUST NOT announce count when `-1` (unknown)** | **❌ Violates** | **❌ Violates** | **❌ Violates** | unknown | **❌ None** | **❌ None** | **❌ None** |

**The `-1` (unknown count) case is catastrophic**: The ARIA 1.1 spec states: *"If the total number of columns is unknown, authors MUST set the value of aria-colcount to -1 to indicate that the value should not be calculated by the user agent."* In practice, **every single screen reader that supports `aria-colcount` IGNORES the `-1` value and still announces its OWN calculated column count** based on visible columns. This means users are told a specific number when the true count is explicitly unknown — actively misleading them.

**What this means for developers**:
1. **Basic `aria-colcount` (known count)** only works on **desktop Windows screen readers** (JAWS, Narrator, NVDA). VoiceOver on macOS AND iOS, plus TalkBack on Android, completely ignore it — their users never hear "table has 50 columns" even when you provide the count.
2. **`aria-colcount="-1"` (unknown count)** is **broken everywhere**. No screen reader correctly suppresses its calculated count. Users will hear something like "table with 6 columns" even though the actual table has an unknown/much larger number of columns.
3. **`aria-colindex`** (which indicates a cell's position within the full column set) depends on `aria-colcount` to be meaningful — if the colcount isn't announced, colindex context is lost.

**What to do instead**:
- For **known column counts**: Set `aria-colcount` for JAWS/NVDA/Narrator users. ALSO provide a visible caption or `aria-label` on the table/grid that includes the total information: e.g., `aria-label="Project tasks, showing columns 5-10 of 50"`.
- For **unknown column counts**: Do NOT use `aria-colcount="-1"` — it will confuse users with an incorrect calculated count. Instead, provide a visible or `aria-label` description that honestly states the situation: e.g., `"Data grid, columns may extend beyond visible area"`.
- Always include a **visible "Showing columns X–Y of Z" indicator** near the table. This is the only universally reliable method — it works for all users, including VoiceOver and TalkBack where `aria-colcount` is invisible.
- If the grid supports column navigation (e.g., Ctrl+Right), ensure accessible instructions are available via `aria-describedby`.

### `aria-flowto` — only JAWS supports alternate reading order (10/44 MUST pass = 23%)

**Reality**: `aria-flowto` defines an alternate reading order, letting users navigate to referenced elements instead of following DOM order. Developers use it for complex layouts (multi-column articles, newspaper-style pages, dashboards) where visual reading flow differs from DOM order. **Only JAWS fully supports it.** Every other screen reader completely ignores it.

| Expectation | JAWS (Chrome/Edge/Firefox) | Narrator (Edge) | NVDA (Chrome/Edge/Firefox) | Orca (Firefox) | TalkBack (Chrome) | VoiceOver iOS (Safari) | VoiceOver macOS (Safari) |
|---|---|---|---|---|---|---|---|
| Convey presence of flowto | ✅ | ❌ None | ❌ None | ❌ None | ❌ None | ❌ None | ❌ None |
| Convey that another element flows to current | ✅ | ❌ None | ❌ None | ❌ None | ❌ None | ❌ None | ❌ None |
| Navigate to referenced element(s) | ✅ | ⚠️ Partial | ❌ None | ❌ None | ❌ None | ❌ None | ❌ None |
| Navigate back to targeting element(s) | ✅ | ❌ None | ⚠️ Partial | ❌ None | ❌ None | ❌ None | ❌ None |

**Why this is deceptive**: The spec describes `aria-flowto` as the standard way to define alternate reading order. Developers building multi-column layouts or complex dashboards naturally reach for it. But in reality:

1. **JAWS is the ONLY screen reader** that fully conveys the presence of flowto AND lets users navigate the alternate path (via Insert+Alt+M).
2. **NVDA has only partial reverse navigation** — it can navigate back from a target but cannot follow flowto forward nor does it convey its presence.
3. **Narrator has only partial forward navigation** — it can follow the link but doesn't announce the flowto relationship.
4. **VoiceOver (macOS and iOS), TalkBack, and Orca have ZERO support** — flowto is completely invisible. Users simply read in DOM order with no alternate path offered.
5. **Multi-target flowto** (pointing to multiple elements so users can choose which to navigate to) works ONLY in JAWS.

**What to do instead**:
- **Fix the DOM order** to match the intended reading flow. Use CSS Grid's `order` property or Flexbox `order` ONLY for visual reordering, never to change content meaning. The DOM sequence IS the reading order for 10 out of 11 screen reader combos.
- **Use landmarks and headings** (`<main>`, `<nav>`, `<section>` with `aria-label`, heading levels) so users can jump between sections efficiently. This works across ALL screen readers.
- Keep `aria-flowto` as progressive enhancement for JAWS users — but **never rely on it** as the only way to reach content.
- For multi-column article layouts, put all column content in a single linear DOM flow and use CSS columns or Grid for the visual multi-column appearance.
- For dashboards where users need to navigate between related widgets, use **skip links** or a **table of contents** with anchor links as universally supported alternatives.

### `aria-level` above 6 — JAWS announces no level, TalkBack also ZERO (4/11 fully support)

**Reality**: ARIA allows `aria-level` to be any positive integer, and `role="heading"` combined with `aria-level="7"`, `"8"`, etc. is spec-valid for deeply nested content. HTML headings stop at `<h6>`, but ARIA headings should go beyond — **in theory**. In practice, heading levels above 6 break JAWS (the most popular enterprise screen reader) and TalkBack completely.

| Expectation: convey heading level | JAWS (Chrome) | JAWS (Edge) | JAWS (Firefox) | Narrator (Edge) | NVDA (Chrome) | NVDA (Edge) | NVDA (Firefox) | Orca (Firefox) | TalkBack (Chrome) | VoiceOver iOS (Safari) | VoiceOver macOS (Safari) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Levels 1–6 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Levels above 6** | **❌ None** | **❌ None** | **❌ None** | ⚠️ Partial | ⚠️ Partial | ⚠️ Partial | ✅ | ✅ | **❌ None** | ✅ | ✅ |

**The breakdown for levels > 6**:
- **JAWS** — ZERO support across ALL 3 browsers. Announces "heading" with no level number. The user has no idea if it's level 7, 8, or 12.
- **TalkBack** — ZERO support. Heading level above 6 is completely invisible.
- **Narrator** — partial support only (may announce as generic heading).
- **NVDA** — partial on Chrome/Edge, fully supported only on Firefox.
- **Orca, VoiceOver iOS, VoiceOver macOS** — fully support arbitrary heading levels.

**Why this is dangerous**: Developers building hierarchical content systems (documentation wikis, nested comment threads, deeply nested nav menus) may create headings with `aria-level="7"` through `"10"` expecting the pattern works since levels 1–6 work perfectly (11/11 combos). But **the most popular paid screen reader (JAWS) has zero support**, affecting a large proportion of professional screen reader users.

**What to do instead**:
- **Restructure your heading hierarchy to stay within levels 1–6.** Even deeply nested content can usually be reorganized: use a flat heading level with visual indentation and ARIA context to convey depth.
- For threaded comments or nested content beyond 6 levels: use `aria-level` capped at 6 and encode depth context in the accessible name: e.g., `aria-label="Reply depth 8: Comment by Alex"`.
- Alternatively, use flat structure with `aria-describedby` pointing to a visually hidden context string like "Reply to Sarah's reply to John's comment."
- Never use `aria-level` above 6 as the sole depth indicator — supplement with visually hidden text that conveys the nesting context explicitly.

### Minimum test matrix

| Priority | Screen reader | Browser | Platform |
|---|---|---|---|
| **Must test** | NVDA | Chrome | Windows |
| **Must test** | VoiceOver | Safari | macOS |
| **Should test** | JAWS | Chrome/Edge | Windows |
| **Should test** | TalkBack | Chrome | Android |
| **Should test** | VoiceOver | Safari | iOS |
| Consider | Narrator | Edge | Windows |
| Consider | Orca | Firefox | Linux |

### What to verify beyond the spec

1. **Browse mode behavior** — Can the user navigate PAST the component with virtual cursor? (Critical for testing `aria-modal` containment)
2. **State change announcements** — Are state changes (expanded/collapsed, checked/unchecked, on/off) announced WITHOUT requiring focus to move?
3. **Role fallback** — When a role isn't supported, what does the user actually hear? Is the fallback acceptable?
4. **Live region reliability** — Do `aria-live` announcements actually fire? (TalkBack is inconsistent with live regions in Chrome)
5. **Touch interaction** — On mobile, do swipe gestures and double-tap work as expected for the component?
6. **Position announcement** — Do screen readers convey "N of M" for options in listboxes, menus, and trees?
