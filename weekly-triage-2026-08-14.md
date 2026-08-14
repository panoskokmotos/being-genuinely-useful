# Weekly Triage — 2026-08-14

## 📊 Week at a glance
- Commits: **0** | Files changed: **0** | Debt markers added: **0**
- High-churn files: _(none — no activity this week)_
- Last commit: `e62c828` on 2026-05-10 ("Add comprehensive README") — **96 days ago**

> No commits landed in the last 7 days. The triage below is a static-analysis snapshot
> of the current codebase state, surfacing issues that pre-date this week and have not
> been fixed.

---

## 🚨 Needs immediate attention

### 1. SyntaxError kills all JavaScript — `index.html:2495` + `2655`

`const chapters` (sidebar setup) and `let chapters = []` (audiobook setup) are both declared at the **top level of the same `<script>` block**. JavaScript engines throw a parse-time `SyntaxError: Identifier 'chapters' has already been declared` before any code runs.

**Impact:** Every interactive feature is silently broken:
- Reading progress bar
- Scroll-in animations
- Sticky sidebar with chapter tracking
- PDF download button
- Audiobook player
- Copy-link button
- Toast notifications

**Introduced in:** The audiobook feature was added in `5e497cf` (2026-05-02), which added `let chapters = []` while the sidebar `const chapters` already existed from `68ea931` (2026-04-20).

**Fix:** Rename `let chapters = []` on line 2655 to `let audiobookChapters = []` and update the four references inside `initAudiobook()`, `playChapter()`, `previousChapter()`, and `nextChapter()`.

---

### 2. `#exercises` nav link is a dead anchor — `index.html:1382`, `cards.html:400`

The third item in the primary nav ("Exercises") links to `#exercises`, which does not exist in the HTML. The chapter list goes: intro, deutsch, naval, ai-failure, compression, inkind, systems, metrics, markets, your-role, canon — no exercises.

**Impact:** Every reader who clicks the third nav item gets silently dumped at the top of the page. First click on the primary nav is a broken experience.

**Introduced in:** Likely `68ea931` or `8cdd726` (April 2026) — the exercises section was probably planned but never written.

**Fix:** Remove the nav item or replace it with a valid anchor (`#systems` or `#your-role`) until the Exercises chapter exists.

---

## 🧹 Cleanup opportunities

### 3. Dead function `shareOnLinkedIn()` — `cards.html:636-638`

A complete function exists that opens a LinkedIn share dialog, but no button in the card UI calls it. Introduced in `8cdd726` or `5e3cfd3` (April 2026).

**Why this matters:** False confidence — a reader of the code assumes LinkedIn sharing works. It doesn't surface anywhere to actual users.

**Fix:** Either add a LinkedIn button to `createCards()`, or delete the function.

---

### 4. Hardcoded `openclaw.ai/book` URL in PDF — `index.html:2577`

The generated PDF title page displays `openclaw.ai/book` as the canonical URL. The live deployment is at `being-genuinely-useful.vercel.app`. Every downloaded PDF sends readers to a URL that likely 404s.

**Introduced in:** `6a85991` (2026-04-13, PDF feature added).

**Fix:** Replace with `window.location.origin` so the link stays correct regardless of deployment.

---

### 5. `copyLink()` missing `.catch()` — `index.html:2752-2755`

```js
navigator.clipboard.writeText(window.location.href).then(() => {
    showToast('Link copied to clipboard!');
});
// no .catch()
```

Clipboard API throws in Firefox (without permission) and in non-focused tabs. Unhandled promise rejection, silent failure for the user.

**Introduced in:** `8cdd726` or `5e497cf` (April–May 2026).

**Fix:** `.catch(() => showToast('Could not copy — please copy from the address bar'))`.

---

### 6. `#canon` chapter not in sidebar — `index.html:1363-1374`

The Canon reading list (`#canon`) was added in `5e497cf` (2026-05-02) but was never added to the sidebar navigation. Sidebar ends at `#your-role`.

**Why this matters:** The Canon is the most likely chapter for readers to want to jump to directly. It's invisible unless you scroll all the way down.

**Fix:** Add a sidebar item for `#canon` and confirm the element has the `.chapter` class for the IntersectionObserver.

---

## 🤔 Worth a second look

### 7. Canvas card images use system fonts — `cards.html:659, 677, 681, 685`

```js
ctx.font = 'italic 36px Georgia, serif';
ctx.font = '24px -apple-system, sans-serif';
```

The downloadable quote card images use system fonts. The site uses Newsreader (Google Fonts serif) and Inter. The downloaded PNGs look visually inconsistent with the cards on screen.

May be intentional (simpler, avoids async font loading) — but the mismatch is jarring if you open a downloaded card next to the website.

---

### 8. `onclick` attribute with unescaped `card.source` — `cards.html:601, 605`

```js
cardEl.innerHTML = `
  ...
  <button onclick="shareOnTwitter('${encodeURIComponent(...)}')">
  <button onclick="downloadCardImage('${safeQuote}', '${card.source}', '${card.color}')">
```

`card.source` is not HTML-attribute-escaped before being injected into `onclick`. Currently all sources are hardcoded strings without single quotes, so this is safe. But if the data source ever changes, this is an XSS vector.

Worth addressing if card data ever moves to a CMS or user-generated content.

---

### 9. `scaling.html` and `distribution.html` use different color palette

Both pages use `#0f172a` + blue instead of `#0a0a0a` + green. They look like a different product. Intentional (private strategy docs)? Or an oversight from being generated separately?

If these pages are meant to be reader-facing, they need the same design system as `index.html`.

---

*Triage generated by automated static analysis on 2026-08-14. No commits this week.*
