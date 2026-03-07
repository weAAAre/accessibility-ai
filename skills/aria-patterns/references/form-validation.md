# Form Validation — Accessible Error Handling with AT Support Reality

> The most common accessibility task — form validation — is also where the spec-vs-reality gap is most deceptive. `aria-errormessage` barely works. `aria-describedby` is the real workhorse.

---

## The `aria-errormessage` trap

The ARIA spec added `aria-errormessage` (ARIA 1.1+) specifically to associate error text with invalid fields. Developers assume it works because it exists. **It does not work in most screen readers.**

### AT support data (a11ysupport.io — MUST: convey error message when pertinent)

| Screen Reader | Browser | Reads aria-errormessage? |
|---|---|---|
| JAWS | Chrome | ✅ Supported |
| JAWS | Edge | ✅ Supported |
| Narrator | Edge | ❌ None |
| NVDA | Chrome | ✅ Supported |
| NVDA | Edge | ❌ None |
| NVDA | Firefox | ✅ Supported |
| Orca | Firefox | ✅ Supported |
| TalkBack | Chrome | ✅ Supported |
| VoiceOver | Safari (iOS) | ✅ Supported |
| VoiceOver | Safari (macOS) | ❌ None |

**Key gaps**: Narrator (Edge) and VoiceOver macOS (Safari) completely ignore `aria-errormessage`. A user on the default Windows screen reader or the default macOS screen reader will never hear your error message through this attribute.

### The correct pattern: `aria-describedby` as primary

```html
<!-- ✅ Correct: aria-describedby + aria-invalid + aria-errormessage as enhancement -->
<label for="email">Email address</label>
<input
  type="email"
  id="email"
  aria-invalid="true"
  aria-describedby="email-error"
  aria-errormessage="email-error"
>
<span id="email-error" class="error">Please enter a valid email address.</span>
```

**Why both?** `aria-describedby` is fully supported across all screen readers. When the user focuses the field, the description (error text) is always announced. `aria-errormessage` is added as progressive enhancement — screen readers that support it get a cleaner experience (they only announce the error when `aria-invalid="true"`, not when the field is valid). But `aria-describedby` ensures NO user misses the error.

### Critical: hide the error element when not applicable

If using `aria-describedby` for error messages, the error element must not exist or be empty when the field is valid. Otherwise, the screen reader announces an empty description or stale error text.

```html
<!-- When valid: error element exists but is empty -->
<input type="email" id="email" aria-describedby="email-error">
<span id="email-error" class="error"></span>

<!-- When invalid: error element has content -->
<input type="email" id="email" aria-invalid="true" aria-describedby="email-error">
<span id="email-error" class="error">Please enter a valid email address.</span>
```

---

## Live region error announcements

For **dynamic validation** (real-time or on-submit), use an `aria-live` region to announce errors as they appear, without requiring the user to re-focus each field.

### The DOM-first rule

The live region container **must exist in the DOM before content is injected**. Creating a new element with `role="alert"` that already contains text will NOT trigger an announcement in most screen readers.

```html
<!-- ✅ Correct: empty container in DOM on page load -->
<div id="form-errors" role="alert" aria-atomic="true"></div>

<!-- When errors occur, inject text into the existing container -->
<script>
  document.getElementById('form-errors').textContent = 'Please fix 2 errors below.';
</script>
```

```html
<!-- ❌ Wrong: dynamically creating element with role="alert" + content -->
<script>
  const errorDiv = document.createElement('div');
  errorDiv.setAttribute('role', 'alert');
  errorDiv.textContent = 'Error occurred';
  document.body.appendChild(errorDiv);
</script>
```

### `aria-atomic="true"` is critical for VoiceOver iOS

VoiceOver on iOS requires `aria-atomic="true"` on the error container to re-read the full content on subsequent form submissions. Without it, VoiceOver may only announce the difference between the old and new content, producing garbled error messages.

### Error summary vs inline errors

Two complementary strategies:

| Strategy | How | Best for |
|---|---|---|
| **Error summary** | `role="alert"` container at top of form with count + list of errors | On-submit validation; gives overview |
| **Inline errors** | `aria-describedby` on each field pointing to adjacent error text | Field-level context; helps user fix in place |

