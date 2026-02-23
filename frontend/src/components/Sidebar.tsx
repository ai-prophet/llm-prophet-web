"use client";

import { cn } from "@/lib/utils";
import type { SearchGroup, BoardEntry } from "@/types";
import SourceBoardPanel from "./SourceBoardPanel";
import SearchesPanel from "./SearchesPanel";

interface SidebarProps {
  searchGroups: SearchGroup[];
  boardEntries: BoardEntry[];
  activeTab: "board" | "searches";
  onTabChange: (tab: "board" | "searches") => void;
  highlightStep: number | null;
  highlightBoardId: number | null;
}

export default function Sidebar({
  searchGroups,
  boardEntries,
  activeTab,
  onTabChange,
  highlightStep,
  highlightBoardId,
}: SidebarProps) {
  return (
    <div className="h-full flex flex-col bg-white/60 backdrop-blur-sm">
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => onTabChange("board")}
          className={cn(
            "flex-1 py-3 text-sm font-medium transition-colors",
            activeTab === "board"
              ? "text-purple-600 border-b-2 border-purple-600"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          Source Board
          {boardEntries.length > 0 && (
            <span className="ml-1.5 text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">
              {boardEntries.length}
            </span>
          )}
        </button>
        <button
          onClick={() => onTabChange("searches")}
          className={cn(
            "flex-1 py-3 text-sm font-medium transition-colors",
            activeTab === "searches"
              ? "text-purple-600 border-b-2 border-purple-600"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          Searches
          {searchGroups.length > 0 && (
            <span className="ml-1.5 text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">
              {searchGroups.length}
            </span>
          )}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === "board" ? (
          <SourceBoardPanel
            entries={boardEntries}
            highlightBoardId={highlightBoardId}
          />
        ) : (
          <SearchesPanel groups={searchGroups} highlightStep={highlightStep} />
        )}
      </div>
    </div>
  );
}
