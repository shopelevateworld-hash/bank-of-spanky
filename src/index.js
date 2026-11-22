const ALLOWED_ORIGIN = "https://shopelevateworld-hash.github.io";

function corsHeaders(origin) {
  const allowed = origin === ALLOWED_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowed ? origin : ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== "GET") {
      return json({ error: "Method not allowed" }, 405, origin);
    }

    if (url.pathname === "/api/health") {
      return json({ ok: true, service: "bank-of-spanky-api" }, 200, origin);
    }

    if (url.pathname === "/api/printful/stores") {
      if (!env.PRINTFUL_API_KEY) {
        return json({ error: "Printful API secret is not configured" }, 503, origin);
      }

      try {
        const upstream = await fetch("https://api.printful.com/stores", {
          headers: {
            "Authorization": `Bearer ${env.PRINTFUL_API_KEY}`,
            "Accept": "application/json"
          }
        });
        const body = await upstream.json();
        return json(body, upstream.status, origin);
      } catch {
        return json({ error: "Could not reach Printful" }, 502, origin);
      }
    }

    return json({ error: "Not found" }, 404, origin);
  }
};
