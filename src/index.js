const ALLOWED_ORIGINS = new Set([
  "https://shopelevateworld-hash.github.io",
  "https://bank-of-spanky.shopelevateworld.workers.dev"
]);
const DEFAULT_ORIGIN = "https://shopelevateworld-hash.github.io";

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : DEFAULT_ORIGIN,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}
function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}
async function printfulGet(path, env) {
  return fetch(`https://api.printful.com${path}`, {
    headers: {
      "Authorization": `Bearer ${env.PRINTFUL_API_KEY}`,
      "Accept": "application/json",
      "X-PF-Store-Id": "19111295"
    }
  });
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: "Origin not allowed" }, 403, origin);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
    if (request.method !== "GET" && request.method !== "HEAD") return json({ error: "Method not allowed" }, 405, origin);

    if (url.pathname === "/api/health") return json({ ok: true, service: "bank-of-spanky-api", assets: Boolean(env.ASSETS) }, 200, origin);

    if (url.pathname.startsWith("/api/printful/")) {
      if (!env.PRINTFUL_API_KEY) return json({ error: "Printful API secret is not configured" }, 503, origin);
      let apiPath;
      if (url.pathname === "/api/printful/stores") apiPath = "/stores";
      else if (url.pathname === "/api/printful/products") apiPath = "/store/products";
      else if (url.pathname === "/api/printful/templates") apiPath = "/product-templates?limit=100";
      else if (url.pathname === "/api/printful/template") apiPath = "/product-templates/497623456";
      else if (/^\/api\/printful\/products\/\d+$/.test(url.pathname)) apiPath = `/store/products/${url.pathname.split("/").pop()}`;
      else return json({ error: "Not found" }, 404, origin);
      try {
        const upstream = await printfulGet(apiPath, env);
        const body = await upstream.json();
        return json(body, upstream.status, origin);
      } catch {
        return json({ error: "Could not reach Printful" }, 502, origin);
      }
    }

    // Serve the actual website for every non-API route (/, /store.html, CSS, JS, images).
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response("Static assets binding is not configured.", { status: 503 });
  }
};