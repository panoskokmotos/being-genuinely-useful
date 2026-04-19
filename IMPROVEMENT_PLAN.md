# Givelink Improvement Plan

> Codebase: static HTML/JS ebook (`index.html` 1 563 lines, `cards.html` 672 lines, `server.js` 111 lines)  
> Scanned: 2026-04-19 · No PostHog data found in repo

---

## 🔥 P0 — Ship this week (bugs breaking user flows)

### 1. Path-traversal vulnerability in dev/prod server
- **What**: `server.js` joins the raw URL path with `__dirname` without validating the result stays inside the project root.
- **Where**: `server.js` lines 41–42
- **Why it matters**: A request like `GET /../../../etc/passwd` can read arbitrary files on the host. Vercel deployment sidesteps this, but anyone running `node server.js` in staging or locally is exposed.
- **Effort**: S
- **Suggested fix**:
  - Replace `path.join(__dirname, urlPath)` with `path.resolve(__dirname, urlPath.slice(1))`.
  - After resolving, assert `filePath.startsWith(__dirname)` and return 403 if not.

---

### 2. No browser-support check before invoking Web Speech API
- **What**: The audiobook feature calls `window.speechSynthesis.speak()` with no guard; on browsers that don't implement the API (Firefox on some OSes, all iOS < 16 incognito) this throws a `TypeError` that swallows all subsequent JS on the page.
- **Where**: `index.html` lines 1436–1443
- **Why it matters**: The audio player is a key differentiator. Silent breakage on Firefox/iOS means a notable share of readers hit a broken experience with no feedback.
- **Effort**: S
- **Suggested fix**:
  - Add `if (!('speechSynthesis' in window))` guard before any speech call.
  - Show a visible, dismissible banner: "Audio not supported in this browser — try Chrome or Edge."
  - Disable the audio toggle button and set `aria-disabled="true"`.

---

### 3. jsPDF loaded from CDN with no fallback and no SRI hash
- **What**: The PDF download dynamically injects a `<script>` from `cdnjs.cloudflare.com` with no Subresource Integrity (SRI) hash and no fallback if the request fails.
- **Where**: `index.html` lines 1294–1328
- **Why it matters**: If the CDN is unreachable the user clicks "Download PDF" and nothing happens — no error, no explanation. A supply-chain compromise of the CDN URL could also inject arbitrary JS into every reader's browser.
- **Effort**: S
- **Suggested fix**:
  - Add `integrity="sha384-..."` and `crossorigin="anonymous"` to the injected script tag (generate hash at build time with `openssl dgst -sha384 -binary jspdf.umd.min.js | openssl base64 -A`).
  - Wrap the dynamic load in a `.onerror` handler that shows: "PDF download unavailable — check your connection and try again."
  - Consider vendoring jsPDF into `/lib/` to remove the CDN dependency entirely.

---

### 4. Binary files corrupted by forced UTF-8 encoding in server
- **What**: `server.js` passes `'utf-8'` as the encoding to every `fs.readFile()` call, including for fonts (`.woff2`), images, and other binary assets.
- **Where**: `server.js` line 103
- **Why it matters**: UTF-8 re-encoding mutates binary bytes. Web fonts will fail to parse, causing fallback fonts to render instead — visible to every reader who loads the page via the local server (common during staging).
- **Effort**: S
- **Suggested fix**:
  - Build a set of binary extensions: `const BINARY_EXTS = new Set(['.woff','.woff2','.ttf','.otf','.png','.jpg','.ico'])`.
  - Call `fs.readFile(filePath)` (no encoding arg) for binary types; the returned `Buffer` is written directly with `res.end(buf)`.

---

## ⚡ P1 — High ROI (UX friction blocking conversion)

