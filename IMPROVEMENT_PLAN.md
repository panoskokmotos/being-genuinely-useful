# Givelink Improvement Plan

_Generated: 2026-06-12. Based on static analysis of `index.html`, `cards.html`, `distribution.html`, `scaling.html`, and `server.js`._

---

## 🔥 P0 — Ship this week (bugs breaking user flows)

### 1. Web Speech API fails silently — "Listen" button does nothing on unsupported browsers

- **What**: `speakText()` calls `window.speechSynthesis.speak()` with no check for API availability; on iOS Safari and some mobile browsers the button appears but nothing plays.
- **Where**: `index.html:2657–2709`
- **Why it matters**: Any reader who clicks "Listen" on Chrome for iOS or Firefox Android gets zero feedback — they assume the feature is broken and lose trust.
- **Effort**: S
- **Suggested fix**:
  - Guard with `if (!('speechSynthesis' in window))` before setting up the UI
  - Show a toast: _"Audio not supported in this browser — try Chrome on desktop"_
  - Optionally hide the Listen button entirely so the CTA doesn't mislead

---

### 2. Clipboard copy failure is completely silent

- **What**: `copyLink()` calls `navigator.clipboard.writeText()` with a `.then()` but no `.catch()`, so permission denial or HTTPS requirement failures produce no user feedback.
- **Where**: `index.html:2752–2756`
- **Why it matters**: On HTTP (local/preview) or when the user denies clipboard permission, they click "Copy link", see nothing happen, and assume the button is broken.
- **Effort**: S
- **Suggested fix**:
  - Add `.catch(() => showToast('Could not copy — please copy the URL manually'))`
  - As a fallback, `prompt('Copy this link:', window.location.href)` works everywhere with no permissions

---

### 3. Canvas `getContext()` returns null — card image download crashes without feedback

- **What**: `downloadCardImage()` calls `canvas.getContext('2d')` and immediately uses `ctx` without a null check. If the browser has exhausted canvas contexts or the element is missing, the function throws a TypeError that swallows the "Image downloaded!" toast.
- **Where**: `cards.html:642–694` (critical line: `const ctx = canvas.getContext('2d')`)
- **Why it matters**: The card image download is the primary share action on the cards page — a silent crash here kills the core share loop.
- **Effort**: S
- **Suggested fix**:
  - Add `if (!ctx) { showToast('Could not generate image — please try again'); return; }` immediately after `getContext`
  - Wrap the entire function in `try/catch` and show a descriptive toast on failure

---

## ⚡ P1 — High ROI (UX friction blocking conversion)

### 4. PDF generation shows no spinner — users think the app is frozen for 3–5 seconds

- **What**: `downloadPDF()` changes the button text to "Generating..." but adds no spinner or visual progress indicator during the 3–5 second jsPDF render.
- **Where**: `index.html:2536–2648` (button state change at ~2538; generation starts at ~2550)
- **Why it matters**: A modern user will click the button again or navigate away within 3 seconds of seeing no movement — generating two PDF processes and likely crashing the tab.
- **Effort**: S
- **Suggested fix**:
  - Add a CSS `@keyframes` spin animation and apply it to the button icon during generation
  - Disable the button with `btn.disabled = true` for the full duration so double-clicks are blocked
  - The `.loading` class already exists in CSS — verify it actually shows a visible spinner (currently it only changes text)

---

### 5. Toast notifications are invisible to screen readers — no `aria-live` region

- **What**: Both `showToast()` implementations (`index.html:2759–2775`, `cards.html:696–704`) inject text into a DOM node that has no `aria-live` attribute, so screen readers never announce it.
- **Where**: `index.html:2759–2775` and `cards.html:696–704`
- **Why it matters**: Every confirmatory action (copy, download, share) gives visual-only feedback — screen reader users have no idea if their action succeeded.
- **Effort**: S
- **Suggested fix**:
  - Add `aria-live="polite"` and `aria-atomic="true"` to the toast container element
  - Ensure the toast container exists in DOM on page load (not injected dynamically) so the live region is registered before content changes

---

### 6. Icon-only audio buttons have no accessible labels

- **What**: Play, Pause, Previous, and Next buttons in the audio player use only icon glyphs with no `aria-label`, making them announced as unlabelled buttons to screen readers.
- **Where**: `index.html:2425–2450`
- **Why it matters**: WCAG 2.1 SC 4.1.2 violation. Users navigating by keyboard or screen reader cannot operate the core "Listen" feature.
- **Effort**: S
- **Suggested fix**:
  - Add `aria-label="Play"`, `aria-label="Pause"`, `aria-label="Previous chapter"`, `aria-label="Next chapter"` to each button
  - Toggle `aria-label` dynamically when play/pause state changes (e.g., `btn.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play')`)

