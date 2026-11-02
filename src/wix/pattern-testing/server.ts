// SERVER ONLY. Files one tester application into the "Tester applications" collection.
//
// Why a server module: that collection is private (every verb ADMIN) so Saskia's applicants are
// never readable from a browser, which means the insert must be elevated. Following the kit's
// CUSTOM_OPERATIONS.md pattern, the API route validates the exact input here first, re-reads the
// pattern test on the server (open? size offered?) and only then elevates the ONE SDK call, with
// field values the server composed. The browser never chooses a collection or a status.
//
// docs: https://dev.wix.com/docs/api-reference/business-solutions/cms/data-items/insert-data-item?apiView=SDK
import { items as itemsModule } from "@wix/data";
import { auth } from "@wix/essentials";
import { PATTERN_TESTS, TESTER_APPLICATIONS, toPatternTest } from "./pattern-tests";
import { getItemById } from "../cms/items";
import { APPLICATION_STATUS_NEW, EXPERIENCE_LEVELS, type ApplicationInput } from "./types";

const elevatedInsert = auth.elevate(itemsModule.insert);

export class ApplicationError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/** The request body as a clean ApplicationInput, or a 400 naming the first problem. */
export function validateApplication(body: unknown): ApplicationInput {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const input: ApplicationInput = {
    patternTestId: str(b.patternTestId, 64),
    name: str(b.name, 120),
    email: str(b.email, 200).toLowerCase(),
    size: str(b.size, 40),
    measurements: str(b.measurements, 300),
    experience: str(b.experience, 40),
    instagram: str(b.instagram, 80).replace(/^@/, ""),
    message: str(b.message, 2000),
    website: str(b.website, 200),
  };
  if (!input.patternTestId) throw new ApplicationError("Which pattern is this for?");
  if (!input.name) throw new ApplicationError("Please tell me your name.");
  if (!EMAIL.test(input.email)) throw new ApplicationError("Please check your email address.");
  if (input.experience && !(EXPERIENCE_LEVELS as readonly string[]).includes(input.experience)) {
    throw new ApplicationError("Please pick your sewing experience from the list.");
  }
  return input;
}

/**
 * File the application. Returns the new row's id. A honeypot hit returns a fake id and writes
 * nothing, so a bot sees the same thank-you as a person.
 */
export async function submitApplication(input: ApplicationInput): Promise<{ id: string }> {
  if (input.website) return { id: "ignored" };

  let raw;
  try {
    raw = await getItemById(PATTERN_TESTS, input.patternTestId);
  } catch {
    raw = null;
  }
  if (!raw) throw new ApplicationError("That pattern test isn't here any more.", 404);
  const test = toPatternTest(raw);
  if (!test.open) throw new ApplicationError("Applications for this pattern have closed.", 409);
  if (test.sizes.length) {
    if (!input.size) throw new ApplicationError("Please choose the size you'd sew.");
    if (!test.sizes.includes(input.size)) throw new ApplicationError("Please choose one of the sizes offered.");
  }

  // The SDK types the item as `{ _id?: string }`; the collection's fields ride flat beside it.
  const row: Record<string, unknown> = {
    name: input.name,
    email: input.email,
    patternName: test.title,
    pattern: test.id,
    size: input.size,
    measurements: input.measurements,
    experience: input.experience,
    instagram: input.instagram,
    message: input.message,
    status: APPLICATION_STATUS_NEW,
  };
  const created = (await elevatedInsert(TESTER_APPLICATIONS, row as { _id?: string })) as { _id?: string };
  return { id: created?._id ?? "" };
}
