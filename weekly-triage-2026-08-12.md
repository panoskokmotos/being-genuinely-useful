# Weekly Triage — 2026-08-12

## 📊 Week at a glance
- **Commits (last 7 days):** 0
- **Files changed:** 0
- **Debt markers added this week:** N/A — no commits
- **High-churn files:** None (last commit was 2026-05-10, ~3 months ago)

> Repository is in a maintenance freeze. All findings below are from a full static scan of the current working tree, not scoped to recent commits.

---

## 🚨 Needs immediate attention

### 1. Path traversal — arbitrary file reads
**File:** `server.js:26-41` | **Commit introduced:** `918696d` (Fix Vercel routing for HTML pages)  
**Why this matters:** `path.join(__dirname, urlPath)` with no boundary check means `GET /../../etc/passwd` (or any `..` path) resolves outside the project root and is served if readable. The fix in commit `918696d` added routing logic but did not add a path-containment guard. Exploitable on any environment running the Node server directly (local dev, any non-Vercel host).

---

### 2. Binary files served with `utf-8` encoding — fonts and PDFs corrupted
**File:** `server.js:103` | **Commit introduced:** `670ca7c` (Being Genuinely Useful in an AI World)  
**Why this matters:** `res.end(content, 'utf-8')` corrupts binary files. Google Fonts are loaded via CDN so the CSS files work, but any locally-served binary (future image assets, downloaded PDF) will be byte-corrupted. The PDF download in `index.html` is generated client-side via jsPDF and doesn't touch this path — but this is a silent trap for the next asset added.

---

### 3. Mobile nav has no handler — users are stranded on mobile
**File:** `index.html:601-614` | **Commit introduced:** `68ea931` (feat: complete ebook redesign)  
**Why this matters:** The ebook's primary audience shares content on mobile. The hamburger button (`mobile-menu-btn`) renders correctly but has no JS click handler anywhere in the 420-line script block. Mobile users cannot navigate between chapters or reach the Cards page.

---

## 🧹 Cleanup opportunities

### 4. `console.error` left in PDF generation path
**File:** `index.html:2642` | **Commit introduced:** `5e3cfd3` (feat: redesign UI/UX)  
```js
console.error('PDF generation failed:', err);
```
This is a borderline intentional log (errors should surface), but the error is caught here and the user sees a toast. Consider whether the `console.error` should be replaced with a structured error log or removed. At minimum, it leaks stack trace detail to browser dev tools on failure.

---

### 5. `synth.onvoiceschanged` set to empty function — no-op that looks intentional
**File:** `index.html:2747-2749` | **Commit introduced:** `5e497cf` (feat: infuse book with wisdom)  
```js
if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = () => {};
}
```
This is almost certainly a placeholder from a "load voices on init" pattern that was never completed. The handler should call `initAudiobook()` or at minimum load available voices so the preferred-voice selection at line 2689 actually works. As written, it fires and does nothing, meaning voice selection on first load may always fall back to the browser default.

---

### 6. `pnpm-lock.yaml` exists but `package.json` declares no dependencies
**File:** `package.json`, `pnpm-lock.yaml` | **Commit introduced:** `670ca7c`  
No `dependencies` or `devDependencies` in `package.json`. The lockfile was likely generated and then the deps removed or never added properly. Running `pnpm install` will generate a lock for zero deps, which is harmless but suggests an abandoned intent to add packages (jsPDF is loaded from CDN; if that was ever going to be bundled, it wasn't followed through on).

---

### 7. CSS for `.audio-player` fully implemented but the audiobook uses Web Speech API instead
**File:** `index.html:666-796` (CSS), `index.html:2650-2749` (JS)  
The `.audio-player` component has full CSS (show/hide animation, controls layout, progress bar). The JS implements this using `window.speechSynthesis` (browser TTS), not actual audio files. The progress bar update via `utterance.onboundary` works by character index, not by time — it will jump erratically on long chapters. The feature works but is rougher than the polish of the CSS implies. No `try/catch` around `synth.speak()`.

---

## 🤔 Worth a second look

### 8. `safeQuote` escaping in `cards.html` is partial — XSS surface exists
**File:** `cards.html:591` | **Commit introduced:** `68ea931`  
```js
const safeQuote = card.quote.replace(/'/g, "\\'").replace(/"/g, '\\"');
```
This is used inside `onclick="copyToClipboard('${safeQuote}', '${card.source}')"`. The escaping handles `'` and `"` but not backticks, `\n`, or other characters that can break an inline `onclick` attribute. `card.source` in the same `onclick` is completely unescaped. Currently safe because both `quote` and `source` are hardcoded — but if this pattern is ever extended to dynamic/user data, it becomes an XSS vector. Consider replacing `onclick` string injection with `dataset` attributes + a delegated event listener.

---

### 9. `distribution.html` and `scaling.html` are orphaned pages with no inbound links
**File:** `index.html:1379-1387`, `vercel.json:6-18`  
Both pages are wired in `vercel.json` rewrites and contain real content (30-day plans, monetisation strategies), but no link from `index.html` or `cards.html` points to them. They only exist as direct-URL orphans. Either they're intentionally hidden (staging content) or they've been forgotten. If the latter, adding nav links would expose already-written content at zero cost.

---

### 10. jsPDF loaded from `cdnjs.cloudflare.com` — no integrity check
**File:** `index.html` (around line 2500, the PDF download section)  
The jsPDF library is loaded from a CDN without a `integrity="sha384-..."` attribute. If the CDN is compromised, arbitrary JavaScript executes in the context of the page. Standard best practice for CDN-loaded scripts is to include the SRI hash. Low probability, but straightforward to fix.

---

*Triage completed via full static scan. No automated tooling (ESLint, tsc) is configured — adding a lint step would catch items like #8 automatically going forward.*
