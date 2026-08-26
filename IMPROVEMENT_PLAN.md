# Improvement Plan — Being Genuinely Useful

_Generated: 2026-08-26_

---

## 🔥 P0 — Ship this week (bugs breaking user flows)

### 1. Mobile nav is completely inaccessible
- **What**: On screens ≤768 px, `.nav-links` is hidden and a `.mobile-menu-btn` is styled—but the button is never rendered in the HTML and has no JS click handler, so all nav links vanish.
- **Where**: `index.html:544–546` (CSS hides nav), `index.html:601–614` (button CSS), `index.html:1376–1387` (nav HTML — button never added)
- **Why it matters**: Any reader on a phone has no way to jump to chapters, go to Cards, or use any nav link. This is the primary reading surface.
- **Effort**: S
- **Suggested fix**:
  - Add `<button class="mobile-menu-btn" onclick="toggleMobileMenu()" aria-label="Open menu">☰</button>` inside `.nav-inner`.
  - Add CSS: `.nav-links.open { display: flex; flex-direction: column; ... }` for mobile open state.
  - Add JS: `function toggleMobileMenu() { document.querySelector('.nav-links').classList.toggle('open'); }`.

### 2. Path traversal in local dev server
- **What**: `server.js` constructs file paths with `path.join(__dirname, urlPath)` without verifying the result stays inside `__dirname`, allowing a crafted URL to read arbitrary files.
- **Where**: `server.js:26–45`
- **Why it matters**: `curl http://localhost:8080/../../../../etc/passwd` serves `/etc/passwd`. This is only the local dev server, but it exposes any developer's machine during local work.
- **Effort**: S
- **Suggested fix**:
  - After `path.join`, check: `if (!filePath.startsWith(__dirname)) { res.writeHead(403); res.end('Forbidden'); return; }`.
  - Alternatively sanitize `urlPath` by rejecting any path containing `..`.

---

## ⚡ P1 — High ROI (UX friction blocking conversion)

