// Public reads of the "Pattern tests" collection (read: ANYONE), through the kit's shipped CMS data
// layer. Visitors see only calls whose "Open for applications" box is ticked; a call's page is
// reachable by its slug, or by its id when Saskia left the slug empty.
import { getItemById, queryItems } from "../cms/items";
import type { CmsItem } from "../cms/types";
import type { PatternTest } from "./types";

export const PATTERN_TESTS = "patternTests";
export const TESTER_APPLICATIONS = "testerApplications";

const text = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/** A tags field arrives as string[]; a size list typed as "8, 10, 12" into a text field still works. */
function toSizes(v: unknown): string[] {
  const raw = Array.isArray(v) ? v : typeof v === "string" ? v.split(/[,\n]/) : [];
  return [...new Set(raw.map((s) => String(s).trim()).filter(Boolean))];
}

export function toPatternTest(item: CmsItem): PatternTest {
  return {
    id: item._id,
    title: text(item.title) || "Pattern test",
    slug: text(item.slug) || item._id,
    open: item.open === true,
    photo: text(item.photo),
    summary: text(item.summary),
    detailsHtml: typeof item.details === "string" ? item.details : "",
    sizes: toSizes(item.sizes),
    skillLevel: text(item.skillLevel),
    deadlineIso: text(item.deadline),
  };
}

/** Every call that is open for applications, newest first. */
export async function listOpenPatternTests(): Promise<PatternTest[]> {
  const page = await queryItems(PATTERN_TESTS, {
    filters: [{ field: "open", op: "eq", value: true }],
    sort: [{ field: "_createdDate", direction: "desc" }],
    limit: 50,
  });
  return page.items.map(toPatternTest);
}

/** One call by its slug (the dashboard field) or, failing that, by its id. Null when neither matches. */
export async function getPatternTest(slugOrId: string): Promise<PatternTest | null> {
  const bySlug = await queryItems(PATTERN_TESTS, { filters: [{ field: "slug", op: "eq", value: slugOrId }], limit: 1 });
  if (bySlug.items[0]) return toPatternTest(bySlug.items[0]);
  if (!/^[0-9a-f-]{36}$/i.test(slugOrId)) return null;
  try {
    const item = await getItemById(PATTERN_TESTS, slugOrId);
    return item ? toPatternTest(item) : null;
  } catch {
    return null;
  }
}
