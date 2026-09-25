"use client";

import { useActionState } from "react";
import { joinGroupAction, ActionResult } from "@/lib/actions";

const initialState: ActionResult = {};

export default function JoinForm({ code }: { code: string }) {
  const boundAction = joinGroupAction.bind(null, code);
  const [state, formAction, pending] = useActionState(
    boundAction,
    initialState
  );

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
          Your name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoFocus
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
        {pending ? "Joining..." : "Continue"}
      </button>
    </form>
  );
}
