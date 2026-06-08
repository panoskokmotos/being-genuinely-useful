# Improvement Plan — Being Genuinely Useful

> **Note:** This is a static ebook site (four HTML files + a Node server), not the Givelink app with Stripe/checkout. No backend API calls exist. Findings are scoped to what's actually here.

---

## 🔥 P0 — Ship this week (bugs breaking user flows)

### 1. `distribution.html` clipboard silently fails with no user feedback
- **What:** `copyToClipboard()` calls `.then()` but has no `.catch()` — if the browser blocks clipboard access, nothing happens and the user thinks the copy worked.
- **Where:** `distribution.html:665–672`
- **Why it matters:** Every "copy affiliate link" / "copy template" action on this monetisation hub can fail invisibly. Users share broken content.
- **Effort:** S
- **Suggested fix:**
  - Add `.catch(() => { toast.textContent = '⚠ Copy failed — select and copy manually'; toast.classList.add('show'); })` after the `.then()` block
  - Use the same fallback pattern already in `cards.html:619–628` (textarea + `execCommand`)

---

### 2. `cards.html` canvas download has no error handling — silent failure
- **What:** `downloadCardImage()` does raw canvas ops (`getContext`, `fillText`, `toDataURL`) with no try-catch. On certain browsers/iframe contexts the canvas is tainted or disabled and the function throws uncaught.
- **Where:** `cards.html:642–694`
- **Why it matters:** Image download is the primary social-sharing CTA on the cards page. A white-screen exception kills the whole page.
- **Effort:** S
- **Suggested fix:**
  - Wrap the entire function body in `try { ... } catch (err) { showToast('Image download failed. Try screenshotting instead.'); }`
  - Check `canvas.getContext('2d')` returns non-null before proceeding

---

### 3. jsPDF CDN loaded without integrity attribute — supply chain risk + no offline fallback
- **What:** `<script src="https://cdnjs.cloudflare.com/…/jspdf.umd.min.js">` has no `integrity` attribute. If the CDN is slow or returns a 404/500, `window.jspdf` is undefined and the PDF button throws a `TypeError` (currently caught but shows a non-actionable "Try printing" message).
- **Where:** `index.html:2467`, error surface at `index.html:2542`
- **Why it matters:** CDN outages are rare but cause PDF to break completely. Missing SRI is a recognised supply-chain attack vector.
- **Effort:** S
- **Suggested fix:**
  - Add `integrity="sha384-…"` (generate with `openssl dgst -sha384 -binary jspdf.umd.min.js | openssl base64 -A`)
  - Before calling `new jsPDF(...)`, guard with `if (!window.jspdf) { showToast('PDF library failed to load. Please refresh.'); return; }` to surface a helpful message instead of a generic catch

---

### 4. Speech synthesis crashes if Web Speech API is unavailable
- **What:** `toggleAudiobook()` calls `synth.cancel()` and `synth.speak()` without checking if `window.speechSynthesis` exists. On Firefox Android and some privacy-hardened browsers `window.speechSynthesis` is undefined → TypeError throws and the audio player never closes.
- **Where:** `index.html:2651`, `index.html:2664–2672`, `index.html:2706`
- **Why it matters:** Mobile is the majority read surface for shared ebook links. A broken audiobook button that errors on tap degrades trust in the whole product.
- **Effort:** S
- **Suggested fix:**
  - Add guard at top of `toggleAudiobook()`: `if (!window.speechSynthesis) { showToast('Your browser does not support text-to-speech.'); return; }`
  - Disable/hide the audiobook button at page load when API unavailable: `if (!window.speechSynthesis) document.getElementById('audioBtn').style.display = 'none';`

---

## ⚡ P1 — High ROI (UX friction blocking conversion)

### 5. Audio player controls have no aria-labels — screen readers say nothing
- **What:** The five audio player buttons (previous, play/pause, next, close) and the three CTA buttons (Download PDF, Listen to Audiobook, Copy Link) contain only SVG icons with no text alternative.
- **Where:** `index.html:2409–2421` (CTA buttons), `index.html:2432–2448` (audio controls)
- **Why it matters:** Screen reader users hear "button, button, button" with no context — the core content delivery features are completely inaccessible.
- **Effort:** S
- **Suggested fix:**
  - Add `aria-label` to each button: `aria-label="Previous chapter"`, `aria-label="Play"` / `aria-label="Pause"` (toggle via JS alongside the icon swap), `aria-label="Next chapter"`, `aria-label="Close audio player"`
  - For CTA buttons the visible text already labels them sufficiently, but add `aria-label` to the SVG-only version on mobile

