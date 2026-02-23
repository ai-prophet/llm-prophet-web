"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import useAgentStream from "@/hooks/useAgentStream";
import type { SearchGroup, BoardEntry, UserSettings } from "@/types";
import UserMessage from "./UserMessage";
import ForecastPlan from "./ForecastPlan";
import AgentDivider from "./AgentDivider";
import StepMessage from "./StepMessage";
import ForecastResultCard from "./ForecastResultCard";

interface ChatInterfaceProps {
  settings: UserSettings;
  onSearchResult: (group: SearchGroup) => void;
  onBoardUpdate: (entries: BoardEntry[]) => void;
  onStepClick: (stepNumber: number) => void;
  onOpenSourceBoardEntry: (boardId: number) => void;
  onRunStart: () => void;
  onOpenSettings: () => void;
  onToggleSettings: () => void;
  hasRequiredKeys: boolean;
  settingsOpen: boolean;
}

export default function ChatInterface({
  settings,
  onSearchResult,
  onBoardUpdate,
  onStepClick,
  onOpenSourceBoardEntry,
  onRunStart,
  onOpenSettings,
  onToggleSettings,
  hasRequiredKeys,
  settingsOpen,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const {
    messages,
    isRunning,
    isPlanning,
    plan,
    startRun,
    onSearchResult: searchRef,
    onBoardUpdate: boardRef,
  } = useAgentStream();

  useEffect(() => {
    searchRef.current = onSearchResult;
    boardRef.current = onBoardUpdate;
  }, [onSearchResult, onBoardUpdate, searchRef, boardRef]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasRequiredKeys) {
      onOpenSettings();
      return;
    }
    const text = input.trim();
    if (!text || isPlanning || isRunning) return;
    setInput("");
    plan(text, settings);
  };

  const handleRun = (title: string, outcomes: string[]) => {
    if (isRunning) return;
    if (!hasRequiredKeys) {
      onOpenSettings();
      return;
    }
    onRunStart();
    startRun(title, outcomes, settings);
  };

  const inputDisabled = isPlanning || isRunning;
  const hasForecastPlans = messages.some((msg) => msg.type === "plan");

  const openLatestForecastEdit = useCallback(() => {
    const buttons = document.querySelectorAll<HTMLButtonElement>(
      "[data-forecast-edit='true']"
    );
    buttons[buttons.length - 1]?.click();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      const key = event.key.toLowerCase();

      if (key === "k") {
        event.preventDefault();
        onToggleSettings();
      } else if (key === "o" && hasForecastPlans) {
        event.preventDefault();
        openLatestForecastEdit();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [hasForecastPlans, onToggleSettings, openLatestForecastEdit]);

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Forecast anything
            </h2>
            <p className="text-sm text-gray-500 max-w-md mb-4">
              Ask a question about the future and the AI agent will research it,
              gather evidence, and produce a probabilistic forecast.
            </p>
            {!hasRequiredKeys && (
              <button
                onClick={onOpenSettings}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors"
              >
                Configure API keys to get started
              </button>
            )}
          </div>
        )}

        {messages.map((msg) => {
          switch (msg.type) {
            case "user":
              return <UserMessage key={msg.id} content={msg.content} />;
            case "plan":
              return (
                <ForecastPlan
                  key={msg.id}
                  title={msg.planTitle || ""}
                  outcomes={msg.planOutcomes || []}
                  onRun={handleRun}
                  disabled={isRunning}
                />
              );
            case "divider":
              return <AgentDivider key={msg.id} />;
            case "step":
              return (
                <StepMessage
                  key={msg.id}
                  message={msg}
                  onStepClick={onStepClick}
                  onAddSourceClick={onOpenSourceBoardEntry}
                />
              );
            case "think":
              return (
                <StepMessage key={msg.id} message={msg} />
              );
            case "result":
              return (
                <ForecastResultCard
                  key={msg.id}
                  submission={msg.submission || {}}
                  exitStatus={msg.exitStatus || "unknown"}
                />
              );
            case "error":
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="pl-12"
                >
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                    {msg.content}
                  </div>
                </motion.div>
              );
            default:
              return null;
          }
        })}

        {(isPlanning || isRunning) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pl-12 flex items-center gap-2"
          >
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
            <span className="text-xs text-gray-400">
              {isPlanning ? "Generating plan..." : "Agent is thinking..."}
            </span>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="flex-shrink-0 border-t border-gray-200 bg-white/80 backdrop-blur-sm px-6 py-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={inputDisabled}
            placeholder={
              inputDisabled
                ? "Agent is running..."
                : !hasRequiredKeys
                  ? "Configure API keys in Settings first..."
                  : "Ask a forecasting question..."
            }
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-400 placeholder:text-gray-400"
          />
          <button
            type="submit"
            disabled={inputDisabled || !input.trim()}
            className="px-5 py-2.5 text-sm font-medium rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>

      <div className="absolute bottom-24 right-5 border border-gray-300 bg-white/80 backdrop-blur-sm px-3 py-2 text-xs text-gray-600 space-y-1 pointer-events-none">
        <p>
          <span className="font-mono text-gray-900">Ctrl+K</span> Toggle Settings
          ({settingsOpen ? "Open" : "Closed"})
        </p>
        <p className={hasForecastPlans ? "text-gray-600" : "text-gray-400"}>
          <span className="font-mono text-gray-900">Ctrl+O</span> Open latest forecast editor
        </p>
      </div>
    </div>
  );
}
