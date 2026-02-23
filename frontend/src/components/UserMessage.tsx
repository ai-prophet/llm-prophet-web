"use client";

import { motion } from "framer-motion";

interface UserMessageProps {
  content: string;
}

export default function UserMessage({ content }: UserMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-end"
    >
      <div className="max-w-[80%] flex items-start gap-3">
        <div className="bg-white border border-gray-200 rounded-2xl rounded-tr-sm px-5 py-3 shadow-sm">
          <p className="text-gray-900 text-[15px] leading-relaxed">{content}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center">
          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}
