# Weekly Triage — 2026-08-28

## 📊 Week at a glance
- **Commits this week**: 0 (last commit: `e62c828` on 2026-05-10, ~110 days ago)
- **Files changed**: N/A
- **Debt markers added this week**: N/A — no activity
- **High-churn files**: N/A

> No commits landed in the last 7 days. The triage below covers the most critical latent debt found in the current codebase, since that is the active risk surface.

---

## 🚨 Needs immediate attention

### 1. `index.html` — SyntaxError: `chapters` declared twice at top-level scope
- **File:line**: `index.html:2495` and `index.html:2655`
- **Introduced by**: `e62c828` (or the preceding large redesign commit `68ea931`)
- **Why this matters**: `const chapters` is declared in the sidebar IntersectionObserver setup, then `let chapters = []` re-declares it in the audiobook state block — both at the top level of the same `<script>` tag. Browsers throw `SyntaxError: Identifier 'chapters' has already been declared` at parse time, preventing the entire script from executing. **Every JS-dependent feature on the page is silently broken**: reading progress bar, scroll animations, chapter sidebar, smooth scrolling, PDF download, audiobook player, and share/copy buttons.
- **Fix**: Rename the sidebar const to `chapterEls` at line 2495 and update its two usages.

### 2. `index.html` — Mobile nav links hidden with no hamburger menu
- **File:line**: `index.html:544-546` (CSS `display:none`), `index.html:1376-1387` (nav markup — no mobile button)
- **Introduced by**: Initial nav design in `5e3cfd3` or `68ea931`
- **Why this matters**: On any viewport <768px, the nav collapses entirely. There is no hamburger or fallback navigation. Mobile users cannot access the Cards page or jump to chapters.

---

## 🧹 Cleanup opportunities

### 3. `index.html:2577` — Hardcoded `openclaw.ai/book` in PDF generator
- **Introduced by**: PDF feature added in `8cdd726` or `68ea931`
- **Why this matters**: The generated PDF links to `openclaw.ai/book`, which is either a dead link or a different product. Readers downloading the PDF will be unable to find the site.
- **Fix**: Replace with `window.location.origin`.

### 4. `index.html:2752-2756` — `copyLink()` has no error handling
- **Introduced by**: Recent polish commits
- **Why this matters**: `navigator.clipboard.writeText` silently rejects on HTTP or older iOS Safari. The function has no `.catch()`, so failed copies produce no feedback.
- **Fix**: Add `.catch()` with the textarea fallback already written in `cards.html:619-627`.

### 5. `README.md:57-63` — Project structure lists three non-existent files
- **Introduced by**: `e62c828` (README written incorrectly)
- **Why this matters**: Lists `style.css`, `script.js`, and `chapters/` — none of which exist. Misleads contributors.
- **Fix**: Update to reflect actual files in the repo.

### 6. `cards.html:636` — Dead function `shareOnLinkedIn()` never called
- **Introduced by**: `5e3cfd3` or `8cdd726`
- **Why this matters**: Defines a LinkedIn share function that no button invokes. Either wire it up or delete it.

---

## 🤔 Worth a second look

### 7. `distribution.html` + `scaling.html` — Entirely different design system
- **File:line**: `distribution.html:15-16`, `scaling.html` (similar)
- **Why this looks suspicious**: These pages use `'Segoe UI'` font and a slate `#0f172a` background instead of the Inter/green brand used everywhere else. They appear to be early planning documents that were never brought into the main design. They are linked from `vercel.json` routes, so they are live and reachable.
- **Likely intentional?** Possibly — they may be internal-only planning pages. But they're public and feel like a different product.

### 8. `vercel.json` — `cleanUrls: false` and no 404 config
- **File:line**: `vercel.json:4-5`
- **Why this looks suspicious**: `cleanUrls: false` means `/cards.html` and `/cards` both work, but a typo'd URL (e.g. `/chapter-1`) returns Vercel's generic 404 rather than the styled on-brand page. There's a custom 404 in `server.js` for local dev but no equivalent for Vercel production.

### 9. `index.html` — Audio `onboundary` event for progress tracking
- **File:line**: `index.html:2701`
- **Why this looks suspicious**: `onboundary` is not supported on iOS Safari or older Firefox. Progress bar will remain at 0% for a large portion of mobile users. Could be by design (acceptable degradation), but given the audiobook is a headline feature on the CTA, worth a browser-compat check.

---

*Triage complete. 2 items flagged for immediate attention (bugs breaking live features), 4 cleanup items, 3 items to review.*
