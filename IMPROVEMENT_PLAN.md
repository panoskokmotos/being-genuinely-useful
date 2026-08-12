# Improvement Plan — Being Genuinely Useful

> Analysed: 2026-08-12 | Scope: index.html, cards.html, distribution.html, scaling.html, server.js, vercel.json

---

## 🔥 P0 — Ship this week (bugs breaking user flows)

### 1. Binary files served with `utf-8` encoding (corrupts PDFs, images, fonts)
**What:** `res.end(content, 'utf-8')` is called for every file type, including binary files.  
**Where:** `server.js:103`  
**Why it matters:** Fonts, images, and any PDF downloads are byte-corrupted in transit. Users on the Node server (local dev and any non-Vercel deployment) will see broken fonts or failed downloads.  
**Effort:** S  
**Suggested fix:**
- Change to: `res.end(content)` — omit the encoding argument
- Only pass `'utf-8'` when `contentType.startsWith('text/')` or `contentType === 'application/json'`

---

### 2. Path traversal in file server — arbitrary file reads possible
**What:** The request URL is resolved to a file path with no check that it stays inside `__dirname`.  
**Where:** `server.js:26-41`  
**Why it matters:** A request like `GET /../../etc/passwd` (or any `..` sequence) resolves to an absolute path outside the project root and is served if readable. This is a security vulnerability on any deployment using the Node server.  
**Effort:** S  
**Suggested fix:**
- After computing `filePath`, assert it starts with `__dirname`:
  ```js
  if (!filePath.startsWith(path.resolve(__dirname) + path.sep) && filePath !== path.resolve(__dirname)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  ```
- Normalise with `path.resolve()` before the check to collapse `..` segments

---

### 3. Mobile navigation is completely broken — hamburger renders but does nothing
**What:** The `mobile-menu-btn` button is shown on screens ≤768px but has no event listener or JS handler.  
**Where:** `index.html:601-614` (CSS shows button), JS section has no corresponding handler  
**Why it matters:** On any mobile device, the nav links are hidden and there is no way to access chapter navigation or the Cards page. Mobile readers are effectively stranded after the cover.  
**Effort:** S  
**Suggested fix:**
- Add a click handler that toggles a visible class on `.nav-links`
- Style `.nav-links.open` as a vertical dropdown positioned below the fixed nav bar
- Close the menu on any nav link click or outside-click

---

### 4. `copyLink()` in index.html silently fails on non-HTTPS or unsupported browsers
**What:** `navigator.clipboard.writeText(...)` has no `.catch()` handler.  
**Where:** `index.html:2752-2756`  
**Why it matters:** Clipboard API requires a secure context (HTTPS) and user gesture. On HTTP or browsers that block it, the promise rejects silently — the user clicks the button and nothing happens with no feedback.  
**Effort:** S  
**Suggested fix:**
- Add `.catch(() => { showToast('Copy failed — please copy the URL manually'); })`
- Mirror the fallback already present in `cards.html:619-627` (textarea + `execCommand`)

---

## ⚡ P1 — High ROI (UX friction blocking conversion)

### 5. No Open Graph / Twitter Card meta tags — share previews are blank
**What:** None of the pages declare `og:title`, `og:description`, `og:image`, or Twitter Card meta tags.  
**Where:** `index.html:1-9`, `cards.html:1-9`  
**Why it matters:** The entire distribution strategy is built on sharing cards to Twitter and LinkedIn. When anyone shares the book URL, the preview renders as a blank card. This kills click-through on every social share.  
**Effort:** S  
**Suggested fix:**
- Add to `index.html` `<head>`:
  ```html
  <meta property="og:title" content="Being Genuinely Useful in an AI World">
  <meta property="og:description" content="10 chapters on what it means to be genuinely useful — and how specificity beats generic helpfulness every time.">
  <meta property="og:image" content="/og-image.png">  <!-- create a 1200×630 static image -->
  <meta name="twitter:card" content="summary_large_image">
  ```
- Do the same on `cards.html` with a cards-specific description

---

### 6. Brand split: `distribution.html` and `scaling.html` look like a different product
**What:** These two pages use `Segoe UI`, navy `#0f172a` background, and blue `#3b82f6` accents — a completely different design from the Inter + near-black + green `#22c55e` system used in `index.html` and `cards.html`.  
**Where:** `distribution.html:7-120`, `scaling.html:7-100`  
**Why it matters:** Users who navigate to these pages (or land on them from a link) will feel they've left the site. Trust and brand recognition evaporates immediately.  
**Effort:** M  
**Suggested fix:**
- Extract a shared `<style>` block (or create `styles.css`) with the `:root` token set from `index.html`
- Restyle `distribution.html` and `scaling.html` to use the same bg, font stack, accent colour, and nav component
- Add the standard `<nav class="nav">` from `index.html` to both pages so users can navigate back

---

### 7. `distribution.html` and `scaling.html` are unreachable from the main site
**What:** The site nav links only to `/cards`. There are no links to `/distribution` or `/scaling` from `index.html` or `cards.html`.  
**Where:** `index.html:1379-1387` (nav), `cards.html:397-404` (nav)  
**Why it matters:** These pages (with 30-day plans, monetisation strategies, passive income) contain high-value content that users never see. They only exist as direct-URL orphans.  
**Effort:** S  
**Suggested fix:**
- Add nav links: "Distribute" → `/distribution` and "Scale" → `/scaling`
- Or add a footer on `index.html` pointing to them under a "What's Next" section

