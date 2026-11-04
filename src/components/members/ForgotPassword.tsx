// "Forgot or never set a password?" under the login form. Posts the email to this site's
// /api/account/reset-password, which asks Wix to email a link to its own password page. The
// reply is the same whether or not the email has an account (so nobody can probe who's a member).
// Wix sends nothing when there is no account, and logins from the old booking site didn't move
// across, so both the failed-login prompt and the "sent" message point those people to sign-up.
import { type FormEvent, useEffect, useState } from "react";

export interface ForgotPasswordProps {
  initialEmail?: string;
  prompt?: boolean;
  /** Moves the login form to sign-up with this email. Left out when sign-up is already showing. */
  onCreateAccount?: (email: string) => void;
}

const LINK = "font-semibold underline decoration-blush decoration-2 underline-offset-4";

export default function ForgotPassword({ initialEmail = "", prompt = false, onCreateAccount }: ForgotPasswordProps) {
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

  if (!open) {
    if (prompt && onCreateAccount)
      return (
        <div className="mt-4 space-y-2 rounded-md bg-blush-soft px-4 py-3 text-sm">
          <p>
            <span className="font-semibold">No account on this website yet?</span> Logins from our old booking site didn't move across, even if you've booked
            with us before.{" "}
            <button type="button" onClick={() => onCreateAccount(email)} className={LINK}>
              Create an account
            </button>{" "}
            with the email you book with.
          </p>
          <p>
            Already have one?{" "}
            <button type="button" onClick={() => setOpen(true)} className={LINK}>
              Set a new password by email
            </button>
          </p>
        </div>
      );
    return (
      <p className={`mt-4 text-sm ${prompt ? "rounded-md bg-blush-soft px-4 py-3" : ""}`}>
        <button type="button" onClick={() => setOpen(true)} className={LINK}>
          {prompt ? "Set your password by email" : "Forgot or never set a password?"}
        </button>
      </p>
    );
  }

  if (state === "sent")
    return (
      <div className="mt-4 space-y-2 rounded-md bg-secondary px-4 py-3 text-sm" role="status">
        <p>
          If there's an account for <span className="font-semibold">{email}</span>, we've emailed a link to set a new password. Check your inbox (and
          spam), then come back and sign in.
        </p>
        {onCreateAccount && (
          <p>
            <span className="font-semibold">Nothing after a few minutes?</span> You may not have an account on this website yet, as logins from our old
            booking site didn't move across.{" "}
            <button type="button" onClick={() => onCreateAccount(email)} className={LINK}>
              Create an account
            </button>
          </p>
        )}
      </div>
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
