"use client";

import { useState } from "react";

export default function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable; the link is still visible to copy manually
    }
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <code className="flex-1 truncate rounded bg-white border border-slate-200 px-2 py-1 text-xs text-slate-700">
        {url}
      </code>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
