"use client";

import { useActionState } from "react";
import { createGroupAction, ActionResult } from "@/lib/actions";

const initialState: ActionResult = {};

export default function HomePage() {
  const [state, formAction, pending] = useActionState(
    createGroupAction,
    initialState
  );

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold text-slate-900">Flat Match</h1>
        <p className="mt-2 text-slate-600">
          Stop debating flats one objection at a time. Everyone fills in
          their must-haves separately, then you get 2–3 real options with the
          tradeoffs laid out honestly.
        </p>

        <form action={formAction} className="mt-8 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">
              Group name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="e.g. Riya, Meera & Kavita"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="memberCount" className="block text-sm font-medium text-slate-700">
              Number of people
            </label>
            <input
              id="memberCount"
              name="memberCount"
              type="number"
              min={2}
              max={8}
              defaultValue={3}
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

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
            {pending ? "Creating..." : "Create group"}
          </button>
        </form>
      </div>
    </main>
  );
}
