"use client";

import { useEffect, useRef, useState } from "react";
import type { BoardEntry } from "@/types";
import { cn } from "@/lib/utils";

const SENTIMENT_BADGE: Record<string, { label: string; cls: string }> = {
  very_positive: { label: "++", cls: "bg-green-100 text-green-700" },
  positive: { label: "+", cls: "bg-green-50 text-green-600" },
  neutral: { label: "~", cls: "bg-gray-100 text-gray-600" },
  negative: { label: "-", cls: "bg-red-50 text-red-600" },
  very_negative: { label: "--", cls: "bg-red-100 text-red-700" },
};

interface SourceBoardPanelProps {
  entries: BoardEntry[];
  highlightBoardId: number | null;
}

function BoardEntryCard({
  entry,
  highlighted,
}: {
  entry: BoardEntry;
  highlighted: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isExpanded = expanded || highlighted;

  useEffect(() => {
    if (highlighted && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [highlighted]);

  return (
    <div
      ref={ref}
      className={cn(
        "border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors",
        highlighted && "border-purple-300 bg-purple-50/50"
      )}
    >
      <div
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              <span className="text-purple-600 font-mono text-xs mr-1.5">
                #{entry.id}
              </span>
              {entry.source.title}
            </p>
          </div>
          <svg
            className={cn(
              "w-4 h-4 text-gray-400 transition-transform flex-shrink-0",
              isExpanded && "rotate-180"
            )}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-2 space-y-2">
          <p className="text-sm text-gray-900 break-words">{entry.source.title}</p>
          <a
            href={entry.source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline break-all"
          >
            {entry.source.url}
          </a>
          <p className="text-xs text-gray-600">{entry.note}</p>
          {Object.keys(entry.reaction).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(entry.reaction).map(([outcome, sentiment]) => {
                const badge = SENTIMENT_BADGE[sentiment] || { label: "?", cls: "bg-gray-100 text-gray-500" };
                return (
                  <span
                    key={outcome}
                    className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", badge.cls)}
                  >
                    {outcome}
                    <span className="font-bold">{badge.label}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SourceBoardPanel({
  entries,
  highlightBoardId,
}: SourceBoardPanelProps) {
  if (entries.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-gray-400">
        No sources on the board yet.
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2">
      {entries.map((entry) => (
        <BoardEntryCard
          key={entry.id}
          entry={entry}
          highlighted={highlightBoardId === entry.id}
        />
      ))}
    </div>
  );
}
