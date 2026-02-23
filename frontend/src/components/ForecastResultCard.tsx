"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ForecastModal from "./ForecastModal";

interface ForecastResultCardProps {
  submission: Record<string, number>;
  exitStatus: string;
}

export default function ForecastResultCard({
  submission,
  exitStatus,
}: ForecastResultCardProps) {
  const [viewOpen, setViewOpen] = useState(false);
  const entries = Object.entries(submission).sort(([, a], [, b]) => b - a);
  const preview = entries.slice(0, 3);

  if (!submission || Object.keys(submission).length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="pl-12"
      >
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 shadow-sm">
          <p className="text-sm text-amber-800">
            Agent exited without submitting a forecast.
            <span className="text-xs text-amber-600 ml-2">
              ({exitStatus})
            </span>
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="pl-12"
      >
        <div className="bg-white border border-purple-200 rounded-xl px-5 py-4 shadow-sm">
          <p className="text-xs text-purple-600 font-medium mb-2">
            Final Forecast
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            {preview.map(([name, prob]) => (
              <div
                key={name}
                className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5"
              >
                <span className="text-sm font-medium text-gray-800">
                  {name}
                </span>
                <span className="text-sm text-purple-600 font-mono">
                  {(prob * 100).toFixed(1)}%
                </span>
              </div>
            ))}
            {entries.length > 3 && (
              <span className="text-xs text-gray-400">
                +{entries.length - 3} more
              </span>
            )}
            <button
              onClick={() => setViewOpen(true)}
              className="ml-auto px-4 py-1.5 text-sm font-medium rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors"
            >
              View
            </button>
          </div>
        </div>
      </motion.div>
      {viewOpen && (
        <ForecastModal
          mode="view"
          submission={submission}
          onClose={() => setViewOpen(false)}
        />
      )}
    </>
  );
}
