// What each holiday look hangs on the page, and in which colours (Tailwind classes on the fixed
// colours in src/styles/global.css): the garland, what drifts past the bird, the stitched motifs
// and the strip above the menu. The page colours themselves change in global.css
// (html[data-season=…]); these are the ornaments.
import type { Season } from "../../lib/season";

export interface SeasonDecor {
  /** What hangs on the garland: sewing buttons, or painted eggs. Their colours, in turn. */
  ornament: "button" | "egg";
  buttons: string[];
  thread: string;
  /** The cross stitch through a button's holes, or the zigzag painted round an egg; then the same
   *  colour as a fill, for the dots painted on an egg. */
  stitch: string;
  stitchFill: string;
  pins: string;
  /** What drifts past the bird, in turn: polka-dot snow, blossom petals that twirl as they fall,
   *  or little bats that flap their way up. Dots and petals take bg-* classes; bats text-*. */
  snow: string[];
  snowShape: "dot" | "petal" | "bat";
  /** A faint ring round each dot or petal, so pale ones still show on a pale page. */
  snowRing: string;
  /** The cross-stitch motif (in the strip and beside the bird), its two colours beside the bird,
   *  and the colour of a flower's centre or a pumpkin's stalk. */
  motif: "snowflake" | "flower" | "pumpkin";
  flakes: [string, string];
  motifCentre: string;
  /** The strip above the menu: background and text, then its motifs, stitching and link underline. */
  strip: string;
  stripAccent: string;
  stripUnderline: string;
  /** The browser bar colour on phones (matches the strip). */
  themeColor: string;
}

export const DECOR: Record<Season, SeasonDecor> = {
  christmas: {
    ornament: "button",
    buttons: ["fill-berry", "fill-holly", "fill-gold", "fill-dotty", "fill-snow", "fill-berry", "fill-holly"],
    thread: "stroke-berry",
    stitch: "stroke-snow",
    stitchFill: "fill-snow",
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
  easter: {
    ornament: "egg",
    buttons: ["fill-blossom", "fill-primrose", "fill-sky", "fill-lilac", "fill-leaf", "fill-dotty", "fill-primrose"],
    thread: "stroke-leaf",
    stitch: "stroke-white",
    stitchFill: "fill-white",
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
  halloween: {
    ornament: "button",
    buttons: ["fill-pumpkin", "fill-plum", "fill-ink", "fill-lime", "fill-white", "fill-pumpkin", "fill-plum"],
    thread: "stroke-night",
    stitch: "stroke-white",
    stitchFill: "fill-white",
    pins: "fill-pumpkin",
    snow: ["text-night/75", "text-plum/70", "text-ink/60"],
    snowShape: "bat",
    snowRing: "",
    motif: "pumpkin",
    flakes: ["text-pumpkin", "text-pumpkin/80"],
    motifCentre: "text-leaf",
    strip: "bg-night text-white",
    stripAccent: "text-pumpkin",
    stripUnderline: "decoration-pumpkin",
    themeColor: "#2a1b3d",
  },
};
