import { NearMiss } from "@/lib/matching";

export default function NearMissCard({ nearMiss }: { nearMiss: NearMiss }) {
  const { listing, violation } = nearMiss;
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
      <p className="font-medium text-slate-900">{listing.title}</p>
      <p className="text-sm text-slate-500">
        {listing.locality} &middot; ₹{listing.rent.toLocaleString("en-IN")}/month
      </p>
      <p className="mt-2 text-sm text-amber-800">
        ⚠️ Breaks one dealbreaker for <strong>{violation.name}</strong>:{" "}
        {violation.description}
      </p>
    </div>
  );
}
