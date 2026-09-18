# Weekly Triage — 2026-09-18

## 📊 Week at a glance
- Commits (last 7 days): **0** — no activity this week
- Files changed: 0
- Debt markers added: n/a
- High-churn files: n/a (no changes)

> **Note**: The most recent commit to this repository was `e62c828` ("Add comprehensive README for interactive ebook") from a prior sprint. There is nothing to triage from this week. The debt items below were found during a full codebase scan as part of the accompanying `IMPROVEMENT_PLAN.md`.

---

## 🚨 Needs immediate attention

### 1. `index.html:2495` + `index.html:2654` — `chapters` declared twice at script top level
- **Commit that introduced it**: `5e497cf` ("feat: infuse book with the world's greatest wisdom") introduced `const chapters` at line 2495 for the sidebar; the audiobook feature (added in `68ea931`) added a second `let chapters = []` at line 2654 in the same `<script>` block.
- **Why this matters**: `SyntaxError: Identifier 'chapters' has already been declared` at parse time. Every piece of JavaScript on the page is dead — no progress bar, no scroll animations, no sidebar, no PDF download, no audiobook, no copy-link. The site renders but behaves as if JavaScript is disabled.

---

## 🧹 Cleanup opportunities

### 2. `index.html:2576` — Hardcoded `openclaw.ai/book` in PDF generator
- **Commit**: `6a85991` ("Improve server and front-end routing, add PDF support")
- **Why this matters**: Downloaded PDFs permanently point to a URL that may not match the deployed domain. Any reader who clicks the link in a downloaded PDF lands somewhere unexpected.
- **Fix**: `window.location.origin`

### 3. `cards.html:636` — `shareOnLinkedIn()` defined but never called
- **Commit**: `5e3cfd3` ("feat: redesign UI/UX for main and cards pages")
- **Why this matters**: Dead code. The page header advertises "Twitter, LinkedIn, and more" but there is no LinkedIn button. Likely an incomplete feature.
- **Fix**: Wire it up to a LinkedIn share button, or delete the function.

### 4. `server.js:103` — All files served with `utf-8` encoding, including binaries
- **Commit**: `6a85991` ("Improve server and front-end routing, add PDF support")
- **Why this matters**: `res.end(content, 'utf-8')` on a PNG or WOFF2 corrupts the binary data. Fonts and images would render incorrectly if served from the local dev server.
- **Fix**: Strip the encoding argument for non-text MIME types.

### 5. `index.html:2752–2756` — `copyLink()` has no `.catch()` handler
- **Commit**: `68ea931` ("feat: complete ebook redesign")
- **Why this matters**: `navigator.clipboard.writeText()` requires HTTPS. In any HTTP deployment or localhost test, the rejection is swallowed silently — users think the link copied but nothing is on their clipboard.
- **Fix**: Add a `.catch()` that falls back to the `execCommand('copy')` pattern already used in `cards.html`.

---

## 🤔 Worth a second look

### 6. `scaling.html` — Complete design-system mismatch
- **Commit**: `19c388f` ("Add scaling guide — book expansion + 3-tier passive income strategy")
- **Pattern**: This page uses `Segoe UI` font, a blue/slate colour scheme, and a light-blue gradient background. It looks like a different product entirely. It is not linked from any nav menu.
- **Why suspicious**: Either intentionally private (staging, not meant for users) or accidentally forgotten after the design overhaul in `68ea931`. If public, it damages brand perception.

### 7. `index.html:2701–2704` — `utterance.onboundary` drives the progress bar
- **Commit**: `68ea931` ("feat: complete ebook redesign")
- **Pattern**: Chrome has a known unfixed bug where `SpeechSynthesisUtterance.onboundary` never fires. The audio progress bar would stay at 0% on most Chrome users.
- **Why suspicious**: May be intentional ("close enough") or an oversight from a Safari/Firefox dev environment. Easy to add a `setInterval` fallback.

### 8. `cards.html:591` — XSS-adjacent: user-visible data injected as inline event handler string
- **Commit**: `5e3cfd3` ("feat: redesign UI/UX for main and cards pages")
- **Pattern**:
  ```js
  const safeQuote = card.quote.replace(/'/g, "\\'").replace(/"/g, '\\"');
  cardEl.innerHTML = `... onclick="copyToClipboard('${safeQuote}', '${card.source}')"`
  ```
  The sanitisation replaces `'` and `"` but not backticks or HTML angle brackets. Since `cards` is a static array embedded in the page, this is not exploitable today — but the pattern would be unsafe if quotes ever came from user input or an API.
- **Why suspicious**: Safe for now, but the proper fix is `data-*` attributes + a delegated listener, not inline-escaped strings.
