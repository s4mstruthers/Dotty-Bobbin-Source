// REFERENCE gate for member-only surfaces on the REACT stack — on Astro, gate server-side
// in frontmatter instead (pages/account.astro shows the shape); a client-side check there
// flashes gated UI. Renders children only for a logged-in member; a visitor gets a login
// prompt in place (routing-free — no router or redirect assumptions).
import type { ReactNode } from "react";
import { useMember } from "../../hooks/members/useMember";

export interface RequireAuthProps {
  children: ReactNode;
  /** Rendered for an anonymous visitor instead of the default login prompt. */
  fallback?: ReactNode;
}

export default function RequireAuth({ children, fallback }: RequireAuthProps) {
  const { loggedIn, loading } = useMember();

  // Wait for the initial session read — deciding early bounces a logged-in member on first paint.
  if (loading) {
    return (
      <div className="py-16 text-center text-muted-foreground" aria-busy="true">
        Loading…
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <>
        {fallback ?? (
          <div className="mx-auto max-w-md rounded-lg border border-border p-8 text-center">
            <p className="text-lg">Log in to see your classes, tickets and orders.</p>
            <p className="mt-1 text-sm text-muted-foreground">New here? You can create an account on the next page.</p>
            <a href={`/login?returnTo=${encodeURIComponent(window.location.pathname)}`} className="btn mt-6">
              Log in
            </a>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}
