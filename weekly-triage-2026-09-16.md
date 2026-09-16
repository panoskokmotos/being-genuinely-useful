# Weekly Triage — 2026-09-16

## 📊 Week at a glance
- Commits in last 7 days: **0** (last commit: `e62c828` on 2026-05-10)
- Files changed this week: 0
- Debt markers added this week: 0

_No code was pushed in the past 7 days. The findings below come from a full static analysis of the current codebase (all 4 HTML files + server.js) rather than a diff of recent changes._

---

## 🚨 Needs immediate attention

### 1. Mobile navigation is broken — users on phones can't navigate
- **File**: `index.html:600-614` (CSS), `index.html:1376-1387` (HTML nav)
- **Introduced**: `68ea931` (complete ebook redesign, 2026-04-20)
- **Why this matters**: The `.mobile-menu-btn` CSS exists, the nav links are `display:none` on ≤768px, but the button is never rendered in the HTML and has no JS handler. Mobile users are stuck — no way to jump to chapters or the Cards page.

### 2. `copyLink()` has no error handler — silently fails on clipboard denial
- **File**: `index.html:2752-2756`
- **Introduced**: `6a85991` (PDF + UI polish, 2026-04-13)
- **Why this matters**: The "Copy Link" CTA button does nothing if the Clipboard API is unavailable (non-HTTPS, permission denied). The PDF download and the card copy both have fallbacks; this one doesn't.

### 3. No OG/SEO meta tags on any page
- **File**: `index.html:1-10`, `cards.html:1-10`
- **Introduced**: Initial commit `670ca7c`
- **Why this matters**: Every share of this book URL on Twitter/LinkedIn renders as a blank unfurled card. The Share Cards page exists specifically to drive viral sharing — missing OG tags nullifies that intent.

### 4. PDF hardcodes `openclaw.ai/book` as the footer URL
- **File**: `index.html:2577`
- **Introduced**: `6a85991` (2026-04-13)
- **Why this matters**: Downloaded PDFs link back to `openclaw.ai/book`, not the actual deployed URL. Every PDF distributed from Vercel points to a different domain.

---

## 🧹 Cleanup opportunities

### 5. Dead CSS: `.mobile-menu-btn` fully styled, element never rendered
- **File**: `index.html:600-614`
- **Commit**: `68ea931` (ebook redesign)
- **Context**: Likely a half-finished implementation — the CSS was written but the HTML element was never added. Either wire it up (see item #1) or delete 12 lines of dead CSS.

### 6. `speechSynthesis.onvoiceschanged = () => {}` — no-op overwrites the callback
- **File**: `index.html:2747-2749`
- **Commit**: `8cdd726` (enhance features)
- **Context**: This pattern registers the `onvoiceschanged` event but with an empty body. The intent was clearly to trigger voice selection when voices load — the implementation forgot to do anything.

### 7. Inline `onclick` string interpolation with manual escaping in cards
- **File**: `cards.html:591-605`
- **Commit**: `5e3cfd3` (redesign UI/UX for cards)
- **Context**: `safeQuote` uses `replace(/'/g, "\\'")` but is interpolated directly into an `onclick="..."` attribute. A quote with `\'` can still break the handler. Should use `data-index` + `addEventListener`.

### 8. CSS duplicated across all 4 HTML files
- **File**: `index.html:11-22`, `cards.html:11-22`, `scaling.html:7-211`, `distribution.html:7-199`
- **Commit**: Various (each page added its own copy)
- **Context**: The `:root` variables and base styles are near-identical in index/cards but diverge significantly in scaling/distribution — exactly the brand drift that happens without a shared stylesheet. Changing `--accent` requires editing 4 files.

---

## 🤔 Worth a second look

### 9. `scaling.html` and `distribution.html` are publicly accessible planning documents
- **File**: `vercel.json:6-18` routes `/scaling` and `/distribution` to the HTML files
- **Commit**: `19c388f`, `888fc5c` (both 2026-04-13)
- **Context**: Both pages contain internal monetization projections ("$0 → $100K+/month"), email course templates, and Twitter content plans. They are fully public and indexable. May be intentional as a "build-in-public" play — but also may be accidentally exposed internal docs. Worth a deliberate decision either way.

### 10. `downloadCardImage()` uses `Georgia, serif` in canvas but Inter on the web
- **File**: `cards.html:659`
- **Commit**: `5e3cfd3`
- **Context**: `ctx.font = 'italic 36px Georgia, serif'` — the generated share image uses a different typeface than the web page, which uses Newsreader for quotes. Not broken, but the generated images look inconsistent with the on-screen cards. Intentional? If not, loading a web font into canvas requires `FontFace.load()`.

### 11. `server.js` sets no cache headers for `index.html` but sets 1-day cache for all other assets
- **File**: `server.js:98-101`
- **Commit**: `6a85991`
- **Context**: The cache logic is correct (`no-cache` for HTML, `public max-age=86400` for assets), but there are no cache-busting mechanisms for the assets. If `cards.html` or the jsPDF CDN script changes, visitors may see stale versions for up to 24 hours.

---

_This triage covers all files in the current HEAD. No changes made to the codebase._
