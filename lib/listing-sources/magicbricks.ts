import * as cheerio from "cheerio";
import { ListingSource, ScrapeFilters, ScrapedListing } from "./types";

/**
 * Path patterns disallowed for `User-agent: *` per
 * https://www.magicbricks.com/robots.txt (checked 2026-09-25). Re-check
 * this file periodically - robots.txt can change independently of this
 * scraper.
 */
const DISALLOWED_PATH_PATTERNS: RegExp[] = [
  /\/trapscript\//,
  /\/maintenance\//,
  /\/admin\//,
  /\/profile\//,
  /\/images\//,
  /\/property\//, // distinct from /property-for-rent/ and /propertyDetails/, both allowed
  /\/propertyDetails\/map-of-/,
  /proptype=/,
  /\/property-for-sale\/ALL-RESIDENTIAL-by-/,
  /\/property-for-sale\/real-estate-agent-broker-/,
  /\/propertyDetails\/viewProject/,
  /\/featuredagent\//,
  /\/templates\/static\//,
  /\/property-agent-details/,
  /\/bricks\//,
  /\/compare-projects-/,
  /\/property-for-rent\/Hostel-/,
  /\/hi-in\/propertyDetails\//,
];

function assertAllowedByRobots(url: string) {
  const { pathname, search } = new URL(url);
  const pathAndQuery = pathname + search;
  for (const pattern of DISALLOWED_PATH_PATTERNS) {
    if (pattern.test(pathAndQuery)) {
      throw new Error(
        `Refusing to fetch ${url}: matches a robots.txt Disallow rule (${pattern})`
      );
    }
  }
}

const USER_AGENT =
  process.env.SCRAPER_USER_AGENT ??
  "FlatMatchAssignmentBot/1.0 (+educational school assignment; respects robots.txt)";

const RATE_LIMIT_MS = Number(process.env.SCRAPER_RATE_LIMIT_MS ?? 2000);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Best-effort MagicBricks rent search URL. Deliberately avoids the
 * `proptype=` query param and the `/property/` path prefix, both disallowed
 * for all bots in robots.txt. MagicBricks' exact URL/markup structure
 * changes over time and the site renders results client-side in practice,
 * so treat this as a starting point to verify against a live search, not a
 * guaranteed-working scraper.
 */
function buildSearchUrl(filters: ScrapeFilters, locality?: string): string {
  const params = new URLSearchParams({
    bedroom: String(filters.bhk),
    cityName: filters.city,
  });
  if (locality) params.set("locality", locality);
  if (filters.rentMin) params.set("budgetMin", String(filters.rentMin));
  if (filters.rentMax) params.set("budgetMax", String(filters.rentMax));
  return `https://www.magicbricks.com/property-for-rent/residential-real-estate?${params.toString()}`;
}

function parseRent(text: string): number | null {
  const cleaned = text.replace(/[₹,]/g, "").trim();
  if (/lac/i.test(cleaned)) {
    const num = parseFloat(cleaned);
    return Number.isFinite(num) ? Math.round(num * 100000) : null;
  }
  const num = parseInt(cleaned, 10);
  return Number.isFinite(num) ? num : null;
}

/**
 * Parses a MagicBricks search results page. Selectors are best-effort
 * guesses at the real markup - if the site returns a JS-rendered shell (very
 * likely with a plain fetch, since it's a client-rendered SPA) this will
 * simply find zero cards, which the caller treats as "could not parse" and
 * skips without touching the database.
 */
function parseSearchResultsPage(html: string): ScrapedListing[] {
  const $ = cheerio.load(html);
  const listings: ScrapedListing[] = [];

  $(".mb-srp__card").each((_, el) => {
    try {
      const card = $(el);
      const title = card.find(".mb-srp__card--title").text().trim();
      const href = card.find("a.mb-srp__card--title").attr("href");
      const rent = parseRent(card.find(".mb-srp__card__price--amount").text());
      const locality = card.find(".mb-srp__card__ads--locality").text().trim();

      if (!title || !href || !rent) return;

      listings.push({
        sourceUrl: href.startsWith("http")
          ? href
          : `https://www.magicbricks.com${href}`,
        title,
        locality: locality || "Unknown",
        rent,
        bhk: 3,
        // Search cards rarely expose bathroom/floor/amenity detail; these
        // conservative defaults are meant to be corrected via the admin
        // "add listing manually" page, not treated as scraped fact.
        bathrooms: 2,
        floor: 1,
        hasLift: false,
        parking: false,
        petFriendly: false,
        furnished: "unfurnished",
        amenities: [],
      });
    } catch {
      // one malformed card should not abort the whole page
    }
  });

  return listings;
}

async function fetchListings(filters: ScrapeFilters): Promise<ScrapedListing[]> {
  const localities = filters.localities?.length ? filters.localities : [undefined];
  const results: ScrapedListing[] = [];

  for (const locality of localities) {
    const url = buildSearchUrl(filters, locality);

    try {
      assertAllowedByRobots(url);
    } catch (err) {
      console.error(`[magicbricks] ${(err as Error).message}`);
      continue;
    }

    await sleep(RATE_LIMIT_MS);

    let html: string;
    try {
      const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (!res.ok) {
        console.warn(`[magicbricks] ${url} returned HTTP ${res.status}, skipping`);
        continue;
      }
      html = await res.text();
    } catch (err) {
      console.warn(`[magicbricks] failed to fetch ${url}: ${err}`);
      continue;
    }

    const parsed = parseSearchResultsPage(html);
    if (parsed.length === 0) {
      console.warn(
        `[magicbricks] no listings parsed from ${url} - markup may have changed, or the page needs JS to render. Skipping without touching existing data.`
      );
    }
    results.push(...parsed);
  }

  return results;
}

export const magicBricksSource: ListingSource = {
  name: "magicbricks",
  fetchListings,
};
