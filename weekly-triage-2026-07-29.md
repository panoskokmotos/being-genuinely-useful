# Weekly Triage — 2026-07-29

## 📊 Week at a glance
- Commits this week: **0** (last commit: `e62c828` on 2026-05-10)
- Files changed this week: 0
- Debt markers added this week: 0 (no changes to scan)
- High-churn files: N/A — no commits since May 10, 2026
- Note: Repo has been dormant for ~11 weeks. Triage below covers the full codebase (production bugs in-flight).

---

## 🚨 Needs immediate attention

### 1. Script SyntaxError — ALL page interactivity is broken
- **File**: `index.html:2495` and `index.html:2655`
- **Commit introduced**: `5e497cf` (2026-05-02) "feat: infuse book with the world's greatest wisdom"
- **Why this matters**: `const chapters` is declared at script top-level for the sidebar observer, then `let chapters = []` is re-declared at the same scope for the audiobook. JavaScript engines throw `SyntaxError: Identifier 'chapters' has already been declared` at parse time — the ENTIRE `<script>` block fails. Reading progress bar, scroll animations, sidebar, smooth scroll, PDF generation, and the audiobook are all non-functional for every visitor.

### 2. Mobile navigation completely broken
- **File**: `index.html:601–614` (CSS), `index.html:1376–1387` (HTML nav)
- **Commit introduced**: `68ea931` (2026-04-20) "feat: complete ebook redesign"
- **Why this matters**: CSS for `.mobile-menu-btn` was written but the HTML button element was never added to the nav, and no JS toggle handler exists. On screens ≤768px, nav links are hidden with `display: none` and there is zero way to reveal them. Mobile users cannot navigate to any section.

### 3. PDF hardcodes stale domain `openclaw.ai/book`
- **File**: `index.html:2577`
- **Commit introduced**: `5e497cf` (2026-05-02)
- **Why this matters**: Every PDF a reader downloads contains `openclaw.ai/book` as the book's URL. That domain appears to be unrelated to the live site (`being-genuinely-useful.vercel.app`). Shared PDFs send readers to a dead link.

### 4. `deploy.sh` references non-existent path
- **File**: `deploy.sh:6`
- **Commit introduced**: First commit `670ca7c` (2026-04-13)
- **Why this matters**: `cd /root/.openclaw/workspace/book-web` will fail on any machine other than the original dev box, making the deploy script silently broken. The `DEPLOY.md` docs repeat this path three times.

---

## 🧹 Cleanup opportunities

### 5. Orphaned `console.log` statements in `deploy.sh`
- **File**: `deploy.sh:51–53`
- **Commit introduced**: `6a85991` (2026-04-13) "Improve server and front-end routing"
- **Why this matters**: `deploy.sh` embeds a hardcoded `server.js` template with `console.log` debug lines. The actual `server.js` is already clean (only one `console.log` for startup, which is intentional). The embedded template in `deploy.sh` is stale and confusing.

### 6. `README.md` project structure is wrong
- **File**: `README.md:57–64`
- **Commit introduced**: `e62c828` (2026-05-10) "Add comprehensive README"
- **Why this matters**: README lists `style.css`, `script.js`, and `chapters/` directory — none of which exist. The actual project has `index.html`, `cards.html`, `distribution.html`, `scaling.html`, `server.js`. A contributor following the README would be confused immediately.

### 7. CSS variable duplication across `index.html` and `cards.html`
- **File**: `index.html:11–21`, `cards.html:11–21`
- **Commit introduced**: `68ea931` / `5e3cfd3` (2026-04-20, 2026-04-13)
- **Why this matters**: Identical `:root` CSS variable blocks are copy-pasted into both files. If the accent color changes, it must be updated in at least two places (four, counting `distribution.html` and `scaling.html` which diverged to a completely different palette). Extraction to a shared `style.css` would fix this.

---

## 🤔 Worth a second look

### 8. `jsPDF` loaded from cdnjs CDN — single point of failure
- **File**: `index.html:2467`
- **Why this looks suspicious**: The PDF download feature depends on `https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js` loaded at runtime. If cdnjs is unreachable or the file is removed, the PDF button throws `Cannot read properties of undefined (reading 'jsPDF')`. The `try/catch` at line 2541 would catch this but only shows "PDF generation failed" with no fallback.
- **Recommendation**: Consider bundling jsPDF locally or using a `link rel="preconnect"` + Subresource Integrity (`integrity=` hash) so CDN tampering would be detected.

### 9. Audiobook progress bar uses `charIndex` — inaccurate cross-browser
- **File**: `index.html:2701–2703`
- **Why this looks suspicious**: `utterance.onboundary` fires at word/sentence boundaries, and `event.charIndex` is not reliably implemented in Firefox or older Safari. The progress bar will often show 0% or jump inconsistently. Looks intentional as a "best effort" feature, but worth noting if audiobook polish is ever prioritized.

### 10. `window.location.origin` in cards used as book URL
- **File**: `cards.html:616`, `cards.html:632`, `cards.html:686`
- **Why this looks suspicious**: Cards built via `downloadCardImage()` and tweet text use `window.location.origin` which is correct for the deployed site — but returns `http://localhost:8080` during local dev. The resulting cards/tweets would link to localhost. Minor dev DX issue, not production risk.
