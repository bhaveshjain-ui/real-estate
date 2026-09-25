/**
 * Run locally with `npm run scrape` - NOT inside a Vercel function.
 * Fetches Pune 3BHK rental listings from MagicBricks and upserts them into
 * Supabase by source_url. Rate-limited, identifies itself with a clear User
 * -Agent, and fails gracefully: if the site blocks the request or the
 * markup doesn't parse, it logs a warning and exits without touching
 * existing data.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config(); // fall back to .env if present

import { createClient } from "@supabase/supabase-js";
import { magicBricksSource } from "../lib/listing-sources/magicbricks";
import { PUNE_LOCALITIES } from "../lib/types";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error(
      "[scrape-magicbricks] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (set them in .env.local)"
    );
    process.exit(1);
  }

  const supabase = createClient(url, key);

  console.log("[scrape-magicbricks] starting...");

  const listings = await magicBricksSource.fetchListings({
    city: "Pune",
    bhk: 3,
    localities: [...PUNE_LOCALITIES],
  });

  if (listings.length === 0) {
    console.warn(
      "[scrape-magicbricks] no listings parsed from any locality - the site likely needs a JS-capable fetch or its markup changed. Existing data left untouched."
    );
    return;
  }

  console.log(`[scrape-magicbricks] parsed ${listings.length} listings, upserting...`);

  let succeeded = 0;
  for (const listing of listings) {
    const { error } = await supabase.from("listings").upsert(
      {
        source: "magicbricks",
        source_url: listing.sourceUrl,
        title: listing.title,
        locality: listing.locality,
        rent: listing.rent,
        bhk: listing.bhk,
        bathrooms: listing.bathrooms,
        floor: listing.floor,
        has_lift: listing.hasLift,
        parking: listing.parking,
        pet_friendly: listing.petFriendly,
        furnished: listing.furnished,
        amenities: listing.amenities,
        scraped_at: new Date().toISOString(),
      },
      { onConflict: "source_url" }
    );

    if (error) {
      console.error(
        `[scrape-magicbricks] failed to upsert ${listing.sourceUrl}: ${error.message}`
      );
    } else {
      succeeded++;
    }
  }

  console.log(
    `[scrape-magicbricks] done: ${succeeded}/${listings.length} listings upserted.`
  );
}

main().catch((err) => {
  console.error("[scrape-magicbricks] unexpected error, exiting:", err);
  process.exit(1);
});
