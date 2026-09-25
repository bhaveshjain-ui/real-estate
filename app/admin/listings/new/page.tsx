"use client";

import { useActionState } from "react";
import { createListingAction, ActionResult } from "@/lib/actions";
import { PUNE_LOCALITIES } from "@/lib/types";

const initialState: ActionResult = {};

export default function NewListingPage() {
  const [state, formAction, pending] = useActionState(
    createListingAction,
    initialState
  );

  return (
    <main className="flex-1 px-4 py-16">
      <div className="mx-auto w-full max-w-lg">
        <h1 className="text-2xl font-semibold text-slate-900">
          Add a listing manually
        </h1>
        <p className="mt-1 text-slate-600">
          Fallback for when the scraper can&apos;t reach a source, or for a
          listing someone pasted in from a group chat.
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          <Field label="Source URL" name="sourceUrl" type="url" required />
          <Field label="Title" name="title" required />

          <div>
            <label htmlFor="locality" className="block text-sm font-medium text-slate-700">
              Locality
            </label>
            <select
              id="locality"
              name="locality"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
            >
              {PUNE_LOCALITIES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Rent (₹/month)" name="rent" type="number" required />
            <Field label="BHK" name="bhk" type="number" defaultValue={3} />
            <Field label="Bathrooms" name="bathrooms" type="number" defaultValue={2} />
            <Field label="Floor" name="floor" type="number" defaultValue={1} />
          </div>

          <div>
            <label htmlFor="furnished" className="block text-sm font-medium text-slate-700">
              Furnished status
            </label>
            <select
              id="furnished"
              name="furnished"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
            >
              <option value="unfurnished">Unfurnished</option>
              <option value="semi">Semi-furnished</option>
              <option value="furnished">Furnished</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="hasLift" className="rounded border-slate-300" />
              Has lift
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="parking" className="rounded border-slate-300" />
              Has parking
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="petFriendly" className="rounded border-slate-300" />
              Pet-friendly
            </label>
          </div>

          <Field
            label="Amenities (comma-separated, e.g. Balcony, Gated Society)"
            name="amenities"
          />

          {state.error && (
            <p className="text-sm text-red-600" role="alert">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-white font-medium hover:bg-slate-800 disabled:opacity-50"
          >
            {pending ? "Saving..." : "Add listing"}
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900"
      />
    </div>
  );
}
