// Uncropped ("fit") image URLs for Wix media — an addition beside the kit's media.ts, which
// only produces "fill" (cropped-to-box) URLs.
//
// Why: product and gallery images come in mixed shapes (square product photos, 16:9 folder
// mock-ups, portrait class photos). A fill URL crops them server-side to the box, cutting off the
// sides of wide images. A fit URL scales the whole image down to fit inside the box, so nothing is
// cut off; the tile then shows it with `object-contain` on a soft background.
//
// The URL is built by the Wix SDK's own helper (media.getScaledToFitImageUrl), never by hand.
// The identifier is passed without origin dimensions: the SDK then emits a plain `/v1/fit/` URL
// (with dimensions it switches to a fill crop).
import { media } from "@wix/sdk";
import { mediaKey } from "./media";

type MediaLike = Parameters<typeof mediaKey>[0];

/** A browser-loadable URL of the whole image, scaled to fit inside width × height ("" when absent). */
export function imgFitSrc(value: MediaLike, width = 640, height = 640): string {
  const key = mediaKey(value);
  if (!key) return "";
  // Only Wix media files (id like `abc_123~mv2.png`) go through the scaler; anything else is returned as-is.
  if (!/~mv2\.[a-z0-9]+$/i.test(key)) return typeof value === "string" ? value : "";
  try {
    return media.getScaledToFitImageUrl(`wix:image://v1/${key}/${key}`, width, height, {});
  } catch {
    return "";
  }
}

/**
 * Everything an <img> needs to show a Wix image uncropped, responsive:
 *   <img {...imgFitAttrs(p.imageUrl, "(min-width: 1024px) 25vw, 50vw")} class="object-contain" />
 * Returns an empty object when there is no image (render a placeholder then).
 *
 * `eager`: load straight away instead of when scrolled near — for the main photo at the top of
 * a page (lazy-loading it makes the page open on an empty box), and for photos inside CSS
 * `columns`, where Chromium never starts lazy images at all.
 */
export function imgFitAttrs(
  value: MediaLike,
  sizes: string,
  widths: number[] = [320, 480, 640, 960, 1280],
  { eager = false }: { eager?: boolean } = {},
): { src: string; srcSet: string; sizes: string; loading: "lazy" | "eager"; decoding: "async"; fetchpriority?: "high" } | Record<string, never> {
  const src = imgFitSrc(value, 640, 640);
  if (!src) return {};
  const srcSet = widths.map((w) => `${imgFitSrc(value, w, w)} ${w}w`).join(", ");
  return eager ? { src, srcSet, sizes, loading: "eager", decoding: "async" } : { src, srcSet, sizes, loading: "lazy", decoding: "async" };
}

/** The same, for the one main photo at the top of a page: loaded first, at high priority. */
export function heroFitAttrs(value: MediaLike, sizes: string): ReturnType<typeof imgFitAttrs> {
  const src = imgFitSrc(value, 640, 640);
  if (!src) return {};
  const srcSet = [320, 480, 640, 960, 1280].map((w) => `${imgFitSrc(value, w, w)} ${w}w`).join(", ");
  return { src, srcSet, sizes, loading: "eager", decoding: "async", fetchpriority: "high" };
}
