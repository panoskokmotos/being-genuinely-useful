# Weekly Triage — 2026-09-30

## 📊 Week at a glance
- Commits this week: **0** | Files changed: **0** | Debt markers added: **0**
- High-churn files: None (no commits in the last 7 days)
- Last activity: `e62c828` — "Add comprehensive README for interactive ebook"

No code changed this week. The triage below covers debt markers found in the **current HEAD** of recently-touched files, based on the prior week's burst of commits (`918696d` through `5e497cf`).

---

## 🚨 Needs immediate attention

### 1. Mobile navigation has no JS handler
**File**: `index.html:601–614` (CSS for `.mobile-menu-btn`) | **Introduced**: `5e3cfd3` ("feat: redesign UI/UX")
**Why this matters**: `.mobile-menu-btn` is styled and rendered on mobile but clicking it does nothing. Nav links are hidden on ≤768px and there is no toggle wired. Mobile users cannot navigate between sections or reach `/cards`.

### 2. `copyLink()` clipboard call has no `.catch()`
**File**: `index.html:2752–2755` | **Introduced**: `8cdd726` ("feat: enhance features and polish UI")
**Why this matters**: `navigator.clipboard.writeText()` requires HTTPS. On any non-HTTPS origin or after a user denies clipboard permission, the promise rejects silently — no toast, no feedback. The user thinks the button is broken.

### 3. `window.speechSynthesis` used without API detection
**File**: `index.html:2651, 2706` | **Introduced**: `8cdd726`
**Why this matters**: On iOS Safari < 14.5 and Firefox Android, `speechSynthesis` is undefined or partially implemented. `synth.speak()` throws a TypeError, and since the audio functions share global state, this can corrupt the `isPlaying` flag for subsequent interactions.

---

## 🧹 Cleanup opportunities

### 4. `onvoiceschanged` handler is a noop
**File**: `index.html:2747–2749` | **Introduced**: `8cdd726`
**Likely intent**: The developer registered the listener to trigger voice loading but forgot to add a body.
**Why this matters**: Chromium's `getVoices()` returns `[]` synchronously before `onvoiceschanged` fires. The preferred-voice selection on line 2689 always falls through to the system default.

### 5. CSS design tokens duplicated in all four HTML files
**Files**: `index.html:11–22`, `cards.html:11–22`, `distribution.html` head, `scaling.html` head | **Introduced**: across `5e3cfd3`, `888fc5c`, `19c388f`
**Why this matters**: Four identical `:root {}` blocks with no shared source. The next color change will drift — it already has: `cards.html` has `--card-accent` that the other files don't know about.

### 6. `distribution.html` and `scaling.html` not linked from main nav
**Files**: `index.html:1376–1387` | **Introduced**: `888fc5c`, `19c388f`
**Likely intent**: These pages were added quickly as companion documents. Linking was deferred.
**Why this matters**: Both pages contain high-value content (30-day plan, email course, passive income model) that the reader who finishes the book would want. Orphaned pages don't convert.

### 7. No Open Graph meta tags on any page
**Files**: All HTML `<head>` sections | **Introduced**: `670ca7c` (initial)
**Why this matters**: Every social share of a Cards page or the main ebook renders as a blank URL preview. The entire Cards feature is built around sharing — this is a direct conversion drag.

---

## 🤔 Worth a second look

### 8. `fs.existsSync()` inside async request handler
**File**: `server.js:36` | **Introduced**: `6a85991` ("Improve server and front-end routing")
**Pattern**: Synchronous filesystem check inside Node's async event loop.
**Verdict**: Currently harmless on Vercel (routing handled at the edge), but the dev server `npm run dev` runs this code on every extensionless request. Consider replacing with a route map (4 routes) or `fs.promises.access()`.

### 9. `res.end(content, 'utf-8')` for all MIME types
**File**: `server.js:103` | **Introduced**: `6a85991`
**Pattern**: The `'utf-8'` encoding argument is passed for binary files (images, fonts, PDFs). Node ignores it for Buffers today, but this is a latent correctness issue.
**Verdict**: Remove the encoding arg; Buffers don't need it.

### 10. jsPDF CDN script loaded dynamically with no timeout
**File**: `index.html` — `downloadPDF()` function | **Introduced**: `8cdd726`
**Pattern**: CDN `<script>` injected into `<head>` inside an async function. If the CDN is unreachable, the `await` never resolves, the spinner never clears, and the button is permanently locked.
**Verdict**: Add a `Promise.race()` with a 10s timeout that shows a toast and removes the loading class.

---

*Triage scope: HEAD of `main`. No new commits this week; all items trace to the prior sprint (commits `5e3cfd3`–`e62c828`). Next scheduled triage: 2026-10-07.*
