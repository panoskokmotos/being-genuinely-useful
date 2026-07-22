# Weekly Triage — 2026-07-22

## 📊 Week at a glance
- Commits this week: **0** (last commit was 2026-05-10, `e62c828`)
- Files changed: N/A
- Debt markers added this week: N/A — no recent commits
- High-churn files (all-time): `index.html` (touched in 5 of 14 commits), `cards.html` (3 commits)

> **Note**: No commits landed in the past 7 days. This triage covers the existing codebase for standing debt. Run again on a week with active development for the commit-scoped analysis.

---

## 🚨 Needs immediate attention

### 1. `index.html:2655` — Duplicate `chapters` variable causes `SyntaxError`
- **Commit**: `68ea931` ("feat: complete ebook redesign — cover, sidebar, animations, enriched content") — introduced `const chapters` at line 2495; `5e497cf` added audiobook code with `let chapters = []` at line 2655
- **Why this matters**: A `SyntaxError: Identifier 'chapters' has already been declared` fires at script parse time, before any code runs. The entire JavaScript runtime fails silently. Progress bar, sidebar, scroll animations, PDF download, audiobook, and copy-link are all broken in every browser.
- **Fix**: Rename the audiobook variable to `audiobookChapters` (see IMPROVEMENT_PLAN.md §1)

### 2. `index.html:2577` — Hardcoded dead URL `openclaw.ai/book` in every generated PDF
- **Commit**: `68ea931` (PDF generation added in same commit as ebook redesign)
- **Why this matters**: Every visitor who downloads the PDF gets a file pointing to a non-existent domain. If openclaw.ai is ever a real site, this leaks traffic there instead of back to the ebook.

### 3. `index.html:2653`, `cards.html` — No mobile navigation handler
- **Commit**: `5e3cfd3` ("feat: redesign UI/UX for main and cards pages") introduced the `.mobile-menu-btn` CSS without implementing the button in HTML or wiring up any JS toggle
- **Why this matters**: Mobile users have no way to navigate between sections of the page. The nav hides all links at `<768px` with no alternative. This is a hard blocker for mobile conversion.

---

## 🧹 Cleanup opportunities

### 4. `index.html:2467` — External CDN script loaded synchronously
- **Commit**: `68ea931`
- `<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js">` blocks the parser on every page load even for users who never click "Download PDF"
- **Likely intent**: Quick integration of jsPDF; should be moved to a dynamic `import()` inside the `downloadPDF` function or bundled locally

### 5. `index.html:2747` — Empty `onvoiceschanged` handler
- **Commit**: `68ea931`
- ```js
  if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = () => {};
  }
  ```
- This wires up a no-op handler. The original intent was probably to call `initAudiobook()` once voices are loaded so the preferred voice is selected before play. Currently the voice selection may always fall back to default.

### 6. `index.html` — `console.error` in PDF catch block (line 2643)
- **Commit**: `68ea931`
- `console.error('PDF generation failed:', err)` is fine for development but there's no error reporting to any monitoring service. On a production ebook, a PDF failure is invisible to the author.
- **Suggestion**: Either hook into a lightweight error reporter (Sentry, LogSnag) or remove the console.error if you're confident it's handled

### 7. `cards.html` — Missing `lang` attribute on `<html>`
- **Commit**: `5e3cfd3`
- `<html>` should be `<html lang="en">` — omitted while `index.html` has it correct

### 8. Both HTML files — Google Fonts URLs missing `&display=swap`
- **Commit**: original `670ca7c`; never updated through redesigns
- Risk of FOIT (flash of invisible text) on slow connections

---

## 🤔 Worth a second look

### 9. `index.html:2492–2532` — `const chapters` used in sidebar vs. DOM querySelectorAll inside functions
- The `const chapters = Array.from(document.querySelectorAll('.chapter'))` at line 2495 captures the chapter list at load time. This is fine for a static document, but would break if chapters were ever injected dynamically (via fetch or framework). Low risk for now.

### 10. `index.html:2580` — `const chapters` inside `downloadPDF()` is a separate declaration
- `const chapters = document.querySelectorAll('.chapter')` inside the `downloadPDF` function body is **not** the conflict — it's correctly scoped to the function. This one is fine. The conflict is between the two top-level declarations at lines 2495 and 2655.

### 11. `vercel.json` — `cleanUrls: false` may cause issues
- The rewrites map `/cards` → `/cards.html` etc., but `cleanUrls: false` means Vercel won't automatically serve `/cards` as `/cards.html`. This is currently papered over by the `rewrites` array. If routes are ever added without a matching rewrite entry, they'll 404. A safer pattern would be to enable `cleanUrls: true` and remove the explicit rewrites.

### 12. `server.js:35` — `fs.existsSync` in the hot path
- ```js
  const htmlPath = path.join(__dirname, urlPath + '.html');
  if (fs.existsSync(htmlPath)) { ... }
  ```
- `fs.existsSync` is synchronous and blocks the event loop. Fine for a dev server with low traffic, but worth noting if this server.js ever serves production traffic directly (rather than Vercel handling it).

---

_Triage generated automatically. Next scheduled run: 2026-07-29._
