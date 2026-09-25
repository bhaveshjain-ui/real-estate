import { notFound } from "next/navigation";
import { getGroupByCode, getMemberById } from "@/lib/data";
import ConstraintsForm from "@/components/ConstraintsForm";

export default async function MemberFormPage({
  params,
}: {
  params: Promise<{ code: string; memberId: string }>;
}) {
  const { code, memberId } = await params;

  const group = await getGroupByCode(code);
  if (!group) notFound();

  const member = await getMemberById(memberId);
  if (!member || member.group_id !== group.id) notFound();

  if (member.submitted_at) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-semibold text-slate-900">
            Thanks, {member.name}!
          </h1>
          <p className="mt-2 text-slate-600">
            You&apos;ve already submitted your answers for {group.name}. Come
            back to the status page to see when everyone else is done.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 py-16">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="text-2xl font-semibold text-slate-900">
          Hi {member.name}, tell us what you need
        </h1>
        <p className="mt-2 text-slate-600">
          Fill this in on your own. {group.name} won&apos;t see your answers
          until everyone has submitted.
        </p>

        <div className="mt-8">
          <ConstraintsForm
            memberId={member.id}
            code={code}
            memberCount={group.member_count}
          />
        </div>
      </div>
    </main>
  );
}
