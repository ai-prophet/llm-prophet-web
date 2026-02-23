"use client";

import { motion } from "framer-motion";

export default function AgentDivider() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-4 py-2"
    >
      <div className="flex-1 border-t border-dashed border-gray-300" />
      <span className="text-xs font-medium text-gray-400 tracking-wide uppercase">
        Agent Start
      </span>
      <div className="flex-1 border-t border-dashed border-gray-300" />
    </motion.div>
  );
}
