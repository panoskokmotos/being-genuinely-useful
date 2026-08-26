# Weekly Triage — 2026-08-26

## 📊 Week at a glance
- **Commits this week**: 0 (last commit was `e62c828` — Add comprehensive README)
- **Files changed this week**: 0
- **Debt markers added this week**: N/A (no changes to scan)
- **High-churn files (last 14 commits)**: `index.html` (touched in majority of commits), `server.js`, `vercel.json`

_No code was committed in the past 7 days. The items below are standing issues identified by a static scan of the current codebase — not new this week, but unaddressed._

---

## 🚨 Needs immediate attention

### 1. Mobile navigation is broken — users on phones have no nav
- **File**: `index.html:544–546, 601–614`
- **Commit introduced**: `68ea931` (complete ebook redesign) — the `.mobile-menu-btn` CSS was added but the HTML button and JS handler were never wired
- **Why this matters**: `.nav-links { display: none }` on ≤768 px viewport with no toggle — every mobile visitor sees only the logo and "Share Cards" CTA. All chapter links and the main navigation are completely gone.

### 2. Path traversal in dev server
- **File**: `server.js:41–45`
- **Commit introduced**: `6a85991` (Improve server and routing)
- **Why this matters**: `path.join(__dirname, urlPath)` with no boundary check. `GET /../../../etc/passwd` will be served. Only the local dev server, but any developer running it locally is exposed.

---

## 🧹 Cleanup opportunities

### 3. Duplicated CSS design tokens
- **Files**: `index.html:11–22`, `cards.html:11–22`
- **Commit introduced**: `5e3cfd3` (redesign UI/UX)
- **Why this matters**: Identical `:root` custom property blocks in both files. One brand color change = two edits, and the two utility pages (`distribution.html`, `scaling.html`) don't share the tokens at all — explaining their visual divergence.

### 4. `synth.onvoiceschanged = () => {}` no-op in audiobook
- **File**: `index.html:2747–2749`
- **Commit introduced**: `68ea931`
- **Why this matters**: Chrome returns an empty voices array on first `getVoices()` call and fires `onvoiceschanged` to signal they're ready. The empty handler means the preferred voice (Google/Samantha/Daniel) is never selected on Chrome — users get the default robotic system voice.

### 5. jsPDF CDN script has no SRI integrity hash
- **File**: `index.html:2467`
- **Commit introduced**: `6a85991`
- **Why this matters**: No `integrity="sha256-..."` attribute means the browser accepts any content from cdnjs.cloudflare.com without verification. CDN outage = silent PDF failure; CDN compromise = arbitrary JS execution.

### 6. No Open Graph meta tags on any page
- **Files**: `index.html:1–10`, `cards.html:1–10`
- **Commit introduced**: `670ca7c` (initial commit, never added)
- **Why this matters**: The site has a dedicated `/cards` page for social sharing, but shares of the book URL render as a bare link with no title, description, or image — undercutting the entire Cards feature.

### 7. No favicon
- **Files**: All four HTML files
- **Commit introduced**: Never added across any commit
- **Why this matters**: Browser shows a grey generic tab icon. Looks like a dev build.

---

## 🤔 Worth a second look

### 8. `distribution.html` and `scaling.html` appear to be admin/author tools, not reader pages
- **Files**: `distribution.html`, `scaling.html`
- **Commit introduced**: `888fc5c`, `19c388f`
- **Why this matters**: These pages describe a "30-day distribution plan" and "passive income tiers" — likely notes for the author, not content for end readers. They use a completely different design system (blue palette, Segoe UI) and have no nav back to the main site. If they're author-only, they should either be behind auth, removed from Vercel routing, or clearly marked. If they're meant to be public, they need to be brought on-brand (see `IMPROVEMENT_PLAN.md` P1.3).

### 9. `index.html` nav links `#deutsch`, `#systems`, `#exercises` — heading occlusion by fixed nav
- **File**: `index.html:1379–1384`
- **Commit introduced**: `5e497cf`
- **Why this matters**: Clicking these anchors scrolls the chapter heading directly behind the 64px fixed nav bar. `scroll-padding-top` is applied to the sidebar scroll container but not the `html` element, so top-nav anchor clicks are broken.

### 10. No 404 page for Vercel (only for local dev server)
- **Files**: `vercel.json`, `server.js:47–91`
- **Commit introduced**: `918696d` (Fix Vercel routing)
- **Why this matters**: The custom 404 page exists in `server.js` for local dev. On Vercel, any unmatched route returns Vercel's generic 404 — no branded page, no "Go Home" link. Consider adding a `404.html` at the repo root (Vercel serves it automatically).
