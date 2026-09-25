export const PUNE_LOCALITIES = [
  "Hinjewadi",
  "Baner",
  "Wakad",
  "Aundh",
  "Kothrud",
  "Viman Nagar",
  "Kharadi",
  "Hadapsar",
  "Magarpatta",
  "Koregaon Park",
  "Shivajinagar",
  "Pimple Saudagar",
  "Balewadi",
  "Bavdhan",
  "Karve Nagar",
  "Kalyani Nagar",
  "Yerwada",
  "Warje",
  "Pashan",
  "Deccan",
] as const;

export type Locality = (typeof PUNE_LOCALITIES)[number];

export type FurnishedStatus = "furnished" | "semi" | "unfurnished";

export type PreferenceWeight = "low" | "medium" | "high";

/** Attributes that can appear as a preference (nice-to-have). */
export type PreferenceAttribute =
  | "lift"
  | "parking"
  | "petFriendly"
  | "furnished"
  | "balcony"
  | "gatedSociety"
  | "nearMetro"
  | "powerBackup";

export interface CommuteAnchor {
  label: string; // e.g. "Office - Hinjewadi"
  locality: Locality;
  maxMinutes: number;
}

export interface HardConstraints {
  maxRent: number; // her max monthly contribution, INR
  excludedLocalities: Locality[];
  commuteAnchors: CommuteAnchor[]; // up to 2
  requireLift: boolean;
  requireParking: boolean;
  minBathrooms: number;
  requirePetFriendly: boolean;
  requiredFurnished: FurnishedStatus | null; // null = no requirement
}

export interface Preference {
  attribute: PreferenceAttribute;
  weight: PreferenceWeight;
}

export interface MemberResponse {
  memberId: string;
  name: string;
  hardConstraints: HardConstraints;
  preferences: Preference[];
}

export interface Listing {
  id: string;
  source: string;
  sourceUrl: string;
  title: string;
  locality: Locality;
  rent: number;
  bhk: number;
  bathrooms: number;
  floor: number;
  hasLift: boolean;
  parking: boolean;
  petFriendly: boolean;
  furnished: FurnishedStatus;
  amenities: string[];
  scrapedAt: string;
}
