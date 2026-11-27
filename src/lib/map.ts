// The studio's map (Contact page, and any event held at the studio). Details are BUSINESS.mapPin,
// mapPlace and mapQuery in src/content/site.ts.
//
// The map and directions go to the house's own pin when it's set (Google doesn't know the name
// Felcote), else to the road and postcode. Directions use Google's documented Maps URLs. With a
// pin, the map is Google's "Embed a map" form (centre, ~1.2 km across, and the Dotty Bobbin
// place marked): the simple ?q=lat,lng embed zooms past the imagery and shows a grey box.
import { BUSINESS } from "../content/site";

type LatLng = { lat: number; lng: number };

const pin = BUSINESS.mapPin;
const target = pin ? `${pin.lat},${pin.lng}` : BUSINESS.mapQuery;
const place = BUSINESS.mapPlace.id ? `!3m3!1m2!1s${encodeURIComponent(BUSINESS.mapPlace.id)}!2s${encodeURIComponent(BUSINESS.mapPlace.name)}` : "";

export const STUDIO_MAP_SRC = pin
  ? `https://www.google.com/maps/embed?pb=!1m${place ? 18 : 14}!1m12!1m3!1d1200!2d${pin.lng}!3d${pin.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1${place}!5e0!3m2!1sen!2suk`
  : `https://www.google.com/maps?q=${encodeURIComponent(target)}&output=embed`;

export const STUDIO_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(target)}`;

/** Metres between two points (haversine). */
function metresBetween(a: LatLng, b: LatLng): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}

/**
 * True when an event's map point is the studio. Wix geocodes an event's address, and "Felden Ln"
 * lands mid-lane, about 450 m from the house (the Christmas retreat, Nov 2026), so anything within
 * a kilometre of the house's pin is taken to be the house itself.
 */
export function isAtStudio(point: LatLng | null | undefined): boolean {
  return !!pin && !!point && metresBetween(pin, point) < 1000;
}
