# Weekly Triage — 2026-09-11

> Repository: `panoskokmotos/being-genuinely-useful`  
> Triage date: 2026-09-11  
> Scope: commits since 2026-09-04

---

## 📊 Week at a glance

- **Commits this week**: 0
- **Files changed**: 0
- **Debt markers added**: 0
- **High-churn files**: N/A — no activity

> **Note**: The repository has been dormant since **2026-05-10** (last commit: "Add comprehensive README for interactive ebook"). The most recent meaningful changes were the book redesign and Vercel routing fix in late April / early May 2026. All findings below are from a full static audit of the codebase rather than diff-scoped analysis, since there is no recent activity to scope to.

---

## 🚨 Needs immediate attention

### 1. Path traversal in `server.js`
- **File**: `server.js:41`
- **Commit introduced**: `6a85991` (2026-04-13, "Improve server and front-end routing...")
- **Why this matters**: `path.join(__dirname, urlPath)` with no boundary check allows requests like `/../../../etc/passwd` to read files outside the web root. Only mitigated by Vercel in production; locally, any developer running `npm start` is exposed.

### 2. Mobile navigation is non-functional
- **File**: `index.html:545-614` (CSS), no matching HTML
- **Commit introduced**: `5e3cfd3` (2026-04-13, "feat: redesign UI/UX for main and cards pages")
- **Why this matters**: The `.mobile-menu-btn` CSS class was written but the corresponding `<button>` element was never added to the HTML. Mobile users (<768 px) see nav links disappear with no way to access them.

### 3. `copyLink()` has no error fallback
- **File**: `index.html:2752-2756`
- **Commit introduced**: `6a85991` (2026-04-13)
- **Why this matters**: `navigator.clipboard.writeText()` silently rejects in HTTP or older-browser contexts with no user feedback. The identical flow in `cards.html` already has a `textarea` fallback — this page doesn't.

### 4. Audiobook crashes if `window.speechSynthesis` is undefined
- **File**: `index.html:2651`, `2678`
- **Commit introduced**: `68ea931` (2026-04-20, "feat: complete ebook redesign")
- **Why this matters**: `synth.cancel()` throws `TypeError` in browsers without Web Speech API support (Firefox on some platforms, some mobile browsers). The user sees a broken button.

---

## 🧹 Cleanup opportunities

### 5. `shareOnLinkedIn()` defined but never wired
- **File**: `cards.html:636-639`
- **Commit introduced**: `5e3cfd3` or `8cdd726` (both 2026-04-13)
- **Why this matters**: Dead code; a LinkedIn share button was clearly intended (the function is fully implemented) but the HTML button was never added to `createCards()`. Simple one-line wiring.

### 6. Fragile `safeQuote` escaping in inline `onclick`
- **File**: `cards.html:591`
- **Commit introduced**: `5e3cfd3` (2026-04-13)
- **Why this matters**: `.replace(/'/g, "\\'")` in innerHTML onclick attributes is a known injection pattern. Safe today because quotes are hardcoded, but will break immediately if a user-data path is ever added. Should be converted to `data-*` attributes + `addEventListener`.

### 7. `pnpm-lock.yaml` with zero dependencies
- **File**: `pnpm-lock.yaml` (root)
- **Commit introduced**: `670ca7c` (2026-04-13, initial commit)
- **Why this matters**: `package.json` declares no dependencies; the lockfile is vestigial noise that confuses toolchain intent.

### 8. jsPDF loaded from CDN without an offline fallback
- **File**: `index.html:2467`, `2541-2543`
- **Commit introduced**: `6a85991` (2026-04-13)
- **Why this matters**: If the CDN is blocked, PDF generation silently fails. A `window.print()` fallback is three lines of code and covers corporate networks and ad-blocker users.

---

## 🤔 Worth a second look

### 9. `distribution.html` and `scaling.html` are orphan pages with a different design system
- **Files**: `distribution.html`, `scaling.html`
- **Commits introduced**: `888fc5c`, `19c388f` (both 2026-04-13)
- **Why this matters**: Both pages use blue/teal color scheme and Segoe UI fonts — completely different from the main site's green/Inter/Newsreader system. They have no link back to the main ebook or nav. May be intentional (separate internal dashboards?) but looks accidental.

### 10. `vercel.json` has no rewrite for `/index`
- **File**: `vercel.json:6-19`
- **Commit introduced**: `918696d` (2026-05-04, "Fix Vercel routing for HTML pages")
- **Why this matters**: `/cards`, `/scaling`, `/distribution` all have rewrites; `/index` does not. Vercel normally serves `index.html` from `/` by default, so this is probably fine, but it's an inconsistency worth noting if custom 404 or middleware is ever added.

### 11. `window.speechSynthesis` voices loaded but handler is a no-op
- **File**: `index.html:2747-2749`
- **Commit introduced**: `68ea931` (2026-04-20)
- **Why this matters**: `synth.onvoiceschanged = () => {}` — the handler that should trigger voice selection is empty. The voice preference logic inside `playChapter()` uses `synth.getVoices()` at call-time which may return an empty array if voices haven't loaded yet on first play. The `onvoiceschanged` hook should populate voices and retry the call. Likely causes the browser's default (often robotic) voice to be used instead of the preferred one.

---

> **Total items**: 11 — all pre-existing; no new debt introduced this week (no commits).
