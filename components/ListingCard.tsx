import { ListingMatch } from "@/lib/matching";

function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function balanceLabel(match: ListingMatch): { text: string; className: string } {
  const spread = match.combinedScore - match.minPersonScore;
  if (spread < 0.1) {
    return { text: "Balanced compromise", className: "bg-green-100 text-green-800" };
  }
  if (spread < 0.3) {
    return { text: "Slightly uneven", className: "bg-amber-100 text-amber-800" };
  }
  return { text: "One person absorbs more", className: "bg-red-100 text-red-800" };
}

export default function ListingCard({ match }: { match: ListingMatch }) {
  const { listing, rent } = match;
  const balance = balanceLabel(match);

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
      <div className="h-32 bg-slate-100 flex items-center justify-center text-slate-400 text-sm">
        Photo placeholder
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-slate-900">{listing.title}</h3>
            <p className="text-sm text-slate-500">{listing.locality}</p>
          </div>
          <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${balance.className}`}>
            {balance.text}
          </span>
        </div>

        <p className="mt-2 text-lg font-semibold text-slate-900">
          {formatINR(listing.rent)}
          <span className="text-sm font-normal text-slate-500">/month</span>
        </p>

        <ul className="mt-2 flex flex-wrap gap-1.5 text-xs text-slate-600">
          <li className="rounded bg-slate-100 px-2 py-0.5">{listing.bhk} BHK</li>
          <li className="rounded bg-slate-100 px-2 py-0.5">{listing.bathrooms} bath</li>
          <li className="rounded bg-slate-100 px-2 py-0.5">Floor {listing.floor}</li>
          {listing.hasLift && <li className="rounded bg-slate-100 px-2 py-0.5">Lift</li>}
          {listing.parking && <li className="rounded bg-slate-100 px-2 py-0.5">Parking</li>}
          {listing.petFriendly && (
            <li className="rounded bg-slate-100 px-2 py-0.5">Pet-friendly</li>
          )}
          {listing.amenities.map((a) => (
            <li key={a} className="rounded bg-slate-100 px-2 py-0.5">
              {a}
            </li>
          ))}
        </ul>

        <a
          href={listing.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-xs text-slate-500 underline"
        >
          View source listing
        </a>

        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
          {match.perPerson.map((person) => (
            <div key={person.memberId} className="text-sm">
              <p className="font-medium text-slate-900">{person.name}</p>
              <p className="text-xs text-slate-500">
                Pays {formatINR(person.rentShare)} of {formatINR(person.rentMax)} max
              </p>

              {person.gets.length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {person.gets.map((g, i) => (
                    <li key={i} className="text-xs text-green-700">
                      ✅ {g}
                    </li>
                  ))}
                </ul>
              )}

              {person.compromises.length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {person.compromises.map((c, i) => (
                    <li key={i} className="text-xs text-amber-700">
                      ⚠️ {c}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {rent.usesUnequalSplit && (
          <p className="mt-3 text-xs text-slate-500 border-t border-slate-100 pt-2">
            An equal split doesn&apos;t work for everyone here, so this uses
            an adjusted split within each person&apos;s stated max.
          </p>
        )}
      </div>
    </div>
  );
}
