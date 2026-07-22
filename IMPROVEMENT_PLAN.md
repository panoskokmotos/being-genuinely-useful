# Improvement Plan — Being Genuinely Useful

_Generated: 2026-07-22_

---

## 🔥 P0 — Ship this week (bugs breaking user flows)

### 1. `chapters` variable declared twice — all JavaScript is broken
- **What**: `const chapters` and `let chapters` are both declared at the top-level `<script>` scope, causing a `SyntaxError: Identifier 'chapters' has already been declared` that prevents all JS from loading.
- **Where**: `index.html` lines 2495 and 2655 (same `<script>` block)
- **Why it matters**: Every interactive feature on the page — progress bar, sidebar, scroll animations, PDF download, audiobook, copy-link — silently fails to initialise. Visitors see a static page with no working buttons.
- **Effort**: S
- **Suggested fix**:
  - Rename the audiobook variable at line 2655 from `let chapters = []` to `let audiobookChapters = []`
  - Update every reference inside the audiobook functions (`initAudiobook`, `playChapter`, `toggleAudiobook`) to use `audiobookChapters`
  - Remove the `const chapters` variable re-declared inside `downloadPDF()` at line 2580 (use a `const` inside the function body, which is already scoped — it's fine; the outer ones are the conflict)

---

### 2. Hardcoded `openclaw.ai/book` URL embedded in every generated PDF
- **What**: The PDF download function writes `openclaw.ai/book` as the attribution URL, which is a dead link unrelated to the live site.
- **Where**: `index.html` line 2577 — `doc.text('openclaw.ai/book', pageWidth / 2, y, { align: 'center' });`
- **Why it matters**: Every PDF a reader downloads has a broken URL. Readers who share the PDF will bounce visitors to a dead domain.
- **Effort**: S
- **Suggested fix**:
  - Replace the hardcoded string with `window.location.origin` or a constant pointing to the actual Vercel deployment URL (`being-genuinely-useful.vercel.app`)
  - Example: `doc.text(window.location.origin, pageWidth / 2, y, { align: 'center' });`

---

### 3. Mobile navigation is non-functional — no menu on small screens
- **What**: The nav links are hidden on mobile (`display: none` on `.nav-links`), and a `.mobile-menu-btn` is defined in CSS and shown at `<768px`, but there is no corresponding HTML element and no JavaScript handler to toggle a mobile menu.
- **Where**: `index.html` lines 544–549 (CSS hide), lines 601–614 (CSS show button), `cards.html` lines 329–332 (same pattern) — no HTML/JS for the button exists in either file
- **Why it matters**: Mobile users (~50%+ of typical web traffic) have no way to navigate to Framework, Systems, Exercises, or the Cards page without guessing URLs or scrolling the entire page.
- **Effort**: M
- **Suggested fix**:
  - Add `<button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Open navigation" aria-expanded="false">☰</button>` to both nav elements
  - Add a `<ul class="nav-links nav-links-mobile" id="mobileMenu">` dropdown that mirrors the desktop nav
  - Wire up a JS toggle: `document.getElementById('mobileMenuBtn').addEventListener('click', () => { ... })`

---

## ⚡ P1 — High ROI (UX friction blocking conversion)

### 4. Audiobook crashes silently when Speech Synthesis is unavailable
- **What**: `window.speechSynthesis` is accessed without a guard; on browsers that don't support it (Firefox Android, some Safari versions, WebViews) clicking "Listen to Audiobook" throws an uncaught TypeError.
- **Where**: `index.html` lines 2651–2653 (`let synth = window.speechSynthesis;`) and line 2706 (`synth.speak(utterance);`)
- **Why it matters**: The audiobook is a top CTA in the hero section. A crash on unsupported browsers degrades trust with no explanation to the user.
- **Effort**: S
- **Suggested fix**:
  - Guard the synth initialisation: `const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;`
  - In `playChapter()` and `toggleAudiobook()`, check `if (!synth)` and call `showToast('Audiobook not supported in this browser.')` instead

### 5. `copyLink()` has no fallback and swallows clipboard permission errors
- **What**: `navigator.clipboard.writeText()` is called with no `.catch()`. If the user denies clipboard permission or the API is unavailable, the promise silently rejects.
- **Where**: `index.html` lines 2752–2755
- **Why it matters**: The share flow is broken for users who block clipboard access, with no toast or fallback (e.g., `prompt()` with the URL pre-selected).
- **Effort**: S
- **Suggested fix**:
  - Add `.catch(() => showToast('Copy failed — paste this URL: ' + window.location.href))`
  - Or use a `try/catch` with a `document.execCommand('copy')` fallback for older browsers

### 6. `scaling.html` and `distribution.html` are orphan pages
- **What**: Two full pages (`/scaling` and `/distribution`) are deployed and rewritten in `vercel.json` but are linked from nowhere in the main nav, the footer, or any CTA.
- **Where**: `vercel.json` lines 6–18; no inbound links in `index.html` or `cards.html`
- **Why it matters**: Content the author invested in (30-day plan, passive income strategy, email course, Twitter playbook) is invisible to organic visitors. Zero conversion opportunity.
- **Effort**: S
- **Suggested fix**:
  - Add links in the footer or as a secondary CTA section after the final chapter
  - Or add "Distribution" and "Scaling" to the nav as dropdown items

### 7. No `<meta>` description or Open Graph tags — social sharing is bare
- **What**: `index.html` has `<title>` but no `<meta name="description">`, `<meta property="og:*">`, or `<meta name="twitter:card">`. When shared on Twitter, LinkedIn, or iMessage, the link preview is blank.
- **Where**: `index.html` lines 3–9 (head section); same issue in `cards.html`, `scaling.html`, `distribution.html`
- **Why it matters**: The share-cards feature exists specifically to drive social distribution; a blank preview unfurl halves click-through rates.
- **Effort**: S
- **Suggested fix**:
  - Add to each page's `<head>`:
    ```html
    <meta name="description" content="A practical guide to building genuinely useful things in an AI world.">
    <meta property="og:title" content="Being Genuinely Useful in an AI World">
    <meta property="og:description" content="10 chapters. 8 exercises. The ideas behind specific knowledge, hard-to-vary explanations, and knowledge markets.">
    <meta property="og:image" content="https://being-genuinely-useful.vercel.app/og-image.png">
    <meta name="twitter:card" content="summary_large_image">
    ```

### 8. External CDN dependency for jsPDF — PDF fails if CDN is unreachable
- **What**: `jsPDF` is loaded from `cdnjs.cloudflare.com` at runtime. If the CDN is blocked (corporate firewalls, China) or the request times out, clicking "Download PDF" fails with a JS error.
- **Where**: `index.html` line 2467 — `<script src="https://cdnjs.cloudflare.com/.../jspdf.umd.min.js">`
- **Why it matters**: The PDF is pitched as a core deliverable ("Get the Full Book"); a silent failure here loses the reader's email and share-intent.
- **Effort**: M
- **Suggested fix**:
  - Bundle jsPDF locally (`pnpm add jspdf`, copy the UMD build to a `/vendor/` directory)
  - Or add a `try/catch` on `window.jspdf` and surface an error message with a print alternative: `showToast('PDF unavailable — use Ctrl+P / Print instead.')`

---

## 🛠 P2 — Code health (tech debt slowing velocity)

### 9. CSS duplicated verbatim across `index.html` and `cards.html`
- **What**: The nav, toast, button, and typography styles (≈200 lines) are copy-pasted identically into both HTML files. Any brand change requires editing two files in sync.
- **Where**: `index.html` lines 43–115 and `cards.html` lines 39–110 (nav and shared styles); same for button, toast, and footer CSS
- **Why it matters**: The last time nav was updated, both files needed touching; one missed sync will create visual inconsistency.
- **Effort**: M
- **Suggested fix**:
  - Extract shared CSS into `style.css` (referenced from both files via `<link rel="stylesheet" href="/style.css">`)
  - Keep only page-specific overrides inline

### 10. `index.html` is 2,779 lines — a single unstructured file
- **What**: The entire ebook (10 chapters, all CSS, all JavaScript, audio player, PDF generator) lives in one file. There is no build step, no component separation, and no way to diff chapter content from layout or behaviour.
- **Where**: `index.html` (entire file)
- **Why it matters**: Adding a new chapter or fixing a chapter-specific bug requires navigating 2,700+ lines of mixed HTML/CSS/JS. The probability of accidental regressions is high.
- **Effort**: L
- **Suggested fix**:
  - Extract JavaScript to `script.js`
  - Extract CSS to `style.css`
  - Consider breaking chapters into `<template>` partials or Markdown files rendered server-side (even a minimal Node build step)

### 11. PDF button state restoration is fragile (innerHTML clobber)
- **What**: After PDF generation, the button is restored by re-setting `btn.innerHTML` to a hardcoded SVG+text string. If the original button markup changes, the restored state won't match.
- **Where**: `index.html` lines 2538–2539 and 2646–2648
- **Why it matters**: Low risk now, but will silently break the next time the button text or icon is updated.
- **Effort**: S
- **Suggested fix**:
  - Save `const originalHTML = btn.innerHTML` before the try/catch and restore `btn.innerHTML = originalHTML` in the finally block

### 12. No `<html lang="en">` on `cards.html`
- **What**: `index.html` correctly has `<html lang="en">` but `cards.html` does not.
- **Where**: `cards.html` line 2
- **Why it matters**: Screen readers default to the browser's UI language for speech synthesis, causing mispronunciation on cards read aloud. Also fails WCAG 3.1.1 (Level A).
- **Effort**: S
- **Suggested fix**:
  - Change `<html>` to `<html lang="en">` in `cards.html`

---

## 💡 P3 — Nice to have

### 13. Reading progress is not persisted across page reloads
- **What**: There is no `localStorage` save of scroll position or current chapter. Readers who close the tab restart from the cover every time.
- **Where**: `index.html` — scroll/progress JS section (lines 2473–2478 and sidebar observer)
- **Why it matters**: A 40-page ebook is typically read in multiple sessions; losing position every reload increases drop-off.
- **Effort**: M
- **Suggested fix**:
  - On scroll, debounce and write `localStorage.setItem('progress', window.scrollY)` 
  - On load, `window.scrollTo(0, localStorage.getItem('progress') || 0)` after a brief delay

### 14. Card filter counts are not shown — users can't tell which author has more cards
- **What**: Filter pills on `cards.html` show author names but no count badges, so users don't know whether "Epictetus" yields 1 card or 10.
- **Where**: `cards.html` lines 413–425 (filter buttons); JS card-filtering section
- **Why it matters**: Users may not bother clicking filters if they can't gauge the yield. Card variety is a selling point.
- **Effort**: S
- **Suggested fix**:
  - After rendering cards, count per-author and append a count badge: `<button data-filter="Epictetus">Epictetus <span class="badge">2</span></button>`

### 15. Google Fonts loaded without `font-display: swap` — layout shift on slow connections
- **What**: The Google Fonts URL does not include `&display=swap`. On slow connections, text may be invisible until fonts load (FOIT).
- **Where**: `index.html` line 9 and `cards.html` line 9 — Google Fonts `<link href="...">`
- **Why it matters**: Core Web Vitals — increases CLS and FID scores for mobile visitors.
- **Effort**: S
- **Suggested fix**:
  - Append `&display=swap` to the Google Fonts URL, or self-host the fonts alongside the HTML files
