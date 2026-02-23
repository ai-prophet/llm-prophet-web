"use client";

import { useState, useCallback, useEffect } from "react";
import ChatInterface from "@/components/ChatInterface";
import Sidebar from "@/components/Sidebar";
import SettingsModal from "@/components/SettingsModal";
import type { SearchGroup, BoardEntry, UserSettings } from "@/types";
import { DEFAULT_SETTINGS } from "@/types";

const SETTINGS_KEY = "prophet_settings";

function loadSettings(): UserSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_SETTINGS;
}

function saveSettings(s: UserSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {}
}

export default function Home() {
  const [searchGroups, setSearchGroups] = useState<SearchGroup[]>([]);
  const [boardEntries, setBoardEntries] = useState<BoardEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"board" | "searches">("board");
  const [highlightStep, setHighlightStep] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const handleSettingsSave = useCallback((s: UserSettings) => {
    setSettings(s);
    saveSettings(s);
  }, []);

  const handleSearchResult = useCallback(
    (group: SearchGroup) => {
      setSearchGroups((prev) => [...prev, group]);
    },
    []
  );

  const handleBoardUpdate = useCallback((entries: BoardEntry[]) => {
    setBoardEntries(entries);
  }, []);

  const handleStepClick = useCallback((stepNumber: number) => {
    setActiveTab("searches");
    setHighlightStep(stepNumber);
  }, []);

  const hasRequiredKeys = (() => {
    if (settings.model_class === "openrouter" && !settings.openrouter_api_key)
      return false;
    if (settings.search_backend === "perplexity" && !settings.perplexity_api_key)
      return false;
    if (settings.search_backend === "brave" && !settings.brave_api_key)
      return false;
    return true;
  })();

  return (
    <div className="h-screen flex flex-col">
      <header className="flex-shrink-0 border-b border-gray-200 bg-white/70 backdrop-blur-md px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">P</span>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">
              Mini LLM Prophet
            </h1>
            <span className="text-xs text-gray-400 font-mono">v0.1.3</span>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
            {!hasRequiredKeys && (
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 min-w-0">
          <ChatInterface
            settings={settings}
            onSearchResult={handleSearchResult}
            onBoardUpdate={handleBoardUpdate}
            onStepClick={handleStepClick}
            onOpenSettings={() => setSettingsOpen(true)}
            hasRequiredKeys={hasRequiredKeys}
          />
        </div>
        <div className="w-[380px] flex-shrink-0 border-l border-gray-200">
          <Sidebar
            searchGroups={searchGroups}
            boardEntries={boardEntries}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            highlightStep={highlightStep}
          />
        </div>
      </div>

      {settingsOpen && (
        <SettingsModal
          settings={settings}
          onSave={handleSettingsSave}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