**Use both together** for the best experience:
1. On submit: inject summary into the `role="alert"` region at the top, listing all errors
2. Move focus to the error summary (or first invalid field)
3. Each field has its own `aria-describedby` error message for context when the user tabs to it

---

## `aria-required` and group validation gaps

### `aria-required` on radio groups

| Screen Reader | On `<input type="radio">` | On `role="radiogroup"` |
|---|---|---|
| JAWS | ✅ Supported | ✅ Supported |
| NVDA | ✅ Supported | ✅ Supported |
| Narrator | ✅ Supported | ❌ None |
| Orca | ✅ Supported | ❌ None |
| TalkBack | ❌ None | ❌ None |
| VoiceOver iOS | ✅ Supported | ✅ Supported |
| VoiceOver macOS | ✅ Supported | ✅ Supported |

**Key insight**: `aria-required` on a `role="radiogroup"` fails in Narrator and Orca. TalkBack doesn't support it on either element. **Workaround**: Always include "required" in the group's visible label or legend text. Never rely solely on `aria-required` to convey the required state for radio groups.

### `group` role on mobile

The `group` role (and by extension, `<fieldset>`) is **not conveyed by TalkBack or VoiceOver iOS**. Mobile screen reader users will not hear "group" / "end of group" announcements or the group's accessible name.

**Workaround**: For critical grouping information (like "Payment method" for a set of radio buttons), ensure the group label is also conveyed through:
- A visible heading before the group
- The first control's label including the group context (e.g., "Payment method: Credit card" as the first radio label)

---

## Form validation decision guide

```
Is the error shown on submit or in real-time?
├─ On submit
│  ├─ Use role="alert" container (pre-existing in DOM) for error summary
│  ├─ Move focus to summary or first invalid field
│  └─ Each field: aria-invalid="true" + aria-describedby="field-error"
├─ Real-time (as user types / on blur)
│  ├─ Use aria-describedby on each field for inline errors
│  ├─ Debounce validation (300-500ms) to avoid rapid announcements
│  ├─ Do NOT use role="alert" for individual field validation (too many interruptions)
│  └─ Optionally: role="status" region for a single summary like "2 errors remaining"
└─ Both (hybrid)
   ├─ Real-time: aria-describedby only (silent until user focuses field)
   └─ On submit: role="alert" summary + focus management
```

### Always include

1. **`aria-invalid="true"`** on invalid fields — well-supported across all AT
2. **`aria-describedby`** pointing to error text — the only reliable cross-AT error association
3. **`aria-errormessage`** pointing to same error element — progressive enhancement
4. **Visible error text** adjacent to the field — benefits all users, not just AT users
5. **Focus management** — on submit, move focus to error summary or first invalid field

### Never rely on alone

- `aria-errormessage` without `aria-describedby` — Narrator and VoiceOver macOS will miss it
- `aria-required` on radiogroup without visible "required" text — TalkBack ignores it
- Dynamically created `role="alert"` elements — DOM-first rule
- Color alone to indicate errors — WCAG 1.4.1 Use of Color

---

## WCAG success criteria for form errors

| Criterion | Requirement | Key technique |
|---|---|---|
| **1.3.1** Info and Relationships | Error messages programmatically associated with fields | `aria-describedby` |
| **3.3.1** Error Identification | Errors identified and described in text | Visible error message + `aria-invalid` |
| **3.3.3** Error Suggestion | Suggest corrections when known | Error text includes expected format |
| **3.3.4** Error Prevention (Legal) | Allow review/correction for legal/financial | Confirmation step before final submission |
| **4.1.3** Status Messages | Status messages announced without focus change | `role="alert"` or `aria-live` for error summary |

---

## Common mistakes

1. **Using only `aria-errormessage`** expecting all screen readers to read it → Use `aria-describedby` as primary
2. **Creating `role="alert"` elements dynamically with content** → Pre-create empty container
3. **Using `role="alert"` for every inline field error** → Overwhelming; use `aria-describedby` for inline, `role="alert"` for summaries only
4. **Forgetting to set `aria-invalid="true"`** → Most critical signal; well-supported everywhere
5. **Leaving stale error text in `aria-describedby` target** → Clear error text when field becomes valid
6. **No focus management on submit** → User doesn't know errors exist if they're above the viewport
7. **Relying on `aria-required` for radiogroup on mobile** → TalkBack ignores it entirely