---

### 7. Card filter shows an empty grid with no "no results" message

- **What**: When the user applies a filter that matches zero cards, the grid renders empty — no empty state, no suggestion to clear the filter.
- **Where**: `cards.html:579–613` (filter logic), grid container at approximately line 395
- **Why it matters**: An empty grid looks like a loading failure or broken feature; users churn rather than adjusting the filter.
- **Effort**: S
- **Suggested fix**:
  - After filtering, check `visibleCards.length === 0` and inject a message: _"No cards match this filter — [Clear filter]"_
  - The clear action should call the existing reset function

---

### 8. `distribution.html` and `scaling.html` use a completely different visual language from the main site

- **What**: The main site uses `background: #0a0a0a`, `accent: #22c55e`. The distribution and scaling pages use `background: #0f172a` (slate) with `#3b82f6` (blue) and `#10b981` (teal) — a different palette with no shared tokens.
- **Where**: `distribution.html` (all CSS, ~lines 1–120), `scaling.html` (all CSS, ~lines 1–80)
- **Why it matters**: Visitors arriving on these pages via direct links perceive a different product. The brand signal breaks at exactly the moment you want them to trust the distribution/sales message.
- **Effort**: M
- **Suggested fix**:
  - Extract a shared `theme.css` with the root-level CSS custom properties (`--bg-primary`, `--accent`, etc.)
  - Update `distribution.html` and `scaling.html` to `@import` the shared theme and replace hardcoded hex values with the variables
  - Unify background to `#0a0a0a`; keep the blue/teal accents only if they serve a deliberate differentiation purpose

---

### 9. Audio player has no keyboard shortcuts — spacebar and arrow keys do nothing

- **What**: Play/pause requires a mouse click; there is no `keydown` listener for spacebar-to-toggle or left/right arrows for chapter navigation.
- **Where**: `index.html:2657–2749` (audio controller setup)
- **Why it matters**: Keyboard accessibility (WCAG 2.1 SC 2.1.1) aside, even mouse users expect spacebar to control audio — its absence feels unpolished during the "try" moment that converts readers.
- **Effort**: S
- **Suggested fix**:
  - Add a `document.addEventListener('keydown', e => { if (e.code === 'Space') togglePlay(); })` guarded to not fire when focus is inside an input
  - Add arrow-key chapter navigation the same way

---

## 🛠 P2 — Code health (tech debt slowing velocity)

### 10. Card accent colors defined twice — CSS and JS are out of sync

- **What**: Card accent colors are declared in CSS (`cards.html:198–201`: `--card-accent: #22c55e` etc.) and again as a JS lookup object (`cards.html:653`: `const colors = { green: '#22c55e', blue: '#3b82f6', ... }`) used for canvas rendering. If one is updated, the card preview and the downloaded image diverge.
- **Where**: `cards.html:198–201` (CSS) and `cards.html:653` (JS)
- **Why it matters**: The next time a designer tweaks a card color, the downloaded PNG will show the old color — a silent visual regression that's hard to notice in testing.
- **Effort**: S
- **Suggested fix**:
  - Read the CSS custom property at runtime: `getComputedStyle(cardEl).getPropertyValue('--card-accent').trim()` and pass that into the canvas render function
  - Delete the hardcoded `colors` object

---

### 11. `showToast()` implemented twice with different behavior

- **What**: `index.html:2759–2775` shows a toast for 3 s with a fade; `cards.html:696–704` has a slightly different implementation with different timing. They will drift further apart over time.
- **Where**: `index.html:2759–2775`, `cards.html:696–704`
- **Why it matters**: A bug fix or style change to toasts must be made in two places — one will inevitably be missed.
- **Effort**: S
- **Suggested fix**:
  - Extract a shared `utils.js` (or an inline `<template>` pattern) with a single `showToast()` implementation
  - Both pages reference the same function

---

### 12. Navigation bar duplicated across three pages with slight link differences

- **What**: The nav bar HTML is copy-pasted into `index.html`, `cards.html`, and `distribution.html` with minor variations (different active states, slightly different link sets).
- **Where**: `index.html:1376–1387`, `cards.html:394–405`, `distribution.html` (top nav block)
- **Why it matters**: Adding a new page or changing a nav label requires three edits — guaranteed to produce inconsistencies over time.
- **Effort**: M
- **Suggested fix**:
  - Extract nav to a shared `nav.html` partial and use a simple JS include: `fetch('/nav.html').then(r => r.text()).then(html => navContainer.innerHTML = html)`
  - Or use a `<template>` element in a shared script — the server already runs Express (`server.js`), so server-side includes via EJS/Handlebars are an option

