# Weekly Triage — 2026-07-27

> **Repo**: panoskokmotos/being-genuinely-useful (interactive ebook, ~4 HTML pages + Node server + Vercel config)
> **Triage scope**: commits from the last 7 days (2026-07-20 → 2026-07-27)

---

## 📊 Week at a glance

- **Commits this week**: 0
- **Files changed**: 0
- **Debt markers added**: 0 (week scope) | **Existing markers in repo**: 2 (see below)
- **High-churn files**: N/A — no commits this week
- **Last commit**: `e62c828` on 2026-05-10 ("Add comprehensive README")

The codebase has been **idle for ~78 days**. All findings below are from the standing codebase, not new introductions.

---

## 🚨 Needs immediate attention

### 1. Mobile nav links unreachable — index.html (nav block)
- **File**: `index.html:601–614` (CSS), nav HTML at `index.html:1376–1387`
- **Introduced by**: `68ea931` ("feat: complete ebook redesign") — 2026-05-07
- **Why this matters**: `.nav-links { display: none }` on screens ≤768px with no hamburger menu element in the HTML. On mobile, Framework / Systems / Exercises / Cards navigation is completely inaccessible. The "Share Cards" CTA is the only interactive nav item.

### 2. Path traversal in local dev server — server.js:41
- **File**: `server.js:41`
- **Introduced by**: `670ca7c` (initial commit) — 2026-05-07
- **Why this matters**: `path.join(__dirname, urlPath)` with no containment check. `GET /../../../etc/passwd` resolves to `/etc/passwd` and the server returns its contents. Vercel prod is not affected but any dev running `node server.js` is exposed.

### 3. copyLink() swallows clipboard errors — index.html:2753
- **File**: `index.html:2753`
- **Introduced by**: `8cdd726` ("feat: enhance features and polish UI") — 2026-05-09
- **Why this matters**: `navigator.clipboard.writeText().then(...)` with no `.catch()`. Fails silently on HTTP and when clipboard permission is denied. User clicks "Share Link" and nothing happens.

### 4. SpeechSynthesis onvoiceschanged is a no-op — index.html:2747
- **File**: `index.html:2747–2749`
- **Introduced by**: `8cdd726` — 2026-05-09
- **Why this matters**: `synth.onvoiceschanged = () => {}` registers an empty callback. Chrome loads voices async; `getVoices()` returns `[]` on first call. The preferred-voice detection at line 2689 (`voices.find(...)`) never matches, so the audiobook always uses the default system voice instead of the selected natural-sounding voice.

---

## 🧹 Cleanup opportunities

### 5. Hardcoded `openclaw.ai/book` in PDF output — index.html:2577
- **File**: `index.html:2577`
- **Introduced by**: `6a85991` ("Improve server and front-end routing, add PDF support") — 2026-05-09
- **Why this matters**: Every downloaded PDF contains a link to `openclaw.ai/book` instead of `window.location.origin`. If the book moves to a new domain (or is on a personal domain), all distributed PDFs point to the wrong URL permanently.

### 6. `document.execCommand('copy')` deprecated — cards.html:625
- **File**: `cards.html:625`
- **Introduced by**: `5e3cfd3` ("feat: redesign UI/UX for main and cards pages") — 2026-05-08
- **Why this matters**: Deprecated API slated for removal from browser engines. The fallback path (non-HTTPS or no Clipboard API) will silently stop working in a future browser release.

### 7. `shareOnLinkedIn()` defined but never called — cards.html:636
- **File**: `cards.html:636–638`
- **Introduced by**: `5e3cfd3` — 2026-05-08
- **Why this matters**: Dead function. LinkedIn sharing was either planned and abandoned, or the button was deleted. Either remove the function or wire it to a button.

### 8. No `<meta name="description">` on any page
- **Files**: `index.html:1–10`, `cards.html:1–10`, `distribution.html:1–10`, `scaling.html:1–10`
- **Introduced by**: `670ca7c` (initial commit) — 2026-05-07
- **Why this matters**: SEO and social unfurlers fall back to scraping body text; no consistent description appears in search results or link previews.

### 9. No `robots.txt` / `sitemap.xml`
- **Files**: repo root (absent)
- **Introduced by**: never added
- **Why this matters**: `distribution.html` and `scaling.html` (internal-looking planning pages) are crawlable and indexable. The two reader-facing pages (`/` and `/cards`) have no sitemap entry to help with indexing.

---

## 🤔 Worth a second look

### 10. `distribution.html` and `scaling.html` publicly routed but not linked from nav
- **Files**: `distribution.html`, `scaling.html`, `vercel.json:6–18`
- **Introduced by**: `19c388f` / `888fc5c` — 2026-05-10
- **Why this matters**: Both pages use a completely different design system (Segoe UI, blue gradients, no nav) and appear to be internal tooling or planning docs. Vercel rewrite rules (`/distribution`, `/scaling`) make them publicly accessible. Uncertain whether this is intentional — they may be meant for author use only.

### 11. jsPDF loaded from CDN, no bundled fallback
- **File**: `index.html:2467`
- **Introduced by**: `6a85991` — 2026-05-09
- **Why this matters**: The PDF button is a primary CTA. A CDN outage, ad blocker, or offline user hits the try-catch at line 2642 which shows "PDF generation failed. Try printing instead." No indication this is a network issue vs. a bug. The error handling is technically present but the user experience is poor.

### 12. `index.html` grown to 2778 lines without splitting
- **File**: `index.html:1–2778`
- **Introduced by**: progressively across all commits
- **Why this matters**: 130KB single-file HTML with ~1350 lines of CSS + ~400 lines of JS inlined. The file has grown 4× since initial commit. At this size, changes carry high diff noise and conflicts become harder to resolve. Not urgent but starting to slow iteration.

---

*30-item cap not reached — 12 items total. All high-confidence, no speculative findings.*
