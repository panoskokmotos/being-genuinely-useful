# Weekly Triage — 2026-07-10

## 📊 Week at a glance
- **Commits this week**: 0 (last commit: e62c828 on 2026-05-10)
- **Files changed this week**: 0
- **Debt markers added this week**: 0
- **High-churn files**: N/A — no activity

No code was merged in the past 7 days. Triage therefore covers the standing technical debt introduced in prior commits, particularly from the active development window of 2026-04-13 to 2026-05-10.

---

## 🚨 Needs immediate attention

### 1. `chapters` variable redeclared in the same script scope — `SyntaxError` kills all JS
- **File:line**: `index.html:2495` + `index.html:2655`
- **Introduced**: e62c828 (2026-05-10) — "Add comprehensive README for interactive ebook" (most likely introduced in 5e497cf or 68ea931 when the sidebar and audiobook were both added)
- **Why this matters**: `const chapters = Array.from(...)` (sidebar state) and `let chapters = []` (audiobook state) are both at the top level of the single `<script>` block. JavaScript throws `SyntaxError: Identifier 'chapters' has already been declared` before a single line executes. Reading progress bar, scroll animations, sidebar, smooth scrolling, PDF download, audiobook — everything is broken for all visitors.

### 2. No error handling on `navigator.clipboard.writeText()` in `copyLink()`
- **File:line**: `index.html:2753`
- **Introduced**: 68ea931 (2026-04-20)
- **Why this matters**: The Clipboard API requires a secure context (HTTPS). On HTTP, in iframes, or in some browser extension contexts, the promise rejects silently — the user clicks "Copy Link" and nothing happens. No catch handler, no fallback, no toast.

### 3. `document.execCommand('copy')` deprecated fallback in cards.html
- **File:line**: `cards.html:619–628`
- **Introduced**: 5e3cfd3 (2026-04-13)
- **Why this matters**: `execCommand('copy')` was deprecated in 2021 and is already removed in some Chromium builds. The fallback that's supposed to help older browsers now fails in newer ones, giving users a false "Copied!" toast with no actual clipboard write.

---

## 🧹 Cleanup opportunities

### 4. `openclaw.ai/book` hardcoded in PDF generation
- **File:line**: `index.html:2577`
- **Introduced**: 6a85991 (2026-04-13) — "Improve server and front-end routing, add PDF support"
- **Why this matters**: Every downloaded PDF permanently prints `openclaw.ai/book` as the source URL, regardless of the domain the site is actually running on. `window.location.origin` is already used correctly everywhere else.

### 5. jsPDF loaded from CDN without an SRI hash
- **File:line**: `index.html:2467`
- **Introduced**: 6a85991 (2026-04-13)
- **Why this matters**: External CDN scripts are a supply-chain risk. Without `integrity="sha384-..."` the browser cannot detect if the file has been tampered with. This is a one-line fix.

### 6. `scaling.html` and `distribution.html` never linked from the main navigation
- **File:line**: `index.html:1376–1387` (nav — these pages absent), `vercel.json:6–18` (routes exist)
- **Introduced**: 19c388f + 888fc5c (2026-04-13)
- **Why this matters**: Both pages have Vercel rewrites configured and contain real content, but there is no path from the main book to either page. They are dark pages that visitors cannot discover organically.

### 7. Mobile nav links hidden with no hamburger replacement
- **File:line**: `index.html:544–548` (CSS hides nav links on mobile), `index.html:601–614` (CSS shows `.mobile-menu-btn`), `index.html:1376–1387` (HTML — button never rendered)
- **Introduced**: 68ea931 (2026-04-20)
- **Why this matters**: On viewports ≤768 px the nav collapses but the hamburger button element is missing from the DOM. Mobile visitors see only the logo and one CTA button; all chapter navigation disappears.

---

## 🤔 Worth a second look

### 8. Audiobook voice selection will silently fail on most machines
- **File:line**: `index.html:2688–2690`
- **Introduced**: 68ea931 (2026-04-20)
- **Why this matters**: `voices.find(v => v.name.includes('Google') || ...)` matches zero voices on most Linux and Windows installations. The code silently falls back to the system default, which may be an unpleasant robotic voice — or no voice at all on some environments. This is intentional-ish but looks suspiciously like untested code shipped on macOS where 'Samantha' exists.

### 9. `server.js` resolves paths without a directory-containment check
- **File:line**: `server.js:41`
- **Introduced**: 670ca7c (2026-04-13) — initial commit, then modified in 7655756 and 6a85991
- **Why this matters**: `path.join(__dirname, urlPath)` with a crafted URL like `/../server.js` resolves to files one directory above the project root. Production is on Vercel (static serving, server.js not used), so this is currently unexploitable — but it will bite in any self-hosted or local-dev setup.

---

*No new debt was introduced this week. The items above are standing issues from the April–May development sprint.*