### 5. Audio player controls have no accessible labels
- **What**: The play/pause, next, and previous buttons in the audiobook player are icon-only SVGs with no `aria-label` attributes.
- **Where**: `index.html` lines 1255–1277
- **Why it matters**: Keyboard-only users and screen-reader users cannot operate the audio feature at all. WCAG 2.1 SC 1.1.1 failure.
- **Effort**: S
- **Suggested fix**:
  - Add `aria-label="Play"` / `aria-label="Pause"` (toggled via JS) to the play button.
  - Add `aria-label="Previous chapter"` and `aria-label="Next chapter"` to the skip buttons.
  - Add `role="img" aria-hidden="true"` to the SVG children so screen readers skip the raw SVG markup.

---

### 6. Toast notifications invisible to screen readers
- **What**: Both the "Copied!" toast (`index.html` line 1545) and the cards toast (`cards.html` line 649) lack `role="alert"` and `aria-live="assertive"`, so screen readers never announce them.
- **Where**: `index.html` lines 1545–1560; `cards.html` lines 649–656
- **Why it matters**: Users who copy a quote or download a card image get no confirmation their action worked, degrading trust in the UI.
- **Effort**: S
- **Suggested fix**:
  - Add `role="alert" aria-live="assertive" aria-atomic="true"` to both toast containers.
  - Keep the 2.5 s auto-dismiss but also add a close button (`aria-label="Dismiss"`) so users with motor disabilities or slow readers can act on the message.

---

### 7. No loading state on "Download PDF" button
- **What**: Clicking the PDF button triggers a multi-second operation (script injection + DOM traversal + rendering) with no visual feedback; the button stays interactive and can be clicked again.
- **Where**: `index.html` lines 1236–1242, `downloadPDF()` line 1321
- **Why it matters**: Users double-click thinking it didn't work, generating duplicate downloads; some close the tab. A spinner costs 10 minutes and eliminates this friction.
- **Effort**: S
- **Suggested fix**:
  - On button click: set `button.disabled = true`, swap label to "Generating PDF…", show a spinner icon.
  - In the `finally` block of the try/catch: restore button state.
  - Show a success toast on completion (currently there is none).

---

### 8. Card filter state lost on reload — no URL sharing
- **What**: Selecting a filter category in `cards.html` updates the UI but not the URL, so the state is lost on reload and filtered views can't be shared as links.
- **Where**: `cards.html` lines 414–432 (filter buttons), no URL state management present
- **Why it matters**: A reader who wants to share "only the Chapter 3 quotes" with a colleague cannot — they get the unfiltered page. This directly limits organic sharing of the content.
- **Effort**: S
- **Suggested fix**:
  - On filter click: `history.replaceState(null, '', `?filter=${encodeURIComponent(value)}`)`.
  - On page load: read `new URLSearchParams(location.search).get('filter')` and apply the matching filter.
  - Persist the selection in `localStorage` as a secondary fallback.

---

### 9. Card filter buttons lack ARIA tab semantics
- **What**: The category filter buttons have no `role="tab"`, `aria-selected`, or `tablist` container, so they appear as unrelated buttons to assistive technology.
- **Where**: `cards.html` lines 414–432
- **Why it matters**: Screen-reader users don't understand these are mutually exclusive options and can't navigate the filter set efficiently. WCAG 2.1 SC 4.1.2 failure.
- **Effort**: S
- **Suggested fix**:
  - Wrap the filter strip in `<div role="tablist" aria-label="Filter by chapter">`.
  - Give each button `role="tab"` and `aria-selected="true/false"`.
  - Toggle `aria-selected` in the JS filter handler.

---

