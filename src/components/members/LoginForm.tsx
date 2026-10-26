// Shipped custom login form — the member signs in on THIS site's page, never on a Wix login page.
// On managed Astro a SUCCESS navigates through Wix's authorization step and returns to `returnTo`
// (the store does that); elsewhere the tokens land in place and this form navigates itself.
// It brings the page's heading, which follows the step: sign in, create an account, enter the code.
import { type FormEvent, useState } from "react";
import { useMember } from "../../hooks/members/useMember";
import { PROFILE_ON_SIGNUP } from "../../wix/members/auth";
import ForgotPassword from "./ForgotPassword";

export interface LoginFormProps {
  onSuccess?: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const { login, register, verifyEmail, error, clearError } = useMember();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [code, setCode] = useState("");
  const [verification, setVerification] = useState(false);
  const [pending, setPending] = useState(false);
  const [busy, setBusy] = useState(false);

  // Where a SUCCESS lands: ?returnTo when it is a same-site path, else /account. With onSuccess the
  // form stays put on manual auth; on managed Astro the round trip returns to this very page.
  function returnTo(): string {
    const wanted = new URLSearchParams(window.location.search).get("returnTo");
    if (wanted?.startsWith("/") && !wanted.startsWith("//")) return wanted;
    return onSuccess ? window.location.pathname + window.location.search : "/account";
  }

  function done() {
    if (onSuccess) return onSuccess();
    window.location.assign(returnTo());
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const options = { returnTo: returnTo() };
      const result =
        mode === "login"
          ? await login(email, password, options)
          : await register(email, password, PROFILE_ON_SIGNUP ? { firstName, lastName } : undefined, options);
      if (result.state === "SUCCESS" && result.redirectUrl) return; // navigating to Wix and back
      if (result.state === "SUCCESS") done();
      if (result.state === "EMAIL_VERIFICATION_REQUIRED") setVerification(true);
      if (result.state === "OWNER_APPROVAL_REQUIRED") setPending(true);
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await verifyEmail(code);
      if (result.state === "SUCCESS" && result.redirectUrl) return; // navigating to Wix and back
      if (result.state === "SUCCESS") done();
      if (result.state === "OWNER_APPROVAL_REQUIRED") setPending(true);
    } finally {
      setBusy(false);
    }
  }

  function switchMode(next: "login" | "register") {
    setMode(next);
    clearError();
  }

  // Back from the code step to the first form, to start again with another address.
  function differentEmail() {
    setVerification(false);
    setCode("");
    clearError();
  }

  if (pending)
    return (
      <div role="status">
        <h1 className="text-3xl text-sage">Nearly there</h1>
        <p className="mt-3">Thanks for signing up. Your account needs approving before you can sign in.</p>
        <p className="mt-3 text-sm text-muted-foreground">
          If you need anything in the meantime, please{" "}
          <a href="/contact" className="font-semibold underline decoration-blush decoration-2 underline-offset-4">
            get in touch
          </a>
          .
        </p>
      </div>
    );
  if (verification) {
    return (
      <>
        <h1 className="text-3xl text-sage">Check your email</h1>
        <p className="mb-6 mt-2 text-muted-foreground">
          We've emailed a code to <span className="font-semibold text-foreground">{email}</span>. Type it in below. If it hasn't arrived, check your spam folder.
        </p>
        <form onSubmit={submitCode} className="space-y-4">
          <label className="block text-sm">
            Code from the email
            <input
              required
              autoComplete="one-time-code"
              inputMode="numeric"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="mt-1 w-full rounded-sm border-[1.5px] border-border bg-background px-4 py-2.5 text-base text-foreground outline-none transition-shadow focus:border-sage focus:ring-2 focus:ring-sage/25"
            />
          </label>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <button disabled={busy} className="btn">
              {busy ? "Checking…" : "Confirm"}
            </button>
            <button type="button" onClick={differentEmail} className="text-sm font-semibold underline decoration-blush decoration-2 underline-offset-4">
              Use a different email
            </button>
          </div>
        </form>
      </>
    );
  }
  // Sign-up said the account exists, or sign-in failed: offer the password email prominently.
  const needsPassword = Boolean(error) && (mode === "login" || /already exists/i.test(error ?? ""));
  const tab = (on: boolean) =>
    `rounded-control px-3 py-2 text-sm font-semibold transition-colors ${on ? "bg-background text-sage-deep shadow-sm" : "text-muted-foreground hover:text-foreground"}`;
  return (
    <>
    <h1 className="text-3xl text-sage">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
    <p className="mb-6 mt-2 text-muted-foreground">
      {mode === "login"
        ? "Sign in to see your classes, tickets and orders."
        : "Use the email address you book with, so your classes and orders all appear in one place."}
    </p>
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-1 rounded-control bg-secondary p-1" role="group" aria-label="Sign in or create an account">
        <button type="button" aria-pressed={mode === "login"} onClick={() => switchMode("login")} className={tab(mode === "login")}>
          I have an account
        </button>
        <button type="button" aria-pressed={mode === "register"} onClick={() => switchMode("register")} className={tab(mode === "register")}>
          I'm new here
        </button>
      </div>
      {mode === "register" && PROFILE_ON_SIGNUP && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            First name
            <input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className="mt-1 w-full rounded-sm border-[1.5px] border-border bg-background px-4 py-2.5 text-base text-foreground outline-none transition-shadow focus:border-sage focus:ring-2 focus:ring-sage/25"
            />
          </label>
          <label className="text-sm">
            Last name
            <input
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className="mt-1 w-full rounded-sm border-[1.5px] border-border bg-background px-4 py-2.5 text-base text-foreground outline-none transition-shadow focus:border-sage focus:ring-2 focus:ring-sage/25"
            />
          </label>
        </div>
      )}
      <label className="block text-sm">
        Email
        <input
          required
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 w-full rounded-sm border-[1.5px] border-border bg-background px-4 py-2.5 text-base text-foreground outline-none transition-shadow focus:border-sage focus:ring-2 focus:ring-sage/25"
        />
      </label>
      <label className="block text-sm">
        Password
        <input
          required
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1 w-full rounded-sm border-[1.5px] border-border bg-background px-4 py-2.5 text-base text-foreground outline-none transition-shadow focus:border-sage focus:ring-2 focus:ring-sage/25"
        />
      </label>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      <button
        disabled={busy}
        className="btn"
      >
        {busy ? "Working…" : mode === "login" ? "Sign in" : "Create account"}
      </button>
    </form>
    <ForgotPassword initialEmail={email} prompt={needsPassword} />
    </>
  );
}
