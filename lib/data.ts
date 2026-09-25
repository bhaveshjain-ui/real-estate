import "server-only";
import { getSupabaseServerClient } from "./supabase-server";
import { Database } from "./database.types";
import { HardConstraints, Listing, MemberResponse, Preference } from "./types";

export type GroupRow = Database["public"]["Tables"]["groups"]["Row"];
export type MemberRow = Database["public"]["Tables"]["members"]["Row"];

type ListingRow = Database["public"]["Tables"]["listings"]["Row"];

function mapListing(row: ListingRow): Listing {
  return {
    id: row.id,
    source: row.source,
    sourceUrl: row.source_url,
    title: row.title,
    locality: row.locality as Listing["locality"],
    rent: row.rent,
    bhk: row.bhk,
    bathrooms: row.bathrooms,
    floor: row.floor,
    hasLift: row.has_lift,
    parking: row.parking,
    petFriendly: row.pet_friendly,
    furnished: row.furnished as Listing["furnished"],
    amenities: row.amenities ?? [],
    scrapedAt: row.scraped_at,
  };
}

export async function createGroup(name: string, memberCount: number) {
  const supabase = getSupabaseServerClient();

  // Small retry loop in case a randomly generated code collides.
  for (let attempt = 0; attempt < 5; attempt++) {
    const { generateGroupCode } = await import("./group-code");
    const code = generateGroupCode();
    const { data, error } = await supabase
      .from("groups")
      .insert({ code, name, member_count: memberCount })
      .select()
      .single();

    if (!error) return data;
    if (!error.message.includes("duplicate key")) throw error;
  }
  throw new Error("Could not generate a unique group code, please retry");
}

export async function getGroupByCode(code: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("groups")
    .select()
    .eq("code", code.toUpperCase())
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getMembersForGroup(groupId: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("members")
    .select()
    .eq("group_id", groupId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getMemberById(memberId: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("members")
    .select()
    .eq("id", memberId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Join a group: reuses an existing not-yet-submitted row for the same name
 * (so refreshing/reopening the join link doesn't create duplicates), errors
 * if the name already submitted or the group is full.
 */
export async function joinGroup(groupId: string, name: string) {
  const supabase = getSupabaseServerClient();

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select()
    .eq("id", groupId)
    .single();
  if (groupError) throw groupError;

  const members = await getMembersForGroup(groupId);

  const existing = members.find(
    (m) => m.name.toLowerCase() === name.trim().toLowerCase()
  );
  if (existing) {
    if (existing.submitted_at) {
      throw new Error(
        `"${name}" has already submitted her answers for this group.`
      );
    }
    return existing;
  }

  if (members.length >= group.member_count) {
    throw new Error("This group already has all its members.");
  }

  const { data, error } = await supabase
    .from("members")
    .insert({ group_id: groupId, name: name.trim() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function submitResponse(
  memberId: string,
  hardConstraints: HardConstraints,
  preferences: Preference[]
) {
  const supabase = getSupabaseServerClient();

  const { error: responseError } = await supabase.from("responses").upsert(
    {
      member_id: memberId,
      hard_constraints: hardConstraints as unknown,
      preferences: preferences as unknown,
    },
    { onConflict: "member_id" }
  );
  if (responseError) throw responseError;

  const { error: memberError } = await supabase
    .from("members")
    .update({ submitted_at: new Date().toISOString() })
    .eq("id", memberId);
  if (memberError) throw memberError;
}

export async function getMemberResponses(
  groupId: string
): Promise<MemberResponse[]> {
  const supabase = getSupabaseServerClient();
  const members = await getMembersForGroup(groupId);

  const { data: responses, error } = await supabase
    .from("responses")
    .select()
    .in(
      "member_id",
      members.map((m) => m.id)
    );
  if (error) throw error;

  return members
    .map((member) => {
      const response = (responses ?? []).find(
        (r) => r.member_id === member.id
      );
      if (!response) return null;
      return {
        memberId: member.id,
        name: member.name,
        hardConstraints: response.hard_constraints as HardConstraints,
        preferences: response.preferences as Preference[],
      } satisfies MemberResponse;
    })
    .filter((m): m is MemberResponse => m !== null);
}

export async function getAllListings(): Promise<Listing[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("listings").select();
  if (error) throw error;
  return (data ?? []).map(mapListing);
}

export async function createListingManual(input: {
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
  furnished: string;
  amenities: string[];
}) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("listings").insert({
    source: "manual",
    source_url: input.sourceUrl,
    title: input.title,
    locality: input.locality,
    rent: input.rent,
    bhk: input.bhk,
    bathrooms: input.bathrooms,
    floor: input.floor,
    has_lift: input.hasLift,
    parking: input.parking,
    pet_friendly: input.petFriendly,
    furnished: input.furnished,
    amenities: input.amenities,
  });
  if (error) throw error;
}
