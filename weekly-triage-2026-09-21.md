# Weekly Triage — 2026-09-21

## 📊 Week at a glance
- **Commits this week**: 0 | **Files changed**: 0 | **Debt markers added**: 0
- **High-churn files**: None (no commits in the last 7 days)
- **Last activity**: `e62c828` on 2026-05-10 (README update) — repository has been dormant for ~4 months

---

> **Note**: No commits were made in the past 7 days, so the "recent commits" triage is empty.
> The items below are a full-repo debt scan of the current codebase, not limited to recently-touched files.

---

## 🚨 Needs immediate attention

### 1. Mobile navigation is completely non-functional
**File**: `index.html:545` (hides nav) / `index.html:601` (CSS for button) / `index.html:1375` (nav HTML)
**Commit introducing**: `68ea931` (2026-04-20) — complete ebook redesign
**Why this matters**: The `.mobile-menu-btn` CSS class exists but the element is never added to the HTML and there is no JS toggle. Every mobile user sees a navbar with no links and no menu button — they cannot navigate.

---

### 2. Clipboard API has no error handler in index.html and distribution.html
**File**: `index.html:2753`, `distribution.html:666`
**Commit introducing**: `68ea931` / `888fc5c` (2026-04-13)
**Why this matters**: `navigator.clipboard.writeText()` rejects when called over HTTP or when permissions are denied. No `.catch()` means silent failure — the "Copy Link" and "Copy" CTAs do nothing with no feedback. `cards.html:617–626` correctly handles this; the other two pages don't.

---

### 3. PDF download freezes if jsPDF CDN fails
**File**: `index.html:2536–2542`
**Commit introducing**: `6a85991` (2026-04-13)
**Why this matters**: `const { jsPDF } = window.jspdf` has no guard. If cdnjs is slow or an ad-blocker strips the CDN request, clicking "Download PDF" throws a TypeError and leaves the button stuck in a "Generating…" loading state forever with no user feedback.

---

### 4. Referenced file `/distribution/email-course.md` does not exist
**File**: `distribution.html:275`
**Commit introducing**: `888fc5c` (2026-04-13)
**Why this matters**: The distribution page instructs users to follow Days 2–7 of the email course in this file. The file has never been created. Users following the distribution strategy hit a dead end.

---

### 5. PDF title page references `openclaw.ai/book` — unverified external URL
**File**: `index.html:2577`
**Commit introducing**: `6a85991` (2026-04-13)
**Why this matters**: Every PDF downloaded by users contains this URL. If `openclaw.ai` is not owned/configured, readers clicking it get a 404 or a squatter page. The README lists the live URL as `being-genuinely-useful.vercel.app`.

---

## 🧹 Cleanup opportunities

### 6. CSS `:root` variables duplicated across all 4 HTML files
**File**: `index.html:11–22`, `cards.html:11–22`, `distribution.html` (overridden completely), `scaling.html` (overridden completely)
**Commit introducing**: `5e3cfd3` (cards redesign), `68ea931` (ebook redesign)
**Why this matters**: `distribution.html` and `scaling.html` have completely drifted from the design system (they use Tailwind-style Slate/Blue colors instead of the defined palette). A shared CSS file would prevent this. Currently any brand update requires 4 separate changes.

---

### 7. No `.gitignore` in repository root
**File**: (absent) repo root
**Commit introducing**: `670ca7c` (initial commit — never added)
**Why this matters**: Running `npm install` (per `package.json`) produces a `node_modules/` directory. Without `.gitignore`, the next `git add .` will include it. The lockfile `pnpm-lock.yaml` is present but npm is also referenced — dependency management is ambiguous.

---

### 8. Inline `console.log` in server.js
**File**: `server.js:109`
**Commit introducing**: `7655756` (fix: use PORT env variable)
**Why this matters**: Low-risk in this case (intentional startup log), but worth noting for completeness. On a production server this is visible in Vercel function logs. No action needed unless log verbosity becomes a concern.

---

### 9. `distribution.html` and `scaling.html` use `font-family: 'Segoe UI'` — Windows-only font
**File**: `distribution.html:16`, `scaling.html:16`
**Commit introducing**: `888fc5c`, `19c388f` (2026-04-13)
**Why this matters**: `Segoe UI` is not available on macOS, Linux, or Android. These pages fall back to `Tahoma`/`Verdana` on those systems. The rest of the site uses `Inter` from Google Fonts, which is cross-platform.

---

### 10. No favicon — 404 on every page load
**File**: All HTML files (absent `<link rel="icon">` in `<head>`)
**Commit introducing**: `670ca7c` (initial — never added)
**Why this matters**: Browsers silently request `/favicon.ico` on every navigation. The server's 404 handler returns a full HTML page for this request, wasting ~2KB per page load and adding noise to server logs.

---

## 🤔 Worth a second look

### 11. `server.js` serves files from `path.join(__dirname, urlPath)` — potential path traversal?
**File**: `server.js:41`
**Commit introducing**: `6a85991` (2026-04-13)
**Why this matters**: `urlPath` is derived from `req.url.split('?')[0]` with no normalization. A request for `/../../../etc/passwd` would attempt to read outside the project directory. Node's `fs.readFile` with `path.join` does not resolve `..` sequences before the join — the path traversal attempt would produce a path outside the project root. **On Vercel this doesn't apply** (serverless, no file system), but the `server.js` is used for local dev. Low risk in practice (development only) but worth fixing with `path.resolve` + bounds check.

---

### 12. `distribution.html` has no `<nav>` and no back-link — only `scaling.html:215` has a "← Back to Book" link
**File**: `distribution.html:1–675`
**Commit introducing**: `888fc5c` (2026-04-13)
**Why this matters**: Both pages were created in the same commit batch, but only `scaling.html` got a back-link. This asymmetry looks unintentional. Users landing on `/distribution` from social sharing are stuck.

---

### 13. `vercel.json` uses `"cleanUrls": false` but `"rewrites"` handle clean URLs manually
**File**: `vercel.json:4`
**Commit introducing**: `918696d` (2026-05-04) — fix Vercel routing
**Why this matters**: Setting `cleanUrls: true` in Vercel would automatically serve `cards.html` at `/cards` without the manual rewrite entries. The current setup works but is redundant — the `rewrites` could be simplified to `"cleanUrls": true` with no `rewrites` array at all. Not a bug, but worth knowing.

---
_Total: 13 items | 5 needs-immediate-attention, 5 cleanup, 3 worth-a-second-look_
