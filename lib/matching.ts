import { getCommuteMinutes } from "./commute";
import {
  HardConstraints,
  Listing,
  MemberResponse,
  PreferenceAttribute,
  PreferenceWeight,
} from "./types";

export const PREFERENCE_WEIGHT_VALUES: Record<PreferenceWeight, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

export const PREFERENCE_LABELS: Record<PreferenceAttribute, string> = {
  lift: "Lift",
  parking: "Parking",
  petFriendly: "Pet-friendly",
  furnished: "Furnished",
  balcony: "Balcony",
  gatedSociety: "Gated society",
  nearMetro: "Near metro",
  powerBackup: "Power backup",
};

export interface Violation {
  memberId: string;
  name: string;
  description: string;
}

export interface RentBreakdown {
  equalShare: number;
  equalFeasible: boolean;
  usesUnequalSplit: boolean;
  perMemberShare: Record<string, number>;
}

export interface PersonBreakdown {
  memberId: string;
  name: string;
  gets: string[];
  compromises: string[];
  preferenceScore: number; // 0..1, weighted preference satisfaction
  rentShare: number;
  rentMax: number;
}

export interface ListingMatch {
  listing: Listing;
  perPerson: PersonBreakdown[];
  combinedScore: number; // average preferenceScore across members, 0..1
  minPersonScore: number; // lowest individual preferenceScore, used as a balance tiebreaker
  rent: RentBreakdown;
}

export interface NearMiss {
  listing: Listing;
  violation: Violation;
}

export interface MatchResult {
  matches: ListingMatch[];
  nearMisses: NearMiss[];
}

export interface MatchOptions {
  /** Max number of full matches to return, ranked best first. */
  maxMatches?: number;
  /** Only surface near-misses when fewer full matches than this survive. */
  minMatchesForNearMiss?: number;
}

function round(n: number): number {
  return Math.round(n);
}

function preferenceSatisfied(
  attribute: PreferenceAttribute,
  listing: Listing
): boolean {
  switch (attribute) {
    case "lift":
      return listing.hasLift;
    case "parking":
      return listing.parking;
    case "petFriendly":
      return listing.petFriendly;
    case "furnished":
      return listing.furnished !== "unfurnished";
    case "balcony":
      return listing.amenities.some((a) => a.toLowerCase().includes("balcony"));
    case "gatedSociety":
      return listing.amenities.some((a) => a.toLowerCase().includes("gated"));
    case "nearMetro":
      return listing.amenities.some((a) => a.toLowerCase().includes("metro"));
    case "powerBackup":
      return listing.amenities.some((a) =>
        a.toLowerCase().replace("-", " ").includes("power backup")
      );
  }
}

/** Hard-constraint checks that exclude a listing outright, excluding rent (handled separately). */
function evaluateHardConstraints(
  listing: Listing,
  member: MemberResponse
): Violation[] {
  const violations: Violation[] = [];
  const hc: HardConstraints = member.hardConstraints;
  const { memberId, name } = member;

  if (hc.excludedLocalities.includes(listing.locality)) {
    violations.push({
      memberId,
      name,
      description: `${listing.locality} is on ${name}'s excluded list`,
    });
  }

  for (const anchor of hc.commuteAnchors) {
    const minutes = getCommuteMinutes(listing.locality, anchor.locality);
    if (minutes > anchor.maxMinutes) {
      violations.push({
        memberId,
        name,
        description: `${minutes} min commute to ${anchor.label} exceeds ${name}'s ${anchor.maxMinutes} min limit`,
      });
    }
  }

  if (hc.requireLift && !listing.hasLift && listing.floor > 1) {
    violations.push({
      memberId,
      name,
      description: `Floor ${listing.floor} with no lift, but ${name} needs a lift or a ground/1st-floor unit`,
    });
  }

  if (hc.requireParking && !listing.parking) {
    violations.push({
      memberId,
      name,
      description: `No parking, but parking is a hard requirement for ${name}`,
    });
  }

  if (listing.bathrooms < hc.minBathrooms) {
    violations.push({
      memberId,
      name,
      description: `Only ${listing.bathrooms} bathroom(s), ${name} needs at least ${hc.minBathrooms}`,
    });
  }

  if (hc.requirePetFriendly && !listing.petFriendly) {
    violations.push({
      memberId,
      name,
      description: `Not pet-friendly, but ${name} requires pet-friendly`,
    });
  }

  if (hc.requiredFurnished && listing.furnished !== hc.requiredFurnished) {
    violations.push({
      memberId,
      name,
      description: `${listing.furnished} does not meet ${name}'s ${hc.requiredFurnished} requirement`,
    });
  }

  return violations;
}

