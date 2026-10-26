// GET /api/google-reviews — Dotty Bobbin's Google rating and up to 5 reviews (the ones Google rates
// most relevant), read live from Google's Places API (New) Place Details with GOOGLE_PLACES_API_KEY
// (set on Wix's servers with `wix env set`) and BUSINESS.googlePlaceId. The home page's reviews
// section asks for it when a visitor scrolls to it (src/components/GoogleReviews.tsx).
//
// Google's terms allow storing the place ID only, so nothing here is cached: each call is one
// billed Place Details (Enterprise + Atmosphere) request. The key's daily quota in Google Cloud
// caps the cost; past it Google refuses and the section shows just the link to the reviews.
import type { APIRoute } from "astro";
import { GOOGLE_PLACES_API_KEY } from "astro:env/server";
import { BUSINESS } from "../../content/site";

export const prerender = false;

// Request and field names from https://developers.google.com/maps/documentation/places/web-service/place-details
// and the Place resource reference (Review, AuthorAttribution, LocalizedText).
const FIELDS = "rating,userRatingCount,googleMapsUri,reviews";

interface PlaceReview {
  rating?: number;
  text?: { text?: string };
  relativePublishTimeDescription?: string;
  googleMapsUri?: string;
  authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export const GET: APIRoute = async () => {
  if (!GOOGLE_PLACES_API_KEY || !BUSINESS.googlePlaceId) return json({ error: "not-configured" }, 503);
  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(BUSINESS.googlePlaceId)}?languageCode=en`,
      { headers: { "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY, "X-Goog-FieldMask": FIELDS } },
    );
    if (!res.ok) return json({ error: "unavailable" }, 502);
    const place = (await res.json()) as {
      rating?: number;
      userRatingCount?: number;
      googleMapsUri?: string;
      reviews?: PlaceReview[];
    };
    return json({
      rating: place.rating ?? null,
      count: place.userRatingCount ?? 0,
      mapsUri: place.googleMapsUri ?? null,
      reviews: (place.reviews ?? [])
        .filter((r) => r.text?.text)
        .map((r) => ({
          rating: r.rating ?? 0,
          text: r.text!.text!,
          when: r.relativePublishTimeDescription ?? "",
          uri: r.googleMapsUri ?? null,
          author: r.authorAttribution?.displayName ?? "A Google user",
          authorUri: r.authorAttribution?.uri ?? null,
          photo: r.authorAttribution?.photoUri ?? null,
        })),
    });
  } catch {
    return json({ error: "unavailable" }, 502);
  }
};
