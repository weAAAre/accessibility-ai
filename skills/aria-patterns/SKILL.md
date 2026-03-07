---
name: aria-patterns
description: >
  Expert knowledge base for building accessible UI components with awareness of
  real-world assistive technology (AT) support gaps. Goes beyond the WAI-ARIA spec
  to provide actual AT compatibility data from a11ysupport.io, known screen reader
  quirks, proven workarounds, and the critical gotchas that emerge when ARIA meets
  real users on real devices.
  Use this skill whenever the user is building, reviewing, fixing, or testing an
  interactive UI component for accessibility — especially when they need to know what
  actually works across screen readers, not just what the spec says should work.
  Trigger on mentions of "ARIA", "a11y", "accessibility", "screen reader", "keyboard
  navigation", "WAI-ARIA", "APG patterns", "AT support", "assistive technology",
  "aria-modal", "tooltip role", "combobox", "menu pattern", "switch role", or any
  question about whether an ARIA feature actually works in practice. Also trigger
  when the user mentions specific screen readers (JAWS, NVDA, VoiceOver, TalkBack,
  Narrator) or asks about cross-browser/cross-AT compatibility for accessible components.
license: MIT
metadata:
  author: weAAAre
  version: 0.14.0
---

# ARIA Accessible Component Patterns

This skill provides deep, practical knowledge about accessible UI component patterns based on the [WAI-ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/).

## Why this skill exists

LLMs already know the ARIA spec reasonably well. What they often get wrong is the **gap between spec and reality**:

- `role="tooltip"` has **3/33 MUST support** on a11ysupport.io — it's essentially dead
- `aria-modal="true"` is **not supported** by TalkBack, Narrator, or Orca — your modal isn't actually modal
- `aria-autocomplete` has **11/55 MUST support** — screen readers mostly ignore it
- `aria-errormessage` has **~20% MUST support** — designed for form errors but AT ignores it; use `aria-describedby` instead
- `aria-relevant` is **completely broken for ANY non-default value** — `"additions"` alone has 0/11 full support (NVDA ZERO on all browsers — stops announcing entirely); `"text"` alone also 0/11 (Narrator, VoiceOver iOS/macOS = none); `"removals"` 2/11 (VoiceOver only); the default `"additions text"` is the ONLY value that works (11/11)
- `aria-controls` navigation works **only in JAWS** — other screen readers don't expose it
- `role="menu"` is for **application commands, not site navigation** — this is the #1 ARIA misuse
- `aria-busy="true"` is supposed to suppress live region updates but **only JAWS supports it** — every other screen reader ignores it
- `aria-live="assertive"` does **NOT interrupt** in JAWS — the most-used desktop screen reader queues it instead
- `aria-details` has **7/11 MUST support** — VoiceOver (macOS + iOS), Narrator, and TalkBack completely ignore it; use `aria-describedby` as primary link to descriptions
- `aria-activedescendant` is **completely unsupported for combobox on VoiceOver macOS/Safari** — it works for menus but combobox options are invisible; use DOM focus (roving tabindex) instead
- `aria-current` has **ZERO support on Narrator and Orca** — the attribute recommended for breadcrumbs, step indicators, and nav is invisible to Windows built-in and Linux screen readers; dynamic state changes only announced by NVDA and VoiceOver iOS
- `aria-pressed="mixed"` has **near-zero support** — only JAWS (Chrome/Firefox) and VoiceOver macOS convey the tri-state; NVDA, Narrator, Orca, TalkBack, VoiceOver iOS all ignore it
- `aria-sort` dynamic changes are announced by **only NVDA+Firefox (1/11 combos)** — when a user clicks a column header to change sort direction, JAWS, Narrator, VoiceOver (all platforms), Orca, and TalkBack are all silent; Orca and TalkBack can't even read static ascending/descending values
- `aria-colcount="-1"` (unknown column count) is **broken in ALL screen readers (0/11)** — every AT ignores the spec's MUST NOT and announces its own calculated count, misleading users; VoiceOver (macOS + iOS) and TalkBack don't support `aria-colcount` at all
- `aria-flowto` has **10/44 MUST support (23%)** — only JAWS supports alternate reading order navigation; NVDA, VoiceOver, TalkBack, Narrator, and Orca completely ignore it, making it useless for defining multi-column or complex layout reading paths
- `aria-level` above 6 has **ZERO support in JAWS (all browsers) and TalkBack** — only 4/11 combos fully support heading levels >6; JAWS announces "heading" with no level number; restructure headings to stay within 1–6 or encode depth context in the accessible name

