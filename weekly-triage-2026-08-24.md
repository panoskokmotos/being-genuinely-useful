# Weekly Triage — 2026-08-24

## 📊 Week at a glance

- **Commits this week**: 0 (last commit was 2026-05-10, 106 days ago)
- **Files changed**: 0
- **Debt markers added this week**: 0

> The codebase has been dormant for 3.5 months. No code churn, no new debt introduced this week. Triage below is based on a full static audit of the current files.

**High-churn files (historical, all-time)**: `index.html` was touched in every non-trivial commit. At 2779 lines it is the single highest-risk file in the repo.

---

## 🚨 Needs immediate attention

### 1. Mobile navigation is non-functional

`index.html:600–614` + `index.html:1376`

The `.mobile-menu-btn` element is rendered on screens < 768 px, but no JavaScript event listener is attached to it anywhere in the file. Mobile users (likely the majority of traffic) see the hamburger icon, tap it, and nothing happens. There is no way to navigate chapters on mobile without already knowing the anchor URLs.

This is a silent, total navigation failure on mobile — not a cosmetic issue.

Introduced in commit `68ea931` (complete ebook redesign) when the mobile button was added as CSS-only without its handler.

---

### 2. PDF credits the wrong URL

`index.html:2577`

```js
doc.text('openclaw.ai/book', pageWidth / 2, y, { align: 'center' });
```

Every downloaded PDF contains a hardcoded URL (`openclaw.ai/book`) that is not the live site. Readers who try to revisit the site from a downloaded PDF follow a dead or unrelated link. This went out in commit `8cdd726` (enhance features and polish UI) when the PDF generator was first added.

---

### 3. Audiobook silently fails on unsupported browsers

`index.html:2651`

`window.speechSynthesis` is called without an existence check. Firefox on Android, some iOS WebViews, and browsers in data-saver mode either throw or return a speechSynthesis object that refuses to speak. The player bar appears but nothing plays — no error, no message.

---

### 4. External CDN dependency for PDF generation, no SRI hash

`index.html:2467`

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
```

No `integrity` attribute. A CDN outage or compromised delivery silently breaks PDF download for all users. The PDF button shows "Generating…" and then resets without explanation (the `catch` only logs to console and shows a toast). First appeared in `8cdd726`.

---

## 🧹 Cleanup opportunities

### 5. Three variables all named `chapters` in the same script block

`index.html:2495, 2580, 2655`

- Line 2495: `const chapters = Array.from(document.querySelectorAll('.chapter'))` — sidebar tracking
- Line 2580: `const chapters = document.querySelectorAll('.chapter')` — inside `downloadPDF()`
- Line 2655: `let chapters = []` — audiobook state

Each is correctly scoped, but the name collision makes the code risky to edit. Any developer adding audiobook or PDF functionality will have to track which `chapters` they're touching.

Introduced piecemeal across `68ea931` and `8cdd726`.

---

### 6. `distribution.html` and `scaling.html` use a different design system

`distribution.html:7–100`, `scaling.html:7–60`

Both pages use `background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%)`, `font-family: 'Segoe UI'`, and blue buttons (`#3b82f6`) — completely inconsistent with the green-on-dark theme of index.html and cards.html. They were added in commits `888fc5c` and `19c388f` and were never restyled to match.

---

### 7. `copyLink()` uses Clipboard API with no fallback

`index.html:2752–2756`

`navigator.clipboard.writeText()` requires a secure context (HTTPS) and modern browser. The call has no try/catch and no execCommand fallback — if it fails (HTTP dev server, older browser), the toast never fires and the user gets no feedback.

Added in `8cdd726`.

---

## 🤔 Worth a second look

### 8. Smooth-scroll JS override may break keyboard navigation

`index.html:2519–2533`

All `a[href^="#"]` elements have `click` handlers that call `e.preventDefault()` and perform manual `window.scrollTo()`. The intent is smooth scrolling, but `html { scroll-behavior: smooth }` is already set at line 32 (CSS). The JS override is redundant and may interfere with keyboard navigation (`Tab` + `Enter` on anchor links) in browsers where the `click` listener doesn't fire for keyboard activation.

---

### 9. Audiobook progress bar is character-count based, not time-based

`index.html:2701–2703`

```js
utterance.onboundary = (event) => {
    const progress = (event.charIndex / chapters[currentChapterIndex].text.length) * 100;
```

`charIndex` counts characters spoken, not time elapsed. Chapters with dense text will appear to "jump" through the progress bar faster than chapters with short paragraphs. This may look like a bug to users. Likely intentional but worth flagging.

---

### 10. `server.js` applies 1-day cache to all non-HTML assets

`server.js:98`

```js
const cacheTime = extname === '.html' ? 0 : 86400;
```

All non-HTML files get a 1-day `Cache-Control: public, max-age=86400`. Since this is a static site deployed to Vercel, the server.js only runs in local dev — Vercel's CDN has its own caching. But if someone runs this server directly, updates to CSS/JS (embedded inline in HTML, so less of a concern today) won't propagate for 24 hours. Low-risk currently but a trap if separate CSS/JS files are ever added.

---

*End of triage. 0 new items introduced this week; all findings are pre-existing. Priority action: fix the mobile navigation (item 1) and PDF URL (item 2).*
