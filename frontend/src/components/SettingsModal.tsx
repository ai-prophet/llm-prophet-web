"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { UserSettings } from "@/types";

interface SettingsModalProps {
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
  onClose: () => void;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

const INPUT_CLS =
  "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none font-mono";

const SELECT_CLS =
  "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white";

export default function SettingsModal({
  settings: initial,
  onSave,
  onClose,
}: SettingsModalProps) {
  const [draft, setDraft] = useState<UserSettings>({ ...initial });

  const set = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => setDraft((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  const needsOpenRouterKey = draft.model_class === "openrouter";
  const needsPerplexityKey = draft.search_backend === "perplexity";
  const needsBraveKey = draft.search_backend === "brave";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto custom-scrollbar"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-5">Settings</h3>

        <div className="space-y-5">
          <div className="border-b border-gray-100 pb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Model
            </p>
            <div className="space-y-3">
              <Field label="Model provider">
                <select
                  value={draft.model_class}
                  onChange={(e) =>
                    set(
                      "model_class",
                      e.target.value as "litellm" | "openrouter"
                    )
                  }
                  className={SELECT_CLS}
                >
                  <option value="litellm">LiteLLM (OpenAI, Anthropic, Google, etc.)</option>
                  <option value="openrouter">OpenRouter</option>
                </select>
              </Field>

              <Field
                label="Model name"
                hint="e.g. google/gemini-2.5-flash-preview-05-20, openai/gpt-4o, anthropic/claude-sonnet-4-20250514"
              >
                <input
                  type="text"
                  value={draft.model_name}
                  onChange={(e) => set("model_name", e.target.value)}
                  className={INPUT_CLS}
                  placeholder="google/gemini-2.5-flash-preview-05-20"
                />
              </Field>

              {needsOpenRouterKey && (
                <Field label="OpenRouter API key">
                  <input
                    type="password"
                    value={draft.openrouter_api_key}
                    onChange={(e) =>
                      set("openrouter_api_key", e.target.value)
                    }
                    className={INPUT_CLS}
                    placeholder="sk-or-..."
                  />
                </Field>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Search
            </p>
            <div className="space-y-3">
              <Field label="Search backend">
                <select
                  value={draft.search_backend}
                  onChange={(e) =>
                    set(
                      "search_backend",
                      e.target.value as "perplexity" | "brave"
                    )
                  }
                  className={SELECT_CLS}
                >
                  <option value="perplexity">Perplexity</option>
                  <option value="brave">Brave Search</option>
                </select>
              </Field>

              {needsPerplexityKey && (
                <Field label="Perplexity API key">
                  <input
                    type="password"
                    value={draft.perplexity_api_key}
                    onChange={(e) =>
                      set("perplexity_api_key", e.target.value)
                    }
                    className={INPUT_CLS}
                    placeholder="pplx-..."
                  />
                </Field>
              )}

              {needsBraveKey && (
                <Field label="Brave API key">
                  <input
                    type="password"
                    value={draft.brave_api_key}
                    onChange={(e) => set("brave_api_key", e.target.value)}
                    className={INPUT_CLS}
                    placeholder="BSA..."
                  />
                </Field>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 text-sm font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
          >
            Save
          </button>
        </div>
      </motion.div>
    </div>
  );
}
