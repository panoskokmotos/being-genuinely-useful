# Weekly Triage — 2026-10-05

## 📊 Week at a glance
- **Commits this week:** 0 — no commits in the last 7 days
- **Files changed:** 0
- **Debt markers added:** 0 (no new changes to scan)
- **High-churn files:** N/A — last activity was 2026-10-02

> **Note:** This was a quiet week with no code changes. The triage below is a first-run baseline scan of the codebase as it stands. Standing debt items are documented in `IMPROVEMENT_PLAN.md`.

---

## 🚨 Needs immediate attention

### 1. Mobile navigation broken — `index.html`
The `.mobile-menu-btn` button is styled in CSS (lines 601–614) but never added to the HTML. On screens ≤768 px the nav links are hidden with no way to access them. Introduced in commit `5e3cfd3` (feat: redesign UI/UX).
**Why this matters:** Every mobile visitor — likely the majority — cannot navigate the book.

### 2. Dead file references — `distribution.html:275, 317`
`/distribution/email-course.md` and `/distribution/twitter-threads.md` are referenced as "see full course here" but neither the files nor the `/distribution/` directory exist. Introduced in commit `888fc5c` (Add distribution hub).
**Why this matters:** A user trying to follow the distribution plan hits an incomplete dead end.

### 3. Path traversal in dev server — `server.js:26–45`
`path.join(__dirname, urlPath)` where `urlPath` is the raw request path allows `../../../../etc/passwd`-style reads. Not a Vercel production risk, but exposes the filesystem to any local network if someone runs `npm run dev` on a shared machine. Present since initial commit `670ca7c`.
**Why this matters:** If the dev server is ever exposed (CI preview, ngrok, shared machine), full disk read access is possible.

---

## 🧹 Cleanup opportunities

### 4. `copyLink()` missing `.catch()` — `index.html:2753`
`navigator.clipboard.writeText()` has no rejection handler. Cards.html (commit `5e3cfd3`) added a correct fallback — index.html never got the same fix.
- Commit that has the correct pattern: `5e3cfd3` → `cards.html:619–625`
- Fix: copy the `.catch()` fallback to `index.html:copyLink()`

### 5. `synth.onvoiceschanged = () => {}` no-op — `index.html:2747`
The TTS voice-loading hook was stubbed out and never implemented (commit `68ea931`). Preferred voice (Google/Samantha/Daniel) is never applied on Chrome because voices load async and the handler does nothing.
- Fix: assign a real handler that calls `getPreferredVoice()` when voices arrive

### 6. `openclaw.ai/book` hardcoded in PDF — `index.html:2577`
URL baked into every generated PDF footer. Introduced in commit `6a85991` (Add PDF support). The actual deployment URL is unknown at write time.
- Fix: replace with `window.location.origin`

### 7. jsPDF CDN pinned to `2.5.1` — `index.html:2467`
Old version path on cdnjs; no load-failure guard. If the CDN evicts this version, PDF silently breaks.
- Commit: `6a85991`
- Fix: bump to latest jsPDF version + add `if (!window.jspdf)` guard

---

## 🤔 Worth a second look

### 8. `#exercises` nav link lands mid-chapter — `index.html:1382`
The nav item "Exercises" links to `#exercises` which resolves to `<h3 id="exercises">` inside the last chapter, not a top-level section. Likely intentional (the exercises are in-chapter), but the sidebar doesn't highlight any item when you land there, making the nav feel broken.
- Consider: rename the nav item to "Your Role" with `href="#your-role"` for consistency with sidebar

### 9. Canvas text in `downloadCardImage` has no y-bounds guard — `cards.html:660–692`
Quote text wraps onto new lines with no check against the 630 px canvas height. A quote long enough to wrap 8+ times would overflow into the attribution/footer zone.
- Hardcoded quotes in the current `cards` array are all short enough to be safe today, but this breaks if new cards are added without checking length.

### 10. No OG meta tags — all HTML files
None of the four pages have Open Graph or Twitter Card tags. Given that sharing is the primary CTA ("Share Cards"), every social share produces a bare-URL preview.
- Not a code bug, but high-impact: one `<head>` block change per file.
