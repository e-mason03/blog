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

Copy the Worker URL from the output (e.g., `https://blog-worker.your-subdomain.workers.dev`)

### 3. Configure DNS

In your Cloudflare dashboard:
1. Go to **DNS** > **Records**
2. Add a new **CNAME** record:
   - **Name**: `blog`
   - **Target**: `[worker-url-from-above]`
   - **Proxy**: DNS only (grey cloud)
   - **TTL**: Auto

### 4. Wait and Test

Wait 1-5 minutes for DNS propagation, then visit:
```
https://blog.masonethan.com
```

---

## Full Setup Guide

See `SETUP.md` for detailed step-by-step instructions.

---

## Updating Content

```bash
cd ~/projects/blog
npm run build
cd ~/projects/blog/cloudflare-worker
wrangler deploy
```

---

## Troubleshooting

### Pages not loading?
- Verify DNS CNAME record is set to "DNS only" (grey cloud)
- Wait for DNS propagation (1-5 minutes)

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
    DNS (CNAME)
         ↓
    blog.masonethan.com
```

---

## Files

- `src/index.js` - Worker code
- `wrangler.toml` - Wrangler configuration
- `deploy.sh` - Deployment script
- `README.md` - Worker documentation
- `SETUP.md` - Detailed setup guide
- `CLOUDFLARE_SETUP.md` - This file
