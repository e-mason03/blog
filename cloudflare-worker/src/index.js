// Cloudflare Worker - serve static assets from ASSETS binding
export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    // Use the ASSETS binding to serve static files
    return ASSETS.fetch(request);
  }
};
