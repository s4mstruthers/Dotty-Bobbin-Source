// SERVER ONLY. Deletes tester applications older than 6 months, as the Privacy Policy promises
// ("Pattern tester applications: deleted automatically 6 months after you apply"). Run monthly
// by the Wix automation "Pattern tester applications: delete after 6 months", which calls
// POST /api/pattern-testing/purge (see that route for the token).
//
// The collection is private (every verb ADMIN), so both calls are elevated. Nothing here takes
// input from the caller except dryRun: the collection and the cut-off are fixed.
//
// docs: https://dev.wix.com/docs/api-reference/business-solutions/cms/data-items/query-data-items.md?apiView=SDK
// docs: https://dev.wix.com/docs/sdk/data-items-sdk/data/items/bulk-remove.md
import { items as itemsModule } from "@wix/data";
import { auth } from "@wix/essentials";
import { TESTER_APPLICATIONS } from "./pattern-tests";

const elevatedQuery = auth.elevate(itemsModule.query as any) as (id: string, req: unknown) => Promise<any>;
const elevatedBulkRemove = auth.elevate(itemsModule.bulkRemove);

export const KEEP_MONTHS = 6;
/** Bulk operations are limited to 1000 items per call. */
const BATCH = 1000;

/** The moment 6 calendar months before `now`: anything created before it goes. */
export function cutoff(now = new Date()): Date {
  const d = new Date(now);
  d.setUTCMonth(d.getUTCMonth() - KEEP_MONTHS);
  return d;
}

export async function purgeOldApplications({ dryRun = false } = {}): Promise<{ cutoff: string; matched: number; removed: number }> {
  const before = cutoff().toISOString();
  const filter = { _createdDate: { $lt: { $date: before } } };
  let matched = 0;
  let removed = 0;
  // Each pass removes what it found, so the next pass starts again from the top. A dry run
  // stops after one page (it only reports).
  for (let pass = 0; pass < 20; pass++) {
    const res = await elevatedQuery(TESTER_APPLICATIONS, { filter, paging: { limit: BATCH, offset: 0 }, fields: ["_id"] });
    const ids: string[] = (res?.items ?? []).map((i: { _id?: string }) => i._id).filter(Boolean);
    matched += ids.length;
    if (!ids.length || dryRun) break;
    const out = (await elevatedBulkRemove(TESTER_APPLICATIONS, ids)) as { removed?: number };
    removed += out?.removed ?? 0;
    if (ids.length < BATCH) break;
  }
  return { cutoff: before, matched, removed };
}
