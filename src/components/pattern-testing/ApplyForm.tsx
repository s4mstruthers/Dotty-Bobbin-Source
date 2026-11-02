// The "apply to test this pattern" form: one island per pattern test page. Posts to
// /api/pattern-testing/apply; the server does the real checks. Styled like the contact and class
// booking forms (same field classes). The size list comes from the pattern test itself, so Saskia
// never edits this file when a new pattern goes up.
import { useRef, useState, type FormEvent } from "react";
import { EXPERIENCE_LEVELS } from "../../wix/pattern-testing/types";

const input =
  "w-full rounded-sm border-[1.5px] border-border bg-background px-4 py-2.5 text-base text-foreground outline-none transition-shadow focus:border-sage focus:ring-2 focus:ring-sage/25 disabled:opacity-60 aria-[invalid=true]:border-destructive";
const heading = "mb-2 block text-xs font-bold uppercase tracking-wider text-sage-deep";
const helpText = "mt-1.5 text-sm text-muted-foreground";

type Props = {
  patternTestId: string;
  patternTitle: string;
  sizes: string[];
  successText: string;
  fallbackEmail: string;
};

export default function ApplyForm({ patternTestId, patternTitle, sizes, successText, fallbackEmail }: Props) {
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const successRef = useRef<HTMLDivElement>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    const form = e.currentTarget;
    const data = new FormData(form);
    const body: Record<string, string> = { patternTestId };
    for (const key of ["name", "email", "size", "measurements", "experience", "instagram", "message", "website"]) {
      body[key] = String(data.get(key) ?? "");
    }
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/pattern-testing/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error || "Sorry, that didn't send. Please try again.");
        return;
      }
      setDone(true);
      setTimeout(() => successRef.current?.focus(), 0);
    } catch {
      setError("Sorry, that didn't send. Please check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div ref={successRef} tabIndex={-1} role="status" className="rounded-lg bg-secondary p-6 outline-none sm:p-8">
        <p className="text-xl text-sage">{successText}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate={false} className="grid gap-5 sm:grid-cols-2" aria-busy={sending}>
      <label className="block">
        <span className={heading}>Your name *</span>
        <input name="name" type="text" required maxLength={120} autoComplete="name" className={input} />
      </label>
      <label className="block">
        <span className={heading}>Email *</span>
        <input name="email" type="email" required maxLength={200} autoComplete="email" className={input} />
      </label>

      {sizes.length > 0 ? (
        <label className="block">
          <span className={heading}>Size you'd sew *</span>
          <select name="size" required defaultValue="" className={input}>
            <option value="" disabled>Choose a size…</option>
            {sizes.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
      ) : (
        <label className="block">
          <span className={heading}>Size you'd sew</span>
          <input name="size" type="text" maxLength={40} className={input} />
        </label>
      )}

      <label className="block">
        <span className={heading}>Sewing experience</span>
        <select name="experience" defaultValue="" className={input}>
          <option value="">Choose…</option>
          {EXPERIENCE_LEVELS.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </label>

      <label className="block sm:col-span-2">
        <span className={heading}>Your measurements</span>
        <input name="measurements" type="text" maxLength={300} placeholder="e.g. bust 96, waist 80, hips 104 cm" className={input} />
        <span className={helpText}>Bust, waist and hips (and height if you like), so I can check the size is right for you.</span>
      </label>

      <label className="block sm:col-span-2">
        <span className={heading}>Instagram (optional)</span>
        <input name="instagram" type="text" maxLength={80} placeholder="@yourname" autoComplete="off" className={input} />
      </label>

      <label className="block sm:col-span-2">
        <span className={heading}>Anything else</span>
        <textarea name="message" rows={5} maxLength={2000} className={`${input} min-h-32 resize-y`} placeholder={`Why you'd like to test ${patternTitle}, what you've sewn before, when you could sew it…`} />
      </label>

      {/* Honeypot: hidden from people, filled in by bots; the server ignores any application that has it. */}
      <div className="hidden" aria-hidden="true">
        <label>
          Website
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive sm:col-span-2">
          {error} You can also email me at <a href={`mailto:${fallbackEmail}`} className="font-semibold underline">{fallbackEmail}</a>.
        </p>
      )}

      <div className="sm:col-span-2">
        <button type="submit" className="btn" disabled={sending}>
          {sending ? "Sending…" : "Send my application"}
        </button>
      </div>
    </form>
  );
}