This skill provides the AT support reality data that prevents developers from shipping components that work in theory but fail for real screen reader users.

## How to use this skill

1. Read the reference file for the pattern the user needs
2. **Always check `references/at-support-gotchas.md`** for cross-cutting AT support issues — this file contains the most critical knowledge that other sources miss
3. **Check `references/live-regions.md`** whenever the user's component involves dynamic content updates, notifications, or status messages — live region behavior is deeply unintuitive
4. **Check `references/form-validation.md`** whenever the user is implementing form validation, error handling, or required field patterns — `aria-errormessage` is deceptively broken
5. Adapt to the user's context (framework, building vs auditing, testing)

When the user asks about a pattern, prioritize AT support reality over idealized spec behavior. If a feature has known support gaps, say so explicitly and provide workarounds.

## Available patterns

| Pattern | Reference file | Key AT insight |
|---------|---------------|----------------|
| Accordion | `references/accordion.md` | Well-supported; heading structure is the critical factor |
| Checkbox | `references/checkbox.md` | Native recommended; tri-state has nuanced AT behavior |
| Combobox | `references/combobox.md` | `aria-autocomplete` is nearly unsupported — use live regions |
| Dialog (Modal) | `references/dialog.md` | `aria-modal` fails in 3+ screen readers — use `inert` or native `<dialog>` |
| Menu and Menubar | `references/menu.md` | **NOT for site navigation** — only for app-style commands |
| Switch | `references/switch.md` | Falls back to "checkbox" in many screen readers |
| Tabs | `references/tabs.md` | Automatic activation recommended; Tab key goes to panel, NOT next tab |
| Tooltip | `references/tooltip.md` | `role="tooltip"` is essentially dead — rely on `aria-describedby`/`aria-labelledby` |

### Cross-cutting reference

| Reference | File | Content |
|-----------|------|---------|
| AT Support Gotchas | `references/at-support-gotchas.md` | Critical ARIA features with broken AT support, workarounds, and testing recommendations |
| Live Regions | `references/live-regions.md` | aria-busy broken everywhere except JAWS, assertive doesn't interrupt in JAWS, DOM-first rule, debouncing |
| Form Validation | `references/form-validation.md` | aria-errormessage barely works — use aria-describedby; group/radiogroup mobile gaps; DOM-first rule for alerts |

## Reference file structure

Each reference file follows the same structure:

1. **Identity** — what makes a component this pattern (and what doesn't), with a comparison table against similar patterns
2. **Variants** — behavioral differences between sub-types
3. **Anatomy & markup** — required HTML structure and ARIA attributes, with code for both native and custom implementations
4. **Keyboard interaction** — every key the component must respond to, organized as required vs. optional
5. **State management** — how ARIA states change in response to user interaction, with state transition rules
6. **Screen reader expectations** — what semantic information must be conveyed, acknowledging differences across screen readers
7. **Implementation guide** — practical guidance for building the component correctly, with native-first approach
8. **Common mistakes** — frequent accessibility failures and how to fix them
9. **Acceptance criteria** — concise, verifiable checklist for auditing, organized by severity

## General principles

### Prefer native HTML (First Rule of ARIA)

Use native HTML elements whenever they provide the needed semantics. A `<button>` is always preferable to a `<div role="button">`. Only reach for ARIA when no native element can achieve the result.

### Spec vs reality

The ARIA spec defines what SHOULD happen. Real AT support determines what DOES happen. When this skill flags a support gap, take it seriously — millions of users depend on screen readers that may not implement the spec correctly. Always provide fallbacks for features with known gaps.

### Screen reader announcements are semantic, not verbatim

When this skill describes what a screen reader should announce, it refers to the semantic information that must be conveyed — not the exact words. NVDA, JAWS, VoiceOver, and TalkBack each phrase things differently, but the underlying meaning must be present.

### Severity levels

- **Critical** — Failure makes the component unusable for AT users. Must be resolved.
- **Major** — Failure significantly degrades the experience. Should be resolved.
- **Minor** — Usability inconvenience. Resolve when possible.
