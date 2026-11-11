// POST /api/pattern-testing/purge?token=<TESTER_PURGE_TOKEN>[&dryRun=1] — deletes tester
// applications older than 6 months (src/wix/pattern-testing/purge.ts). Called once a month by
// the Wix automation "Pattern tester applications: delete after 6 months" (dashboard ›
// Automations). The token is set on Wix's servers (`wix env set`) and in that automation's
// webhook URL; a wrong or missing one gets the same 404 as any unknown page.
import type { APIRoute } from "astro";
import { TESTER_PURGE_TOKEN } from "astro:env/server";
import { purgeOldApplications } from "../../../wix/pattern-testing/purge";

export const prerender = false;

/** Compares every character, so the time taken doesn't hint at how much of a guess was right. */
function sameToken(given: string, expected: string): boolean {
  let diff = given.length ^ expected.length;
  for (let i = 0; i < expected.length; i++) diff |= (given.charCodeAt(i) || 0) ^ expected.charCodeAt(i);
  return diff === 0;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export const POST: APIRoute = async ({ url }) => {
  const expected = TESTER_PURGE_TOKEN ?? "";
  if (expected.length < 24 || !sameToken(url.searchParams.get("token") ?? "", expected)) {
    return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const result = await purgeOldApplications({ dryRun: url.searchParams.get("dryRun") === "1" });
    console.log("[pattern-testing/purge]", result);
    return json(result);
  } catch (e) {
    console.error("[pattern-testing/purge] failed", (e as any)?.details?.applicationError ?? e);
    return json({ error: "Purge failed" }, 500);
  }
};
