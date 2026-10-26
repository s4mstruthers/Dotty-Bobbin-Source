// Header account control, on the shipped useMember hook (session state lives in the shipped
// store — never copied here). Visitor → "Log in"; member → their initial/photo linking to
// /account (log out lives on the account page). Mount client:only="react".
// variant="menu" is the same control as a row of the mobile menu: "Log in" or "My account".
import { useMember } from "../hooks/members/useMember";

export default function AccountLink({ variant = "header" }: { variant?: "header" | "menu" }) {
  const { member, loggedIn, loading } = useMember();

  if (variant === "menu") {
    // While the session read settles it says "My account" (which asks a visitor to log in anyway).
    const href = loading || loggedIn ? "/account" : "/login";
    const current = typeof window !== "undefined" && window.location.pathname === href;
    return (
      <a
        href={href}
        aria-current={current ? "page" : undefined}
        className={`block rounded-md px-4 py-3 font-semibold no-underline ${current ? "bg-secondary text-sage-deep" : "hover:bg-secondary"}`}
      >
        {href === "/login" ? "Log in" : "My account"}
      </a>
    );
  }

  // While the session read settles: a quiet placeholder, never a flash of "Log in".
  if (loading) {
    return <span className="inline-block h-9 w-9 animate-pulse rounded-full bg-secondary" aria-hidden="true" />;
  }

  if (!loggedIn) {
    return (
      <a
        href="/login"
        aria-label="Log in"
        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-control px-2 py-1.5 text-sm font-semibold text-foreground no-underline transition-colors hover:text-sage-deep"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" strokeLinecap="round" />
        </svg>
        <span className="hidden sm:inline">Log in</span>
      </a>
    );
  }

  const name = member?.displayName ?? "My account";
  return (
    <a href="/account" aria-label="My account" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground no-underline" title="My account">
      {member?.photoUrl ? (
        <img src={member.photoUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blush font-display text-sm font-bold text-primary-foreground" aria-hidden="true">
          {name.slice(0, 1).toUpperCase()}
        </span>
      )}
      <span className="sr-only">My account</span>
    </a>
  );
}
