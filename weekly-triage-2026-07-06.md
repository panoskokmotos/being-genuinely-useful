# Weekly Triage — 2026-07-06

## 📊 Week at a glance

- **Commits this week**: 0 (last commit: `e62c828` on 2026-05-10 — 57 days ago)
- **Files changed this week**: 0
- **Debt markers added this week**: N/A

> **Note**: The repo has been dormant for nearly two months. The triage below reflects a full static scan of the most recently active files rather than a diff-scoped scan.

**High-churn files from the active development period (Apr–May 2026):**
1. `index.html` — touched in 6 of 10 total commits; also the largest file (2,779 lines)
2. `server.js` — touched in 3 commits (`670ca7c`, `7655756`, `6a85991`): initial creation, PORT env fix, routing polish
3. `cards.html` — touched in 3 commits (`5e3cfd3`, `8cdd726`, `5e497cf`): redesign, UI polish, wisdom infusion

---

## 🚨 Needs immediate attention

### 1. `chapters` identifier redeclared → SyntaxError breaks all JavaScript

**File**: `index.html:2495` and `index.html:2655`  
**Commit introduced**: `5e497cf` (feat: infuse book with world's greatest wisdom) — audiobook functions added a second `let chapters = []` into the same script scope that already had `const chapters` from the sidebar tracking code added in `68ea931`.

```js
// line 2495 — sidebar chapter tracking, introduced in 68ea931
const chapters = Array.from(document.querySelectorAll('.chapter'));

// ... 160 lines later, same <script> block, introduced in 5e497cf ...

// line 2655 — audiobook chapter list
let chapters = [];
```

**Why this matters**: `const` and `let` cannot be redeclared in the same scope. Modern browsers throw `Uncaught SyntaxError: Identifier 'chapters' has already been declared` at parse time — before any line of code executes. The reading progress bar, sidebar navigation, smooth scroll, PDF download, audiobook player, and copy-link are all broken for 100% of visitors on index.html.

---

### 2. PDF download watermarks wrong URL (`openclaw.ai/book`)

**File**: `index.html:2577`  
**Commit introduced**: `6a85991` (Improve server and front-end routing, add PDF support)

```js
doc.text('openclaw.ai/book', pageWidth / 2, y, { align: 'center' });
```

**Why this matters**: Every PDF a reader downloads has the wrong attribution URL stamped on its title page. Anyone who clicks that URL gets a 404. The site is at `being-genuinely-useful.vercel.app`.

---

### 3. `deploy.sh` writes over `server.js` with a broken older version

**File**: `deploy.sh:6`  
**Commit introduced**: `670ca7c` (initial commit)

`deploy.sh` hardcodes `cd /root/.openclaw/workspace/book-web` (line 6) — this path only exists on the original authoring machine. Running the script anywhere else fails at line 6. Worse, the script also overwrites `server.js` with a simplified version that lacks the port env var, the mime-types for fonts/PDF/markdown, and the proper 404 page — undoing the work from commit `7655756`.

**Why this matters**: A developer following the DEPLOY.md instructions who tries `./deploy.sh` first will corrupt their local `server.js`.

---

### 4. Internal tooling text visible at `/distribution`

**File**: `distribution.html:653`  
**Commit introduced**: `888fc5c` (Add distribution hub)

```html
<p style="color: #94a3b8; margin-bottom: 20px;">All files available in workspace. Copy-paste ready.</p>
```

**Why this matters**: This is an AI-authoring artifact that was never cleaned up. Anyone navigating to `/distribution` sees debug copy.

---

## 🧹 Cleanup opportunities

### 5. `copyLink()` missing `.catch()` on Clipboard API

**File**: `index.html:2752`  
**Commit**: `68ea931` (complete ebook redesign)

```js
navigator.clipboard.writeText(window.location.href).then(() => {
    showToast('Link copied to clipboard!');
});
// no .catch()
```

The `cards.html` version (added in `5e3cfd3`) correctly has a `.catch()` fallback. The `distribution.html` version (added in `888fc5c`) also lacks a `.catch()`. Likely pattern: whoever wrote each page copied the snippet without the fallback.

**Fix**: Add `.catch()` with `execCommand` fallback or a manual-copy prompt. 15 minutes.

---

### 6. `distribution.html` `scrollTo` function shadows `window.scrollTo`

**File**: `distribution.html:661`  
**Commit**: `888fc5c` (Add distribution hub)

```js
function scrollTo(id) {
    document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}
```

`scrollTo` is already defined on `window` — this local function shadows it. Any browser internal or third-party script calling `window.scrollTo()` on this page would get the wrong function. The fix is trivial: rename to `smoothScrollTo` or `scrollToSection`.

---

### 7. `server.js` missing routes for `/scaling` and `/distribution`

**File**: `server.js:29–39`  
**Commit**: `6a85991` (routing improvements)

The routing block explicitly handles `/` and `/cards` but not `/scaling` or `/distribution`. These work via `vercel.json` rewrites in production, but `npm run dev` returns 404 for both. Confusing during local development. One-line fix per route.

---

### 8. README.md lists files that don't exist

**File**: `README.md:57–63`  
**Commit**: `e62c828` (Add comprehensive README)

```
being-genuinely-useful/
├── index.html
├── style.css          # ← does not exist
├── script.js          # ← does not exist
├── chapters/          # ← does not exist
└── README.md
```

All CSS and JS are inline in the HTML files. The README was likely generated from a template and not reconciled against the actual structure.

---

### 9. `console.error` left in production browser code

**File**: `index.html:2642`  
**Commit**: `6a85991` (PDF support added)

```js
} catch (err) {
    console.error('PDF generation failed:', err);
    showToast('PDF generation failed. Try printing instead.');
}
```

The user-facing toast is appropriate; the `console.error` leaks implementation details to the browser console and signals "this was a debug-first build." Remove or replace with structured error telemetry when analytics are added.

---

### 10. `jsPDF` CDN loaded without Subresource Integrity

**File**: `index.html:2467`  
**Commit**: `6a85991` (PDF support added)

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
```

No `integrity` attribute. If cdnjs serves a tampered file, arbitrary JS runs in every visitor's browser. Add the SHA-384 hash. The hash for jsPDF 2.5.1 UMD can be generated with:  
`curl -s <url> | openssl dgst -sha384 -binary | openssl base64 -A`

---

## 🤔 Worth a second look

### 11. `distribution.html` and `scaling.html` linked from `vercel.json` but not from the site

Both pages exist and are publicly accessible via `/distribution` and `/scaling`, but no page on the site links to them. If they're intended as internal planning documents, they should be password-protected or removed from the public deployment. If they're intended for users, they need navigation links.

**Commit added**: `888fc5c` and `19c388f` respectively. No subsequent commit added nav links. Likely an intentional "ship it now, link it later" that was never followed up.

---

### 12. Mobile hamburger menu: CSS defined, HTML never added

**File**: `index.html:601–614` (CSS), nav HTML at `index.html:1376–1387`

The `.mobile-menu-btn` CSS class (display: none at desktop, display: block at ≤768px) was added in `68ea931` but the corresponding `<button>` element was never added to the HTML. This looks like the JS interactivity for the hamburger was planned but not shipped. On mobile, nav links are hidden and there is no toggle — mobile users cannot navigate.

---

### 13. `SpeechSynthesis` audiobook silently fails in non-Chrome browsers

**File**: `index.html:2651`  
**Commit**: `5e497cf`

`window.speechSynthesis` is available in Chrome and Firefox but is partially or fully broken in Safari on iOS and not available in some privacy-focused browsers. If `synth` is undefined or `synth.speak()` does nothing, the user clicks "Listen to Audiobook" and the player appears but never plays. No error state or fallback message.

**Worth investigating**: Add a browser check (`if (!window.speechSynthesis)`) and show a message like "Your browser doesn't support text-to-speech. Try Chrome or Firefox."

---

*Total items: 13 | Immediate: 4 | Cleanup: 6 | Watch: 3*
