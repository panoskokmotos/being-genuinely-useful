# Weekly Triage — 2026-08-05

## 📊 Week at a glance

- **Commits this week:** 0 (last commit: 2026-05-10, `e62c828 Add comprehensive README`)
- **Files changed this week:** 0
- **Debt markers added this week:** 0 new (existing debt documented below)
- **High-churn files:** N/A — no activity this week
- **Status:** Repository has been dormant for ~87 days. The outstanding bugs documented below predate this week.

---

## 🚨 Needs immediate attention

### 1. JavaScript SyntaxError makes entire `index.html` script block non-functional

- **File:line:** `index.html:2655` (conflicting with `index.html:2495`)
- **Commit:** `5e497cf` (feat: complete ebook redesign) introduced `const chapters` for sidebar tracking; `68ea931` (feat: infuse book with wisdom) likely introduced the second `let chapters = []` for audiobook state — both ended up in the same top-level script scope.
- **Why this matters:** ES6 prohibits redeclaring a `const`-bound name with `let` in the same lexical scope. Browsers throw `SyntaxError: Identifier 'chapters' has already been declared` before any code runs. Reading progress bar, sidebar, smooth scroll, PDF download, audiobook, and copy-link are all dead.

### 2. PDF footer contains stale internal URL

- **File:line:** `index.html:2577`
- **Commit:** `5e497cf` (feat: infuse book with wisdom — this commit added the PDF generation feature)
- **Why this matters:** Every generated PDF stamps `openclaw.ai/book` as the book's URL. The live site is at `being-genuinely-useful.vercel.app`. Every shared PDF contains a broken attribution link.

### 3. Path traversal in local dev server

- **File:line:** `server.js:41`
- **Commit:** `7655756` (fix: use PORT env variable for server start) — present since initial commit
- **Why this matters:** `path.join(__dirname, req.url.split('?')[0])` does not verify the resolved path stays under `__dirname`. `GET /../../../../etc/passwd` resolves to `/etc/passwd`. Vercel is unaffected (it serves static files directly) but anyone running `node server.js` locally is exposed.

---

## 🧹 Cleanup opportunities

### 4. Hardcoded internal path in `DEPLOY.md`

- **File:line:** `DEPLOY.md:9`, `DEPLOY.md:39`
- **Commit:** `670ca7c` (Being Genuinely Useful in an AI World - Ebook — initial commit)
- **What it likely meant:** The author was working from `/root/.openclaw/workspace/book-web` during development and forgot to genericize the path before committing.
- **Why this matters:** Leaks internal build environment path (`/root/.openclaw/workspace/`) in a public repo. Replace with `path/to/being-genuinely-useful`.

### 5. Missing `.catch()` on `copyLink()` clipboard call

- **File:line:** `index.html:2753`
- **Commit:** `5e497cf` (feat: complete ebook redesign)
- **What it likely meant:** Copied from another project or written quickly; the fallback pattern using `execCommand` already exists in `cards.html:619–627` but wasn't applied here.
- **Why this matters:** Silent failure on HTTP or when clipboard permission is denied — button appears to do nothing.

### 6. `pnpm-lock.yaml` references packages not declared in `package.json`

- **File:line:** `package.json:1–12`, `pnpm-lock.yaml`
- **Commit:** `670ca7c` (initial commit)
- **What it likely meant:** Lock file was generated from a richer `package.json` during development, then `package.json` was simplified before commit without regenerating the lock file.
- **Why this matters:** Confusing to contributors; `pnpm install` behavior is undefined when lockfile and manifest disagree. Either add `jspdf` to devDependencies or delete the lockfile.

---

## 🤔 Worth a second look

### 7. `distribution.html` and `scaling.html` are entirely off-brand

- **File:line:** `distribution.html:1–end`, `scaling.html:1–end`
- **Commit:** `888fc5c` (Add distribution hub), `19c388f` (Add scaling guide)
- **Pattern:** Both pages use a blue/slate design (`#0f172a`, `#3b82f6`) from a different design system than the main book (`#0a0a0a`, `#22c55e`). No nav bar, no link back to the book.
- **Likely intentional?** These look like quick scratch-pad pages added for personal reference and never properly integrated. If they're meant to be public-facing, they need the design treatment the main pages have. If internal only, consider removing them from the repo or adding `noindex` headers.

### 8. `downloadCardImage` canvas may silently clip long quotes

- **File:line:** `cards.html:661–673`
- **Commit:** `5e3cfd3` (feat: redesign UI/UX for main and cards pages)
- **Pattern:** Quote rendering starts at `y=200` on a `canvas.height=630` canvas, adding 50px per line. Quotes ≥9 lines (common for longer ones) overflow the canvas bottom and are clipped without error.
- **Likely intentional?** No. This is probably an oversight from not testing long quotes. Low urgency since it only affects the downloaded image, not the card display.

### 9. Audiobook voice preference may fail on most browsers

- **File:line:** `index.html:2689`
- **Commit:** `5e497cf` (feat: complete ebook redesign)
- **Pattern:** `voices.find(v => v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel'))` — these specific voices are only reliably available on Chrome (Google), Safari on macOS (Samantha), and certain Windows configs (Daniel). Firefox users and Chrome on Linux get no match and fall back to the default robotic voice.
- **Likely intentional?** Best-effort — but broadening the regex would help most users with no downside.

### 10. jsPDF loaded from CDN without Subresource Integrity (SRI)

- **File:line:** `index.html:2467`
- **Commit:** `5e497cf`
- **Pattern:** `<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js">` — no `integrity` hash. A compromised CDN or MITM could inject arbitrary JS into every page load.
- **Likely intentional?** Convenience over security. The fix is a one-line addition or self-hosting the file.

---

_Total items: 10. No commits to scan this week; existing debt from commits in April–May 2026 documented above._
