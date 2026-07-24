# Weekly Triage — 2026-07-24

## 📊 Week at a glance

- **Commits this week**: 0 (last commit: `e62c828` on 2026-05-10 — 75 days ago)
- **Files changed this week**: 0
- **Debt markers added this week**: N/A (no recent changes)
- **High-churn files**: none this week

> ⚠️ **No development activity in the past 75 days.** The triage below covers pre-existing issues found in the current codebase — particularly a critical JavaScript bug that has likely been silently broken since the last redesign commit on 2026-04-20.

---

## 🚨 Needs immediate attention

### 1. `SyntaxError`: `chapters` declared twice in global script scope

**File**: `index.html:2495` and `index.html:2655`
**Introduced**: `68ea931` (feat: complete ebook redesign — cover, sidebar, animations, enriched content, 2026-04-20)

```js
// Line 2495 — top-level script scope
const chapters = Array.from(document.querySelectorAll('.chapter'));

// Line 2655 — also top-level script scope (audiobook section)
let chapters = [];
```

**Why this matters**: A `let`/`const` redeclaration at the same scope level throws a `SyntaxError` at parse time. The JavaScript engine refuses to execute **any** of the script. Every interactive feature on the page (reading progress bar, sticky sidebar, smooth scroll, PDF download, audiobook player, copy link, toast notifications) is completely non-functional for all visitors.

**Commit that introduced it**: `68ea931` — this commit was a major redesign that added the sidebar (which introduced the first `chapters` binding) and the audiobook (which introduced the second). Neither block was written with awareness of the other.

**Fix**: Rename `let chapters = []` at line 2655 to `let audiobookChapters = []` and update all 5 internal references.

---

### 2. Audiobook `onvoiceschanged` handler is a no-op

**File**: `index.html:2747–2749`
**Introduced**: `68ea931` (same redesign commit)

```js
if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = () => {};  // empty — does nothing
}
```

**Why this matters**: Chrome loads speech synthesis voices asynchronously. `synth.getVoices()` returns `[]` on first call. The empty handler overwrites the browser's default population mechanism. The preferred voice selection (Google/Samantha/Daniel) never runs. If JS weren't already broken by issue #1, every audiobook user on Chrome would get the default robotic voice.

---

### 3. `copyLink()` has no error handling — silent failure

**File**: `index.html:2752–2756`
**Introduced**: `68ea931`

```js
function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        showToast('Link copied to clipboard!');
    });
    // no .catch() — rejects silently on HTTP / clipboard permission denied
}
```

**Why this matters**: `navigator.clipboard` is only available in secure contexts (HTTPS). On local dev over HTTP, or when the user blocks clipboard access, the promise rejects with an unhandled rejection and no feedback. User thinks the button is broken.

---

## 🧹 Cleanup opportunities

### 4. `shareOnLinkedIn()` — defined, never called

**File**: `cards.html:636–639`
**Introduced**: `5e3cfd3` (feat: redesign UI/UX for main and cards pages, 2026-04-13)

```js
function shareOnLinkedIn() {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=...`;
    window.open(url, '_blank', 'width=550,height=420,noopener,noreferrer');
}
```

**Why this matters**: Dead code that was presumably intended to become a "Share on LinkedIn" button but was never wired up. Either add the button (one line of HTML, already-working function) or delete the function.

---

### 5. Hardcoded `openclaw.ai/book` URL in PDF export

**File**: `index.html:2577`
**Introduced**: `6a85991` (Improve server and front-end routing, add PDF support, 2026-04-13)

```js
doc.text('openclaw.ai/book', pageWidth / 2, y, { align: 'center' });
```

**Why this matters**: The live site is `being-genuinely-useful.vercel.app`. Every downloaded PDF sends readers to a dead or unrelated link. Replace with `window.location.origin`.

---

### 6. `fs.existsSync()` called in async request handler

**File**: `server.js:36`
**Introduced**: `6a85991` (same routing commit)

```js
if (fs.existsSync(htmlPath)) {
```

**Why this matters**: Synchronous filesystem call in Node.js HTTP request handler blocks the event loop. Only affects local dev (`vercel.json` handles routing in production), but `npm run dev` sessions under concurrent requests will stall. Low severity but easy to fix.

---

## 🤔 Worth a second look

### 7. `#exercises` nav link targets a subsection `<h3>`, not a chapter

**File**: `index.html:1382` (nav link) → `index.html:2266` (`h3` target)
**Introduced**: `68ea931`

The top nav has `<a href="#exercises">Exercises</a>`, but `id="exercises"` is on an `<h3>` inside Chapter 10, not a dedicated section. The anchor also lacks `scroll-margin-top`, so the heading is hidden under the 64px fixed nav. This may be intentional (exercises are scattered through the chapters) but the nav label implies a dedicated page/section that doesn't exist.

**Worth deciding**: Either create a proper exercises section, or rename the nav link to "Your Role" (the actual chapter at the bottom) and remove the misleading anchor.

---

### 8. `distribution.html` and `scaling.html` are public and not linked

**File**: `vercel.json:11–18`, `distribution.html`, `scaling.html`
**Introduced**: `888fc5c` and `19c388f` (2026-04-13)

These files contain the full go-to-market strategy, email course structure, and passive income breakdown. They're accessible at `/distribution` and `/scaling` but have no inbound links from the main site. Probably intentional as operational docs, but currently discoverable via source code inspection or URL guessing.

**Worth deciding**: Move to a private doc platform, or add a `robots.txt` `Disallow` and remove the Vercel rewrites if these should stay private.

---

### 9. Card animation stagger silently drops for cards 10–26

**File**: `cards.html:368–377`
**Introduced**: `5e3cfd3`

```css
.card:nth-child(n+10) { animation-delay: 0.5s; }
```

With 26 cards, the bottom 17 all animate in simultaneously rather than in a stagger. The code reads like the stagger was intended to continue, but the nth-child rule caps it. Visually noticeable when filtering resets the grid. Low severity but easy to fix by generating delays in JS.

---

_Triage generated 2026-07-24. No commits in the past 7 days; all items above are pre-existing. Primary action item: fix the `chapters` redeclaration (item 1) which has likely been silently breaking all JS since 2026-04-20._
