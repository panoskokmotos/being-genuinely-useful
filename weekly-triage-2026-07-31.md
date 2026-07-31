# Weekly Triage — 2026-07-31

## 📊 Week at a glance
- **Commits this week**: 0 | **Files changed**: 0 | **Debt markers added**: 0
- **High-churn files**: N/A — no commits in the last 7 days
- **Last commit**: `e62c828` — "Add comprehensive README for interactive ebook" (older than 14 days)

> No code changed this week. The items below are pre-existing issues surfaced during a fresh codebase scan.

---

## 🚨 Needs immediate attention

### 1. SyntaxError kills all JavaScript on the main ebook page
- **File**: `index.html:2495` and `index.html:2655`
- **Introduced by**: `e62c828` / `5e3cfd3` (initial ebook construction — both top-level `chapters` declarations coexist)
- **Why this matters**: `const chapters` at line 2495 and `let chapters` at line 2655 are both declared at the top level of the same `<script>` block. JavaScript engines treat this as a `SyntaxError` and refuse to execute any of the script. Every interactive feature on the page is silently dead: reading progress bar, scroll animations, sticky sidebar, PDF download button, TTS audiobook player. The page appears broken to every reader.

**Fix**: Rename the audiobook variable at line 2655 from `let chapters = []` to `let audiobookChapters = []` and update all references in `initAudiobook()` and the playback functions.

---

### 2. distribution.html points readers to files that do not exist
- **File**: `distribution.html:275`, `distribution.html:317`
- **Introduced by**: `888fc5c` — "Add distribution hub"
- **Why this matters**: At the most actionable points in the distribution strategy — "Days 2–7 email course" and "Weeks 2–52 Twitter threads" — the page tells readers to look in `/distribution/email-course.md` and `/distribution/twitter-threads.md`. These files were never created. A motivated reader following through on the strategy hits a dead end.

---

### 3. DEPLOY.md exposes internal build tool paths
- **File**: `DEPLOY.md:9`, `DEPLOY.md:38`, `DEPLOY.md:62`
- **Introduced by**: `e62c828` — "Add comprehensive README"
- **Why this matters**: The public deployment docs reference `/root/.openclaw/workspace/book-web` three times. This is an internal code generation artifact path. Anyone reading the docs (it's in the repo, visible on GitHub) will be confused, and it leaks information about the internal toolchain.

---

## 🧹 Cleanup opportunities

### 4. Dead `shareOnLinkedIn()` function in cards.html
- **File**: `cards.html:636`
- **Introduced by**: `5e3cfd3` — "feat: redesign UI/UX for main and cards pages"
- **Why this matters**: The function is fully implemented but no element calls it. Either wire it up to a LinkedIn share button (low-effort feature that completes the social sharing suite) or delete it to avoid confusion.

### 5. deploy.sh writes to a non-existent internal path and is unused
- **File**: `deploy.sh` (entire file)
- **Introduced by**: Initial commit `670ca7c`
- **Why this matters**: `deploy.sh` generates an older version of `server.js` and writes it to `/root/.openclaw/workspace/book-web`. Running this script on any real machine does nothing useful. It's a leftover generation artifact. Delete it — `DEPLOY.md` already documents the actual deployment workflow.

### 6. README Project Structure section is wrong
- **File**: `README.md` (Project Structure section)
- **Introduced by**: `e62c828` — "Add comprehensive README for interactive ebook"
- **Why this matters**: The README lists `style.css`, `script.js`, and a `chapters/` directory — none of which exist. A contributor cloning the repo for the first time sees an immediate contradiction between docs and reality.

### 7. `scrollTo()` in distribution.html shadows `window.scrollTo`
- **File**: `distribution.html` (inline script, `scrollTo` helper)
- **Introduced by**: `888fc5c` — "Add distribution hub"
- **Why this matters**: Defining a top-level function named `scrollTo` shadows the native browser API. Any native `window.scrollTo(x, y)` call on that page now silently calls the custom function. Rename to `scrollToSection()`.

---

## 🤔 Worth a second look

### 8. jsPDF loaded via external CDN with no availability guard
- **File**: `index.html:2467` (CDN script tag), `index.html:2636` (downloadPDF function)
- **Commit**: `68ea931` — "feat: complete ebook redesign"
- **Why this matters**: If `cdnjs.cloudflare.com` is slow, blocked, or returns an error, the `jspdf` global is undefined when `downloadPDF()` runs. The catch block fires with "PDF generation failed" — which is technically wrong (the library never loaded). May be intentional (CDN is reliable), but worth adding a typeof guard.

### 9. No Web Speech API availability guard for TTS audiobook
- **File**: `index.html:2651` (`let synth = window.speechSynthesis`)
- **Commit**: `68ea931`
- **Why this matters**: Firefox on Linux, some mobile browsers, and privacy-hardened browser profiles disable or omit `window.speechSynthesis`. The audio player button appears but nothing happens when clicked. Silently broken UX. Add a `if (!window.speechSynthesis)` guard that either hides the button or shows a tooltip.

### 10. scaling.html and distribution.html use a visually different design system
- **Files**: `scaling.html` (blue/teal on navy), `distribution.html` (blue/teal on navy), vs. `index.html` (green on near-black)
- **Commits**: `19c388f`, `888fc5c`
- **Why this matters**: May be intentional (book vs. tools pages), but it looks like two different products to a reader navigating between them. Worth a deliberate decision either way.

---

## 🔒 Security scan (files changed this week)
No commits this week — no files to scan.

**Standing note from full-repo scan**: No API keys, tokens, secrets, or credential patterns found anywhere in the codebase. The only external origin is `cdnjs.cloudflare.com` (jsPDF) and `fonts.googleapis.com` (Google Fonts). No `eval()`, no `innerHTML` assignments with user-supplied content, no XSS vectors in the JS. The server.js has no SQL, no auth, no user input paths. Security posture is clean for a static ebook.
