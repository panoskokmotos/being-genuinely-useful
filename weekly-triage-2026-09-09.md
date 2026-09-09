# Weekly Triage — 2026-09-09

## 📊 Week at a glance

- **Commits this week**: 0 — last commit was `e62c828` on 2026-05-10 (4 months ago)
- **Files changed this week**: 0
- **Debt markers added this week**: N/A (no changes)
- **High-churn files**: None (repo has been dormant)

> **Note**: There was no development activity in the last 7 days. The triage below reflects outstanding issues found in the static codebase rather than recently introduced regressions. These are production issues that have been present since the last release.

---

## 🚨 Needs immediate attention

### 1. `index.html:2495` + `index.html:2655` — Duplicate identifier `chapters` (SyntaxError)

**Commit introduced**: `5e497cf` (2026-05-02, "feat: infuse book with the world's greatest wisdom")
**Why this matters**: `const chapters` and `let chapters` in the same `<script>` block is a SyntaxError. The browser refuses to parse the script at all. Every interactive feature on the main page — reading progress, scroll animations, sidebar nav, PDF download, audiobook — is dead for all visitors right now. This is P0.

---

### 2. `server.js:103` — Binary files sent with `'utf-8'` encoding (data corruption)

**Commit introduced**: `6a85991` (2026-04-13, "Improve server and front-end routing, add PDF support")
**Why this matters**: `res.end(content, 'utf-8')` is applied to every file type. PDFs, images, and fonts served via this server are byte-corrupted. The "Download PDF" feature in the UI also generates PDFs via jsPDF client-side, but any static PDF asset hosted on the server would be broken.

---

### 3. `index.html:1376-1387` — Mobile nav button never rendered (broken mobile UX)

**Commit introduced**: `68ea931` (2026-04-20, "feat: complete ebook redesign — cover, sidebar, animations, enriched content")
**Why this matters**: `.mobile-menu-btn` CSS exists and is shown on `≤768px`, but the `<button>` element is absent from the HTML. Mobile users have no navigation. This is likely a regression from the redesign that removed the button from the template but kept the CSS.

---

## 🧹 Cleanup opportunities

### 4. `index.html:2577` — Hardcoded domain `openclaw.ai/book`

**Commit introduced**: `68ea931` (2026-04-20)
**Why this matters**: The PDF generator embeds a hardcoded domain that appears to be an old project name rather than the live deployment URL. Every downloaded PDF points readers to the wrong address.

```javascript
// index.html:2577 — current
doc.text('openclaw.ai/book', pageWidth / 2, y, { align: 'center' });

// fix
doc.text(window.location.origin, pageWidth / 2, y, { align: 'center' });
```

---

### 5. `cards.html:591` — Fragile backslash-escape pattern for onclick attributes

**Commit introduced**: `8cdd726` (2026-04-13, "feat: enhance features and polish UI")
**Why this matters**: `card.quote.replace(/'/g, "\\'").replace(/"/g, '\\"')` produces a string injected into an `onclick="..."` HTML attribute. This is unnecessary complexity — passing data via event listeners and closures avoids all escaping. Currently safe because the data is hardcoded, but the pattern will silently break for quotes containing backticks or HTML entities.

---

### 6. `distribution.html` and `scaling.html` — Off-brand pages with different design system

**Commit introduced**: `888fc5c` / `19c388f` (2026-05-04, "Add distribution hub" / "Add scaling guide")
**Why this matters**: Both pages were added in a rapid commit batch and use an entirely different font (`Segoe UI`), color scheme (`#3b82f6` blue), and gradient background vs. the flat dark design of the main site. They look like a different product.

---

### 7. All four pages — No `<meta name="description">` or Open Graph tags

**Commit introduced**: `670ca7c` (2026-04-13, initial commit — never added)
**Why this matters**: Social shares of the book URL produce blank previews on Twitter and LinkedIn. This suppresses organic sharing, which is the primary distribution mechanism for an ebook.

---

## 🤔 Worth a second look

### 8. `index.html:2747-2748` — `onvoiceschanged` handler is empty

```javascript
if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = () => {};  // does nothing
}
```

**Why this looks suspicious**: The Web Speech API requires listening to `onvoiceschanged` before calling `synth.getVoices()` — voices may not be available synchronously. The empty handler suggests this was placeholder code never finished. The `preferredVoice` lookup in `playChapter()` (line 2689) will always return `undefined` in Chrome because it calls `synth.getVoices()` synchronously before voices load. The audiobook will always use the default voice.

**Is it intentional?** Unlikely — store voices in the handler: `synth.onvoiceschanged = () => { cachedVoices = synth.getVoices(); }`.

---

### 9. `cards.html:636-638` — `shareOnLinkedIn` is defined but never called

```javascript
function shareOnLinkedIn() { ... }  // defined
```

The card buttons only wire up "Copy" and "Tweet" — there is no LinkedIn share button despite the page header copy saying "Share on Twitter, LinkedIn, and anywhere else." Either the function should be removed or a LinkedIn button added to each card.

---

### 10. `server.js:35-38` — Path traversal risk via `.html` extension suffix

```javascript
const htmlPath = path.join(__dirname, urlPath + '.html');
if (fs.existsSync(htmlPath)) {
    urlPath = urlPath + '.html';
}
```

`urlPath` comes from `req.url.split('?')[0]` with no sanitisation beyond the query strip. A request to `/../secret` would suffix `.html` and resolve to `path.join(__dirname, '/../secret.html')`. On most OSes `path.join` normalises away `..` traversal past the root, making this unlikely to reach the filesystem, but it's worth replacing with an explicit allowlist (`['/', '/cards', '/scaling', '/distribution']`) rather than the open-ended `.existsSync` probe.

---

*Generated by the weekly triage routine. No new commits this week — revisit after next development sprint.*
