// A guard for the site's own POST routes that change something (cancel or move a booking, send a
// reset email, file a tester application).
//
// Astro's own cross-site check is off (`security.checkOrigin: false` in astro.config.mjs, as the
// Wix kit ships it): behind Wix's proxy the request URL is internal, so Astro would compare the
// browser's Origin with the wrong host and refuse every real request. Instead, these routes
// accept only a JSON body. Another site can't send that with the visitor's login cookie: a plain
// HTML form can only send form or text bodies, and a script needs the browser's CORS permission,
// which a request carrying the login is never given here. Our own pages always send
// "Content-Type: application/json".

/** A 415 response when the request isn't JSON, else null. */
export function requireJson(request: Request): Response | null {
  const type = (request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (type === "application/json") return null;
  return new Response(JSON.stringify({ error: "Expected JSON." }), {
    status: 415,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
