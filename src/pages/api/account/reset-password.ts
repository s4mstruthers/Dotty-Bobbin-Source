// POST /api/account/reset-password { email } — "Forgot or never set a password?"
//
// Sends Wix's own password-reset email (Headless Recovery: Send Recovery Email). The link opens a
// Wix-hosted page where the member sets a new password, then returns them to /login. This covers
// members who never had a password too (for example an account made for them before this site).
//
// The kit's members guide points to a built-in /api/auth/reset-password route, but @wix/astro
// 3.0.0 / 3.1.0 don't ship one (their auth routes: login, signup, verify-email, logout, callback),
// so this route calls the documented SDK method instead.
// docs: https://dev.wix.com/docs/api-reference/business-management/headless/recovery/send-recovery-email.md
//
// The answer is the same whether or not the email belongs to a member, so the form can't be used
// to find out who has an account. The email only ever goes to the address typed in.
import type { APIRoute } from "astro";
import { recovery } from "@wix/identity";
import { auth } from "@wix/essentials";
import { WIX_MEMBERS_CLIENT_ID } from "../../../wix/config";

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: APIRoute = async ({ request, url }) => {
  let email = "";
  try {
    email = String(((await request.json()) as { email?: unknown }).email ?? "").trim();
  } catch {
    return json({ error: "Expected JSON." }, 400);
  }
  if (!EMAIL.test(email) || email.length > 320) return json({ error: "Enter a valid email address." }, 400);

  const options = { redirect: { url: `${url.origin}/login`, ...(WIX_MEMBERS_CLIENT_ID ? { clientId: WIX_MEMBERS_CLIENT_ID } : {}) } } as any;
  try {
    await recovery.sendRecoveryEmail(email, options);
  } catch (e) {
    const status = (e as any)?.details?.httpStatus ?? (e as any)?.response?.status ?? (e as any)?.status;
    const code = (e as any)?.details?.applicationError?.code ?? (e as Error)?.message;
    if (status === 401 || status === 403 || /permission|unauthori|forbidden/i.test(String(code))) {
      // The visitor identity may not be allowed to send it; the site can. Safe to elevate: the only
      // effect is a reset email to the address that was typed in, and the reply never says more.
      try {
        await auth.elevate(recovery.sendRecoveryEmail)(email, options);
      } catch (e2) {
        console.error("[account] recovery email failed (elevated)", (e2 as any)?.details?.applicationError?.code ?? (e2 as Error)?.message);
      }
    } else {
      // Unknown emails also land here; log for the owner, answer the visitor the same either way.
      console.error("[account] recovery email failed", code);
    }
  }
  return json({ ok: true });
};
