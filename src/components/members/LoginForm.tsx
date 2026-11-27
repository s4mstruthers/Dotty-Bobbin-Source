// Shipped custom login form — the member signs in on THIS site's page, never on a Wix login page.
// On managed Astro a SUCCESS navigates through Wix's authorization step and returns to `returnTo`
// (the store does that); elsewhere the tokens land in place and this form navigates itself.
// It brings the page's heading, which follows the step: sign in, create an account, enter the code.
import { type FormEvent, useState } from "react";
import { useMember } from "../../hooks/members/useMember";
import { PROFILE_ON_SIGNUP } from "../../wix/members/auth";
import ForgotPassword from "./ForgotPassword";
import { BUSINESS } from "../../content/site";

const HELP_LINK = "font-semibold underline decoration-blush decoration-2 underline-offset-4";

/**
 * For anyone stuck at the email code (26 Nov 2026: an older customer got three codes that all
 * "ran out"): booking never needs an account, so offer the guest route straight back to the class,
 * and Saskia's number.
 */
function StuckHelp({ guestHref }: { guestHref: string | null }) {
  return (
    <div className="mt-6 rounded-md bg-secondary px-4 py-3 text-sm">
      <p className="font-semibold">Having trouble?</p>
      <p className="mt-1">
        {guestHref ? (
          <>
            You don't need an account to book.{" "}
            <a href={guestHref} className={HELP_LINK}>
              Book as a guest
            </a>{" "}
            instead.{" "}
          </>
        ) : (
          <>You don't need an account to book: choose a class and pick &ldquo;Continue as guest&rdquo;. </>
        )}
        Or call or text {BUSINESS.owner.split(" ")[0]} on{" "}
        <a href={`tel:${BUSINESS.phoneIntl}`} className={HELP_LINK}>
          {BUSINESS.phone}
        </a>
        .
      </p>
    </div>
  );
}

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
  const { login, register, verifyEmail, error, clearError, loggedIn, logout } = useMember();
  // Back here after a stale login was cleared (see submit): say why they're signing in again.
  const [signedOutAgain] = useState(() => new URLSearchParams(window.location.search).get("again") === "1");
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

  // Safari set to block all cookies: signing in can't work (the code step is kept in a cookie).
  const [codeExpired, setCodeExpired] = useState(false);
  const [cookiesBlocked] = useState(() => typeof navigator !== "undefined" && navigator.cookieEnabled === false);

  // ?returnTo as a URL on this site, or null. The check is made on the path AFTER the URL is
  // resolved: "/services/..//evil.com" starts like a class page but resolves to the path
  // "//evil.com", which a browser reads as another site (as it does "/\evil.com").
  function wantedUrl(): URL | null {
    const wanted = new URLSearchParams(window.location.search).get("returnTo") ?? "";
    if (!wanted.startsWith("/")) return null;
    try {
      const u = new URL(wanted, window.location.origin);
      if (u.origin !== window.location.origin || /^\/[/\\]/.test(u.pathname)) return null;
      return u;
    } catch {
      return null;
    }
  }

  // The class page they came from, opened for guest booking — only when they came from a class.
  function guestHref(): string | null {
    const u = wantedUrl();
    if (!u || !/^\/(services|portfolio-course-1)\//.test(u.pathname)) return null;
    u.searchParams.set("guest", "1");
    return u.pathname + u.search;
  }

  // Where a SUCCESS lands: ?returnTo when it is a same-site path, else /account. With onSuccess the
  // form stays put on manual auth; on managed Astro the round trip returns to this very page.
  function returnTo(): string {
    const u = wantedUrl();
    if (u) return u.pathname + u.search + u.hash;
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
    setCodeExpired(false);
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
      // Wix's login route says "already signed in" whenever the browser still holds a member login,
      // even one Wix has since revoked or expired, which the rest of the site reads as logged out.
      // Without this the member is stuck: "Log in" everywhere, "already signed in" here, and no Log
      // out button. Really signed in (another tab): carry on. Stale: clear it, come back, sign in.
      if (result.state === "FAILURE" && result.errorCode === "ALREADY_LOGGED_IN") {
        leaving = true;
        clearError();
        if (loggedIn) window.location.assign(returnTo());
        else await logout(`/login?${new URLSearchParams({ returnTo: returnTo(), again: "1" })}`);
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
    let leaving = false;
    try {
      const result = await verifyEmail(code);
      // The code step was lost (over 15 minutes, or the browser didn't keep it): back to the first
      // form with the email kept and the explanation showing, so one tap gets a fresh code.
      if (result.state === "FAILURE" && result.errorCode === "VERIFICATION_STATE_EXPIRED") {
        setVerification(false);
        setCode("");
        setPassword("");
        setMode("login"); // an account made at sign-up already exists: signing in sends the new code
        setCodeExpired(true);
        return;
      }
      if (result.state === "SUCCESS" && result.redirectUrl) {
        leaving = true; // navigating to Wix and back: keep the button disabled (a second tap re-sent the code)
        return;
      }
      if (result.state === "SUCCESS") done();
      if (result.state === "OWNER_APPROVAL_REQUIRED") setPending(true);
    } finally {
      if (!leaving) setBusy(false);
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
        <p className="-mt-3 mb-6 rounded-md bg-blush-soft px-4 py-3 text-sm">
          <span className="font-semibold">The code works for 15 minutes.</span> Keep this page open while you check your email, then come back here. If you asked for more
          than one, use the newest email.
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
        <StuckHelp guestHref={guestHref()} />
      </>
    );
  }
  // Sign-up said the account exists, or sign-in failed: offer the password email prominently.
  const needsPassword = Boolean(error) && !codeExpired && (mode === "login" || /already exists/i.test(error ?? ""));
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
    {signedOutAgain && !error && (
      <p className="mb-5 rounded-md bg-blush-soft px-4 py-3 text-sm" role="status">
        Your last sign-in had run out, so we've signed you out. Please sign in again.
      </p>
    )}
    {cookiesBlocked && (
      <p className="mb-5 rounded-md bg-blush-soft px-4 py-3 text-sm" role="alert">
        <span className="font-semibold">This browser is blocking cookies,</span> so signing in won't work here. You can still book as a guest, or turn cookies back on
        (on an iPhone: Settings › Safari › untick &ldquo;Block All Cookies&rdquo;).
      </p>
    )}
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
    {(cookiesBlocked || codeExpired) && <StuckHelp guestHref={guestHref()} />}
    </>
  );
}
