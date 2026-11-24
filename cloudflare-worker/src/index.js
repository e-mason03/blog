// Cloudflare Worker: serves the static blog from the ASSETS binding and
// exposes a small comments API backed by D1.
//
//   GET  /api/comments?post=/posts/<slug>/   -> { comments: [{ id, name, body, created_at }] }
//   POST /api/comments  { post, name, body } -> { comment: { ... } }

const NAME_MAX = 50;
const BODY_MAX = 5000;
const RATE_LIMIT_COUNT = 3;          // max comments per IP...
const RATE_LIMIT_WINDOW_MIN = 10;    // ...per this many minutes
const POST_PATH = /^\/posts\/[a-z0-9-]+\/$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/comments") {
      try {
        if (request.method === "GET") return await listComments(url, env);
        if (request.method === "POST") return await createComment(request, url, env);
        return json({ error: "Method not allowed" }, 405, { Allow: "GET, POST" });
      } catch (err) {
        console.error(err);
        return json({ error: "Something went wrong. Please try again later." }, 500);
      }
    }
    return env.ASSETS.fetch(request);
  },
};

async function listComments(url, env) {
  const post = url.searchParams.get("post") || "";
  if (!POST_PATH.test(post)) return json({ error: "Invalid post" }, 400);

  const { results } = await env.DB.prepare(
    "SELECT id, name, body, created_at FROM comments WHERE post_id = ? ORDER BY created_at ASC, id ASC"
  ).bind(post).all();

  return json({ comments: results });
}

async function createComment(request, url, env) {
  // Only accept submissions from the blog's own pages.
  const origin = request.headers.get("Origin");
  if (origin !== url.origin) return json({ error: "Forbidden" }, 403);

  let data;
  try {
    data = await request.json();
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }

  // Honeypot: real visitors never see or fill the "website" field.
  // Pretend success so bots don't learn to skip it.
  if (data.website) return json({ comment: null }, 201);

  const post = typeof data.post === "string" ? data.post : "";
  const name = clean(data.name, false);
  const body = clean(data.body, true);

  if (!POST_PATH.test(post)) return json({ error: "Invalid post" }, 400);
  if (!name) return json({ error: "Please enter a name." }, 400);
  if (!body) return json({ error: "Please enter a comment." }, 400);
  if (name.length > NAME_MAX) return json({ error: `Name must be ${NAME_MAX} characters or fewer.` }, 400);
  if (body.length > BODY_MAX) return json({ error: `Comment must be ${BODY_MAX} characters or fewer.` }, 400);

  // The post must actually exist as a page on the site.
  const page = await env.ASSETS.fetch(new URL(post, url.origin));
  if (!page.ok) return json({ error: "Invalid post" }, 400);

  const ipHash = await hashIp(request.headers.get("CF-Connecting-IP") || "unknown", env);
  const recent = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM comments WHERE ip_hash = ? AND created_at > strftime('%Y-%m-%dT%H:%M:%SZ', 'now', ?)"
  ).bind(ipHash, `-${RATE_LIMIT_WINDOW_MIN} minutes`).first();
  if (recent.n >= RATE_LIMIT_COUNT) {
    return json({ error: "You're commenting a lot — please wait a few minutes and try again." }, 429);
  }

  const comment = await env.DB.prepare(
    "INSERT INTO comments (post_id, name, body, ip_hash) VALUES (?, ?, ?, ?) RETURNING id, name, body, created_at"
  ).bind(post, name, body, ipHash).first();

  return json({ comment }, 201);
}

// Trim, normalise newlines, strip control characters. Single-line fields
// also collapse whitespace. Output is rendered with textContent, never as HTML.
function clean(value, multiline) {
  if (typeof value !== "string") return "";
  let s = value.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "");
  s = multiline ? s.replace(/\n{3,}/g, "\n\n") : s.replace(/\s+/g, " ");
  return s.trim();
}

// Store a salted hash rather than the raw IP; it's only used for rate limiting.
async function hashIp(ip, env) {
  const salt = env.IP_SALT || "blog-comments";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${ip}`));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
  });
}
