"use client";

import { useState, useEffect, useRef } from "react";
import type { SearchGroup } from "@/types";
import { cn } from "@/lib/utils";

interface SearchesPanelProps {
  groups: SearchGroup[];
  highlightStep: number | null;
}

function SearchGroupCard({
  group,
  highlighted,
}: {
  group: SearchGroup;
  highlighted: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlighted && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
      setExpanded(true);
    }
  }, [highlighted]);

  return (
    <div
      ref={ref}
      className={cn(
        "border rounded-lg p-3 transition-colors",
        highlighted
          ? "border-purple-300 bg-purple-50/50"
          : "border-gray-200 hover:border-gray-300"
      )}
    >
      <div
        className="cursor-pointer flex items-start justify-between gap-2"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 font-mono">
            Step {group.stepNumber}
          </p>
          <p className="text-sm text-gray-900 mt-0.5">
            &ldquo;{group.query}&rdquo;
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {group.results.length} source(s)
          </p>
        </div>
        <svg
          className={cn(
            "w-4 h-4 text-gray-400 transition-transform flex-shrink-0",
            expanded && "rotate-180"
          )}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {expanded && group.results.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-gray-100 pt-2">
          {group.results.map((r) => (
            <div key={r.id} className="text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-purple-600 font-medium font-mono">
                  {r.id}
                </span>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate"
                >
                  {r.title}
                </a>
              </div>
              <p className="text-gray-500 mt-0.5 line-clamp-2">{r.snippet}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchesPanel({
  groups,
  highlightStep,
}: SearchesPanelProps) {
  if (groups.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-gray-400">
        No searches performed yet.
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2">
      {groups.map((g) => (
        <SearchGroupCard
          key={g.stepNumber}
          group={g}
          highlighted={highlightStep === g.stepNumber}
        />
      ))}
    </div>
  );
}
