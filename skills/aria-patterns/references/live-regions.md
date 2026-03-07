# Live Regions — The Reality of Dynamic Announcements

Live regions are ARIA's mechanism for announcing dynamic content changes to screen reader users. They are essential for SPAs, form validation, chat, notifications, and any content that updates without a page reload. However, AT support is riddled with counterintuitive gaps.

## Key Traps — Read These First

1. **DOM-first rule**: The live region container MUST exist in the DOM BEFORE content is injected. Creating a new element with `role="alert"` and text already inside will be missed by most screen readers.
2. **`aria-busy` is broken everywhere except JAWS.** Narrator, NVDA, Orca, TalkBack, and VoiceOver all ignore it. Use a JavaScript debounce pattern instead.
3. **`role="status"` implicit `aria-atomic="true"` is ignored by NVDA/Firefox** — it announces only the changed text fragment. Always replace the entire text content, not just fragments.
4. **Chromium bug with inline `<span>` children**: When `aria-atomic="false"`, JAWS/NVDA/TalkBack on Chrome announce everything instead of just changes if children are `<span>` (inline). **Use `<div>` (block-level) children instead.** (Chromium issue #1148404). This also affects `role="status"` regions — if you update part of a status message using `<span>`, use block-level `<div>` wrappers to ensure only the changed part is announced.
5. **VoiceOver macOS ignores the polite queue** — it may interrupt current speech even for `polite` regions.

## Core Concepts

### Roles and Implicit Mappings

| Role/Attribute | Implicit `aria-live` | Implicit `aria-atomic` | Use case |
|---------------|---------------------|----------------------|----------|
| `role="alert"` | `assertive` | `true` | Critical, time-sensitive messages |
| `role="status"` | `polite` | `true` | Advisory info (search results count, form status) |
| `role="log"` | `polite` | `false` | Chat messages, activity logs |
| `role="timer"` | `off` | — | Countdown/elapsed time (usually NOT announced) |
| `role="marquee"` | `off` | — | Scrolling content (usually NOT announced) |
| `aria-live="polite"` | — | `false` (default) | General non-urgent updates |
| `aria-live="assertive"` | — | `false` (default) | Urgent updates that interrupt |

### The DOM-First Rule (Critical)

**The live region container MUST exist in the DOM before content changes occur.** If you dynamically inject an element with `role="alert"` already containing text, many screen readers will NOT announce it.

**Wrong approach:**
```html
<!-- Injected dynamically with content already inside — may be missed -->
<div role="alert">Error: invalid email</div>
```

**Correct approach:**
```html
<!-- Container exists in DOM on page load, empty -->
<div role="alert" id="error-output"></div>

<!-- Later, inject content INTO the existing container -->
<script>
  document.getElementById('error-output').textContent = 'Error: invalid email';
</script>
```

This is the #1 cause of "my live region doesn't work" bugs. The live region must be registered by the accessibility tree before mutations trigger announcements.

## AT Support Reality — Critical Gaps

### 1. `aria-busy="true"` — Almost Universally Broken

**a11ysupport.io: 14/22 (partial support)**

`aria-busy="true"` is supposed to suppress live region announcements until set back to `false`. In practice:

| AT | `aria-busy="true"` suppression |
|---|---|
| JAWS (Chrome/Edge/Firefox) | **Supported** |
| Narrator (Edge) | **None** — ignores aria-busy |
| NVDA (all browsers) | **None** — ignores aria-busy |
| Orca (Firefox) | **None** |
| TalkBack (Chrome) | **None** |
| VoiceOver (iOS/Safari) | **None** |
| VoiceOver (macOS/Safari) | **None** |

**Takeaway:** Only JAWS honors `aria-busy`. Do NOT rely on it to batch updates. Instead, build your own debounce: accumulate changes in JavaScript, then inject the final content into the live region in a single DOM mutation.

### 2. `aria-live="assertive"` Does NOT Interrupt in JAWS

**a11ysupport.io: 38/44 (partial support)**

The MUST expectation "interrupt the current announcement" fails in major AT:

| AT + Browser | Assertive interruption |
|---|---|
| JAWS + Chrome | **None** — queued, not interrupted |
| JAWS + Edge | **None** |
| JAWS + Firefox | **None** |
| Narrator + Edge | **Supported** |
| NVDA (all browsers) | **Supported** |
| Orca | **None** |
| TalkBack | **None** |
| VoiceOver (iOS) | **Supported** |
| VoiceOver (macOS) | **Supported** |

**Takeaway:** `aria-live="assertive"` makes the announcement happen "next" but does NOT reliably interrupt in JAWS (the most-used screen reader on desktop). Do not depend on interrupt timing. If the message is truly critical, also provide a visible, focusable mechanism.

### 3. `role="alert"` Implicit Assertive — Same JAWS Problem

`role="alert"` implies `aria-live="assertive"`, but JAWS Chrome/Edge shows **none** for the "interrupt current announcement" expectation. The alert IS announced, but it waits for the current utterance to finish rather than interrupting it.

Additionally:
- **Orca does not support `role="alert"` at all** (none across all expectations)
- **TalkBack partially supports** the implicit `aria-atomic="true"` — it may not announce the full region content

### 4. `role="status"` Implicit `aria-atomic="true"` Gaps

**a11ysupport.io: 59/66 (partial support)**

While `role="status"` announces changes reliably, its implicit `aria-atomic="true"` (announce the entire region) fails in:

| AT + Browser | Implicit aria-atomic=true |
|---|---|
| NVDA + Firefox | **None** — only announces changed text, not full region |
| NVDA + Chrome/Edge | **None** (on named variant) |
| Orca (Firefox) | **None** |
| TalkBack (Chrome) | **Partial** (inconsistent) |

**Practical impact:** If your status region says "3 results found" and you update to "5 results found", NVDA/Firefox may announce only "5" instead of "5 results found". 

**Workaround:** Always replace the entire text content of the status region rather than updating just a number within it. Or add explicit `aria-atomic="true"` (though this still may not fix all AT).

### 5. `aria-atomic="false"` — Broken with Inline Elements

**a11ysupport.io: 37/44 (partial support)**

When `aria-atomic="false"` and new content is added as `<span>` elements (inline), rather than `<div>` elements (block):

| AT + Browser | aria-atomic=false with `<span>` children |
|---|---|
| JAWS + Chrome/Edge | **None** — announces everything instead of just changes |
| NVDA + Chrome/Edge | **None** |
| TalkBack + Chrome | **None** |

This is a **Chromium accessibility tree bug** (Chromium issue #1148404). It works correctly with `<div>` children but fails with `<span>` children.

**Workaround:** When using `aria-atomic="false"`, wrap content changes in block-level elements (`<div>`, `<p>`) rather than inline elements (`<span>`).

### 6. VoiceOver macOS Does NOT Respect Polite Queue

For `aria-live="polite"`, VoiceOver on macOS shows **"none"** for the "not interrupting the current announcement" expectation. This means VoiceOver macOS may interrupt the current announcement even for `polite` regions.

**Practical impact:** The distinction between `polite` and `assertive` is meaningless on VoiceOver macOS. Design as if all live regions may interrupt.

## Common Live Region Mistakes

### 1. Using `role="alert"` For Everything

`role="alert"` fires an assertive announcement. Using it for:
- Search result counts → Use `role="status"` (polite)
- Form field hints → Use `aria-describedby` (no live announcement)  
- Loading spinners → Use `role="status"` with "Loading..." text
- Chat messages → Use `role="log"` (polite, non-atomic)

Reserve `role="alert"` for genuine error conditions or critical time-sensitive warnings.

### 2. Rapid-Fire Updates

If you update a live region multiple times in quick succession (e.g., on every keystroke during a search), screen readers may:
- Skip intermediate announcements and only read the last one
- Queue all announcements, creating an overwhelming stream
- Behave differently depending on the AT

**Solution:** Debounce updates with a 500-1000ms delay for user-triggered changes. For search results:
```javascript
let debounceTimer;
const announceResults = (count) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    statusRegion.textContent = `${count} results found`;
  }, 800);
};
```

### 3. Invisible Live Region With No Content Path

A live region that's visually hidden via `display: none` or `visibility: hidden` will NOT trigger announcements in most AT (the accessibility tree removes the element). Use a visually-hidden CSS class instead:

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### 4. Nesting Live Regions

Nesting `aria-live` regions (or nesting `role="alert"` inside `role="status"`) causes unpredictable double-announcements or no announcement at all. Each live region should be a flat, standalone container.

### 5. Using `aria-relevant` for Removals

`aria-relevant="removals"` has near-zero AT support (already documented in `at-support-gotchas.md`). Do not use it to announce content removal. Instead, update a separate status region with text describing what was removed.

## Decision Guide: Choosing the Right Live Region

```
Is the update critical/time-sensitive?
├── Yes → Is it an error requiring attention?
│   ├── Yes → role="alert" (but remember JAWS won't interrupt)
│   └── No → aria-live="assertive" on a pre-existing container
└── No → Is it advisory status info?
    ├── Yes → role="status" (but replace full text content each time)
    └── No → Is it a sequential log (chat, activity)?
        ├── Yes → role="log"
        └── No → aria-live="polite" on a pre-existing container
```

## Testing Recommendations

1. **Test with JAWS + Chrome** — the most-used desktop combo; catches assertive non-interruption
2. **Test with NVDA + Firefox** — catches aria-atomic failures on status role
3. **Test with VoiceOver + Safari** — catches polite/assertive conflation on macOS
4. **Test with TalkBack + Chrome** — catches mobile-specific live region timing issues
5. **Verify the DOM-first rule** — ensure live region containers exist before content injection
6. **Test rapid updates** — verify debouncing prevents announcement floods
7. **Test with both block and inline child elements** — catches the Chromium span bug
