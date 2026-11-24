// Cloudflare Worker - serve static assets from ASSETS binding
export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  }
};
