# Weekly Triage — 2026-07-17

## 📊 Week at a glance

- **Commits this week**: 0
- **Files changed**: 0
- **Debt markers added**: 0 (this week)
- **High-churn files**: N/A — no changes in the last 7 days

---

## 🚨 Needs immediate attention

No new commits this week. However, the static analysis run alongside this triage identified **one pre-existing critical bug** that warrants immediate attention regardless of weekly activity:

### `index.html:2495` vs `index.html:2657` — duplicate `chapters` identifier causes SyntaxError

```
2495:  const chapters = Array.from(document.querySelectorAll('.chapter'));
2657:  let chapters = [];
```

Both are at the top level of the same `<script>` block. JavaScript throws `SyntaxError: Identifier 'chapters' has already been declared` at parse time, **preventing the entire script from executing**.

- **Introduced in**: Likely commit `68ea931` (sidebar added) or `5e497cf` (content enrichment)
- **Why this matters**: Reading-progress bar, sidebar, scroll animations, PDF download, and audiobook all fail silently. The page renders but is non-interactive.
- **Fix**: Rename the audiobook state variable to `audiobookChapters` in all six places it's referenced within the audiobook functions.

---

## 🧹 Cleanup opportunities

No TODOs, FIXMEs, or debug statements were introduced this week (no commits). The following are **pre-existing** items found in files:

### `index.html:2644` — `console.error` in catch block
```js
console.error('PDF generation failed:', err);
```
- **Commit that introduced it**: `6a85991` (PDF support added)
- **Why this matters**: For production, errors should be reported to a monitoring service, not just logged. Low priority given the page's current scale, but worth routing to a service like Sentry when one is set up.

### `distribution.html:275` — Reference to a file that doesn't exist
```
<code>/distribution/email-course.md</code>
```
- **Commit that introduced it**: `888fc5c`
- **Why this matters**: The distribution hub tells users to "See full course in `/distribution/email-course.md`" — that file does not exist in the repository. It's a broken content reference in what appears to be a draft document.

### `distribution.html:317` — Same pattern for twitter threads
```
<code>/distribution/twitter-threads.md</code>
```
- **Commit that introduced it**: `888fc5c`
- **Why this matters**: Same as above — referenced file does not exist.

---

## 🤔 Worth a second look

### `index.html:2747–2749` — `onvoiceschanged` is a no-op
```js
if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = () => {};
}
```
- **Commit**: `68ea931`
- **Why this matters**: This registers an empty callback for the voices-ready event, which means the preferred-voice selection in `playChapter()` always queries `getVoices()` before voices have loaded on first use. Looks intentional (placeholder) but is a bug. See IMPROVEMENT_PLAN.md item 7.

### `cards.html:591` — Inline onclick built with partial escaping
```js
const safeQuote = card.quote.replace(/'/g, "\\'").replace(/"/g, '\\"');
cardEl.innerHTML = `... onclick="copyToClipboard('${safeQuote}', '${card.source}')"`
```
- **Commit**: `5e3cfd3`
- **Why this matters**: `card.source` is not escaped at all. Angle brackets and ampersands in `safeQuote` are also not handled. Currently safe because data is hardcoded, but fragile. See IMPROVEMENT_PLAN.md item 10.

### `vercel.json:5` — `cleanUrls: false` means `.html` paths are also valid
```json
"cleanUrls": false
```
- **Commit**: `918696d`
- **Why this matters**: This was set to fix a routing regression. With `cleanUrls: false`, both `/cards` (via rewrite) and `/cards.html` (raw path) are accessible. Also means `/distribution.html` and `/scaling.html` are reachable without the rewrites. Verify this is intentional.

---

*No new commits this week — triage is based on static analysis of the current codebase state.*