---

### 13. `index.html` is 2,779 lines — content, styles, and scripts are unseparated

- **What**: The entire main experience — book content, CSS custom properties, JavaScript for PDF/audio/share — is in a single 2,779-line HTML file.
- **Where**: `index.html` (entire file)
- **Why it matters**: Can't unit-test any of the JS logic; can't cache CSS/JS independently from content; any script error blocks the full page parse; onboarding a contributor requires reading 2.7K lines to understand anything.
- **Effort**: L
- **Suggested fix**:
  - Extract `<style>` blocks → `public/theme.css`
  - Extract `<script>` blocks → `public/audiobook.js`, `public/pdf.js`, `public/share.js`
  - The Express server already serves static files (`server.js:1–15`) — no infrastructure change needed
  - Do this incrementally: extract scripts first (lowest risk), then styles

---

### 14. Speech synthesis has no timeout — "Pause" button can get permanently stuck

- **What**: `speakText()` starts the speech utterance but never handles `onerror` or sets a watchdog timeout. If synthesis stalls (common on Chrome when the page goes to background), `isPlaying` stays `true` and the button is permanently stuck on "Pause".
- **Where**: `index.html:2675–2709`
- **Why it matters**: The user must refresh the page to recover — a jarring dead end in the core "listen" experience.
- **Effort**: S
- **Suggested fix**:
  - Set `utterance.onerror = (e) => { resetAudioState(); showToast('Audio stopped unexpectedly'); }`
  - On `utterance.onend`, ensure `isPlaying = false` and the button resets (verify this path exists)

---

### 15. `console.error` left in production PDF path

- **What**: `console.error('PDF generation failed:', err)` at `index.html:2642` exposes internal stack traces in the browser console of every end user who hits a PDF error.
- **Where**: `index.html:2642`
- **Why it matters**: Low security risk but reveals implementation details; confuses non-developer users who open DevTools.
- **Effort**: XS
- **Suggested fix**:
  - Remove the `console.error` line; the `showToast('PDF generation failed…')` on the next line is sufficient user feedback
  - If error logging is needed, send to a proper error-tracking service (not console)

---

## 💡 P3 — Nice to have

### 16. Share buttons have no debounce — rapid clicks open multiple Twitter windows

- **What**: `shareOnTwitter()` and `copyLink()` have no debounce or cooldown, so triple-clicking opens three `window.open()` popups or fires three clipboard writes.
- **Where**: `cards.html:597–609`
- **Effort**: XS
- **Suggested fix**: Disable the button for 1.5 s after first click (same pattern used by `downloadPDF()`)

---

### 17. Hardcoded Twitter share URL — will break silently if the endpoint changes

- **What**: `shareOnTwitter()` builds a URL with a hardcoded `https://twitter.com/intent/tweet` endpoint; Twitter has historically changed this to `x.com`.
- **Where**: `cards.html:601–603`
- **Effort**: XS
- **Suggested fix**: Move the base URL to a `const TWITTER_SHARE_URL` constant at the top of the script block so it's a one-line change

---

### 18. No offline / repeat-visit caching (service worker)

- **What**: The site has no service worker, so repeat visits re-download the full 130 KB `index.html` on every load.
- **Where**: No `sw.js` or service worker registration anywhere in the codebase
- **Effort**: M
- **Suggested fix**:
  - Register a minimal Workbox or hand-rolled cache-first service worker for static assets
  - Given the content-heavy nature of the book, aggressive caching would meaningfully improve perceived performance for returning readers

---

### 19. Canvas font hardcoded to Georgia — may render inconsistently across OSes

- **What**: Card image export uses `ctx.font = 'italic 36px Georgia, serif'` with no font loading guarantee.
- **Where**: `cards.html:659`
- **Effort**: S
- **Suggested fix**:
  - Load the page font via `FontFace` API and `await document.fonts.ready` before drawing to canvas
  - This ensures the exported card image matches what the user sees on screen

---

### 20. No `.env.example` — new contributors have no reference for environment configuration

- **What**: `server.js` uses `process.env.PORT` but there is no `.env.example` documenting what environment variables the project expects.
- **Where**: `server.js:109`, repo root (missing file)
- **Effort**: XS
- **Suggested fix**:
  - Create `.env.example` with `PORT=3000` and any other vars referenced in the codebase
  - Add a note to `README.md` pointing to it

---

_Total: 20 items. P0: 3 | P1: 6 | P2: 6 | P3: 5_
