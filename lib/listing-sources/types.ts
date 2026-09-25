export interface ScrapeFilters {
  city: string;
  bhk: number;
  rentMin?: number;
  rentMax?: number;
  /** Restrict the search to specific localities; omit for a city-wide search. */
  localities?: string[];
}

export interface ScrapedListing {
  sourceUrl: string;
  title: string;
  locality: string;
  rent: number;
  bhk: number;
  bathrooms: number;
  floor: number;
  hasLift: boolean;
  parking: boolean;
  petFriendly: boolean;
  furnished: "furnished" | "semi" | "unfurnished";
  amenities: string[];
}

/**
 * A pluggable listing source: MagicBricks today, a manual CSV import or a
 * "paste in these URLs" source later. Nothing outside the concrete
 * implementation should know how a given source fetches or parses listings.
 */
export interface ListingSource {
  name: string;
  fetchListings(filters: ScrapeFilters): Promise<ScrapedListing[]>;
}
