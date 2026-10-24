// "Forgot or never set a password?" under the login form. Posts the email to this site's
// /api/account/reset-password, which asks Wix to email a link to its own password page. The
// reply is the same whether or not the email has an account (so nobody can probe who's a member).
import { type FormEvent, useEffect, useState } from "react";

export default function ForgotPassword({ initialEmail = "", prompt = false }: { initialEmail?: string; prompt?: boolean }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(initialEmail);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  // Follow what was typed in the login form until this form is opened.
  useEffect(() => {
    if (!open) setEmail(initialEmail);
  }, [initialEmail, open]);

  async function send(event: FormEvent) {
    event.preventDefault();
    setState("sending");
    try {
      const r = await fetch("/api/account/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!r.ok) {
        const body = (await r.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Sorry, that didn't work. Please try again.");
      }
      setState("sent");
    } catch (e) {
      setMessage((e as Error).message);
      setState("error");
    }
  }

  if (!open)
    return (
      <p className={`mt-4 text-sm ${prompt ? "rounded-md bg-blush-soft px-4 py-3" : ""}`}>
        {prompt && "Booked with us before, or never set a password? "}
        <button type="button" onClick={() => setOpen(true)} className="font-semibold underline decoration-blush decoration-2 underline-offset-4">
          {prompt ? "Set your password by email" : "Forgot or never set a password?"}
        </button>
      </p>
    );

  if (state === "sent")
    return (
      <p className="mt-4 rounded-md bg-secondary px-4 py-3 text-sm" role="status">
        If there's an account for <span className="font-semibold">{email}</span>, we've emailed a link to set a new password. Check your inbox (and
        spam), then come back and sign in.
      </p>
    );

  return (
    <form onSubmit={send} className="mt-4 space-y-3 rounded-md bg-secondary p-4" aria-label="Set a new password">
      <p className="text-sm">We'll email you a link to set a new password.</p>
      <label className="block text-sm">
        Email
        <input
          required
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-sm border-[1.5px] border-border bg-background px-4 py-2.5 text-base text-foreground outline-none transition-shadow focus:border-sage focus:ring-2 focus:ring-sage/25"
        />
      </label>
      {state === "error" && <p className="text-sm text-destructive">{message}</p>}
      <div className="flex flex-wrap gap-2">
        <button className="btn" disabled={state === "sending"}>
          {state === "sending" ? "Sending…" : "Email me a link"}
        </button>
        <button type="button" className="link-pill" onClick={() => setOpen(false)}>
          Back
        </button>
      </div>
    </form>
  );
}
