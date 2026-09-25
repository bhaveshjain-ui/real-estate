import { describe, expect, it } from "vitest";
import { matchListings } from "./matching";
import {
  HardConstraints,
  Listing,
  MemberResponse,
  Preference,
} from "./types";

let idCounter = 0;
function nextId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

function makeHardConstraints(
  overrides: Partial<HardConstraints> = {}
): HardConstraints {
  return {
    maxRent: 20000,
    excludedLocalities: [],
    commuteAnchors: [],
    requireLift: false,
    requireParking: false,
    minBathrooms: 1,
    requirePetFriendly: false,
    requiredFurnished: null,
    ...overrides,
  };
}

function makeMember(
  name: string,
  hardConstraints: Partial<HardConstraints> = {},
  preferences: Preference[] = []
): MemberResponse {
  return {
    memberId: nextId("member"),
    name,
    hardConstraints: makeHardConstraints(hardConstraints),
    preferences,
  };
}

function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: nextId("listing"),
    source: "manual",
    sourceUrl: `https://example.com/${nextId("url")}`,
    title: "Test 3BHK",
    locality: "Baner",
    rent: 45000,
    bhk: 3,
    bathrooms: 2,
    floor: 2,
    hasLift: true,
    parking: true,
    petFriendly: false,
    furnished: "semi",
    amenities: ["Balcony", "Gated Society"],
    scrapedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("matchListings - hard constraint exclusions", () => {
  it("excludes a Baner listing when it breaks a member's commute anchor (Kavita/Hinjewadi scenario)", () => {
    const riya = makeMember("Riya");
    const meera = makeMember("Meera");
    const kavita = makeMember("Kavita", {
      commuteAnchors: [
        { label: "Office - Hinjewadi", locality: "Hinjewadi", maxMinutes: 20 },
      ],
    });
    const listing = makeListing({ locality: "Baner" });

    const result = matchListings([listing], [riya, meera, kavita]);

    expect(result.matches).toHaveLength(0);
    expect(result.nearMisses).toHaveLength(1);
    expect(result.nearMisses[0].violation.name).toBe("Kavita");
    expect(result.nearMisses[0].violation.description).toContain(
      "Office - Hinjewadi"
    );
  });

  it("excludes a Kothrud listing when it is too far from a member's gym/family anchor (Riya/Viman Nagar scenario)", () => {
    const riya = makeMember("Riya", {
      commuteAnchors: [
        { label: "Gym/family - Viman Nagar", locality: "Viman Nagar", maxMinutes: 20 },
      ],
    });
    const meera = makeMember("Meera");
    const kavita = makeMember("Kavita");
    const listing = makeListing({ locality: "Kothrud" });

    const result = matchListings([listing], [riya, meera, kavita]);

    expect(result.matches).toHaveLength(0);
    expect(result.nearMisses).toHaveLength(1);
    expect(result.nearMisses[0].violation.name).toBe("Riya");
    expect(result.nearMisses[0].violation.description).toContain(
      "Gym/family - Viman Nagar"
    );
  });

  it("excludes a 5th-floor listing with no lift when a member requires one (Meera's knee condition scenario)", () => {
    const riya = makeMember("Riya");
    const meera = makeMember("Meera", { requireLift: true });
    const kavita = makeMember("Kavita");
    const listing = makeListing({ floor: 5, hasLift: false });

    const result = matchListings([listing], [riya, meera, kavita]);

    expect(result.matches).toHaveLength(0);
    expect(result.nearMisses).toHaveLength(1);
    expect(result.nearMisses[0].violation.name).toBe("Meera");
    expect(result.nearMisses[0].violation.description).toContain("lift");
  });

  it("excludes a listing entirely, with no near-miss, when it breaks two or more hard constraints", () => {
    const riya = makeMember("Riya", {
      commuteAnchors: [
        { label: "Gym/family - Viman Nagar", locality: "Viman Nagar", maxMinutes: 20 },
      ],
    });
    const meera = makeMember("Meera", { requireLift: true });
    const kavita = makeMember("Kavita");
    const listing = makeListing({ locality: "Kothrud", floor: 5, hasLift: false });

    const result = matchListings([listing], [riya, meera, kavita]);

    expect(result.matches).toHaveLength(0);
    expect(result.nearMisses).toHaveLength(0);
  });
});

