# Weekly Triage — 2026-07-13

## 📊 Week at a glance
- **Commits this week**: 0 (last commit: e62c828 on 2026-05-10 — repo has been quiet for ~2 months)
- **Files changed**: N/A
- **Debt markers added this week**: N/A
- **High-churn files**: None (no activity)

_Note: With no recent commits, this triage scans the full codebase for existing debt that hasn't been addressed. Items below are pre-existing issues, not regressions._

---

## 🚨 Needs immediate attention

### 1. `index.html:2495 + 2655` — Duplicate `chapters` variable (SyntaxError)
**Introduced**: e62c828 / 5e497cf (audiobook feature added in redesign, conflicting with earlier sidebar code)  
**Why this matters**: `const chapters` is declared at line 2495 (sidebar IntersectionObserver), then `let chapters = []` is re-declared at line 2655 (audiobook init). Both are at the top level of the same `<script>` block. This is a JavaScript `SyntaxError` that prevents the entire script from parsing — reading progress, animations, sidebar, PDF download, and audiobook are all dead on arrival.

### 2. `index.html:2577` — PDF hardcodes internal dev URL `openclaw.ai/book`
**Introduced**: 6a85991 (PDF feature added)  
**Why this matters**: Every downloaded PDF instructs readers to visit `openclaw.ai/book`, which is either an internal alias or a dead URL. The canonical site is `being-genuinely-useful.vercel.app`. This is the PDF's only external reference and it is wrong.

### 3. `deploy.sh:6` — Hardcoded absolute path from dev machine
**Introduced**: Initial commit (670ca7c)  
**Why this matters**: `cd /root/.openclaw/workspace/book-web` makes `deploy.sh` non-functional on any machine other than the original dev box. The script will silently change to a non-existent directory and then write a `server.js` file to the wrong location. The script is also superseded by Vercel deployment and should be removed or rewritten.

---

## 🧹 Cleanup opportunities

### 4. `cards.html:636–639` — Dead function `shareOnLinkedIn()` never called
**Introduced**: 5e3cfd3 (UI redesign)  
**Why this matters**: A LinkedIn share button was apparently planned but never wired up. The function exists, takes no arguments (shares only the site URL), and is never referenced by any element. Either complete it or remove it to avoid confusion in future diffs.

### 5. `pnpm-lock.yaml` tracked in git with no packages to lock
**Introduced**: Initial commits  
**Why this matters**: `package.json` has zero `dependencies` / `devDependencies`. The lock file is a no-op artifact that suggests there are managed dependencies when there are none. `pnpm install` against this project installs nothing and the lockfile will differ across pnpm versions, causing spurious diffs.

### 6. `index.html:2467` — jsPDF CDN script has no `integrity` hash
**Introduced**: 6a85991  
**Why this matters**: `<script src="https://cdnjs.cloudflare.com/.../jspdf.umd.min.js">` with no `integrity="sha256-..."` attribute. The hash is available on cdnjs; adding it takes 30 seconds and defends against CDN compromise.

### 7. `README.md:57–63` — Project structure lists non-existent files
**Introduced**: e62c828  
**Why this matters**: `style.css`, `script.js`, and `chapters/` are listed in the documented project structure. None of these exist. The project is a single-file HTML app. The README was clearly written before the architecture was finalised and never updated. Any future contributor's first experience is confusion.

---

## 🤔 Worth a second look

### 8. `index.html:2655` — `let chapters = []` initialized empty, populated in `initAudiobook()`
**Introduced**: 5e497cf / 68ea931 (audiobook feature)  
**Why this matters**: (Separate from the SyntaxError — this is about the pattern itself once the rename is done.) `initAudiobook()` is only called the first time the audiobook button is clicked. If a user clicks "Previous" or "Next" before ever clicking "Listen", `playChapter()` will iterate over an empty array and silently do nothing. There's no guard: `if (!audiobookChapters.length) initAudiobook()` inside `playChapter()` would be safer.

### 9. `scaling.html` + `distribution.html` — Publicly routed internal planning docs
**Introduced**: 19c388f / 888fc5c  
**Why this matters**: Both files are accessible at `/scaling` and `/distribution` per `vercel.json` rewrites. Their content ("3-tier passive income strategy", "30-day distribution plan") reads as internal product planning material, not public-facing content. They use a completely different visual design. Intentional? If not, the vercel.json rewrites and possibly the files themselves should be removed.

### 10. `index.html:2520–2530` — `smooth` scroll behaviour applied to all `a[href^="#"]` anchors, including the mobile menu
**Introduced**: 68ea931  
**Why this matters**: Once the mobile menu is wired up, clicking a nav link will attempt smooth-scroll but the event handler calls `e.preventDefault()` unconditionally, which means any anchor that doesn't match a real DOM element will silently fail (no scroll, no navigation). The guard `if (target)` handles missing elements, but the menu close action (if added) will need to be handled here too. Flag for when the mobile menu is implemented.
