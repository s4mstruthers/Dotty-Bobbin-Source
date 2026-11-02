// Pattern testing — the DTOs the page and the apply form share. The content lives in two CMS
// collections Saskia edits in the Wix dashboard (CMS › Pattern tests, CMS › Tester applications);
// the schema is seed/pattern-testing.plan.json.

/** One call for testers, as the page shows it (fields flat, dates as ISO strings, photo as an https URL or ""). */
export interface PatternTest {
  id: string;
  title: string;
  /** The page address: the dashboard's slug, falling back to the item id so a call without one still has a page. */
  slug: string;
  open: boolean;
  photo: string;
  summary: string;
  /** The rich-text field's stored HTML — rendered with set:html on a wrapper, never as text. */
  detailsHtml: string;
  sizes: string[];
  skillLevel: string;
  /** ISO string, "" when Saskia hasn't set one. */
  deadlineIso: string;
}

/** What the apply form sends to POST /api/pattern-testing/apply. */
export interface ApplicationInput {
  patternTestId: string;
  name: string;
  email: string;
  size: string;
  measurements: string;
  experience: string;
  instagram: string;
  message: string;
  /** Honeypot: a hidden field people never fill in; a bot that does is quietly ignored. */
  website?: string;
}

export const EXPERIENCE_LEVELS = ["Beginner", "Improver", "Confident", "Experienced"] as const;

/** The status every new application is filed under; Saskia moves it on in the dashboard. */
export const APPLICATION_STATUS_NEW = "New";
export const APPLICATION_STATUSES = ["New", "Chosen", "Pattern sent", "Feedback received", "Done", "Not this time"] as const;
