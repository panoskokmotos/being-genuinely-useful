# Weekly Triage — 2026-08-19

## 📊 Week at a glance

- **Commits this week**: 0
- **Files changed**: 0
- **Debt markers added this week**: 0
- **High-churn files**: N/A (no activity)

_No commits landed in the last 7 days. Triage below is drawn from a full static analysis of the current working tree on branch `claude/amazing-dijkstra-p4gjpt`._

---

## 🚨 Needs immediate attention

### 1. `index.html:2495 + 2655` — `chapters` declared twice in the same script scope

**Commit introduced**: `68ea931` (feat: complete ebook redesign — cover, sidebar, animations, enriched content)

The sidebar code declares `const chapters = Array.from(document.querySelectorAll('.chapter'))` at the top level of the `<script>` block, and the audiobook code later declares `let chapters = []` in the same block. In modern browsers, redeclaring a `const`/`let` binding in the same scope is a **SyntaxError** — the entire script refuses to parse. Every interactive feature on the page (progress bar, scroll animations, sidebar, PDF download, audiobook, copy link) fails silently.

**Why this matters**: This is not a subtle edge case — it breaks the page for all users in all modern browsers. The only reason it might appear to work in some setups is if an older cached version of the script is being served.

**Fix**: Rename the audiobook variable to `audiobookChapters` at lines 2655–2659 and update all references inside `initAudiobook()`, `playChapter()`, and related functions.

---

### 2. `server.js:41` — Path traversal allows reading files outside the project root

**Commit introduced**: `6a85991` (Improve server and front-end routing, add PDF support, and polish UI/UX)

```js
const filePath = path.join(__dirname, urlPath);
```

`urlPath` is taken directly from `req.url` with no boundary check. A request for `/../../../etc/passwd` normalizes to `/etc/passwd` after `path.join`. Any process or person with network access to the dev server can read arbitrary host files.

**Why this matters**: If the dev server is ever exposed (e.g. in a shared office network, a container with open ports, or a tunnelled dev session), this is a one-liner exploit. Low probability in practice but catastrophic if hit.

**Fix**: After constructing `filePath`, add:
```js
const root = path.resolve(__dirname);
if (!filePath.startsWith(root + path.sep) && filePath !== root) {
    res.writeHead(403); res.end('Forbidden'); return;
}
```

---

## 🧹 Cleanup opportunities

### 3. `index.html:2467` — jsPDF CDN script loaded on every page (1.2 MB)

**Commit introduced**: `6a85991`

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
```

This is a blocking script in the document body, loading ~1.2 MB from an external CDN unconditionally. Most visitors never click "Download PDF". The CDN is also a single point of failure.

**Why this matters**: Measurable page weight and load-time penalty for 100% of visitors, benefit for a small fraction.

**Fix**: Load dynamically inside `downloadPDF()` on first click. Or replace with `window.print()` + print CSS.

---

### 4. `cards.html:636` — Dead function `shareOnLinkedIn()` never called

**Commit introduced**: `5e3cfd3` (feat: redesign UI/UX for main and cards pages)

```js
function shareOnLinkedIn() {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=...`;
    window.open(url, '_blank', 'width=550,height=420,noopener,noreferrer');
}
```

The function is defined but there is no LinkedIn button in the UI. It has never been called.

**Why this matters**: Dead code suggests an abandoned feature. LinkedIn is actually the most natural platform for this content (knowledge work, AI, career positioning) — this should either be shipped or removed.

**Fix**: Wire up a LinkedIn button in each card's `.card-buttons`, or delete the function.

---

### 5. `cards.html:591-602` — Fragile onclick string escaping

**Commit introduced**: `8cdd726` (feat: enhance features and polish UI)

```js
const safeQuote = card.quote.replace(/'/g, "\\'").replace(/"/g, '\\"');
cardEl.innerHTML = `... onclick="copyToClipboard('${safeQuote}', ...)"`;
```

Injecting data into `onclick` strings via regex replacement is fragile. The escaping handles `'` and `"` but not backslashes, newlines, or template literal characters. The data is currently hardcoded and safe, but this pattern becomes an XSS vector the moment card data comes from any external source.

**Why this matters**: Low risk today (static data), but a pattern that will cause pain when content is made editable or fetched from an API.

**Fix**: Use `data-*` attributes + a delegated event listener. Remove the string escaping entirely.

---

### 6. `index.html:2752` — `copyLink()` missing fallback for non-HTTPS

**Commit introduced**: `68ea931`

```js
function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        showToast('Link copied to clipboard!');
    });
}
```

No `.catch()`. On `http://` origins or file:// (common in dev), `navigator.clipboard.writeText` rejects with a DOMException, but the toast fires "Link copied!" anyway via the microtask queue's state at that moment — actually no, it won't fire (the `.then` won't run on rejection). Users see nothing happen.

**Why this matters**: During local development (`http://localhost`), the copy button appears broken. The fix is already written in `cards.html:619-627` — `copyToClipboard()` there has the `execCommand` fallback. This is a DRY violation and a usability bug.

**Fix**: Extract the clipboard utility to a shared function and use it in both pages.

---

## 🤔 Worth a second look

### 7. `index.html:2701-2704` — `onboundary` event for audiobook progress

```js
utterance.onboundary = (event) => {
    const progress = (event.charIndex / chapters[currentChapterIndex].text.length) * 100;
    document.getElementById('audioProgressBar').style.width = progress + '%';
};
```

`SpeechSynthesisUtterance.onboundary` is not dispatched in Firefox (MDN: "Not implemented"). The progress bar will never advance in Firefox, making the audiobook feature appear broken in ~25% of desktop browsers.

**Why this matters**: The audiobook is a conversion-level feature prominently placed in the CTA section. If it looks broken on Firefox, it hurts trust in the whole page.

**Commit introduced**: `68ea931`

**Suggested approach**: Supplement with a `setInterval` that advances a timer-based progress estimation while `synth.speaking` is true, falling back gracefully when `onboundary` fires.

---

### 8. `index.html:2577` — Hardcoded `openclaw.ai/book` in PDF generation

```js
doc.text('openclaw.ai/book', pageWidth / 2, y, { align: 'center' });
```

Every generated PDF points to `openclaw.ai/book` regardless of actual deployment URL. Vercel preview deployments, staging environments, or a custom domain change would produce PDFs with stale attribution.

**Commit introduced**: `6a85991`

**Suggested approach**: Use `window.location.origin` at generation time.

---

### 9. `server.js:99-102` — No security response headers

The server sends no `X-Frame-Options`, `X-Content-Type-Options`, `Content-Security-Policy`, or `Referrer-Policy`. Low urgency for a dev-only server, but worth noting if this ever gets used as a production fallback.

**Commit introduced**: `6a85991`

---

_Triage capped at quality items. No activity this week means zero new risk — existing issues are pre-existing technical debt from the build sprint._
