import { notFound } from "next/navigation";
import { getGroupByCode, getMembersForGroup } from "@/lib/data";
import JoinForm from "@/components/JoinForm";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const group = await getGroupByCode(code);
  if (!group) notFound();

  const members = await getMembersForGroup(group.id);
  const full = members.length >= group.member_count;

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold text-slate-900">{group.name}</h1>
        <p className="mt-2 text-slate-600">
          Enter your name to fill in your own constraints. Nobody else in the
          group can see your answers until everyone has submitted.
        </p>

        {full ? (
          <p className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            This group already has all {group.member_count} members. If
            that&apos;s you and you haven&apos;t submitted yet, ask whoever
            created the group for your personal form link.
          </p>
        ) : (
          <JoinForm code={code} />
        )}
      </div>
    </main>
  );
}