### 10. XSS-prone inline `onclick` construction in cards
- **What**: Card HTML is built by interpolating quote text directly into an `onclick="copyToClipboard('${safeQuote}',...)"` attribute string. The escaping (`replace(/'/g, "\\'")`) does not cover backticks, template literals, or Unicode lookalikes.
- **Where**: `cards.html` lines 543–560
- **Why it matters**: Quote data is hardcoded today, but if the source ever becomes dynamic (CMS, URL param, i18n file) this becomes a stored-XSS vector. The pattern also makes it impossible to pass a `Content-Security-Policy: script-src 'self'` header.
- **Effort**: M
- **Suggested fix**:
  - Remove inline `onclick` entirely.
  - Assign a `data-card-id` attribute to each card element.
  - Use a single delegated listener on the container: `container.addEventListener('click', e => { const id = e.target.closest('[data-card-id]')?.dataset.cardId; ... })`.
  - Look up quote data by ID from the JS `cards` array — no interpolation needed.

---

## 🛠 P2 — Code health (tech debt slowing velocity)

### 11. `downloadPDF()` is a 112-line monolith
- **What**: The PDF generation function mixes CDN script injection, DOM parsing, text extraction, page layout math, and jsPDF API calls in a single function.
- **Where**: `index.html` lines 1321–1433
- **Why it matters**: Any change to chapter structure, fonts, or pagination requires editing one high-risk function. The current structure also makes it impossible to unit test the layout logic.
- **Effort**: M
- **Suggested fix**:
  - Extract into three functions: `loadJsPDF()` (script injection, returns Promise), `extractChapterContent()` (DOM → data), `renderPDF(jsPDF, chapters)` (layout only).
  - Move to a separate `pdf.js` file and import via `<script type="module">`.

---

### 12. No request logging in `server.js`
- **What**: The server logs nothing — no incoming requests, no 404s, no latency — making production debugging impossible without external tooling.
- **Where**: `server.js` — entire request handler (lines 30–108)
- **Why it matters**: When a staging reader reports "the page is broken," there is no server-side record of what was requested or what failed.
- **Effort**: S
- **Suggested fix**:
  - Add one log line per request: `console.log(`${new Date().toISOString()} ${req.method} ${req.url} → ${statusCode} (${duration}ms)`)`.
  - Log errors with stack traces: `console.error('Error serving', req.url, err)`.

---

### 13. No `<meta name="description">` or Open Graph tags
- **What**: Neither `index.html` nor `cards.html` have `<meta name="description">`, `og:title`, `og:description`, or `og:image` tags.
- **Where**: `index.html` lines 1–15; `cards.html` lines 1–15
- **Why it matters**: Every social share of the book or cards shows a blank preview. Search engines index the page with no description snippet. This directly suppresses organic discovery.
- **Effort**: S
- **Suggested fix**:
  - Add `<meta name="description" content="...">` (≤160 chars) to both pages.
  - Add `og:title`, `og:description`, `og:url`, `og:image` (a 1200×630 card screenshot works well).
  - Add `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`.

---

### 14. No skip-navigation link for keyboard users
- **What**: There is no "Skip to main content" link at the top of either page, forcing keyboard users to tab through the full navigation on every page load.
- **Where**: `index.html` line 836 (start of hero section); `cards.html` line 410
- **Why it matters**: WCAG 2.1 SC 2.4.1 (Bypass Blocks) — a Level A failure that affects all keyboard and switch-device users.
- **Effort**: S
- **Suggested fix**:
  - Add `<a href="#main-content" class="skip-link">Skip to main content</a>` as the very first element inside `<body>`.
  - Add `id="main-content"` to the first `<main>` or content wrapper.
  - Style `.skip-link` to be visually hidden until focused (standard CSS pattern).

---

### 15. Deprecated `execCommand('copy')` fallback with no deprecation handling
- **What**: The clipboard fallback in `cards.html` silently uses `document.execCommand('copy')`, which is deprecated and removed in some browsers, without warning the user when it fails.
- **Where**: `cards.html` lines 567–581
- **Why it matters**: On browsers where `execCommand` is removed and `navigator.clipboard` is unavailable (e.g., HTTP contexts), copy silently fails — the toast says "Copied!" but nothing is in the clipboard.
- **Effort**: S
- **Suggested fix**:
  - Wrap the `execCommand` fallback in its own try/catch.
  - If both methods fail, show a different toast: "Auto-copy failed — press Ctrl+C / ⌘C to copy the selected text."
  - Use `document.execCommand` return value (`true`/`false`) to detect failure.

