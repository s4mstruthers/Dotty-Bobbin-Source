// Authentication rules — transport-agnostic, imported by EVERY transport: ./auth.ts (the SDK's
// OAuthStrategy, or the managed-Astro built-in auth routes) and the REST twin in
// templates/members/rest/auth.ts (the IAM authentication API over fetch). What a login/registration
// response MEANS — the four states, when a session token is expected, which Wix error code is which
// failure — lives HERE, once. No imports: a strip to JS emits a plain module.

/** The four outcomes every credential operation resolves to; the shipped LoginForm renders each. */
export type LoginState = "SUCCESS" | "EMAIL_VERIFICATION_REQUIRED" | "OWNER_APPROVAL_REQUIRED" | "FAILURE";

export interface LoginResult {
  state: LoginState;
  /** Continues an EMAIL_VERIFICATION_REQUIRED flow (the transport keeps it too — verifyMemberEmail needs no argument). */
  stateToken?: string;
  /** A stable name for a FAILURE: invalidPassword, invalidEmail, emailAlreadyExists, resetPassword, missingCaptchaToken, invalidCaptchaToken. */
  errorCode?: string;
  /** Wix's message for a FAILURE — render it. */
  error?: string;
  /**
   * Managed Astro only: a SUCCESS is not a session yet — the browser must navigate here (the Wix
   * authorization step), which returns through /api/auth/callback and lands on the requested page.
   */
  redirectUrl?: string;
}

/** A raw login/register/verify response as either transport returns it. */
export type RawAuth = Record<string, any>;

/** A LoginResult plus the one-shot session token a SUCCESS carries (5-minute life; exchanged, never shown). */
export interface AuthOutcome extends LoginResult {
  sessionToken: string | null;
}

// REST spells the states differently from the SDK; both map onto LoginState.
const REST_STATES: Record<string, LoginState> = {
  SUCCESS: "SUCCESS",
  REQUIRE_EMAIL_VERIFICATION: "EMAIL_VERIFICATION_REQUIRED",
  REQUIRE_OWNER_APPROVAL: "OWNER_APPROVAL_REQUIRED",
};

/**
 * Normalize either transport's response — SDK `{ loginState, data: { sessionToken | stateToken },
 * error?, errorCode? }` or REST `{ state, sessionToken?, stateToken? }`. Anything else is a FAILURE.
 */
export function authOutcome(raw: RawAuth | null | undefined): AuthOutcome {
  const state: LoginState = raw?.loginState ?? REST_STATES[raw?.state ?? ""] ?? "FAILURE";
  const stateToken: string | undefined = raw?.stateToken ?? raw?.data?.stateToken;
  return {
    state,
    sessionToken: raw?.data?.sessionToken ?? raw?.sessionToken ?? null,
    ...(stateToken ? { stateToken } : {}),
    ...(raw?.errorCode ? { errorCode: raw.errorCode } : {}),
    ...(raw?.error ? { error: raw.error } : {}),
  };
}

/** The outcome as callers see it — without the session token, which the transport has consumed. */
export function toLoginResult({ sessionToken: _consumed, ...result }: AuthOutcome): LoginResult {
  return result;
}

export function failure(error: string, errorCode?: string): LoginResult {
  return { state: "FAILURE", error, ...(errorCode ? { errorCode } : {}) };
}

// What customers read. They are not technical: no "Wix", no status codes, and always a next step.
/** Something failed on the site's side (or the network): nothing the customer typed was wrong. */
export const OUR_SIDE_ERROR = "Something went wrong on our side. Please try again, or get in touch.";
/** The credentials were not accepted, for whatever reason Wix gives. */
export const CHECK_DETAILS_ERROR = "That didn't work. Check your email and password, or set a new password by email below.";

/** A SUCCESS without a session token — the exchange can't run; surfaced as a FAILURE with this text. */
export const NO_SESSION_ERROR = OUR_SIDE_ERROR;

// The built-in auth routes' request-level error codes (body `{ error }`), in the words a form can show.
const AUTH_ROUTE_ERRORS: Record<string, string> = {
  ALREADY_LOGGED_IN: "You're already signed in.",
  AUTH_SERVICE_ERROR: OUR_SIDE_ERROR,
  VERIFICATION_FAILED: "That code didn't match. Check the email and try again.",
  VERIFICATION_STATE_EXPIRED: "That code has run out. Use a different email, or sign in again to get a new code.",
  INVALID_REQUEST: CHECK_DETAILS_ERROR,
  FORBIDDEN: OUR_SIDE_ERROR,
};

