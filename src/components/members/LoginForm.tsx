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

/** The show/hide password eye; struck through while the password is showing (click hides it). */
function EyeIcon({ crossed }: { crossed: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {crossed && <path d="M4 4l16 16" />}
    </svg>
  );
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const { login, register, verifyEmail, error, clearError } = useMember();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    // Only this site: "/\\evil.com" starts with "/" but browsers read it as another site.
    if (wanted?.startsWith("/")) {
      try {
        const u = new URL(wanted, window.location.origin);
        if (u.origin === window.location.origin) return u.pathname + u.search + u.hash;
      } catch {}
    }
    return onSuccess ? window.location.pathname + window.location.search : "/account";
  }

  function done() {
    if (onSuccess) return onSuccess();
    window.location.assign(returnTo());
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setShowPassword(false); // so the browser still offers to save the password
    let leaving = false;
    try {
      const options = { returnTo: returnTo() };
      const result =
        mode === "login"
          ? await login(email, password, options)
          : await register(email, password, PROFILE_ON_SIGNUP ? { firstName, lastName } : undefined, options);
      if (result.state === "SUCCESS" && result.redirectUrl) {
        leaving = true; // navigating to Wix and back: keep the button disabled
        return;
      }
      if (result.state === "SUCCESS") done();
      if (result.state === "EMAIL_VERIFICATION_REQUIRED") setVerification(true);
      if (result.state === "OWNER_APPROVAL_REQUIRED") setPending(true);
    } finally {
      if (!leaving) setBusy(false);
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

  // From the "no account yet?" prompts: sign-up with the email they tried, and not the old password.
  function createAccount(withEmail: string) {
    setEmail(withEmail);
    setPassword("");
    switchMode("register");
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
      <div className="text-sm">
        <label htmlFor="login-password">Password</label>
        <div className="relative mt-1">
          <input
            id="login-password"
            required
            type={showPassword ? "text" : "password"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-sm border-[1.5px] border-border bg-background py-2.5 pl-4 pr-12 text-base text-foreground outline-none transition-shadow focus:border-sage focus:ring-2 focus:ring-sage/25"
          />
          {/* Show what was typed, to catch a typo before signing in. */}
          <button
            type="button"
            onClick={() => setShowPassword((on) => !on)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            aria-controls="login-password"
            title={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/25"
          >
            <EyeIcon crossed={showPassword} />
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      <button
        disabled={busy}
        className="btn"
      >
        {busy ? "Working…" : mode === "login" ? "Sign in" : "Create account"}
      </button>
    </form>
    <ForgotPassword key={mode} initialEmail={email} prompt={needsPassword} onCreateAccount={mode === "login" ? createAccount : undefined} />
    </>
  );
}
