// The home page's Google reviews: the rating, the count and up to 5 reviews from /api/google-reviews,
// drawn in the site's own style. Mount client:visible, so Google is only asked (and billed) when a
// visitor actually scrolls here. Anything short of reviews (not set up yet, Google's daily cap
// reached, a failed read) leaves just the link to the reviews on Google.
// Google's display rules (Places API policies): each review keeps its author's photo, name and
// profile link and a link to it on Google Maps, the section says how the reviews were picked, and
// "Google Maps" is credited in Roboto, grey, unwrapped and untranslated.
import { useEffect, useState } from "react";

interface Review {
  rating: number;
  text: string;
  when: string;
  uri: string | null;
  author: string;
  authorUri: string | null;
  photo: string | null;
}
interface Data {
  rating: number | null;
  count: number;
  mapsUri: string | null;
  reviews: Review[];
}

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex text-primary" aria-label={`${value} out of 5 stars`} role="img">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill={i <= Math.round(value) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" strokeLinejoin="round" />
        </svg>
      ))}
    </span>
  );
}

const GOOGLE_MAPS_CREDIT = (
  <span translate="no" className="whitespace-nowrap text-sm text-[#5E5E5E]" style={{ fontFamily: "Roboto, Arial, sans-serif", fontWeight: 400 }}>
    Google Maps
  </span>
);

export default function GoogleReviews({ title, fallbackUrl }: { title: string; fallbackUrl: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/google-reviews")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Data | null) => setData(d))
      .catch(() => setData(null))
      .finally(() => setDone(true));
  }, []);

  const reviewsUrl = data?.mapsUri ?? fallbackUrl;
  const link = (
    <a href={reviewsUrl} target="_blank" rel="noopener" className="link-pill">
      Read all our reviews on Google
    </a>
  );

  if (!done) {
    return <div className="h-48 animate-pulse rounded-lg bg-secondary" aria-hidden="true" />;
  }

  if (!data || data.reviews.length === 0) {
    return (
      <div className="text-center">
        <h2 className="text-3xl text-sage sm:text-4xl">{title}</h2>
        <div className="mt-6 flex justify-center">{link}</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-background p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl text-sage sm:text-4xl">{title}</h2>
          {data.rating !== null && (
            <p className="mt-2 flex flex-wrap items-center gap-2 text-lg">
              <span className="font-semibold">{data.rating.toFixed(1)}</span>
              <Stars value={data.rating} size={20} />
              <span className="text-muted-foreground">
                from {data.count} review{data.count === 1 ? "" : "s"} on {GOOGLE_MAPS_CREDIT}
              </span>
            </p>
          )}
        </div>
        {link}
      </div>

      <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.reviews.map((r, i) => (
          <li key={i} className="flex flex-col rounded-lg bg-secondary p-5">
            <div className="flex items-center gap-3">
              {r.photo ? (
                <img src={r.photo} alt="" width={40} height={40} loading="lazy" referrerPolicy="no-referrer" className="h-10 w-10 rounded-full" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blush font-semibold" aria-hidden="true">
                  {r.author.charAt(0)}
                </span>
              )}
              <div className="min-w-0">
                {r.authorUri ? (
                  <a href={r.authorUri} target="_blank" rel="noopener" className="block truncate font-semibold text-foreground">
                    {r.author}
                  </a>
                ) : (
                  <span className="block truncate font-semibold">{r.author}</span>
                )}
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Stars value={r.rating} size={14} />
                  {r.when}
                </span>
              </div>
            </div>
            <p className="mt-3 line-clamp-6 whitespace-pre-line">{r.text}</p>
            {r.uri && (
              <a href={r.uri} target="_blank" rel="noopener" className="mt-auto pt-3 text-sm">
                View on Google Maps
              </a>
            )}
          </li>
        ))}
      </ul>

      <p className="mt-4 text-sm text-muted-foreground">
        The reviews Google rates most relevant, from {GOOGLE_MAPS_CREDIT}.
      </p>
    </div>
  );
}