---

### 16. Canvas image download fails silently on unsupported browsers
- **What**: `downloadCardImage()` calls `canvas.getContext('2d')` without checking if the return value is `null` (which happens when canvas is unsupported or the context is already taken).
- **Where**: `cards.html` lines 594–646
- **Why it matters**: The function throws a `TypeError` on `null.fillStyle = ...`, killing JS execution with no user feedback. Canvas is well-supported today but fails in some privacy-hardened or embedded browser contexts.
- **Effort**: S
- **Suggested fix**:
  - Add `const ctx = canvas.getContext('2d'); if (!ctx) { showToast('Image download not supported in this browser'); return; }`.
  - Wrap the entire function in try/catch and show an error toast on failure.

---

## 💡 P3 — Nice to have

### 17. Vendor jsPDF to remove CDN dependency
- **What**: jsPDF (currently ~500 KB from cdnjs) could be vendored into `/lib/jspdf.umd.min.js` and served from the same origin.
- **Where**: `index.html` line 1294
- **Why it matters**: Removes the CDN reliability risk and the SRI maintenance burden; also allows serving with proper cache-control headers.
- **Effort**: S
- **Suggested fix**:
  - `pnpm add jspdf` (or just download the UMD build once).
  - Update the script src to `/lib/jspdf.umd.min.js`.

---

### 18. Separate JS and CSS from HTML into dedicated files
- **What**: All JavaScript and CSS are embedded inline in both HTML files, making the files hard to navigate and impossible to cache separately.
- **Where**: `index.html` (styles: lines ~16–830; scripts: lines ~1280–1555); `cards.html` (similar)
- **Why it matters**: Inline assets can't be cached by the browser — every page load re-downloads ~40 KB of CSS and JS. Extracted files get long-term cache headers and can be shared between pages.
- **Effort**: L
- **Suggested fix**:
  - Extract to `style.css`, `index.js`, `cards.js`.
  - Update `server.js` MIME map to include `.css` with `text/css`.
  - Set `Cache-Control: public, max-age=31536000, immutable` on asset responses in `server.js`.

---

### 19. Add reading-progress persistence via `localStorage`
- **What**: The reading progress bar resets every time the page is reloaded; there is no way for a reader to return to where they left off.
- **Where**: `index.html` — scroll event handler and progress bar logic (no persistent storage currently)
- **Why it matters**: Long-form readers who step away and return lose their place. Saving the scroll position to `localStorage` takes ~5 lines and meaningfully reduces abandonment.
- **Effort**: S
- **Suggested fix**:
  - On scroll: `localStorage.setItem('readProgress', window.scrollY)` (debounced).
  - On load: `window.scrollTo(0, parseInt(localStorage.getItem('readProgress') || '0'))`.
  - Show a subtle "Resume reading ↓" CTA if a saved position exists.

---

### 20. Add basic test infrastructure for critical JS paths
- **What**: There are no tests of any kind in the repository. The PDF generation, audiobook logic, and canvas download are all untested.
- **Where**: Entire repo — no `/test` or `/spec` directory
- **Why it matters**: Each of the three main interactive features (PDF, audio, card download) has known failure modes that were caught only by manual inspection. A regression in any of them would be invisible until a user reports it.
- **Effort**: M
- **Suggested fix**:
  - Add Vitest (`pnpm add -D vitest`) — zero config for a plain JS project.
  - Write three smoke tests: PDF function exports correct page count given mock chapters; clipboard fallback called when `navigator.clipboard` is absent; canvas context null path shows error toast.
  - Add `"test": "vitest run"` to `package.json` scripts.

---

*Total items: 20 · Generated from static analysis of `index.html`, `cards.html`, `server.js` on 2026-04-19.*
