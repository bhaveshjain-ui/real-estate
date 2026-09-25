import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getGroupByCode, getMembersForGroup } from "@/lib/data";
import CopyLinkButton from "@/components/CopyLinkButton";

export default async function GroupStatusPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const group = await getGroupByCode(code);
  if (!group) notFound();

  const members = await getMembersForGroup(group.id);
  const headerList = await headers();
  const origin = `${headerList.get("x-forwarded-proto") ?? "https"}://${headerList.get("host")}`;
  const joinUrl = `${origin}/group/${group.code}/join`;
  const submittedCount = members.filter((m) => m.submitted_at).length;
  const allSubmitted =
    members.length === group.member_count && submittedCount === members.length;
  const seatsLeft = group.member_count - members.length;

  return (
    <main className="flex-1 px-4 py-16">
      <div className="mx-auto w-full max-w-lg">
        <h1 className="text-2xl font-semibold text-slate-900">{group.name}</h1>
        <p className="mt-1 text-slate-600">
          Group code <span className="font-mono font-semibold">{group.code}</span>
        </p>

        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-700">Share this link with the group:</p>
          <CopyLinkButton url={joinUrl} />
        </div>

        <div className="mt-8">
          <h2 className="text-sm font-medium text-slate-700">
            Who&apos;s submitted ({submittedCount}/{group.member_count})
          </h2>
          <ul className="mt-3 space-y-2">
            {members.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2"
              >
                <span className="text-slate-900">{m.name}</span>
                <span
                  className={
                    m.submitted_at
                      ? "text-sm font-medium text-green-700"
                      : "text-sm text-slate-500"
                  }
                >
                  {m.submitted_at ? "Submitted ✓" : "Waiting..."}
                </span>
              </li>
            ))}
            {seatsLeft > 0 &&
              Array.from({ length: seatsLeft }).map((_, i) => (
                <li
                  key={`empty-${i}`}
                  className="flex items-center justify-between rounded-md border border-dashed border-slate-300 px-3 py-2"
                >
                  <span className="text-slate-400">Waiting for someone to join...</span>
                </li>
              ))}
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            Nobody can see anyone else&apos;s answers until everyone has submitted.
          </p>
        </div>

        <div className="mt-8">
          {allSubmitted ? (
            <Link
              href={`/group/${group.code}/results`}
              className="block w-full rounded-md bg-slate-900 px-4 py-2 text-center text-white font-medium hover:bg-slate-800"
            >
              See results
            </Link>
          ) : (
            <p className="text-sm text-slate-500">
              Results will unlock once everyone has submitted. Refresh this page
              to check again.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
