# Weekly Triage — 2026-07-08

## 📊 Week at a glance

- Commits (last 7 days): **0**
- Files changed: **0**
- Debt markers added this week: **0**
- High-churn files: N/A — quiet week

No commits were made in the last 7 days. The triage below covers the most significant pre-existing debt markers found during the accompanying full codebase review, sourced from the current state of HEAD (`e62c828`).

---

## 🚨 Needs immediate attention

### 1. `chapters` re-declared — SyntaxError breaks all JS on `index.html`
- **File:** `index.html:2495` (`const chapters = ...`) and `index.html:2655` (`let chapters = []`)
- **Commit introduced:** `5e497cf feat: infuse book with the world's greatest wisdom`
- **Why this matters:** Re-declaring a `const` with `let` in the same script scope is a parse-time SyntaxError in all modern engines. The entire `<script>` block never runs: reading progress bar, sidebar, smooth scroll, PDF download, audiobook, and copy-link are all dead. The `js-loaded` class is never added to `<body>`, so scroll-in chapter animations are also broken. This is the single highest-priority fix.
- **Fix:** Rename audiobook's `let chapters` to `let audiobookChapters` and update all 5 references inside audiobook functions.

### 2. `copyLink()` has no `.catch()` — silent failure on HTTP
- **File:** `index.html:2752–2756`
- **Commit introduced:** `68ea931 feat: complete ebook redesign`
- **Why this matters:** `navigator.clipboard` requires a secure context (HTTPS). On `localhost` HTTP or when the user denies clipboard permission, the rejection is unhandled — no user feedback, no fallback. Given `package.json` runs `node server.js` (HTTP) for local dev, this breaks the feature for every developer running the site locally.

### 3. jsPDF loaded from CDN with no SRI hash
- **File:** `index.html:2467`
- **Commit introduced:** `6a85991 Improve server and front-end routing, add PDF support`
- **Why this matters:** `<script src="https://cdnjs.cloudflare.com/...jspdf.umd.min.js">` with no `integrity` attribute. The only external script on the site — a supply-chain compromise or CDN misconfiguration would execute arbitrary code with full DOM access on every page load. Fix is one attribute: `integrity="sha384-<hash>" crossorigin="anonymous"`.

---

## 🧹 Cleanup opportunities

### 4. Dead function: `shareOnLinkedIn()` in `cards.html`
- **File:** `cards.html:636–638`
- **Commit introduced:** `5e3cfd3 feat: redesign UI/UX for main and cards pages`
- **Why this matters:** The function is fully implemented but no button calls it. Either wire it up (LinkedIn is a natural fit for the book's professional audience) or delete it to reduce confusion.

### 5. Empty `onvoiceschanged` callback silences voice loading
- **File:** `index.html:2747–2749`
- **Commit introduced:** `68ea931 feat: complete ebook redesign`
- **Why this matters:** `synth.onvoiceschanged = () => {}` is a pattern copied from MDN examples but left empty. On Chrome, `getVoices()` returns `[]` until the event fires — so the preferred voice is never selected and the TTS always uses the browser default. The fix (storing voices in the callback) is 3 lines.

### 6. `deploy.sh` hardcodes `/root/.openclaw/workspace/book-web`
- **File:** `deploy.sh:6`
- **Commit introduced:** `670ca7c Being Genuinely Useful in an AI World - Ebook` (initial commit)
- **Why this matters:** The `cd` fails silently in any environment. If the script continues after the failed `cd`, the heredoc at line 9 overwrites `server.js` in the current working directory with a degraded older version. Best action: delete the file.

### 7. CSS `:root` block duplicated in `index.html` and `cards.html`
- **File:** `index.html:11–22`, `cards.html:11–22`
- **Commit introduced:** `5e3cfd3 feat: redesign UI/UX for main and cards pages`
- **Why this matters:** The two files already diverge visually (cards.html uses `#a855f7` as a purple card accent, not referenced in index.html). Extracting to a shared `style.css` takes ~15 minutes and prevents future drift.

---

## 🤔 Worth a second look

### 8. `distribution.html` and `scaling.html` served at public routes
- **File:** `vercel.json:7–19`, `distribution.html`, `scaling.html`
- **Commit introduced:** `888fc5c Add distribution hub` / `19c388f Add scaling guide`
- **Why this matters:** Both pages are routed publicly via Vercel rewrites (`/distribution`, `/scaling`) and contain monetization strategy, email course scripts, pricing tiers, and a 52-week social calendar. They are not linked from the main nav but are discoverable by anyone exploring the domain. This may be intentional (internal reference) or accidental (forgot to restrict). Needs a deliberate decision.

### 9. No Web Speech API feature detection
- **File:** `index.html:2651`, `index.html:2664`
- **Commit introduced:** `68ea931 feat: complete ebook redesign`
- **Why this matters:** `window.speechSynthesis` is `undefined` on Firefox Mobile and several privacy-focused browsers. The code assigns it directly without checking, so `synth.cancel()` throws `TypeError` when the audiobook is opened. Could be intentional (Chrome-only feature), but there's no graceful degradation — add a single guard check.

### 10. `downloadPDF()` resets button state outside the try/catch but inside `async`
- **File:** `index.html:2641–2648`
- **Commit introduced:** `6a85991 Improve server and front-end routing, add PDF support`
- **Why this matters:** Button label/state restoration runs after the try/catch (lines 2646–2647). This is correct for most failures, but if `window.jspdf` is undefined (CDN blocked), the catch runs the `showToast` but the button has already been mutated on line 2539 (label changed to "Generating…"). The restoration does run, so button state is recovered. However, on a slow CDN load where jsPDF resolves mid-click, there is a brief state inconsistency. Low risk, but the pattern is fragile — consider `try/finally`.

---

*Items 1–3 are production breakage. Items 4–7 are confirmed dead/broken code. Items 8–10 are patterns that are suspicious but may be intentional — bring to team before changing.*