---

### 6. No focus-visible styles on interactive elements in main book
- **What:** `index.html` has no `:focus-visible` CSS rules for buttons, links, or the sidebar nav. Users navigating by keyboard have no visual indicator of focus position.
- **Where:** `index.html` (global CSS, ~lines 700–900 button styles)
- **Why it matters:** WCAG 2.1 AA success criterion 2.4.7. Any keyboard-only user — and all power users using Tab navigation — lose their place in the book.
- **Effort:** S
- **Suggested fix:**
  - Add to the global button style: `button:focus-visible, a:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 4px; }`
  - The cards page already has `.card:focus-within` — copy that pattern consistently

---

### 7. `distribution.html` and `scaling.html` use a completely different design system
- **What:** The main book is black (#0a0a0a) with green (#22c55e) accents and Inter/Newsreader fonts. Both satellite pages use a blue-slate gradient (`#0f172a → #1e293b`), blue borders (#3b82f6), and Segoe UI — a completely different visual identity.
- **Where:** `distribution.html:14–33`, `scaling.html:~14–33`
- **Why it matters:** Users who click through from the book feel they've left the product. Brand incoherence is a direct conversion killer on the monetisation and growth pages, which are high-intent destinations.
- **Effort:** M
- **Suggested fix:**
  - Extract the CSS variables from `index.html:11–22` into a `brand.css` file and link it from all four pages
  - Replace `background: linear-gradient(135deg, #0f172a…)` with `background: var(--bg-primary)` and `border: 1px solid #3b82f6` with `border: 1px solid var(--border)` throughout both pages
  - Replace `font-family: 'Segoe UI'…` with `font-family: 'Inter'…` (already loaded on the main page via Google Fonts)

---

### 8. Card color palette (blue, orange, purple) is off-brand and duplicated in JS
- **What:** `cards.html` defines four card accent colors — green, blue (#3b82f6), orange (#f59e0b), purple (#a855f7) — that do not exist in the brand palette. These same colors are hardcoded again in the JS canvas renderer, meaning any color change requires two separate edits.
- **Where:** `cards.html:198–201` (CSS), `cards.html:653` (JS canvas)
- **Why it matters:** Blue/orange/purple cards look mismatched against the black/green brand. When visitors screenshot and share these cards, the brand signal is diluted.
- **Effort:** S
- **Suggested fix:**
  - Either remove the three off-brand colors and use only green, or document them as intentional "chapter accent" variants and update the brand guide
  - Extract the color map from the JS canvas function into a `const CARD_COLORS` object at module scope, driven by `getComputedStyle` reading CSS custom properties — single source of truth

---

### 9. No Open Graph / Twitter Card meta tags — shared links look bare
- **What:** `index.html` has only a bare `<title>` tag. No `og:title`, `og:description`, `og:image`, or `twitter:card` meta tags exist on any page.
- **Where:** `index.html:1–9`, `cards.html:1–9`, `distribution.html:1–9`
- **Why it matters:** Every time someone shares a link to this ebook on LinkedIn, Twitter, or Slack, it renders as a plain URL with no preview. The cards page specifically is designed to drive sharing — missing OG tags mean those shared links generate zero visual previews.
- **Effort:** S
- **Suggested fix:**
  - Add to `<head>` of `index.html`: `og:title`, `og:description` (~160 chars), `og:image` (can be a static 1200×630 card), `og:url`, `twitter:card: summary_large_image`
  - Reuse the canvas-generation logic from `cards.html` to produce a static OG image at deploy time, or commit a screenshot as `og-image.png`

---

## 🛠 P2 — Code health (tech debt slowing velocity)

### 10. `downloadPDF()` is 112 lines of inline imperative code
- **What:** The entire PDF generation logic — title page, content iteration, text wrapping, pagination, and save — lives in a single 112-line function with a nested helper (`checkPage`).
- **Where:** `index.html:2536–2648`
- **Why it matters:** Hard to test, hard to update formatting without regression risk, and currently produces a text-only PDF that strips blockquotes, emphasis, and list styling — limiting the PDF's quality.
- **Effort:** M
- **Suggested fix:**
  - Extract into three functions: `renderTitlePage(doc)`, `renderChapter(doc, chapter, state)`, `downloadPDF()` (orchestrator only)
  - The `checkPage` helper should live at module scope, not nested
  - Consider whether the PDF needs richer formatting — if so, `html2canvas` + jsPDF gives a visual snapshot at lower complexity than the current text-parsing approach

---

### 11. `cards.html` uses inline onclick with string interpolation — fragile pattern
- **What:** Card buttons are generated with `onclick="copyToClipboard('${safeQuote}', '${card.source}')"` injected into `innerHTML`. The escaping (`replace(/'/g, "\\'")`) is manual and incomplete — curly apostrophes in quotes or sources would still break the inline handler.
- **Where:** `cards.html:591–610`
- **Why it matters:** If a quote contains a backtick or an escaped sequence, the generated HTML is malformed and the entire card section breaks. This is a latent bug waiting for the wrong quote to be added to the data array.
- **Effort:** S
- **Suggested fix:**
  - Use `dataset` attributes on the generated element instead of inline handlers: `cardEl.dataset.quote = card.quote; cardEl.dataset.source = card.source;`
  - Attach event listeners after creating the element: `cardEl.querySelector('.copy').addEventListener('click', () => copyToClipboard(cardEl.dataset.quote, cardEl.dataset.source))`
  - Delete the manual string-escaping logic — it's no longer needed

---

### 12. `vercel.json` uses `cleanUrls: false` but serves pretty URLs via rewrites
- **What:** `vercel.json` disables clean URLs globally (`"cleanUrls": false`) but manually rewrites `/cards`, `/scaling`, `/distribution` to `.html` files. This is the inverse of the standard approach and can cause double-routing issues (both `/cards` and `/cards.html` resolve to the same page).
- **Where:** `vercel.json:4–18`
- **Why it matters:** Duplicate URLs hurt SEO (Google sees two canonical pages). A user sharing `https://…/cards.html` and `https://…/cards` creates split link equity.
- **Effort:** S
- **Suggested fix:**
  - Set `"cleanUrls": true` and remove the manual rewrites array — Vercel automatically serves `cards.html` at `/cards`
  - Add `<link rel="canonical" href="…/cards">` to each page's `<head>` to signal the preferred URL

---

## 💡 P3 — Nice to have

### 13. No service worker — book can't be read offline
- **What:** There is no `service-worker.js` or `manifest.json`. Once loaded, the book requires a network connection to re-fetch on next visit.
- **Where:** N/A (missing file)
- **Why it matters:** An offline-capable book is a meaningful differentiator for readers who download it to read on flights.
- **Effort:** M
- **Suggested fix:**
  - Add a simple cache-first service worker that caches all four HTML files and the Google Fonts request on first load
  - Add a `manifest.json` to enable "Add to Home Screen" on mobile

---

### 14. JSON-LD structured data missing — search won't recognise this as a book
- **What:** No `<script type="application/ld+json">` schema exists on any page.
- **Where:** `index.html:1–9`
- **Why it matters:** Without `Book` or `Article` schema, Google Search cannot surface this as a rich result. Given the author, publisher, and publication date are all known, this is a quick SEO win.
- **Effort:** S
- **Suggested fix:**
  - Add `Book` schema with `name`, `author`, `url`, `inLanguage`, `description`, and `publisher` fields to `index.html`
  - Add `BreadcrumbList` schema to the satellite pages to establish hierarchy

---

### 15. Voice name selection is fragile across OS/browser combos
- **What:** `playChapter()` looks for voices by hardcoded name substrings: `'Google'`, `'Samantha'`, `'Daniel'`. These are macOS/Chrome-specific names that don't exist on Windows, Firefox, or most mobile browsers.
- **Where:** `index.html:2688–2690`
- **Why it matters:** On most non-Chrome environments the preferred voice lookup returns `undefined` and falls back silently to the default system voice, which can be very robotic or wrong language. Not a crash, but a noticeably worse experience for most users.
- **Effort:** S
- **Suggested fix:**
  - Prefer voices by `lang` attribute first: `voices.find(v => v.lang.startsWith('en') && v.localService)` — picks a local English voice available on every platform
  - Fall back to any `en-*` voice, then the system default — covers all environments gracefully
