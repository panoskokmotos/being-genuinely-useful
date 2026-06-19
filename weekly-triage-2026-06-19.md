# Weekly Triage — 2026-06-19

## 📊 Week at a glance

- **Commits this week:** 0 (last commit was `e62c828` on 2026-05-10 — 40 days ago)
- **Files changed this week:** 0
- **Debt markers added this week:** 0 (none in any file)
- **High-churn files:** N/A — no activity this week
- **Status:** Repository has been dormant for ~6 weeks. No bugs introduced this week, but the existing critical issues flagged in `IMPROVEMENT_PLAN.md` remain unaddressed.

> Because there were no commits in the last 7 days, Steps 1–2 of the standard triage process are vacuous. Sections below document the outstanding debt already present in the codebase, drawn from the full-repo scan this session.

---

## 🚨 Needs immediate attention

### 1. `index.html:2495` + `2655` — Duplicate `chapters` identifier breaks all JS

**Commit introduced:** `5e497cf` (2026-05-02) — "feat: infuse book with the world's greatest wisdom"  
**Why this matters:** `const chapters` (IntersectionObserver setup) and `let chapters = []` (audiobook initialisation) are both declared at the top level of the same `<script>` block. This is an uncaught `SyntaxError` at parse time — none of the script runs. Reading progress bar, sidebar, smooth scroll, PDF download, and audiobook are all silently broken. HTML/CSS still renders, so the breakage is invisible on a casual visual check.

```
index.html:2495   const chapters     = Array.from(document.querySelectorAll('.chapter'));
index.html:2655   let chapters = [];   ← redeclaration in same scope → SyntaxError
```

Fix: rename `let chapters = []` → `let audiobookChapters = []` and update the four references in `initAudiobook()`, `playChapter()`, and `utterance.onend`.

---

### 2. `index.html:1376-1387` — Mobile nav menu CSS exists, HTML element does not

**Commit introduced:** `68ea931` (2026-04-20) — "feat: complete ebook redesign — cover, sidebar, animations"  
**Why this matters:** `.mobile-menu-btn` has `display: block` in the `@media (max-width: 768px)` block, but the `<button>` is never added to the nav HTML and there is no JS click handler. On mobile, all nav links (`#deutsch`, `#systems`, `#exercises`, `/cards`) are `display: none` with no way to reveal them. The hamburger was styled but never wired up.

```css
/* index.html:610-614 — button styled but never rendered */
@media (max-width: 768px) {
    .mobile-menu-btn { display: block; }
}
```

---

### 3. `index.html:2577` — PDF footer hardcodes `openclaw.ai/book`

**Commit introduced:** `6a85991` (2026-04-13) — "Improve server and front-end routing, add PDF support"  
**Why this matters:** Every reader who downloads the PDF sees a footer crediting `openclaw.ai/book` — a domain unrelated to the deployed site. Stale from an earlier iteration of the project; should be `window.location.origin`.

```js
// index.html:2577
doc.text('openclaw.ai/book', pageWidth / 2, y, { align: 'center' });
```

---

### 4. `index.html:2651` + `2678` — `speechSynthesis` used without feature detection

**Commit introduced:** `8cdd726` (2026-04-13) — "feat: enhance features and polish UI"  
**Why this matters:** `let synth = window.speechSynthesis;` is assigned at module scope. If the browser doesn't support the API (Firefox for Android, some embedded WebViews), `synth` is `undefined` and `synth.cancel()` in `playChapter()` throws an uncaught `TypeError` on the first "Listen to Audiobook" click.

---

## 🧹 Cleanup opportunities

### 5. `index.html:2747` — Empty `onvoiceschanged` handler

**Commit introduced:** `8cdd726` (2026-04-13)  
**Context:** `if (synth.onvoiceschanged !== undefined) { synth.onvoiceschanged = () => {}; }` — the hook was wired up but left empty. The voice-selection logic inside `playChapter()` (lines 2688–2690) calls `synth.getVoices()` synchronously on every play, which on Chrome returns an empty array on first invocation. The empty handler was likely a placeholder.  
**Fix:** Populate `preferredVoice` inside `onvoiceschanged` and consume it in `playChapter()`.

---

### 6. `vercel.json:4` — `cleanUrls: false` with manual rewrites that could be removed

**Commit introduced:** `918696d` (2026-05-04) — "Fix Vercel routing for HTML pages"  
**Context:** Three rewrites (`/scaling`, `/distribution`, `/cards`) compensate for `cleanUrls: false`. Switching to `cleanUrls: true` eliminates the rewrites and auto-handles `.html` → clean URL redirects natively.

```json
// vercel.json — remove all three rewrites when cleanUrls is set to true
"rewrites": [
  { "source": "/scaling", "destination": "/scaling.html" },
  { "source": "/distribution", "destination": "/distribution.html" },
  { "source": "/cards", "destination": "/cards.html" }
]
```

---

### 7. `distribution.html:661` — Custom `scrollTo()` shadows `window.scrollTo`

**Commit introduced:** `888fc5c` (2026-04-13) — "Add distribution hub"  
**Context:** `function scrollTo(id)` is a page-scoped function that replaces the native `window.scrollTo`. Low blast radius since neither the main app nor any included script calls `window.scrollTo` on this page currently, but it's an antipattern that could bite on browser updates.

```js
// distribution.html:661 — rename to scrollToSection(id)
function scrollTo(id) {
    document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}
```

---

### 8. `cards.html:591` — Quote string escaped into `onclick` attribute (fragile XSS pattern)

**Commit introduced:** `5e3cfd3` (2026-04-13) — "feat: redesign UI/UX for main and cards pages"  
**Context:** `card.quote.replace(/'/g, "\\'").replace(/"/g, '\\"')` then injected directly into `onclick="copyToClipboard('${safeQuote}', ...)"`. The `"` replacement is ineffective inside HTML attributes (the HTML parser terminates the attribute on `"` before the JS evaluates the escape). Current data has no double-quote characters so the bug is dormant — but adding a card with `"` in its text would produce broken HTML and a potential XSS vector.

---

## 🤔 Worth a second look

### 9. `scaling.html` and `distribution.html` are publicly routed but appear to be internal planning docs

**Committed:** `19c388f` / `888fc5c` (both 2026-04-13)  
**Why suspicious:** Both pages contain specific pricing strategies (`$29`, `$99`, `$297`), revenue projections ("$0 → $100K+/month"), copy-paste Twitter thread templates, and references to private project names ("OpenClaw Labs"). They're accessible at `/scaling` and `/distribution` via Vercel rewrites. Could be intentional or could be drafts that accidentally shipped. Worth confirming with the author whether these should be public.

---

### 10. `index.html:2701-2704` — `utterance.onboundary` used for audio progress bar

**Committed:** `8cdd726` (2026-04-13)  
**Why suspicious:** `onboundary` is not fired on iOS Safari (known WebKit limitation since 2016). The audio progress bar will stay at 0% for all iOS users. Not a crash, but a consistently broken UI element for a likely-large user segment. An `rAF`-based time estimate or a simple `speaking` boolean indicator would be more reliable.

---

*No new debt was introduced this week. The 10 items above are carry-overs from the April–May development sprint. The SyntaxError in item 1 is the highest-severity outstanding issue and should be the first commit when development resumes.*