/**
 * Rent: default to an equal split. If that breaks someone's budget, check
 * whether an unequal split (each person paying up to, but never over, her
 * own max, proportional to her max) can cover the rent. Only if even that
 * fails does rent become a hard-constraint violation.
 */
function evaluateRent(
  listing: Listing,
  members: MemberResponse[]
): RentBreakdown & { violation: Violation | null } {
  const n = members.length;
  const equalShare = listing.rent / n;
  const equalFeasible = members.every(
    (m) => equalShare <= m.hardConstraints.maxRent
  );

  if (equalFeasible) {
    const perMemberShare = Object.fromEntries(
      members.map((m) => [m.memberId, round(equalShare)])
    );
    return {
      equalShare,
      equalFeasible: true,
      usesUnequalSplit: false,
      perMemberShare,
      violation: null,
    };
  }

  const sumMax = members.reduce((s, m) => s + m.hardConstraints.maxRent, 0);

  if (sumMax >= listing.rent) {
    const perMemberShare = Object.fromEntries(
      members.map((m) => [
        m.memberId,
        round(listing.rent * (m.hardConstraints.maxRent / sumMax)),
      ])
    );
    return {
      equalShare,
      equalFeasible: false,
      usesUnequalSplit: true,
      perMemberShare,
      violation: null,
    };
  }

  const tightest = members.reduce((min, m) =>
    m.hardConstraints.maxRent < min.hardConstraints.maxRent ? m : min
  );
  const perMemberShare = Object.fromEntries(
    members.map((m) => [m.memberId, round(equalShare)])
  );

  return {
    equalShare,
    equalFeasible: false,
    usesUnequalSplit: false,
    perMemberShare,
    violation: {
      memberId: tightest.memberId,
      name: tightest.name,
      description: `Combined budgets (₹${sumMax}) fall short of rent ₹${listing.rent} even with an unequal split`,
    },
  };
}

function buildPersonBreakdown(
  listing: Listing,
  member: MemberResponse,
  rent: RentBreakdown
): PersonBreakdown {
  const gets: string[] = [];
  const compromises: string[] = [];

  for (const anchor of member.hardConstraints.commuteAnchors) {
    const minutes = getCommuteMinutes(listing.locality, anchor.locality);
    gets.push(
      `${anchor.label}: ~${minutes} min commute (her limit ${anchor.maxMinutes} min)`
    );
  }

  let earned = 0;
  let possible = 0;
  for (const pref of member.preferences) {
    const weight = PREFERENCE_WEIGHT_VALUES[pref.weight];
    possible += weight;
    const label = PREFERENCE_LABELS[pref.attribute];
    if (preferenceSatisfied(pref.attribute, listing)) {
      earned += weight;
      gets.push(label);
    } else {
      compromises.push(`No ${label.toLowerCase()}`);
    }
  }
  const preferenceScore = possible > 0 ? earned / possible : 1;

  const share = rent.perMemberShare[member.memberId];
  const rentNote = `Pays ₹${share} of her ₹${member.hardConstraints.maxRent} max`;
  if (rent.usesUnequalSplit && share > round(rent.equalShare)) {
    compromises.push(
      `${rentNote} (more than an equal ₹${round(rent.equalShare)} split)`
    );
  } else {
    gets.push(rentNote);
  }

  return {
    memberId: member.memberId,
    name: member.name,
    gets,
    compromises,
    preferenceScore,
    rentShare: share,
    rentMax: member.hardConstraints.maxRent,
  };
}

export function matchListings(
  listings: Listing[],
  members: MemberResponse[],
  options: MatchOptions = {}
): MatchResult {
  const { maxMatches = 3, minMatchesForNearMiss = 2 } = options;

  const allMatches: ListingMatch[] = [];
  const allNearMisses: NearMiss[] = [];

  for (const listing of listings) {
    const violations: Violation[] = [];
    for (const member of members) {
      violations.push(...evaluateHardConstraints(listing, member));
    }

    const rent = evaluateRent(listing, members);
    if (rent.violation) violations.push(rent.violation);

    if (violations.length === 0) {
      const perPerson = members.map((m) =>
        buildPersonBreakdown(listing, m, rent)
      );
      const scores = perPerson.map((p) => p.preferenceScore);
      const combinedScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const minPersonScore = Math.min(...scores);
      allMatches.push({ listing, perPerson, combinedScore, minPersonScore, rent });
    } else if (violations.length === 1) {
      allNearMisses.push({ listing, violation: violations[0] });
    }
    // violations.length >= 2: excluded entirely, not shown anywhere
  }

  allMatches.sort(
    (a, b) =>
      b.combinedScore - a.combinedScore || b.minPersonScore - a.minPersonScore
  );

  return {
    matches: allMatches.slice(0, maxMatches),
    nearMisses:
      allMatches.length < minMatchesForNearMiss ? allNearMisses : [],
  };
}
