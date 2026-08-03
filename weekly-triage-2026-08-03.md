# Weekly Triage — 2026-08-03

## 📊 Week at a glance

- **Commits this week**: 0
- **Files changed**: 0
- **Debt markers added**: 0
- **High-churn files**: n/a (no activity)

> No commits landed in the past 7 days. Triage below is based on a static scan of the current codebase rather than diff-scoped analysis.

---

## 🚨 Needs immediate attention

### 1. Path traversal in `server.js`

`server.js:41` — `path.join(__dirname, urlPath)` is never validated against `__dirname`. A crafted URL (e.g., `GET /../../../etc/passwd`) resolves to an arbitrary filesystem path readable by the Node.js process.

- **Introduced by**: commit `6a85991` ("Improve server and front-end routing, add PDF support, and polish UI/UX")
- **Why this matters**: Anyone who runs `npm dev` with the port exposed (e.g., on a shared network, in a container with a forwarded port) leaks server files. One-line fix: `if (!filePath.startsWith(__dirname)) { res.writeHead(403); res.end('Forbidden'); return; }`

---

### 2. Mobile navigation broken — button missing from DOM

`index.html:601–613` — CSS defines `.mobile-menu-btn { display: none; }` with a media query to reveal it on ≤ 768 px screens, but no `<button class="mobile-menu-btn">` exists in the HTML. Mobile users see only the logo; all nav links are hidden with no trigger to open them.

- **Introduced by**: commit `68ea931` ("feat: complete ebook redesign — cover, sidebar, animations, enriched content")
- **Why this matters**: Mobile is likely the plurality of traffic from social shares (Twitter/LinkedIn cards). Broken nav on mobile = 0% conversion from that channel.

---

### 3. `copyLink()` has no error handler — silent failure on clipboard denial

`index.html:2753` — `navigator.clipboard.writeText(window.location.href).then(...)` with no `.catch()`. Clipboard API is blocked on HTTP origins and when the user denies the permission prompt.

- **Introduced by**: commit `68ea931`
- **Why this matters**: The "Copy Link" CTA is the lightest-weight sharing action. When it silently does nothing, users assume the button is broken.

---

## 🧹 Cleanup opportunities

### 4. Hardcoded `openclaw.ai/book` URL inside PDF generator

`index.html:2577` — `doc.text('openclaw.ai/book', ...)` is a literal string, not `window.location.host`.

- **Commit**: `6a85991`
- **Why this matters**: Every PDF downloaded from any other deployment links readers to the wrong URL. One-character fix: replace with `` `${window.location.host}` ``.

---

### 5. jsPDF loaded from CDN with no Subresource Integrity hash

`index.html:2467` — `<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js">` has no `integrity` attribute.

- **Commit**: `6a85991`
- **Why this matters**: CDN compromise would execute arbitrary JS in the page. Adding `integrity="sha384-..."` costs 30 seconds and eliminates the risk.

---

### 6. `document.execCommand('copy')` deprecated fallback

`cards.html:624–627` — the clipboard fallback uses `document.execCommand('copy')`, removed in Chrome 130+ when called outside a user gesture from an async context.

- **Commit**: `5e3cfd3` ("feat: redesign UI/UX for main and cards pages")
- **Why this matters**: When `navigator.clipboard` fails (HTTP, no permission), the fallback also fails silently in modern browsers. Both paths need to surface an error to the user.

---

### 7. `passive` section in `distribution.html` unreachable

`distribution.html:547` — `<div id="passive" class="section">` (Passive Income content) exists but no overview card links to it via `scrollTo('passive')`.

- **Commit**: `888fc5c` ("Add distribution hub — email course, twitter, monetization, 30-day plan, passive income")
- **Why this matters**: High-value monetization content is invisible to users who arrive on the distribution page.

---

## 🤔 Worth a second look

### 8. Global `chapters` variable in audiobook JS shadows PDF generator's `chapters`

`index.html:2580, 2654` — `let chapters = []` is declared at global scope for the audiobook player. A `const chapters = document.querySelectorAll('.chapter')` is independently declared inside `downloadPDF()`. They don't collide at runtime (block scope), but the naming is a trap for anyone editing either section.

- **Commit**: `68ea931`
- **Why this matters**: If someone moves or refactors either block, the shared name will cause confusion or a subtle scoping bug. Low priority to fix, high probability of causing a future issue.

---

### 9. `distribution.html` and `scaling.html` design diverges from main book

Both auxiliary pages use a different visual language (emoji `<h2>` headings, different card layouts, different base colors) vs the editorial design of `index.html`. This may be intentional (utility pages), but the inconsistency is jarring when navigating from the book.

- **Commits**: `888fc5c`, `19c388f`
- **Why this matters**: Visitors who click through from the book's CTAs land on what feels like a different product.

---

### 10. No OG/Twitter meta tags on any page

`index.html:1–10` (and all other pages) — no `<meta property="og:image">`, `og:description`, or `twitter:card` tags exist.

- **Introduced by**: initial commit `670ca7c`
- **Why this matters**: Social shares (the book's primary distribution mechanism per `distribution.html`) render as blank link previews with no image or description. This is likely the single highest-ROI missing feature for growth.

---

*10 items. No commits this week — all findings are pre-existing. P0 path traversal and mobile nav are the only items that should block the next release.*
