"use server";

import { redirect } from "next/navigation";
import {
  createGroup,
  createListingManual,
  getGroupByCode,
  joinGroup,
  submitResponse,
} from "./data";
import { HardConstraints, Preference } from "./types";

export interface ActionResult {
  error?: string;
}

export async function createGroupAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const memberCount = Number(formData.get("memberCount") ?? 3);

  if (!name) return { error: "Give your group a name." };
  if (!Number.isInteger(memberCount) || memberCount < 2 || memberCount > 8) {
    return { error: "Member count must be between 2 and 8." };
  }

  const group = await createGroup(name, memberCount);
  redirect(`/group/${group.code}`);
}

export async function joinGroupAction(
  code: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Enter your name." };

  const group = await getGroupByCode(code);
  if (!group) return { error: "Group not found." };

  let member;
  try {
    member = await joinGroup(group.id, name);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not join." };
  }

  redirect(`/group/${code}/form/${member.id}`);
}

export async function submitResponseAction(
  memberId: string,
  code: string,
  hardConstraints: HardConstraints,
  preferences: Preference[]
): Promise<ActionResult> {
  if (hardConstraints.maxRent <= 0) {
    return { error: "Enter a valid max rent contribution." };
  }
  await submitResponse(memberId, hardConstraints, preferences);
  redirect(`/group/${code}`);
}

export async function createListingAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const get = (key: string) => String(formData.get(key) ?? "").trim();

  const sourceUrl = get("sourceUrl");
  const title = get("title");
  const locality = get("locality");
  const rent = Number(formData.get("rent"));
  const bhk = Number(formData.get("bhk") || 3);
  const bathrooms = Number(formData.get("bathrooms") || 2);
  const floor = Number(formData.get("floor") || 1);
  const amenities = get("amenities")
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);

  if (!sourceUrl || !title || !locality || !rent) {
    return { error: "Fill in URL, title, locality and rent." };
  }

  try {
    await createListingManual({
      sourceUrl,
      title,
      locality,
      rent,
      bhk,
      bathrooms,
      floor,
      hasLift: formData.get("hasLift") === "on",
      parking: formData.get("parking") === "on",
      petFriendly: formData.get("petFriendly") === "on",
      furnished: get("furnished") || "unfurnished",
      amenities,
    });
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not save listing.",
    };
  }

  return {};
}
