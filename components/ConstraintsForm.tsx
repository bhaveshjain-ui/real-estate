"use client";

import { useState, useTransition } from "react";
import { submitResponseAction } from "@/lib/actions";
import {
  CommuteAnchor,
  FurnishedStatus,
  HardConstraints,
  Locality,
  Preference,
  PreferenceAttribute,
  PreferenceWeight,
  PUNE_LOCALITIES,
} from "@/lib/types";
import { PREFERENCE_LABELS } from "@/lib/matching";

const PREFERENCE_ATTRIBUTES = Object.keys(
  PREFERENCE_LABELS
) as PreferenceAttribute[];

const emptyAnchor: CommuteAnchor = {
  label: "",
  locality: PUNE_LOCALITIES[0],
  maxMinutes: 30,
};

export default function ConstraintsForm({
  memberId,
  code,
  memberCount,
}: {
  memberId: string;
  code: string;
  memberCount: number;
}) {
  const [maxRent, setMaxRent] = useState(20000);
  const [excludedLocalities, setExcludedLocalities] = useState<Locality[]>([]);
  const [commuteAnchors, setCommuteAnchors] = useState<CommuteAnchor[]>([
    { ...emptyAnchor },
  ]);
  const [requireLift, setRequireLift] = useState(false);
  const [requireParking, setRequireParking] = useState(false);
  const [minBathrooms, setMinBathrooms] = useState(1);
  const [requirePetFriendly, setRequirePetFriendly] = useState(false);
  const [requiredFurnished, setRequiredFurnished] =
    useState<FurnishedStatus | "">("");

  const [preferences, setPreferences] = useState<
    Record<PreferenceAttribute, PreferenceWeight | null>
  >(
    Object.fromEntries(
      PREFERENCE_ATTRIBUTES.map((a) => [a, null])
    ) as Record<PreferenceAttribute, PreferenceWeight | null>
  );

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleLocality(locality: Locality) {
    setExcludedLocalities((prev) =>
      prev.includes(locality)
        ? prev.filter((l) => l !== locality)
        : [...prev, locality]
    );
  }

  function updateAnchor(index: number, patch: Partial<CommuteAnchor>) {
    setCommuteAnchors((prev) =>
      prev.map((a, i) => (i === index ? { ...a, ...patch } : a))
    );
  }

  function addAnchor() {
    setCommuteAnchors((prev) =>
      prev.length >= 2 ? prev : [...prev, { ...emptyAnchor }]
    );
  }

  function removeAnchor(index: number) {
    setCommuteAnchors((prev) => prev.filter((_, i) => i !== index));
  }

  function setPreferenceWeight(
    attribute: PreferenceAttribute,
    weight: PreferenceWeight | null
  ) {
    setPreferences((prev) => ({ ...prev, [attribute]: weight }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!maxRent || maxRent <= 0) {
      setError("Enter a valid max rent contribution.");
      return;
    }

    const anchors = commuteAnchors.filter((a) => a.label.trim().length > 0);

    const hardConstraints: HardConstraints = {
      maxRent,
      excludedLocalities,
      commuteAnchors: anchors,
      requireLift,
      requireParking,
      minBathrooms,
      requirePetFriendly,
      requiredFurnished: requiredFurnished || null,
    };

    const prefs: Preference[] = PREFERENCE_ATTRIBUTES.filter(
      (a) => preferences[a] !== null
    ).map((a) => ({ attribute: a, weight: preferences[a]! }));

    startTransition(async () => {
      const result = await submitResponseAction(
        memberId,
        code,
        hardConstraints,
        prefs
      );
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <section>
        <h2 className="text-lg font-semibold text-slate-900">
          Dealbreakers (hard constraints)
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Any listing that breaks one of these is excluded outright.
        </p>

        <div className="mt-4">
          <label htmlFor="maxRent" className="block text-sm font-medium text-slate-700">
            Max rent you&apos;d contribute per month (₹)
          </label>
          <input
            id="maxRent"
            type="number"
            min={1}
            value={maxRent}
            onChange={(e) => setMaxRent(Number(e.target.value))}
            className="mt-1 w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-slate-500">
            Assumes an equal {memberCount}-way split by default; we&apos;ll
            also check if an unequal split could work.
          </p>
        </div>

        <div className="mt-6">
          <span className="block text-sm font-medium text-slate-700">
            Localities you will NOT consider
          </span>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PUNE_LOCALITIES.map((locality) => (
              <label key={locality} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={excludedLocalities.includes(locality)}
                  onChange={() => toggleLocality(locality)}
                  className="rounded border-slate-300"
                />
                {locality}
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <span className="block text-sm font-medium text-slate-700">
            Commute anchors (up to 2 places you must be near)
          </span>
          <div className="mt-2 space-y-3">
            {commuteAnchors.map((anchor, i) => (
              <div key={i} className="rounded-md border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">
                    Anchor {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAnchor(i)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Office - Hinjewadi"
                    value={anchor.label}
                    onChange={(e) => updateAnchor(i, { label: e.target.value })}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                  <select
                    value={anchor.locality}
                    onChange={(e) =>
                      updateAnchor(i, { locality: e.target.value as Locality })
                    }
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  >
                    {PUNE_LOCALITIES.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={5}
                      value={anchor.maxMinutes}
                      onChange={(e) =>
                        updateAnchor(i, { maxMinutes: Number(e.target.value) })
                      }
                      className="w-20 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
                    />
                    <span className="text-sm text-slate-500">min max</span>
                  </div>
                </div>
              </div>
            ))}
            {commuteAnchors.length < 2 && (
              <button
                type="button"
                onClick={addAnchor}
                className="text-sm text-slate-700 underline"
              >
                + Add another anchor
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={requireLift}
              onChange={(e) => setRequireLift(e.target.checked)}
              className="rounded border-slate-300"
            />
            Lift required (or ground/1st floor)
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={requireParking}
              onChange={(e) => setRequireParking(e.target.checked)}
              className="rounded border-slate-300"
            />
            Parking required
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={requirePetFriendly}
              onChange={(e) => setRequirePetFriendly(e.target.checked)}
              className="rounded border-slate-300"
            />
            Must be pet-friendly
          </label>
          <div className="flex items-center gap-2">
            <label htmlFor="minBathrooms" className="text-sm text-slate-700">
              Minimum bathrooms
            </label>
            <input
              id="minBathrooms"
              type="number"
              min={1}
              max={4}
              value={minBathrooms}
              onChange={(e) => setMinBathrooms(Number(e.target.value))}
              className="w-20 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="furnished" className="text-sm text-slate-700">
              Required furnished status
            </label>
            <select
              id="furnished"
              value={requiredFurnished}
              onChange={(e) =>
                setRequiredFurnished(e.target.value as FurnishedStatus | "")
              }
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
            >
              <option value="">No requirement</option>
              <option value="furnished">Furnished</option>
              <option value="semi">Semi-furnished</option>
              <option value="unfurnished">Unfurnished</option>
            </select>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">
          Nice-to-haves (preferences)
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          These never exclude a listing, they just affect ranking. Weight the
          ones you care about.
        </p>

        <div className="mt-4 space-y-2">
          {PREFERENCE_ATTRIBUTES.map((attribute) => (
            <div
              key={attribute}
              className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2"
            >
              <span className="text-sm text-slate-700">
                {PREFERENCE_LABELS[attribute]}
              </span>
              <select
                value={preferences[attribute] ?? ""}
                onChange={(e) =>
                  setPreferenceWeight(
                    attribute,
                    (e.target.value || null) as PreferenceWeight | null
                  )
                }
                className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-900"
              >
                <option value="">Don&apos;t care</option>
                <option value="low">Low priority</option>
                <option value="medium">Medium priority</option>
                <option value="high">High priority</option>
              </select>
            </div>
          ))}
        </div>
      </section>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-slate-900 px-4 py-3 text-white font-medium hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Submitting..." : "Submit my answers"}
      </button>
    </form>
  );
}
