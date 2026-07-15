# Weekly Triage — 2026-07-15

## 📊 Week at a glance
- **Commits this week**: 0 (last batch landed 2026-07-13, 2 days ago; git clock puts them outside `--since="7 days ago"` from the CI runner's clock)
- **Files changed in recent burst**: `index.html`, `cards.html`, `distribution.html`, `scaling.html`, `vercel.json`, `README.md`
- **Debt markers added this week**: 0 new TODOs/FIXMEs (only existing `console.log` in `server.js:109` — intentional startup log)
- **High-churn files (all touched in the recent 7-commit sprint)**: `index.html` (5 of 7 commits), `distribution.html` (2 commits), `scaling.html` (1 commit)

---

## 🚨 Needs immediate attention

### 1. SyntaxError: `chapters` double-declared — all JS silently broken

**File**: `index.html:2495` and `index.html:2655`
**Introduced**: `68ea931` (feat: complete ebook redesign — cover, sidebar, animations)

The sidebar refactor at commit `68ea931` added `const chapters = Array.from(document.querySelectorAll('.chapter'))` at line 2495 to power the chapter scroll tracker. The existing audiobook code at line 2655 already had `let chapters = []` — also at top-level script scope.

Two `const`/`let` declarations of the same identifier at the same block scope is a SyntaxError. The browser refuses to parse the entire `<script>` block. Every interactive feature — progress bar, PDF download, audiobook, copy-link, toast, animations, sidebar active state — is broken for every visitor.

**Why this matters**: The site renders but all buttons are dead. No console errors unless DevTools is open. Very easy to miss in a quick visual review.

**Fix**: Rename `let chapters` at line 2655 to `let audiobookChapters` and update all 8 references inside the audiobook functions (lines 2658–2744).

---

### 2. Distribution Hub references files that don't exist

**File**: `distribution.html:275`, `distribution.html:317`
**Introduced**: `888fc5c` (Add distribution hub)

The hub tells users to find the rest of the email course in `/distribution/email-course.md` and the remaining 51 weeks of Twitter threads in `/distribution/twitter-threads.md`. Neither file was committed. Users who follow these instructions get 404s.

**Why this matters**: Days 2–7 of the 7-day email course and weeks 2–52 of the 52-week content calendar are missing. The distribution hub's primary value proposition is "copy-paste ready" — right now it's incomplete.

**Fix**: Either commit the missing files or replace the references with inline content / a clear note that they're pending.

---

### 3. Audio player has no speech synthesis guard

**File**: `index.html:2651`
**Introduced**: `68ea931`

`let synth = window.speechSynthesis` is assigned without checking if the API exists. On Safari Private Browsing and some mobile WebViews this is `undefined`. Because of bug #1 above, this code never actually runs — but once #1 is fixed, this becomes the next crash on those browsers.

**Fix**: Add `if (!window.speechSynthesis)` guard inside `toggleAudiobook()`.

---

## 🧹 Cleanup opportunities

### 4. Dead function: `shareOnLinkedIn` in cards.html

**File**: `cards.html:636–639`
**Introduced**: `5e3cfd3` (feat: redesign UI/UX for main and cards pages)

```js
function shareOnLinkedIn() {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=...`;
    window.open(url, '_blank', ...);
}
```

No button in the HTML ever calls this. Either wire it up (LinkedIn is the highest-value sharing channel for this audience) or remove it.

---

### 5. Native `scrollTo` overridden in distribution.html

**File**: `distribution.html:661`
**Introduced**: `888fc5c`

```js
function scrollTo(id) {
    document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}
```

Shadows `window.scrollTo(x, y)`. Will silently break anything calling the native function on this page. Rename to `scrollToSection`.

---

### 6. Hardcoded `openclaw.ai/book` in PDF generation

**File**: `index.html:2577`
**Introduced**: `6a85991` (Improve server and front-end routing, add PDF support)

```js
doc.text('openclaw.ai/book', pageWidth / 2, y, { align: 'center' });
```

Every PDF downloaded bakes in this URL regardless of actual deployment host. Replace with `window.location.origin`.

---

## 🤔 Worth a second look

### 7. `distribution.html` and `scaling.html` appear to be internal planning docs

**Files**: `distribution.html`, `scaling.html`
**Introduced**: `888fc5c`, `19c388f`

Both pages use a completely different design system (blue/teal scheme vs. the book's green/dark theme) and read like strategic planning documents ("25.5 hours work → $900-2,700 revenue", "From $0 → $100K+/month in 12 months"). They contain personal revenue projections, unbuilt product ideas, and specific platform instructions.

These pages are publicly accessible at `/distribution` and `/scaling` with no auth. The question to answer: are these intentionally public, or should they be behind a password or removed from deployment?

If intentional, they need to be restyled to match the book and linked from the main nav. If not, they should be excluded from Vercel's output directory.

---

### 8. jsPDF loaded from external CDN with no integrity check

**File**: `index.html:2467`
**Introduced**: `6a85991`

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
```

No `integrity` attribute (SRI). If cdnjs is compromised or the resource is modified in transit, arbitrary JS would execute on your page. CDN dependency also creates single-point-of-failure for PDF download.

Low exploitability in practice but worth adding the integrity hash: check `https://www.srihash.org/` for the hash and add `integrity="sha512-..."` + `crossorigin="anonymous"`.

---

### 9. `pnpm-lock.yaml` is effectively empty

**File**: `pnpm-lock.yaml`
**Introduced**: initial commit

The lockfile exists but contains no packages (only 4 bytes / a header). The project has no npm dependencies, so this is correct — but anyone onboarding who runs `pnpm install` will get an empty install with no error, which could be confusing.

Acceptable as-is since `server.js` uses only Node.js built-ins. Worth adding a comment to `README.md` clarifying "no npm dependencies — server runs with `node server.js` directly."

---

*Triage generated 2026-07-15 | Repository: panoskokmotos/being-genuinely-useful | Branch: claude/amazing-dijkstra-96wy0s*
