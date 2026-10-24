// POST /api/account/booking — cancel or move one of the caller's own bookings.
// Body: { action: "cancel", bookingId } or { action: "reschedule", bookingId, slot }.
// The server re-reads the booking within the caller's own scope and only acts when Wix's own
// policy allows the change (see changeBooking in src/wix/account/server.ts).
import type { APIRoute } from "astro";
import { AccountError, changeBooking, currentCaller } from "../../../wix/account/server";
import type { BookingActionRequest } from "../../../wix/account/types";

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store" } });

export const POST: APIRoute = async ({ request }) => {
  const caller = await currentCaller();
  if (!caller) return json({ error: "Log in to change a booking." }, 401);

  let body: BookingActionRequest;
  try {
    body = (await request.json()) as BookingActionRequest;
  } catch {
    return json({ error: "Expected JSON." }, 400);
  }
  if (!body || (body.action !== "cancel" && body.action !== "reschedule")) return json({ error: "Unknown action." }, 400);

  try {
    await changeBooking(caller, body);
    return json({ ok: true });
  } catch (e) {
    if (e instanceof AccountError) return json({ error: e.message }, e.status);
    // Wix's own refusals (time no longer free, policy window passed) come back as errors too.
    const details = (e as any)?.details?.applicationError ?? {};
    console.error("[account] booking change failed", details.code ?? e);
    const message =
      details.code === "BOOKING_POLICY_VIOLATION"
        ? "That change isn't allowed this close to the class. Please get in touch."
        : /availab|capacity|full/i.test(String(details.code ?? details.description ?? ""))
          ? "Sorry, that time has just been taken. Please pick another."
          : "Sorry, that didn't work. Please try again or get in touch.";
    return json({ error: message }, 409);
  }
};
