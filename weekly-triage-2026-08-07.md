# Weekly Triage — 2026-08-07

## 📊 Week at a glance
- **Commits this week**: 0 (last commit: `e62c828` on 2026-05-10 — "Add comprehensive README for interactive ebook")
- **Files changed**: 0
- **Debt markers added this week**: 0 (no new commits to scan)
- **High-churn files**: N/A — no activity this week

> No new code was merged this week. The items below are pre-existing issues surfaced by a static scan of the current codebase.

---

## 🚨 Needs immediate attention

### 1. ALL JavaScript on the main ebook page is broken
- **File:line**: `index.html:2495` + `index.html:2655`
- **Commit**: `68ea931` ("feat: complete ebook redesign") introduced `const chapters` at top-level; `5e497cf` ("feat: infuse book with wisdom") added `let chapters = []` to the same scope without noticing the collision
- **Why this matters**: Both declarations are at the top level of the same `<script>` block. The JavaScript engine throws `SyntaxError: Identifier 'chapters' has already been declared` at parse time and the entire script never runs. The reading progress bar, sidebar chapter tracker, PDF download, audiobook player, and copy-link button are all dead for every visitor. This is the highest-priority bug in the project.

### 2. XSS / broken onclick in share cards
- **File:line**: `cards.html:591–605`
- **Commit**: `5e3cfd3` ("feat: redesign UI/UX for main and cards pages")
- **Why this matters**: Card text is interpolated directly into `onclick="..."` attribute strings. Backslash is not an HTML escape character — any card containing an apostrophe (e.g. "You're...") silently truncates the handler and breaks the button. `card.source` is injected with zero escaping, creating a latent XSS vector if card data ever comes from user input or a CMS.

### 3. Mobile navigation is invisible with no hamburger button
- **File:line**: `index.html:545–547` (CSS hides nav links at ≤768px), `index.html:601–614` (hamburger CSS exists), `index.html:1376–1387` (nav HTML has no hamburger element)
- **Commit**: `68ea931` ("feat: complete ebook redesign") added the responsive CSS but never added the `<button class="mobile-menu-btn">` to the HTML
- **Why this matters**: Mobile visitors (likely 50%+ of traffic) see only the logo and a green CTA button — the chapter links, Framework, Systems, Exercises, and Cards navigation is completely hidden with no way to access it.

### 4. `speechSynthesis` used without feature check
- **File:line**: `index.html:2651`, `index.html:2747`
- **Commit**: `8cdd726` ("feat: enhance features and polish UI")
- **Why this matters**: `window.speechSynthesis` is undefined in Firefox for Android and some iOS Safari versions. The line `if (synth.onvoiceschanged !== undefined)` at line 2747 will throw `TypeError: Cannot read properties of undefined (reading 'onvoiceschanged')`, crashing the audiobook feature on ~10–15% of mobile browsers.

---

## 🧹 Cleanup opportunities

### 5. Dead code: `shareOnLinkedIn()` in cards.html
- **File:line**: `cards.html:636–638`
- **Commit**: `5e3cfd3`
- **Why this matters**: The function is defined but no HTML button calls it. Misleads developers into thinking LinkedIn sharing is implemented. Delete or wire it up.

### 6. Dead code: `copyToClipboard()` and `.copy-btn` CSS in distribution.html
- **File:line**: `distribution.html:145–157` (CSS), `distribution.html:665` (JS function)
- **Commit**: `888fc5c` ("Add distribution hub")
- **Why this matters**: The copy feature was planned (CSS exists, function exists) but never connected to any HTML element. 30 lines of unused CSS and JS.

### 7. `console.error` in production PDF path
- **File:line**: `index.html:2642`
- **Commit**: `6a85991` ("Improve server and front-end routing, add PDF support")
- **Why this matters**: `console.error('PDF generation failed:', err)` will surface in end-user DevTools. The `showToast(...)` on the next line already handles user feedback — remove the `console.error`.

### 8. Dead file path references in distribution.html
- **File:line**: `distribution.html:275`, `distribution.html:317`
- **Commit**: `888fc5c`
- **Why this matters**: `<code>/distribution/email-course.md</code>` and `<code>/distribution/twitter-threads.md</code>` are shown as if they are navigable paths, but neither file exists in the repo. Users who try to open them get a 404.

### 9. Deprecated clipboard fallback shows false success
- **File:line**: `cards.html:620–628`
- **Commit**: `5e3cfd3`
- **Why this matters**: The `catch` block calls `document.execCommand('copy')` — removed from the Web standard, always returns `false` — but then shows a "Copied!" toast regardless. Users think they've copied but the clipboard is empty.

### 10. Inline `onclick` handlers on 13 buttons across the site
- **File:line**: `index.html:2409,2413,2417,2432,2435,2439,2446`; `distribution.html:214,221,228,235,242,249`
- **Commits**: Multiple
- **Why this matters**: Inline handlers are blocked by `Content-Security-Policy: script-src 'self'`. If a CSP header is ever added to the Vercel deployment (a common hardening step), all these buttons will silently stop working. Low risk now, landmine for the future.

---

## 🤔 Worth a second look

### 11. `async function downloadPDF()` with no `await`
- **File:line**: `index.html:2536`
- **Commit**: `6a85991`
- **Why this matters**: The `async` keyword is present but the function contains no `await` expression. Likely a refactor that was started (maybe to fetch content via `fetch()`) but never completed. Harmless in practice, but suggests the function may have been left in an unfinished state. Verify intent, then remove `async` if no network calls are planned.

### 12. `scrollTo()` function in distribution.html shadows `window.scrollTo`
- **File:line**: `distribution.html:661`
- **Commit**: `888fc5c`
- **Why this matters**: The custom `function scrollTo(id)` replaces the global, so `window.scrollTo(0, 500)` on this page would call `getElementById(0).scrollIntoView()` and throw. Not broken yet, but a footgun.

### 13. jsPDF CDN without `integrity` attribute
- **File:line**: `index.html:2467`
- **Commit**: `6a85991`
- **Why this matters**: `<script src="https://cdnjs.cloudflare.com/...jspdf.umd.min.js">` with no SRI hash means a CDN compromise could silently inject malicious JS. Low probability but high impact — worth the 5 minutes to add the hash.

### 14. No `@media` queries on distribution.html and scaling.html
- **File:line**: `distribution.html:7–675`, `scaling.html:7–496`
- **Commits**: `888fc5c`, `19c388f`
- **Why this matters**: Both pages have tables and long prose with no responsive breakpoints. The tables at `scaling.html:297–420` force horizontal scrolling on any phone narrower than ~600px.
