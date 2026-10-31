import { NextResponse } from "next/server";

// Sansho Ramen, Mårtenstorget 1, Lund (same listing as cid=1650844808977529973)
const PLACE_ID = "ChIJJWesZRWXU0YRdTxncpv66BY";

export const revalidate = 86400;

type Review = { author: string; rating: number; text: string; when: string };

// Snapshot from Google Maps 2026-10-31, used when GOOGLE_PLACES_API_KEY isn't set or the API fails.
const FALLBACK = {
  rating: 4.8,
  count: 31,
  fiveStar: 27 as number | null,
  reviews: [
    { author: "Elias D.", rating: 5, text: "Banger food, not spicey even for a swede", when: "October 2026" },
    { author: "Oscar F.", rating: 5, text: "Absolutely incredible place, the tastes are so exquisite and rich. Haven't tasted a place in Sweden or the Nordics that even comes close. The most enthusiastic and passionate owners, super cool place. Can't recommend it enough.", when: "October 2026" },
    { author: "Nachi V.", rating: 5, text: "Loved the attention to detail and care that goes into each bowl. Their spicy tantanmen ramen has a cloudy and gently creamy broth which blends beautifully with the chili oil.", when: "October 2026" },
  ] as Review[],
};

export async function GET() {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return NextResponse.json({ placeId: PLACE_ID, ...FALLBACK });

  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${PLACE_ID}?languageCode=en`, {
      headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "rating,userRatingCount,reviews" },
      next: { revalidate },
    });
    if (!res.ok) throw new Error(`Places API ${res.status}`);
    const data = await res.json();
    const reviews: Review[] = (data.reviews ?? [])
      .filter((r: any) => r.rating >= 4 && r.text?.text)
      .slice(0, 3)
      .map((r: any) => ({
        author: r.authorAttribution?.displayName ?? "Google user",
        rating: r.rating,
        text: r.text.text,
        when: r.relativePublishTimeDescription ?? "",
      }));
    return NextResponse.json({
      placeId: PLACE_ID,
      rating: data.rating ?? FALLBACK.rating,
      count: data.userRatingCount ?? FALLBACK.count,
      // The Places API doesn't expose the star distribution
      fiveStar: null,
      reviews: reviews.length ? reviews : FALLBACK.reviews,
    });
  } catch (e) {
    console.error("google-reviews", e);
    return NextResponse.json({ placeId: PLACE_ID, ...FALLBACK });
  }
}
