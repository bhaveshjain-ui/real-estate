import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAllListings, getGroupByCode, getMemberResponses, getMembersForGroup } from "@/lib/data";
import { matchListings } from "@/lib/matching";
import ListingCard from "@/components/ListingCard";
import NearMissCard from "@/components/NearMissCard";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const group = await getGroupByCode(code);
  if (!group) notFound();

  const members = await getMembersForGroup(group.id);
  const allSubmitted =
    members.length === group.member_count &&
    members.every((m) => m.submitted_at);

  if (!allSubmitted) {
    redirect(`/group/${code}`);
  }

  const [responses, listings] = await Promise.all([
    getMemberResponses(group.id),
    getAllListings(),
  ]);

  const { matches, nearMisses } = matchListings(listings, responses);

  return (
    <main className="flex-1 px-4 py-16">
      <div className="mx-auto w-full max-w-5xl">
        <Link href={`/group/${code}`} className="text-sm text-slate-500 underline">
          &larr; Back to {group.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          Options for {group.name}
        </h1>
        <p className="mt-1 text-slate-600">
          No winner is picked for you. These are real tradeoffs — the
          conversation is about which one to accept.
        </p>

        {matches.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {matches.map((match) => (
              <ListingCard key={match.listing.id} match={match} />
            ))}
          </div>
        ) : (
          <p className="mt-8 text-slate-600">
            No listing clears everyone&apos;s dealbreakers. See the near
            misses below — they&apos;re the honest starting point for a
            conversation about what to bend on.
          </p>
        )}

        {nearMisses.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-slate-900">
              Near misses
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Fewer than 2 listings cleared every dealbreaker, so here are
              listings that break exactly one — labelled with whose and
              which.
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {nearMisses.map((nm, i) => (
                <NearMissCard key={i} nearMiss={nm} />
              ))}
            </div>
          </div>
        )}

        <p className="mt-10 text-xs text-slate-400">
          Commute times are approximate estimates between localities, not
          live traffic data.
        </p>
      </div>
    </main>
  );
}
