# Weekly Triage — 2026-08-17

## 📊 Week at a glance

- Commits (last 7 days): **0**
- Files changed: **0**
- Debt markers added this week: **0** (no changes)
- Last commit: `e62c828` — 2026-05-10 — "Add comprehensive README for interactive ebook" (99 days ago)
- High-churn files: None this week

> No code was committed in the last 7 days. This triage covers pre-existing debt in the live codebase that poses production risk. Items are drawn from a static scan of the current files.

---

## 🚨 Needs immediate attention

### 1. `index.html:2495` + `index.html:2655` — Duplicate `chapters` variable → SyntaxError

Commit introduced: `68ea931` (redesign) + `8cdd726` (enhance features) — variable likely diverged during two separate feature passes.

```js
// line 2495 — sidebar tracking
const chapters = Array.from(document.querySelectorAll('.chapter'));

// line 2655 — audiobook
let chapters = [];
```

Both declarations live at the top level of the same `<script>` block. Modern JS engines throw `SyntaxError: Identifier 'chapters' has already been declared` at parse time, preventing the entire script from executing. If this fires, the reading progress bar, scroll animations, sidebar, PDF download, audiobook, and copy-link are all dead. Likely went unnoticed because the HTML content renders without JS.

**Fix:** Rename audiobook variable to `audiobookChapters` at line 2655 and update all five audiobook functions that reference it.

---

### 2. `index.html:2576` — Hardcoded wrong URL in PDF output

Commit: `6a85991` (PDF support added).

```js
doc.text('openclaw.ai/book', pageWidth / 2, y, { align: 'center' });
```

Every downloaded PDF sends readers to `openclaw.ai/book`, not `being-genuinely-useful.vercel.app`. Every share of the PDF is traffic leaking to a third-party domain (or a dead URL). Fix: replace with `window.location.origin`.

---

### 3. `cards.html:591` — Fragile quote escaping in `innerHTML` template

Commit: `5e3cfd3` (UI redesign).

```js
const safeQuote = card.quote.replace(/'/g, "\\'").replace(/"/g, '\\"');
// then injected into onclick="copyToClipboard('${safeQuote}', ...)"
```

The escaping handles `'` and `"` but not `<`, `>`, `&`, or backticks. Any future quote with an HTML entity or angle bracket will break card rendering or create an XSS vector if quotes ever become dynamic. The `onclick` inline handler pattern is also fragile — backticks in a quote will immediately terminate the template literal.

**Fix:** Switch from `innerHTML` string interpolation to `addEventListener` and `textContent` assignment.

---

### 4. `index.html:2753` — Unhandled clipboard rejection

Commit: `8cdd726`.

```js
function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        showToast('Link copied to clipboard!');
    });
    // no .catch()
}
```

On HTTP or when the user denies clipboard permission, the promise rejects silently. No toast appears; the button looks broken. The identical function in `cards.html` at line 617 has the same issue but adds a `try/catch` fallback block — the inconsistency suggests this was added in a separate commit pass.

**Fix:** Add `.catch(() => showToast('Could not copy — please copy the URL from your address bar.'))`.

---

### 5. `server.js:41` — Path traversal on local dev server

Commit: `6a85991`.

```js
const filePath = path.join(__dirname, urlPath);
```

No check that the resolved `filePath` stays within `__dirname`. A request for `GET /../../etc/passwd` would resolve to a file outside the project root. The local dev server is used by anyone running `pnpm dev`; this does not affect Vercel production.

**Fix:** Add `if (!filePath.startsWith(__dirname + path.sep)) { res.writeHead(403); ... }` immediately after the `path.join()` call.

---

## 🧹 Cleanup opportunities

### 6. `index.html:2747-2749` — `synth.onvoiceschanged` set to no-op

Commit: `8cdd726`.

```js
if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = () => {};
}
```

