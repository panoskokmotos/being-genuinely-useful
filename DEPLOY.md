# Deploy to Vercel

## Quick Deploy (No Code)

### Option 1: Deploy from GitHub (Easiest)

1. **Push to GitHub:**
   ```bash
   cd /root/.openclaw/workspace/book-web
   git init
   git add .
   git commit -m "Being Genuinely Useful - Ebook"
   git remote add origin https://github.com/YOUR_USERNAME/being-genuinely-useful
   git push -u origin main
   ```

2. **Deploy on Vercel:**
   - Go to https://vercel.com
   - Click "New Project"
   - Select GitHub
   - Choose "being-genuinely-useful" repo
   - Click "Deploy"
   - Done! It's live in 60 seconds

**Result:** `https://being-genuinely-useful.vercel.app`

---

### Option 2: Deploy with Vercel CLI (Fast)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   cd /root/.openclaw/workspace/book-web
   vercel
   ```

3. **Follow prompts:**
   - Link to Vercel account (or create free account)
   - Choose settings (defaults are fine)
   - Deploy happens automatically

**Result:** Get live URL immediately

---

### Option 3: Deploy to Netlify (Alternative)

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy:**
   ```bash
   cd /root/.openclaw/workspace/book-web
   netlify deploy --prod
   ```

3. **Result:** Same thing, different platform

---

## Files Included

- `index.html` — Main book
- `cards.html` — Shareable quote cards
- `server.js` — Node.js server (optional)
- `package.json` — Dependencies
- `vercel.json` — Vercel config

---

## Custom Domain (Optional)

1. Buy domain (Namecheap, Godaddy)
2. In Vercel dashboard: Settings → Domains
3. Add domain and point nameservers
4. SSL is automatic (free)

Examples:
- `book.givelink.app`
- `genuinelyuseful.com`
- `knowledge-market.io`

---

## Expected Result

**Live website:**
- Fast (Vercel CDN)
- Always up (99.9% uptime)
- Free (Hobby tier)
- Scalable (auto-scales if needed)

**Your book is now:**
- Publicly accessible
- Shareable (one link)
- Easy to update (push to GitHub, auto-deploys)
- Professional (custom domain optional)

---

## Next Steps

Once deployed:

1. Update book URL everywhere
2. Add to social media
3. Start email course
4. Launch Twitter campaign
5. Build community

---

## Support

- Vercel docs: https://vercel.com/docs
- Netlify docs: https://docs.netlify.com/
- GitHub Pages alternative: https://pages.github.com/

---

**Pick one method above and you'll have a live ebook in 5 minutes.** 🚀