### 3. distribution.html and scaling.html break brand entirely
- **What**: Both pages use `Segoe UI` font, blue (#3b82f6) accent color, and a slate gradient background—completely different from the Inter/Newsreader + green (#22c55e) + near-black design of the main book. They have no navigation header and no way back to the main site.
- **Where**: `distribution.html:14–19`, `scaling.html:14–19`
- **Why it matters**: Anyone who lands on `/distribution` or `/scaling` sees an unrelated product. There is zero continuity; no back-link means they're stranded.
- **Effort**: M
- **Suggested fix**:
  - Apply the shared CSS variables (`--bg-primary: #0a0a0a`, `--accent: #22c55e`, `--text-primary: #fafafa`) and load the same Google Fonts (`Inter` + `Newsreader`).
  - Add the same `<nav>` block used in `index.html` and `cards.html` at the top of both pages.
  - Replace blue card borders and headings with `--accent`.

### 4. No Open Graph or Twitter Card meta tags on any page
- **What**: None of the four pages include `<meta property="og:title">`, `og:description`, `og:image`, or `twitter:card`. Social shares show blank previews.
- **Where**: `index.html:1–10`, `cards.html:1–10`, `distribution.html:1–10`, `scaling.html:1–10`
- **Why it matters**: The whole Cards page exists to drive sharing—but shares from it (and from the main book) render as raw URLs with no thumbnail or description, killing click-through.
- **Effort**: S
- **Suggested fix**:
  - Add in `<head>` of each page: `og:title`, `og:description` (one sentence), `og:url`, `og:type: "website"`, `twitter:card: "summary_large_image"`.
  - Generate a 1200×630 cover image for `og:image` (the book cover section already has good visual material).

### 5. No favicon across all pages
- **What**: No `<link rel="icon">` is present anywhere.
- **Where**: All four HTML files, `<head>` section.
- **Why it matters**: Browser shows a generic grey icon in tabs and bookmark bars. Looks unpublished.
- **Effort**: S
- **Suggested fix**:
  - Add a simple SVG favicon (the ✦ glyph used in the cover works). `<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>✦</text></svg>">`.

### 6. jsPDF loaded from CDN without Subresource Integrity hash
- **What**: `index.html:2467` loads jsPDF from `cdnjs.cloudflare.com` with no `integrity` attribute. If CDN is down, the PDF button silently fails after a network timeout; if CDN is compromised, arbitrary JS runs in page context.
- **Where**: `index.html:2467`
- **Why it matters**: PDF download is a featured action (it has its own button in the toolbar). CDN outages will silently break it for users who may not notice the error toast.
- **Effort**: S
- **Suggested fix**:
  - Add the SRI hash: `integrity="sha256-..." crossorigin="anonymous"` (generate with `openssl dgst -sha256 -binary jspdf.umd.min.js | openssl base64`).
  - Alternatively bundle the file locally at `vendor/jspdf.umd.min.js` — it's 300 KB gzipped, acceptable for a one-time asset.

---

## 🛠 P2 — Code health (tech debt slowing velocity)

### 7. CSS design tokens duplicated in every HTML file
- **What**: The `:root` block defining all 8 CSS custom properties (`--bg-primary`, `--accent`, etc.) is copy-pasted identically in `index.html:11–22` and `cards.html:11–22`.
- **Where**: `index.html:11–22`, `cards.html:11–22`
- **Why it matters**: Changing the accent color requires editing two files. When `distribution.html` and `scaling.html` are brought on-brand (P1.3), it becomes four.
- **Effort**: S
- **Suggested fix**:
  - Extract to `styles/tokens.css`.
  - `<link rel="stylesheet" href="/styles/tokens.css">` in each page.
  - Add the MIME type `.css: 'text/css'` to `server.js` (already present at line 9).

### 8. Audiobook preferred-voice selection never retries after voices load
- **What**: `index.html:2747–2749` sets `synth.onvoiceschanged = () => {}` — an empty no-op. In Chrome, `getVoices()` returns `[]` synchronously on first call; the preferred voice (Google/Samantha/Daniel) is silently skipped.
- **Where**: `index.html:2687–2690`, `index.html:2747–2749`
- **Why it matters**: Audiobook always plays in the default system voice on Chrome instead of the natural voice the code intends.
- **Effort**: S
- **Suggested fix**:
  - Replace the no-op: `synth.onvoiceschanged = () => { if (isPlaying && utterance) { utterance.voice = getBestVoice(); } };`.
  - Extract voice selection: `function getBestVoice() { return synth.getVoices().find(v => v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')); }`.

### 9. Nav links in index.html reference chapter IDs that are page-internal with no scroll offset correction
- **What**: The fixed nav bar is 64 px tall. Clicking `#deutsch`, `#systems`, etc. snaps to those IDs but the fixed nav occludes the chapter heading.
- **Where**: `index.html:1379–1384` (nav links), `index.html:1165–1175` (sidebar CSS, has `scroll-padding-top`)
- **Why it matters**: Every nav click sends the user to a chapter where the heading is hidden under the nav — jarring reading experience.
- **Effort**: S
- **Suggested fix**:
  - Add `scroll-padding-top: 80px;` to the `html` element (already partially addressed via sidebar scroll behaviour; needs to cover top nav links too).

### 10. No skip-to-content link for keyboard users
- **What**: There is no `<a href="#main-content" class="skip-link">Skip to content</a>` before the nav. Keyboard users must tab through all nav items on every page load.
- **Where**: `index.html:1360`, `cards.html` (body start)
- **Why it matters**: Basic keyboard accessibility requirement. Screen reader users cannot skip past repetitive navigation.
- **Effort**: S
- **Suggested fix**:
  - Add a visually-hidden skip link before the nav: `<a href="#main-content" style="position:absolute;left:-9999px;...">Skip to content</a>`.
  - Add `id="main-content"` to the first `<section>` or `<main>` element.

---

## 💡 P3 — Nice to have

### 11. distribution.html and scaling.html are orphaned — no inbound links from main site
- **What**: `/distribution` and `/scaling` exist and are Vercel-routed, but no page on the site links to them.
- **Where**: `index.html:1379–1384` (nav), `vercel.json:6–17` (routes exist)
- **Why it matters**: Pages you can only reach by knowing the URL get zero organic traffic and zero discovery.
- **Effort**: S
- **Suggested fix**: Add links to the footer or in a "Resources" nav item: `<li><a href="/distribution">Distribution</a></li>`.

### 12. `server.js` sends no security headers
- **What**: No `X-Content-Type-Options`, `X-Frame-Options`, or `Content-Security-Policy` headers are set.
- **Where**: `server.js:99–102`
- **Why it matters**: Low risk in local dev, but sets a bad precedent if the server is ever exposed. Also aligns with Vercel's default header behaviour being different.
- **Effort**: S
- **Suggested fix**: Add to every successful response: `'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'SAMEORIGIN'`.

### 13. Footer attributes "Sophos" without explanation
- **What**: `index.html:2462` reads `© 2026 Panos Kokmotos & Sophos`. Sophos is also a well-known cybersecurity company — readers may be confused.
- **Where**: `index.html:2462`
- **Why it matters**: Ambiguous attribution. May look like an accidental corporate claim.
- **Effort**: S
- **Suggested fix**: Clarify with a tooltip, a link, or rename to the actual entity (personal brand, LLC name, etc.).
