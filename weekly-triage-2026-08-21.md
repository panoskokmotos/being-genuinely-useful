# Weekly Triage — 2026-08-21

## 📊 Week at a glance

- Commits: 0 in the last 7 days | Files changed this week: 0 | Debt markers added: 0
- High-churn files: N/A (no commits this week)

> **Note**: No commits landed in the last 7 days. The analysis below covers the existing codebase for pre-existing debt markers and fragile patterns found in recently-introduced code (last 5 commits).

---

## 🚨 Needs immediate attention

### 1. `chapters` variable declared twice in root script scope — SyntaxError, all JS dead

- **File**: `index.html:2495` and `index.html:2655`
- **Introduced by**: `5e497cf` (feat: infuse book with the world's greatest wisdom)
- **Why this matters**: `const chapters = Array.from(...)` and `let chapters = []` both exist at the top level of the same `<script>` block. Browsers throw `SyntaxError: Identifier 'chapters' has already been declared` at parse time. The entire script block does not execute. Progress bar, animations, sidebar, PDF download, audiobook, and link copy are all broken for every visitor.

### 2. `copyLink()` — unhandled promise rejection on clipboard deny

- **File**: `index.html:2752–2756`
- **Introduced by**: `68ea931` (feat: complete ebook redesign)
- **Why this matters**: `navigator.clipboard.writeText(url).then(showToast)` has no `.catch()`. On HTTP, in a sandboxed iframe, or when the user denies the permission prompt, the rejected promise becomes an uncaught error. Users see no feedback; the CTA appears broken.

### 3. Mobile menu button renders but has no handler — dead UX on phones

- **File**: `index.html:601–614` (CSS), `index.html:1382–1386` (HTML)
- **Introduced by**: `68ea931`
- **Why this matters**: `.mobile-menu-btn` is `display: block` on ≤768px viewports. Nav links are `display: none`. No click handler exists. Mobile users have no way to navigate between chapters except scrolling the entire page from the top.

---

## 🧹 Cleanup opportunities

### 4. Hardcoded `openclaw.ai/book` in PDF output

- **File**: `index.html:2577`
- **Commit**: `68ea931`
- **Note**: PDF generation embeds this URL as the book's canonical address. The live site is at `being-genuinely-useful.vercel.app`. Anyone who downloads a PDF gets a broken link in the footer.

### 5. jsPDF CDN import missing SRI hash

- **File**: `index.html:2467`
- **Commit**: `68ea931`
- **Note**: `<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js">` has no `integrity` attribute. Version 2.5.1 is over 2 years old (current is 2.5.2+). Without an SRI hash, CDN-level tampering would not be detected.

### 6. Audiobook uses `window.speechSynthesis` without availability guard

- **File**: `index.html:2651`
- **Commit**: `5e497cf`
- **Note**: `let synth = window.speechSynthesis;` at root scope. On browsers that don't support the Web Speech API (Firefox for Android, some WebViews), `synth` is `undefined`. Calling `synth.cancel()` inside `playChapter` / `closeAudioPlayer` will throw a TypeError. The feature fails with no user feedback.

### 7. Duplicate CSS across all four HTML pages

- **Files**: `index.html`, `cards.html`, `distribution.html`, `scaling.html`
- **Commit**: Multiple commits
- **Note**: The `:root` token block, nav styles, button styles, and typography declarations are copy-pasted into every file. No shared stylesheet exists despite `style.css` being referenced in the README as part of the project structure. Any brand change requires editing 4 files.

---

## 🤔 Worth a second look

### 8. `server.js` path join without bounds check

- **File**: `server.js:35–42`
- **Commit**: `6a85991` (Improve server and front-end routing)
- **Note**: `path.join(__dirname, urlPath)` is not validated against `__dirname` after resolution. `path.join` normalises `..` but URL-encoded traversal paths (e.g. `/%2e%2e/`) are decoded by Node's HTTP parser before `path.join` sees them. On Vercel this is moot (server.js is never invoked), but anyone running `npm run dev` on a local network is exposed. Low severity, easy fix.

### 9. `synth.onvoiceschanged = () => {}` — no-op listener defeats lazy voice loading

- **File**: `index.html:2747–2749`
- **Commit**: `5e497cf`
- **Note**: The comment says "load voices when available," but the handler is an empty function. In Chrome, `getVoices()` returns an empty array until `onvoiceschanged` fires. The current code sets the preferred voice at playback time (`playChapter`), which races against voice loading. The fix is to populate voices inside the handler: `synth.onvoiceschanged = initVoices`, then call `initVoices()` immediately as well for browsers that pre-load voices.

### 10. `vercel.json` sets `cleanUrls: false` — `/cards.html` and `/cards` both resolve

- **File**: `vercel.json:4`
- **Commit**: `918696d` (Fix Vercel routing for HTML pages)
- **Note**: With `cleanUrls: false`, Vercel serves `/cards.html` and `/cards` (via the rewrite) as separate URLs with identical content. This creates duplicate-content SEO issues and canonical confusion. Setting `cleanUrls: true` and removing the `.html` rewrites would fix both issues, but requires verifying that the existing rewrite rules don't conflict.

---

_10 items total. Items 1–3 are production-impacting. Items 4–7 are cleanup. Items 8–10 are worth a review._
