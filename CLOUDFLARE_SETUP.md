# Cloudflare Worker Blog Setup

## Quick Start

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Deploy the Worker

```bash
cd ~/projects/blog/cloudflare-worker
wrangler login
wrangler deploy
```

### 3. Custom domain

`wrangler.toml` attaches `blog.masonethan.com` to the Worker as a **Custom Domain**,
so `wrangler deploy` creates the DNS record and certificate itself.

- Do **not** add a `blog` CNAME pointing at `*.workers.dev`; Cloudflare doesn't route
  that to the Worker, and an existing record blocks the Custom Domain from being created.
- The portfolio Worker must only be bound to `masonethan.com` (no `*masonethan.com/*`
  wildcard route), or it will catch the blog's traffic.

### 4. Comments database (one-time)

Comments are stored in a free D1 database bound to the Worker as `DB`.

```bash
cd ~/projects/blog/cloudflare-worker
npx wrangler d1 create blog-comments        # copy the printed database_id into wrangler.toml
npx wrangler d1 migrations apply blog-comments --remote
```

Optional: set a private salt for the IP hashes used for rate limiting:

```bash
npx wrangler secret put IP_SALT
```

### 5. Test

After deploying (the certificate can take a minute or two), visit:
```
https://blog.masonethan.com
```

---

## Updating Content

```bash
~/projects/blog/cloudflare-worker/deploy.sh
```

This builds the site with Eleventy, copies `_site/` into `cloudflare-worker/`, and deploys.

---

## Troubleshooting

### Subdomain shows the portfolio (or nothing)?
- Check **Workers & Pages → blog-worker → Domains & Routes** lists `blog.masonethan.com`
- Check the portfolio Worker has no wildcard route covering subdomains
- Make sure there's no leftover `blog` CNAME record in DNS

### CSS/JS not loading?
- Check browser DevTools for 404 errors
- Verify file paths in HTML match Worker structure

### Comments not loading or posting?
- Check `wrangler.toml` has the real `database_id` and the migration was applied with `--remote`
- Tail Worker logs: `npx wrangler tail blog-worker`

---

## Comments

Posts with `comments: true` in their front matter show a comment section. The Worker
serves `GET /api/comments?post=/posts/<slug>/` and `POST /api/comments`
(`name` and comment both required; 50 / 5000 char limits; 3 comments per IP per
10 minutes; honeypot field for bots). Comments publish immediately.

Moderating from the CLI:

```bash
# List recent comments
npx wrangler d1 execute blog-comments --remote \
  --command "SELECT id, post_id, name, substr(body,1,80) AS body, created_at FROM comments ORDER BY id DESC LIMIT 20"

# Delete one
npx wrangler d1 execute blog-comments --remote --command "DELETE FROM comments WHERE id = 42"
```

Local testing: `npx wrangler d1 migrations apply blog-comments --local && npx wrangler dev`

---

## Alternative: Cloudflare Pages

For easier deployments, consider using [Cloudflare Pages](https://pages.cloudflare.com/):

1. Create a new Pages project
2. Connect your blog repository
3. Deploy automatically on git push

**Benefits**:
- Automatic deployments
- Better caching
- Free SSL
- No manual CLI needed

**Drawbacks**:
- Requires git integration
- Slightly different deployment flow

---

## Architecture

```
┌─────────────────────────────────────────┐
│         Cloudflare Workers              │
│         (blog-worker)                   │
├─────────────────────────────────────────┤
│  / → _site/index.html                   │
│  /about/ → _site/about/index.html       │
│  /posts/ → _site/posts/index.html       │
│  /posts/[slug]/ → _site/posts/[slug]/   │
│  /assets/* → _site/assets/*             │
└─────────────────────────────────────────┘
         ↓
    Custom Domain
         ↓
    blog.masonethan.com
```

---

## Files

- `cloudflare-worker/src/index.js` - Worker code (static assets + comments API)
- `cloudflare-worker/migrations/` - D1 schema for comments
- `src/js/comments.js` - Client-side comments widget
- `cloudflare-worker/wrangler.toml` - Wrangler configuration (incl. custom domain)
- `cloudflare-worker/.assetsignore` - Files excluded from the public assets
- `cloudflare-worker/deploy.sh` - Build + deploy script
- `CLOUDFLARE_SETUP.md` - This file
