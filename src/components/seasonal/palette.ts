// The colours of each season's decorations (garland, snow or petals, stitched motifs, the strip above the menu),
// as Tailwind classes on the fixed colours in src/styles/global.css. The page colours themselves
// change in global.css (html[data-season=…]); these are the ornaments.
import type { Season } from "../../lib/season";

export interface SeasonDecor {
  /** Garland buttons, in turn along the thread. */
  buttons: string[];
  thread: string;
  /** The cross stitch through each button's holes. */
  stitch: string;
  pins: string;
  /** What falls beside the bird, in turn: polka-dot snow, or blossom petals that twirl as they fall. */
  snow: string[];
  snowShape: "dot" | "petal";
  /** A faint ring round each snow dot, so pale dots still show on a pale page. */
  snowRing: string;
  /** The cross-stitch motif (in the strip and beside the bird), its two colours beside the bird, and a flower's centre. */
  motif: "snowflake" | "flower";
  flakes: [string, string];
  motifCentre: string;
  /** The strip above the menu: background and text, then its snowflakes, stitching and link underline. */
  strip: string;
  stripAccent: string;
  stripUnderline: string;
  /** The browser bar colour on phones (matches the strip). */
  themeColor: string;
}

export const DECOR: Record<Season, SeasonDecor> = {
  christmas: {
    buttons: ["fill-berry", "fill-holly", "fill-gold", "fill-dotty", "fill-snow", "fill-berry", "fill-holly"],
    thread: "stroke-berry",
    stitch: "stroke-snow",
    pins: "fill-gold",
    snow: ["bg-berry/45", "bg-gold/70", "bg-holly/40", "bg-dotty/50"],
    snowShape: "dot",
    snowRing: "",
    motif: "snowflake",
    flakes: ["text-gold", "text-holly/70"],
    motifCentre: "",
    strip: "bg-pine text-snow",
    stripAccent: "text-gold",
    stripUnderline: "decoration-gold",
    themeColor: "#22513a",
  },
  winter: {
    buttons: ["fill-navy", "fill-ice", "fill-white", "fill-dotty", "fill-silver", "fill-navy", "fill-ice"],
    thread: "stroke-steel",
    stitch: "stroke-dotty",
    pins: "fill-silver",
    snow: ["bg-white", "bg-ice/70", "bg-white", "bg-dotty/40"],
    snowShape: "dot",
    snowRing: "ring-1 ring-steel/25",
    motif: "snowflake",
    flakes: ["text-steel/80", "text-ice"],
    motifCentre: "",
    strip: "bg-midnight text-white",
    stripAccent: "text-ice-light",
    stripUnderline: "decoration-ice-light",
    themeColor: "#1f3b57",
  },
  spring: {
    buttons: ["fill-dotty", "fill-primrose", "fill-leaf", "fill-lilac", "fill-white", "fill-sky", "fill-dotty"],
    thread: "stroke-leaf",
    stitch: "stroke-white",
    pins: "fill-primrose",
    snow: ["bg-blossom", "bg-white", "bg-dotty/45", "bg-blossom", "bg-primrose/70"],
    snowShape: "petal",
    snowRing: "ring-1 ring-dotty/25",
    motif: "flower",
    flakes: ["text-dotty", "text-lilac"],
    motifCentre: "text-primrose",
    strip: "bg-blossom text-ink",
    stripAccent: "text-dotty",
    stripUnderline: "decoration-dotty",
    themeColor: "#fbd3dd",
  },
};
