// The colours of each season's decorations (garland, snow, snowflakes, the strip above the menu),
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
  /** Polka-dot snow, in turn. */
  snow: string[];
  /** A faint ring round each snow dot, so pale dots still show on a pale page. */
  snowRing: string;
  /** The two stitched snowflakes beside the bird. */
  flakes: [string, string];
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
    snowRing: "",
    flakes: ["text-gold", "text-holly/70"],
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
    snowRing: "ring-1 ring-steel/25",
    flakes: ["text-steel/80", "text-ice"],
    strip: "bg-midnight text-white",
    stripAccent: "text-ice-light",
    stripUnderline: "decoration-ice-light",
    themeColor: "#1f3b57",
  },
};
