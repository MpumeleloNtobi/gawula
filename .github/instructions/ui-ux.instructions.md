---
description: "Use when building, editing, or reviewing any Gawula customer or admin UI (React/Next .tsx/.jsx, Tailwind, globals.css). Covers usability heuristics, accessibility (WCAG 2.2 AA), visual hierarchy, interaction and feedback, responsive layout, forms, and Gawula's copy and brand rules."
applyTo: "apps/admin/src/**/*.tsx, apps/admin/src/**/*.jsx, apps/admin/src/**/*.css"
---

# Gawula UI/UX guide

Applies to every customer and admin surface. These are the always-on rules; for
a deeper audit of a screen, run the `ui-ux-reviewer` agent.

## Usability first (Nielsen heuristics, condensed)

- Show system status: every action gives immediate, visible feedback (loading,
  saved, error). Never leave the user guessing whether something worked.
- Match the real world: name things the way a customer would (their words, not
  the data model). Order, cart, store, delivery, pickup.
- User control: actions are reversible where possible; destructive ones confirm.
- Consistency: reuse existing components, tokens, and patterns before inventing.
  The same action keeps the same label across the whole flow.
- Prevent errors: constrain inputs, disable invalid submits, set sensible
  defaults, so mistakes can't easily happen.
- Recognition over recall: keep choices and context visible; don't make people
  remember values from a previous step.
- Aesthetic and minimal: every element earns its place. Remove anything that
  does not help the user act. Quiet beats decorated.

## Visual hierarchy and layout

- One clear primary action per view; secondary actions are visually quieter.
- Group related things and separate unrelated ones with spacing, not borders
  (Gestalt proximity). Use whitespace as the main grouping device.
- Establish hierarchy with size, weight, and colour, in that order. Cap weight
  at `font-semibold` (no bold/extrabold/black).
- Keep a consistent spacing rhythm (Tailwind 4/8px scale); align to a grid.
- Limit line length for readable body copy; constrain narrow forms/marketing
  content to `max-w-md`/`max-w-2xl` rather than full width.

## Accessibility (WCAG 2.2 AA, non-negotiable)

- Contrast: >= 4.5:1 body text, >= 3:1 large text, icons, and UI boundaries.
- Visible focus: never remove a focus ring without a clearly visible
  replacement. Keyboard users must always see where they are.
- Full keyboard operability: everything clickable is reachable and operable by
  keyboard in a logical tab order. Use real `<button>`/`<a>`, not click-`<div>`.
- Touch targets: comfortable hit areas (aim ~44px); never below 24px.
- Semantics first: use the correct element; reach for ARIA only when native
  semantics can't express it. Label every input (`<label htmlFor>`); give
  meaningful `alt` text (empty `alt=""` for decorative imagery).
- Respect `prefers-reduced-motion`: tone down or remove non-essential motion.
- Do not rely on colour alone to convey state (pair with text or icon).

## Interaction and feedback

- Design all four states for any data view: loading, empty, error, and content.
  Empty is an invitation to act; error explains what happened and how to fix it,
  in the product's voice (no apologies, no vague "something went wrong").
- Give affordances: interactive things look interactive; hover/active/disabled
  states are clear. Signal hover with colour/opacity, never an added underline.
- Keep perceived performance high: optimistic updates and skeletons over spinners
  where it fits; debounce expensive work.
- Motion has a purpose (orient, confirm, direct attention). Skip ambient/
  decorative animation. Keep durations short.

## Responsive

- Mobile-first: design the small screen first, enhance upward.
- Fluid, content-driven breakpoints; no horizontal scroll; no fixed pixel widths
  that break on narrow screens.
- Verify the layout, tap targets, and nav at mobile widths, not just desktop.

## Forms

- Visible label per field (placeholders are not labels). Correct `type`,
  `inputMode`, and `autoComplete` for each input.
- Validate at the boundary; keep the submit disabled until valid; surface a
  specific, recoverable message on failure.
- Textareas are never user-resizable: always `resize-none`.

## Content and copy

- Voice: conversational, plain verbs, sentence case, no filler. Specific beats
  clever. Active voice ("Save changes", not "Submit").
- Spelling: SA / British English everywhere (favourites, neighbourhood, colour,
  organise, centre). Never US spellings in copy.
- No all-uppercase styling (no `uppercase` class / `text-transform`).
- No em-dashes or en-dashes in user-facing copy; use commas, colons, full stops,
  or parentheses. Same for `&mdash;`.
- Vocabulary: "store" (not "shop") and "cart" (not "basket") in user-facing copy.
- Currency: no space between symbol and number (`R150.00`). Strip the space that
  `en-ZA` `Intl.NumberFormat` inserts.
- Page titles/meta use a pipe separator: `Page | Gawula`.

## Gawula specifics

- Aesthetic: minimal, clean, Uber Eats-like. Avoid decorative pills, dots,
  badges, brand-label rows, heavy cards, and unnecessary borders/dividers.
- Accent: orange `primary`. Never switch to Uber Eats green, even when copying
  their layout patterns.
- No emojis or emoji-style icon sets. Use neutral line icons or real imagery.
- Navigation: no on-page Back buttons; rely on the browser's native back.
- Don't add redundant subheadings under an `h1` (e.g. "N stores available").
- Selection states: don't double-signal. If a native radio/checkbox shows
  selection, don't also invert the background.
- Fulfilment icons everywhere: delivery -> `lucide:Bike`; pickup ->
  `WalkingPickupIcon` (never a shopping bag for pickup).
- North-star: people do one trip with multiple stops. Surface the bundle/trip
  before individual stores; batch cart, checkout, fees, and ETA by bundle, not
  per store. Never imply each store is its own separate journey.

## Before you ship

Run through: primary action obvious; loading/empty/error states handled;
keyboard + focus + contrast pass; mobile width checked; copy follows the rules
above. For non-trivial UI changes, run the `ui-ux-reviewer` agent and address
its findings.