describe("matchListings - full matches", () => {
  it("returns a full match with per-person gets/compromises when all hard constraints pass", () => {
    const riya = makeMember(
      "Riya",
      {
        commuteAnchors: [
          { label: "Gym/family - Viman Nagar", locality: "Viman Nagar", maxMinutes: 90 },
        ],
      },
      [{ attribute: "balcony", weight: "high" }]
    );
    const meera = makeMember("Meera", { requireLift: true }, [
      { attribute: "petFriendly", weight: "medium" },
    ]);
    const kavita = makeMember(
      "Kavita",
      {
        commuteAnchors: [
          { label: "Office - Hinjewadi", locality: "Hinjewadi", maxMinutes: 35 },
        ],
      },
      [{ attribute: "nearMetro", weight: "low" }]
    );
    const listing = makeListing({
      locality: "Baner",
      hasLift: true,
      petFriendly: false,
      amenities: ["Balcony", "Gated Society"],
    });

    const result = matchListings([listing], [riya, meera, kavita]);

    expect(result.matches).toHaveLength(1);
    const match = result.matches[0];
    expect(match.perPerson).toHaveLength(3);

    const riyaBreakdown = match.perPerson.find((p) => p.name === "Riya")!;
    expect(riyaBreakdown.gets).toContain("Balcony");

    const meeraBreakdown = match.perPerson.find((p) => p.name === "Meera")!;
    expect(meeraBreakdown.compromises).toContain("No pet-friendly");

    const kavitaBreakdown = match.perPerson.find((p) => p.name === "Kavita")!;
    expect(kavitaBreakdown.compromises).toContain("No near metro");
    expect(
      kavitaBreakdown.gets.some((g) => g.includes("Office - Hinjewadi"))
    ).toBe(true);

    // equal three-way split of 45000
    expect(match.rent.equalFeasible).toBe(true);
    expect(match.rent.perMemberShare[riya.memberId]).toBe(15000);
  });

  it("ranks a balanced listing above a lopsided one with the same combined score", () => {
    const memberA = makeMember("A", {}, [
      { attribute: "balcony", weight: "high" },
      { attribute: "parking", weight: "high" },
    ]);
    const memberB = makeMember("B", {}, [
      { attribute: "petFriendly", weight: "high" },
      { attribute: "furnished", weight: "high" },
    ]);

    // Lopsided: A gets everything she wants, B gets nothing (combined 0.5, min 0).
    const lopsidedListing = makeListing({
      rent: 30000,
      parking: true,
      amenities: ["Balcony"],
      petFriendly: false,
      furnished: "unfurnished",
    });

    // Balanced: both get exactly half of what they want (combined 0.5, min 0.5).
    const balancedListing = makeListing({
      rent: 30000,
      parking: true,
      amenities: [],
      petFriendly: true,
      furnished: "unfurnished",
    });

    const result = matchListings(
      [lopsidedListing, balancedListing],
      [memberA, memberB]
    );

    expect(result.matches).toHaveLength(2);
    expect(result.matches[0].listing.id).toBe(balancedListing.id);
    expect(result.matches[0].minPersonScore).toBeCloseTo(0.5);
    expect(result.matches[1].listing.id).toBe(lopsidedListing.id);
    expect(result.matches[1].minPersonScore).toBeCloseTo(0);
  });

  it("falls back to an unequal rent split when the equal split breaks one budget, without excluding the listing", () => {
    const tight = makeMember("Tight", { maxRent: 10000 });
    const flexible1 = makeMember("Flex1", { maxRent: 25000 });
    const flexible2 = makeMember("Flex2", { maxRent: 25000 });
    const listing = makeListing({ rent: 45000 }); // equal split = 15000, breaks Tight's 10000 max

    const result = matchListings([listing], [tight, flexible1, flexible2]);

    expect(result.matches).toHaveLength(1);
    const { rent, perPerson } = result.matches[0];
    expect(rent.equalFeasible).toBe(false);
    expect(rent.usesUnequalSplit).toBe(true);
    expect(rent.perMemberShare[tight.memberId]).toBeLessThanOrEqual(10000);

    const tightBreakdown = perPerson.find((p) => p.name === "Tight")!;
    expect(tightBreakdown.compromises).toHaveLength(0); // she pays at or under her max, not more than equal share

    const flexBreakdown = perPerson.find((p) => p.name === "Flex1")!;
    expect(
      flexBreakdown.compromises.some((c) => c.includes("more than an equal"))
    ).toBe(true);
  });

  it("excludes a listing as a hard failure when even an unequal split can't cover the rent", () => {
    const a = makeMember("A", { maxRent: 5000 });
    const b = makeMember("B", { maxRent: 5000 });
    const c = makeMember("C", { maxRent: 5000 });
    const listing = makeListing({ rent: 45000 });

    const result = matchListings([listing], [a, b, c]);

    expect(result.matches).toHaveLength(0);
    expect(result.nearMisses).toHaveLength(1);
    expect(result.nearMisses[0].violation.description).toContain(
      "fall short"
    );
  });
});