This overwrites the browser's `onvoiceschanged` handler with a function that does nothing. It appears to be scaffolding from an earlier attempt to pre-load voices that was never completed. Voices are fetched on demand inside `playChapter()` via `synth.getVoices()`, so this block has no effect. It's dead code that reads as intentional but isn't.

**Fix:** Delete lines 2747-2749. No functionality changes.

---

### 7. `index.html:2466-2467` — External CDN script with no SRI hash

Commit: `6a85991`.

```html
<!-- jsPDF for PDF generation -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
```

No `integrity` or `crossorigin` attribute. If cdnjs is compromised, arbitrary JS runs in the reader's page with full DOM access.

**Fix:** Generate SRI hash with `openssl` and add `integrity="sha384-<hash>" crossorigin="anonymous"`. One line change, eliminates the risk class.

---

### 8. `cards.html:620-628` — `document.execCommand('copy')` deprecated

Commit: `5e3cfd3`.

```js
document.execCommand('copy');
```

This API is deprecated in all major browsers and removed in some contexts. The fallback is used for "older browsers" but the site's Inter + Canvas API usage already excludes IE11. Safe to replace with a user instruction toast.

---

### 9. `distribution.html`, `scaling.html` — No `<nav>` and completely off-brand

Commits: `888fc5c`, `19c388f` (separate commits, different visual style).

Both pages use `font-family: 'Segoe UI'`, blue gradient backgrounds, and card styling that shares no CSS variables with the main ebook. They also have no navigation back to the main site. A user arriving via direct URL has no way back without pressing the back button.

These pages exist in routing (`vercel.json`) and in the commit history, but are effectively invisible — no page links to them. Either link to them from the footer or add `<meta name="robots" content="noindex">` to prevent unintended SEO indexing.

---

## 🤔 Worth a second look

### 10. `cards.html:636-639` — `shareOnLinkedIn()` defined but never called

```js
function shareOnLinkedIn() {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}`;
    window.open(url, '_blank', 'width=550,height=420,noopener,noreferrer');
}
```

This function is correct and complete but wired to nothing. Either a LinkedIn button was planned and cut, or the function was added speculatively. The intent seems clear — add the button or remove the dead function.

---

### 11. `index.html:2509-2516` — Sidebar `activeId` tracking uses mutation without cleanup

```js
let activeId = null;
const chapterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            activeId = entry.target.id;  // last-write-wins, no sort by position
        }
    });
    ...
}, { rootMargin: '-20% 0px -60% 0px', threshold: 0 });
```

When multiple chapters enter the intersection region simultaneously (e.g., fast scroll, small viewport), multiple entries fire in one callback. The last entry to be `isIntersecting` wins, which is non-deterministic. On most scroll speeds this doesn't matter, but on large monitors or fast scrolls the active sidebar item may flicker or land on the wrong chapter.

**Worth a look if users report sidebar highlighting glitches.** Fix would be to pick the entry with the highest `intersectionRatio` or lowest `boundingClientRect.top`.

---

### 12. `index.html:2481-2490` — `animObserver` never cleans up disconnect

```js
const animObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            animObserver.unobserve(entry.target);  // ✓ individual elements are cleaned up
        }
    });
}, { threshold: 0.08 });
```

Individual elements are correctly unobserved after they animate in. The observer itself is never disconnected, but since all elements unobserve themselves, the observer becomes idle rather than leaking. **Low priority — no action needed unless performance profiling shows observer overhead.**

---

### 13. `index.html` — `#exercises` anchor is on an `h3`, scroll offset math may be off

The nav link `href="/#exercises"` and the smooth scroll JS both target `#exercises`, which is an `h3` at line 2266. The scroll offset calculation (`target.getBoundingClientRect().top + window.scrollY - 80`) accounts for the fixed nav but `h3` elements have no top padding — the chapter content directly above may be clipped by the nav bar on some viewport heights.

**Likely fine on desktop, worth checking on mobile-sized viewports where the 80px offset may not be enough.**

---
