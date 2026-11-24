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

### 4. Test

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

### Giscus comments missing?
- The Giscus script should load automatically
- Check browser console for JavaScript errors

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

- `cloudflare-worker/src/index.js` - Worker code
- `cloudflare-worker/wrangler.toml` - Wrangler configuration (incl. custom domain)
- `cloudflare-worker/.assetsignore` - Files excluded from the public assets
- `cloudflare-worker/deploy.sh` - Build + deploy script
- `CLOUDFLARE_SETUP.md` - This file