---

### 8. Web Speech API used without browser-support check — throws TypeError in Firefox/Safari
**What:** `window.speechSynthesis` is accessed unconditionally and stored in `let synth`. `synth.cancel()`, `synth.speak()` etc. are called with no guard.  
**Where:** `index.html:2651-2749`  
**Why it matters:** `window.speechSynthesis` is undefined in some environments (Firefox with speech disabled, certain mobile browsers). Every call to `synth.cancel()` etc. throws `TypeError: Cannot read properties of undefined`. The audiobook feature crashes silently.  
**Effort:** S  
**Suggested fix:**
- Guard: `const synth = window.speechSynthesis || null;`
- Before any synth call: `if (!synth) { showToast('Text-to-speech not supported in this browser'); return; }`
- Hide the "Listen to Audiobook" button when `!window.speechSynthesis`

---

## 🛠 P2 — Code health (tech debt slowing velocity)

### 9. `index.html` is 2,779 lines — CSS, HTML, and JS all in one file
**What:** The entire site is a monolith: ~1360 lines of CSS, ~1000 lines of HTML, ~420 lines of JS, all inline in a single file.  
**Where:** `index.html:1-2779`  
**Why it matters:** Any style change requires scanning 1400 lines of CSS to find the right rule. The JS features (PDF, audiobook, progress bar, sidebar, toast) have no separation. Every edit carries risk of accidentally breaking something else.  
**Effort:** L  
**Suggested fix:**
- Extract `styles.css` and `app.js` as separate files
- Serve them with the 1-day cache header already set in `server.js:98`
- Split JS into logical modules: `progress.js`, `audiobook.js`, `pdf.js`

---

### 10. Navigation and button CSS is copy-pasted between `index.html` and `cards.html`
**What:** The `.nav`, `.nav-inner`, `.nav-logo`, `.nav-links`, `.nav-cta`, `.btn`, `.toast` CSS blocks are word-for-word identical in both files.  
**Where:** `index.html:43-102`, `cards.html:39-101`  
**Why it matters:** Any nav style change must be made in two places. They will drift and cause inconsistencies — the `nav-cta` hover color already differs subtly between files.  
**Effort:** M  
**Suggested fix:**
- Create a shared `styles.css` and `<link>` it from both files
- This resolves item #9 and #10 simultaneously

---

### 11. No favicon on any page
**What:** None of the four pages declare a `<link rel="icon">`.  
**Where:** `index.html:1-9`, `cards.html:1-9`, `distribution.html:1-6`, `scaling.html:1-6`  
**Why it matters:** The browser tab shows a blank default icon. It looks unfinished and reduces recognisability when users have multiple tabs open.  
**Effort:** S  
**Suggested fix:**
- Create a 32×32 SVG favicon using the green accent (or an emoji shortcut: `<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📖</text></svg>">`)
- Add to `<head>` in all four pages

---

### 12. `server.js` sends no security headers
**What:** HTTP responses include no `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`, or `Referrer-Policy` headers.  
**Where:** `server.js:99-102`  
**Why it matters:** Without `X-Content-Type-Options: nosniff`, browsers may MIME-sniff responses. Without `X-Frame-Options`, the ebook can be embedded in iframes (clickjacking). Matters for any deployment using the Node server directly.  
**Effort:** S  
**Suggested fix:**
- Add to the `res.writeHead` call:
  ```js
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
  ```

---

## 💡 P3 — Nice to have

### 13. Google Fonts loaded without `font-display: swap`
**What:** The Google Fonts URL in `index.html` and `cards.html` does not include `&display=swap`.  
**Where:** `index.html:9`, `cards.html:9`  
**Why it matters:** On slow connections, text remains invisible (FOIT) until fonts load. Adding `display=swap` shows system font text immediately and swaps in once loaded — visibly faster perceived load.  
**Effort:** S  
**Suggested fix:**
- Change `...Inter:wght@...&family=Newsreader...` to append `&display=swap` to the fonts URL

---

### 14. No `<meta name="description">` on any page
**What:** All four pages are missing the basic SEO description meta tag.  
**Where:** `index.html:1-9`, `cards.html:1-9`, `distribution.html:1-6`, `scaling.html:1-6`  
**Why it matters:** Search engines show the URL or truncated body text instead of a curated description. Reduces click-through from search results.  
**Effort:** S  
**Suggested fix:**
- Add e.g. `<meta name="description" content="10 chapters on genuinely useful thinking in an AI world — frameworks from Deutsch, Naval, Feynman and more.">`

---

### 15. `vercel.json` uses `cleanUrls: false` — trailing `.html` shows in browser URL
**What:** `vercel.json:4` sets `cleanUrls: false`, so visiting the site on Vercel shows `/cards.html` instead of `/cards`.  
**Where:** `vercel.json:4`  
**Why it matters:** URL aesthetics and shareability. `/cards` is cleaner than `/cards.html`.  
**Effort:** S  
**Suggested fix:**
- Set `"cleanUrls": true` in `vercel.json`
- Remove the explicit rewrites since Vercel's `cleanUrls` handles `.html` → clean URL automatically
- Verify that `server.js` route handling still works locally (it already tries `.html` fallback on line 35)