/**
 * A managed-Astro auth route answer → LoginResult. Success: `{ loginState: "SUCCESS", redirectUrl }`
 * (200). Challenges: `{ loginState }` with 403 — verification and owner approval pass through; a
 * CAPTCHA challenge (the site owner turned reCAPTCHA on) is a FAILURE the form cannot clear without
 * a widget. Failure: `{ loginState: "FAILURE", errorCode }` (422, or 403 for resetPassword). Request
 * errors: `{ error: CODE }` without a loginState.
 */
export function fromAuthRoute(status: number, body: RawAuth | null): LoginResult {
  const loginState: string | undefined = body?.loginState;
  switch (loginState) {
    case "SUCCESS":
      return body?.redirectUrl ? { state: "SUCCESS", redirectUrl: body.redirectUrl } : failure(NO_SESSION_ERROR);
    case "EMAIL_VERIFICATION_REQUIRED":
    case "OWNER_APPROVAL_REQUIRED":
      return { state: loginState };
    case "SILENT_CAPTCHA_REQUIRED":
    case "USER_CAPTCHA_REQUIRED":
      // The owner turned reCAPTCHA on; the form has no CAPTCHA widget yet (errorCode says so).
      return failure(OUR_SIDE_ERROR, "captchaRequired");
    case "FAILURE":
      // Our wording first when we know the code; Wix's own text can be technical.
      return failure(FAILURE_TEXT[body?.errorCode ?? ""] ?? body?.error ?? CHECK_DETAILS_ERROR, body?.errorCode ?? "unknown");
    default: {
      // No route at all (errorCode authRoutesMissing): the project's @wix/astro predates the
      // built-in credential routes (2.75) and needs updating.
      if (status === 404 || status === 405) return failure(OUR_SIDE_ERROR, "authRoutesMissing");
      const code: string | undefined = body?.error;
      return failure(AUTH_ROUTE_ERRORS[code ?? ""] ?? OUR_SIDE_ERROR, code);
    }
  }
}

/** Default wording per errorCode when the route sends none (the SDK sends none either). */
// (A failed login with an unrecognised code is named invalidEmail, so that one stays general.)
// LoginForm looks for "already exists" to offer the password email: keep those words.
const FAILURE_TEXT: Record<string, string> = {
  invalidCredentials: CHECK_DETAILS_ERROR,
  invalidEmail: CHECK_DETAILS_ERROR,
  invalidPassword: "That password isn't right. Try again, or set a new password by email below.",
  emailAlreadyExists: "An account with this email already exists. Sign in instead, or set a password by email below if you've never had one.",
  resetPassword: "You need to set a new password before signing in. Use the link below to get one by email.",
  missingCaptchaToken: OUR_SIDE_ERROR,
  invalidCaptchaToken: OUR_SIDE_ERROR,
};

/** The words to show for a FAILURE from either transport: ours for a known code, else Wix's, else general. */
export function failureText(result: Pick<LoginResult, "error" | "errorCode">): string {
  return FAILURE_TEXT[result.errorCode ?? ""] ?? result.error ?? CHECK_DETAILS_ERROR;
}

// Wix IAM application-error codes, named as the SDK names them.
export const AUTH_ERROR_CODES = {
  MISSING_CAPTCHA: "-19971",
  INVALID_CAPTCHA: "-19970",
  EMAIL_EXISTS: "-19995",
  INVALID_PASSWORD: "-19976",
  RESET_PASSWORD: "-19973",
} as const;

/** A failed login's applicationError code → the SDK's errorCode name (anything unrecognized is `invalidEmail`, as the SDK does). */
export function loginErrorCode(code: string | undefined): string {
  switch (code) {
    case AUTH_ERROR_CODES.MISSING_CAPTCHA:
      return "missingCaptchaToken";
    case AUTH_ERROR_CODES.INVALID_CAPTCHA:
      return "invalidCaptchaToken";
    case AUTH_ERROR_CODES.INVALID_PASSWORD:
      return "invalidPassword";
    case AUTH_ERROR_CODES.RESET_PASSWORD:
      return "resetPassword";
    default:
      return "invalidEmail";
  }
}

/**
 * A failed registration's applicationError code (+ the response `details`) → the SDK's errorCode
 * name; undefined when the SDK would name none. A validation error on the EMAIL field is `invalidEmail`.
 */
export function registerErrorCode(code: string | undefined, details?: RawAuth): string | undefined {
  const violations: RawAuth[] = details?.validationError?.fieldViolations ?? [];
  if (violations.some((v) => v?.data?.type === "EMAIL")) return "invalidEmail";
  switch (code) {
    case AUTH_ERROR_CODES.MISSING_CAPTCHA:
      return "missingCaptchaToken";
    case AUTH_ERROR_CODES.EMAIL_EXISTS:
      return "emailAlreadyExists";
    case AUTH_ERROR_CODES.INVALID_CAPTCHA:
      return "invalidCaptchaToken";
    default:
      return undefined;
  }
}
