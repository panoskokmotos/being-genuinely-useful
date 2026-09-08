# Weekly Triage — 2026-09-08

## 📊 Week at a glance

- **Commits this week**: 0
- **Files changed this week**: 0
- **Debt markers added this week**: 0
- **High-churn files**: N/A (no activity)
- **Last commit**: `e62c828` — "Add comprehensive README for interactive ebook" (2026-05-10)

The codebase has been dormant for ~4 months. No new code landed this week, so this triage focuses on pre-existing debt in the current HEAD.

---

## 🚨 Needs immediate attention

### 1. `chapters` const/let collision — JS entirely broken in production
- **File**: `index.html:2495` and `index.html:2655`
- **Introduced**: `5e497cf` (feat: infuse book with the world's greatest wisdom)
- **Why this matters**: Two identically-named variables (`const chapters` and `let chapters`) live at the same script scope. Browsers throw `SyntaxError: Identifier 'chapters' has already been declared` and abort the entire script block. Reading progress, sidebar nav, scroll animations, PDF download, audiobook, and copy-link are all dead for every visitor right now.

### 2. Path traversal in HTTP server
- **File**: `server.js:41`
- **Introduced**: `6a85991` (Improve server and front-end routing)
- **Why this matters**: `path.join(__dirname, urlPath)` with no traversal check means `GET /../package.json` returns the file. Not sandboxed by Vercel in the same way for local runs.

### 3. `copyLink()` has no fallback — fails silently on HTTP
- **File**: `index.html:2752–2755`
- **Introduced**: `5e3cfd3` (feat: redesign UI/UX for main and cards pages)
- **Why this matters**: The clipboard promise rejects on non-HTTPS contexts with no user feedback. `cards.html` has the correct `execCommand` fallback; `index.html` doesn't.

---

## 🧹 Cleanup opportunities

### 4. Intentional `console.error` — fine as-is
- **File**: `index.html:2642`
- **Commit**: `6a85991`
- **Note**: Inside the PDF generation `catch` block. This is correct intentional error logging, not debug residue.

### 5. `console.log` startup message — acceptable
- **File**: `server.js:109`
- **Commit**: `6a85991`
- **Note**: Standard `Server running at http://localhost:${PORT}` startup log. No action needed.

### 6. Dead function: `shareOnLinkedIn` never called
- **File**: `cards.html:636–638`
- **Commit**: `5e3cfd3`
- **Why this matters**: LinkedIn is mentioned in the page header copy but has no button wired to this function. Either add the button or remove the dead code.

### 7. Hardcoded `openclaw.ai/book` URL in PDF generator
- **File**: `index.html:2577`
- **Commit**: `6a85991`
- **Why this matters**: Every downloaded PDF footer points to a domain that may not be the live host. Should use `window.location.origin`.

---

## 🤔 Worth a second look

### 8. `distribution.html` and `scaling.html` publicly reachable
- **Files**: `distribution.html`, `scaling.html`
- **Commit**: `888fc5c`, `19c388f`
- **Why it looks suspicious**: These pages expose a detailed 30-day monetisation plan and passive-income tiers that read as internal strategy notes, not reader-facing content. They're also styled completely differently (blue gradient, Segoe UI), which suggests they were rapid drafts never meant to go live. Intentional?

### 9. Inline onclick string escaping pattern in cards
- **File**: `cards.html:591–601`
- **Commit**: `5e3cfd3`
- **Why it looks suspicious**: Quote text is interpolated into `onclick` attributes using only `'` and `"` escaping. Safe for the current hardcoded data set, but the pattern is a maintenance trap if quotes ever come from an API.

### 10. Mobile nav hamburger CSS with no corresponding HTML
- **File**: `index.html:600–614` (CSS), `index.html:1376–1387` (HTML)
- **Commit**: `68ea931`
- **Why it looks suspicious**: `.mobile-menu-btn { display: none }` is toggled to `display: block` at ≤768 px, but no `<button class="mobile-menu-btn">` exists in the DOM. Looks like an unfinished feature from the redesign commit.

---

*Triage complete. 3 items need immediate attention; 0 items introduced this week. Priority: fix the `chapters` variable collision first — it's breaking all JS for live readers.*
