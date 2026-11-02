// POST /api/pattern-testing/apply — a visitor applies to test a pattern. Body: ApplicationInput
// (src/wix/pattern-testing/types.ts). The server validates it, checks the call is still open and
// files the row into the private "Tester applications" collection (src/wix/pattern-testing/server.ts).
import type { APIRoute } from "astro";
import { ApplicationError, submitApplication, validateApplication } from "../../../wix/pattern-testing/server";

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store" } });

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Expected JSON." }, 400);
  }
  try {
    const input = validateApplication(body);
    const { id } = await submitApplication(input);
    return json({ ok: true, id });
  } catch (e) {
    if (e instanceof ApplicationError) return json({ error: e.message }, e.status);
    console.error("[pattern-testing] application failed", (e as any)?.details?.applicationError ?? e);
    return json({ error: "Sorry, that didn't send. Please try again or email me." }, 500);
  }
};
