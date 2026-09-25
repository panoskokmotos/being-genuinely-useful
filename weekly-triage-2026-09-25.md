# Weekly Triage — 2026-09-25

## 📊 Week at a glance
- **Commits this week**: 0 — no activity in the last 7 days
- **Files changed**: 0
- **Debt markers added this week**: 0
- **High-churn files**: N/A (no commits)
- **Last commit**: `e62c828` on 2026-05-10 ("Add comprehensive README for interactive ebook")

_No commits to triage. The sections below surface pre-existing issues from the current codebase that are worth reviewing during the quiet period._

---

## 🚨 Needs immediate attention

### 1. Broken mobile navigation
- **File**: `index.html:544–613` and `index.html:1376–1387`
- **Introduced**: `68ea931` (2026-04-20, "feat: complete ebook redesign")
- **Why this matters**: `.mobile-menu-btn` CSS class is defined and media-queried but no button exists in the HTML. On any screen narrower than 768px the nav-links are hidden (`display: none`) with no hamburger menu or alternative — mobile users have zero chapter navigation.

### 2. Dead external URL baked into every PDF export
- **File**: `index.html:2577`
- **Introduced**: `5e497cf` (2026-05-02, "feat: infuse book with the world's greatest wisdom")
- **Why this matters**: The jsPDF generator hard-codes `openclaw.ai/book` as the footer URL in every downloaded PDF. This domain appears unrelated to the deployed project; downloaded PDFs carry a broken link.

### 3. `deploy.sh` would overwrite `server.js` with a regressed version
- **File**: `deploy.sh:27–56`
- **Introduced**: `670ca7c` (2026-04-13, "Being Genuinely Useful in an AI World - Ebook") — never updated
- **Why this matters**: The script embeds an old `server.js` heredoc that lacks MIME types for `.pdf`, `.woff`, `.woff2`, and the full clean-URL routing. Running it on a server would silently break PDF downloads and font loading.

---

## 🧹 Cleanup opportunities

### 4. `vercel.json` — `cleanUrls: false` + three manual rewrites
- **File**: `vercel.json:5–18`
- **Commit**: `918696d` (2026-05-04, "Fix Vercel routing for HTML pages")
- **Why this matters**: The fix added manual rewrites for each existing page instead of enabling Vercel's native `cleanUrls: true`. Any new HTML page will default to `/page.html` unless someone remembers to add another rewrite entry.

### 5. `navigator.clipboard` calls without `.catch()` handlers
- **File**: `index.html:2752–2755`, `distribution.html:666`
- **Commit**: `5e497cf` (2026-05-02) and `888fc5c` (2026-04-13)
- **Why this matters**: Both calls will reject silently on HTTP or in browsers with restricted clipboard access — users see nothing when the copy action fails.

### 6. `document.execCommand('copy')` fallback in cards page
- **File**: `cards.html:620–627`
- **Commit**: `5e3cfd3` (2026-04-13, "feat: redesign UI/UX for main and cards pages")
- **Why this matters**: `execCommand` is removed in Chromium 117+. The fallback added for "older browsers" is now itself broken on modern browsers in HTTP contexts.

### 7. `README.md` documents a file structure that does not exist
- **File**: `README.md` (full file)
- **Commit**: `e62c828` (2026-05-10, "Add comprehensive README for interactive ebook")
- **Why this matters**: README lists `src/`, `components/`, `chapters/`, `style.css`, `script.js` — none of which exist. The README was written describing intended architecture, never updated to match reality.

---

## 🤔 Worth a second look

### 8. `scaling.html` and `distribution.html` — different design system
- **File**: `scaling.html:7–80`, `distribution.html:7–80`
- **Commits**: `19c388f` and `888fc5c` (both 2026-04-13)
- **Why this matters**: Both pages were added before the full ebook redesign (`68ea931`) and were never updated to use the canonical dark-green theme. This may be intentional (they're "utility" pages) or an oversight — but the visual disconnect is jarring to readers.

### 9. `speechSynthesis` called without feature detection
- **File**: `index.html:2651`, `2664`
- **Commit**: `5e497cf` (2026-05-02)
- **Why this matters**: `window.speechSynthesis` is used directly without checking if the API exists. Firefox on Linux and some mobile WebViews omit it entirely; a TypeError here could silence JS errors that affect unrelated page features.

### 10. jsPDF loaded from CDN without Subresource Integrity hash
- **File**: `index.html:2467`
- **Commit**: `5e497cf` (2026-05-02)
- **Why this matters**: `<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js">` has no `integrity` attribute. If the CDN is compromised or the file is tampered with, the attack executes with full page access. Low probability but zero-effort to fix with a known hash.
