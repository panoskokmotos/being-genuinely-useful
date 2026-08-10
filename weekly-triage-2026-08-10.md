# Weekly Triage — 2026-08-10

## 📊 Week at a glance
- **Commits this week:** 0 (last commit was `e62c828` on 2026-05-10 — 91 days ago)
- **Files changed:** 0
- **Debt markers added this week:** N/A (no commits)
- **High-churn files (last 7 days):** None
- **Repository status:** Dormant for 3 months

> No code shipped this week. The triage below focuses on standing debt found in the existing codebase — issues that exist in production right now and should be addressed before the next push.

---

## 🚨 Needs immediate attention

### 1. PDF embeds wrong URL in every download
- **File:** `index.html:2577`
- **Commit introduced:** `6a85991` (2026-04-13) — "Improve server and front-end routing, add PDF support"
- **Why this matters:** Every PDF download prints `openclaw.ai/book` — a stale origin from the build environment, not the live Vercel URL. This is in production and affects every reader who clicks "Download PDF".

### 2. Mobile navigation is non-functional
- **File:** `index.html:546-548`, `index.html:601-614`, `index.html:1376-1387`
- **Commit introduced:** `68ea931` (2026-04-20) — "complete ebook redesign"
- **Why this matters:** `.nav-links { display: none }` on mobile with no hamburger button or JS handler means zero navigation for mobile users. Mobile share traffic (from Twitter/LinkedIn cards) lands on a page with no way to explore chapters.

### 3. `copyLink()` has no error handler — silently fails
- **File:** `index.html:2753`
- **Commit introduced:** `8cdd726` (2026-04-13) — "enhance features and polish UI"
- **Why this matters:** `navigator.clipboard.writeText()` throws on non-HTTPS, background tab, or denied permission. No `.catch()` means failure is invisible. Users think the button is broken.

### 4. `/distribution` and `/scaling` pages are unreachable from main site
- **Files:** `index.html:1376-1387`, `cards.html:394-405`
- **Commit introduced:** `888fc5c` + `19c388f` (2026-04-13) — pages added with no nav links
- **Why this matters:** Two full pages of monetization strategy and content templates exist in production but are completely undiscoverable. This is lost conversion surface.

### 5. Canvas image export ignores loaded web fonts
- **File:** `cards.html:658-693`
- **Commit introduced:** `5e3cfd3` (2026-04-13) — "redesign UI/UX for main and cards pages"
- **Why this matters:** The "Download Image" button — the primary share mechanism — renders cards with system fonts (Georgia, -apple-system), not the Inter/Newsreader fonts visible on the site. Every card image looks worse than the live card.

---

## 🧹 Cleanup opportunities

### 6. Dead function: `shareOnLinkedIn()` defined, never called
- **File:** `cards.html:637-639`
- **Commit:** `5e3cfd3` (2026-04-13)
- **Why this matters:** Either finish it (add a LinkedIn button to the card template) or delete it. Suggests unfinished LinkedIn sharing was planned but never wired up.

### 7. CSS variables copied verbatim between `index.html` and `cards.html`
- **Files:** `index.html:11-22`, `cards.html:11-22`
- **Commit:** `5e3cfd3` (2026-04-13)
- **Why this matters:** Identical 12-variable `:root` block in both files. Changing brand colors requires editing two places. `server.js` already supports `.css` files — extract to a shared `style.css`.

### 8. README documents a project that doesn't match the actual repo
- **File:** `README.md` (Project Structure section)
- **Commit:** `e62c828` (2026-05-10) — README was written last and still references `style.css`, `script.js`, and `chapters/` that don't exist.
- **Why this matters:** Misleading for any contributor trying to orient themselves. Also the "Local Development" section will confuse new developers.

### 9. DEPLOY.md has hardcoded original dev environment path
- **File:** `DEPLOY.md`
- **Commit:** pre-`670ca7c` (original)
- **Why this matters:** Path `/root/.openclaw/workspace/book-web` is from the AI-assisted build environment, not the user's machine. Anyone following these instructions will fail at the `cd` step.

### 10. `distribution.html` references two non-existent markdown files
- **File:** `distribution.html:275`, `distribution.html:317`
- **Commit:** `888fc5c` (2026-04-13)
- **Why this matters:** Users are told to find content at `/distribution/email-course.md` and `/distribution/twitter-threads.md`. These files don't exist. The distribution page is the monetization launchpad — broken instructions here directly harm revenue.

### 11. `distribution.html:661` shadows `window.scrollTo`
- **File:** `distribution.html:661`
- **Commit:** `888fc5c` (2026-04-13)
- **Why this matters:** `function scrollTo(id)` shadows the browser built-in. Works now because nothing in the file calls native `window.scrollTo`, but any future addition will silently break. Rename to `scrollToSection`.

---

## 🤔 Worth a second look

### 12. `window.speechSynthesis` used without availability check
- **File:** `index.html:2651`
- **Commit:** `8cdd726` (2026-04-13)
- **Why this matters:** `let synth = window.speechSynthesis` — if the API is undefined (some mobile browsers), subsequent calls throw. The audiobook button should be hidden when unsupported. Likely intentional given the feature is listed in the nav, but no guard exists.

### 13. `distribution.html` and `scaling.html` have no `lang="en"` attribute
- **Files:** `distribution.html:2`, `scaling.html:2`
- **Commit:** `888fc5c` + `19c388f` (2026-04-13)
- **Why this matters:** Minor a11y and SEO issue. All other pages have `lang="en"` correctly.

### 14. Card filter resets card numbers when filtering
- **File:** `cards.html:593`
- **Commit:** `5e3cfd3` (2026-04-13)
- **Why this matters:** After filtering by author, "Card 01" is always the first card in the filtered set, not the card's canonical number. Likely intentional (simplest implementation) but creates inconsistency when sharing by card number.

### 15. Audio progress bar doesn't reset at chapter boundaries
- **File:** `index.html:2692-2699`
- **Commit:** `8cdd726` (2026-04-13)
- **Why this matters:** When a chapter ends and the next begins, the progress bar starts at 100% instead of 0%. Cosmetic but makes the player appear to malfunction.
