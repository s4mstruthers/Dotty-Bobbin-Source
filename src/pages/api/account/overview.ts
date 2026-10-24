// GET /api/account/overview — the logged-in member's own bookings, event tickets and shop orders.
// The caller's identity comes from their own session on the server (never from the request), so a
// visitor gets 401 and a member only ever sees their own data. See src/wix/account/server.ts.
import type { APIRoute } from "astro";
import { accountOverview, currentCaller } from "../../../wix/account/server";

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    // Personal data: never cached anywhere.
    headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store" },
  });

export const GET: APIRoute = async () => {
  const caller = await currentCaller();
  if (!caller) return json({ error: "Log in to see your account." }, 401);
  return json(await accountOverview(caller));
};
