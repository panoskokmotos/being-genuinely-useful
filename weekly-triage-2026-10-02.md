# Weekly Triage — 2026-10-02

## 📊 Week at a glance
- **Commits this week**: 0
- **Files changed**: 0
- **Debt markers added**: 0
- **High-churn files**: N/A (no activity)

No commits landed in the last 7 days. The triage scoped to recently-touched files has nothing to scan — but a full static analysis of the existing codebase surfaced several issues worth flagging.

---

## 🚨 Needs immediate attention

### 1. `chapters` variable declared twice in same script scope — SyntaxError kills all JS
- **File**: `index.html:2495` and `index.html:2655`
- **Introduced by**: commit `5e497cf` ("feat: infuse book with the world's greatest wisdom")
- **Why this matters**: `const chapters = ...` at line 2495 and `let chapters = []` at line 2655 are in the same `<script>` block. Modern engines throw `SyntaxError: Identifier 'chapters' has already been declared` and refuse to execute the block at all. Reading progress bar, sidebar, animations, PDF download, and audiobook are all silently dead.

### 2. Mobile nav has no hamburger button — mobile users can't navigate
- **File**: `index.html:600–614` (CSS) vs `index.html:1376–1387` (HTML)
- **Introduced by**: commit `5e3cfd3` ("feat: redesign UI/UX for main and cards pages")
- **Why this matters**: CSS defines `.mobile-menu-btn { display: block }` on narrow viewports and hides `nav-links`, but the `<button class="mobile-menu-btn">` element was never added to the HTML. Mobile visitors have no way to access the navigation.

---

## 🧹 Cleanup opportunities

### 3. `server.js` path traversal — no bounds check on resolved file path
- **File**: `server.js:41`
- **Introduced by**: commit `6a85991` ("Improve server and front-end routing…")
- **Why this matters**: `path.join(__dirname, urlPath)` with no validation that the result stays within `__dirname`. A crafted URL like `/../../../etc/passwd` resolves outside the project root. Production is Vercel (not affected), but local dev and any self-hosted deployment are exposed.

### 4. `navigator.clipboard.writeText()` — no `.catch()` handler
- **File**: `index.html:2753`
- **Introduced by**: commit `8cdd726` ("feat: enhance features and polish UI")
- **Why this matters**: Clipboard API requires HTTPS and user-gesture permission. On HTTP or in unsupported browsers the promise rejects silently — no toast, no fallback, no feedback to the user.

### 5. `window.speechSynthesis` used without support check
- **File**: `index.html:2651`
- **Introduced by**: commit `8cdd726`
- **Why this matters**: Firefox and several mobile browsers don't implement the Web Speech API. `synth.cancel()` called on `undefined` throws TypeError when the audiobook player is toggled.

---

## 🤔 Worth a second look

### 6. CSS is copy-pasted across all four HTML files
- **Files**: `index.html`, `cards.html`, `distribution.html`, `scaling.html`
- **Introduced by**: across multiple commits — no shared stylesheet was ever created
- **Why this matters**: `:root` token definitions (~20 lines), nav styles, and utility classes are duplicated verbatim. If they've drifted between files, visual inconsistencies may already exist on `/cards` or `/distribution` without being obvious.

### 7. `distribution.html` and `scaling.html` have Vercel routes but no links from the UI
- **Files**: `vercel.json:8–14`, `distribution.html`, `scaling.html`
- **Introduced by**: commits `19c388f` and `888fc5c`
- **Why this matters**: Two pages with substantive content are unreachable by normal navigation. Whether this is intentional (staged content) or an oversight is worth clarifying.

### 8. jsPDF loaded from CDN with no fallback
- **File**: `index.html:2467`
- **Introduced by**: commit `8cdd726`
- **Why this matters**: If `cdnjs.cloudflare.com` is unreachable (corporate firewalls, slow connection), the PDF button clicks, shows "Generating...", then silently resets. No print fallback is offered.
