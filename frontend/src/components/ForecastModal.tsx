"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface EditProps {
  mode: "edit";
  title: string;
  outcomes: string[];
  onSave: (title: string, outcomes: string[]) => void;
  onClose: () => void;
}

interface ViewProps {
  mode: "view";
  submission: Record<string, number>;
  onClose: () => void;
}

type ForecastModalProps = EditProps | ViewProps;

export default function ForecastModal(props: ForecastModalProps) {
  const { mode, onClose } = props;

  if (mode === "view") {
    const { submission } = props;
    const sorted = Object.entries(submission).sort(([, a], [, b]) => b - a);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 w-full max-w-lg mx-4"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Forecast Results
          </h3>
          <div className="space-y-3">
            {sorted.map(([name, prob]) => (
              <div key={name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium">{name}</span>
                  <span className="text-gray-500">
                    {(prob * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="bg-purple-500 h-2.5 rounded-full transition-all"
                    style={{ width: `${Math.max(prob * 100, 1)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={onClose}
            className="mt-6 w-full py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </motion.div>
      </div>
    );
  }

  return <EditModal {...props} />;
}

function EditModal({
  title: initialTitle,
  outcomes: initialOutcomes,
  onSave,
  onClose,
}: EditProps) {
  const [title, setTitle] = useState(initialTitle);
  const [outcomes, setOutcomes] = useState(initialOutcomes.join(", "));

  const handleSave = () => {
    const parsed = outcomes
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
    if (title.trim() && parsed.length >= 2) {
      onSave(title.trim(), parsed);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 w-full max-w-lg mx-4"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Edit Forecast
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Outcomes (comma-separated)
            </label>
            <textarea
              value={outcomes}
              onChange={(e) => setOutcomes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
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
