"use client";

import { useCallback, useRef, useState } from "react";
import type {
  AgentEvent,
  ChatMessage,
  SearchGroup,
  BoardEntry,
  UserSettings,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

let msgCounter = 0;
function nextId(): string {
  return `msg_${++msgCounter}_${Date.now()}`;
}

export default function useAgentStream() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const stepRef = useRef(0);

  const searchGroupsRef = useRef<SearchGroup[]>([]);
  const boardRef = useRef<BoardEntry[]>([]);

  const onSearchResult = useRef<((g: SearchGroup) => void) | null>(null);
  const onBoardUpdate = useRef<((e: BoardEntry[]) => void) | null>(null);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const plan = useCallback(
    async (prompt: string, settings: UserSettings) => {
      setIsPlanning(true);
      addMessage({
        id: nextId(),
        type: "user",
        content: prompt,
        timestamp: Date.now(),
      });

      try {
        const res = await fetch(`${API_BASE}/api/plan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, settings }),
        });
        const data = await res.json();

        if (data.status === "success" && data.title && data.outcomes) {
          addMessage({
            id: nextId(),
            type: "plan",
            content: "",
            timestamp: Date.now(),
            planTitle: data.title,
            planOutcomes: data.outcomes,
          });
        } else {
          addMessage({
            id: nextId(),
            type: "error",
            content: data.message || "Failed to generate a forecasting plan.",
            timestamp: Date.now(),
            isError: true,
          });
        }
      } catch (err) {
        addMessage({
          id: nextId(),
          type: "error",
          content: `Network error: ${err}`,
          timestamp: Date.now(),
          isError: true,
        });
      } finally {
        setIsPlanning(false);
      }
    },
    [addMessage]
  );

  const startRun = useCallback(
    async (title: string, outcomes: string[], settings: UserSettings) => {
      setIsRunning(true);
      stepRef.current = 0;
      searchGroupsRef.current = [];
      boardRef.current = [];

      addMessage({
        id: nextId(),
        type: "divider",
        content: "",
        timestamp: Date.now(),
      });

      try {
        const res = await fetch(`${API_BASE}/api/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, outcomes, settings }),
        });
        const { run_id } = await res.json();

        const eventSource = new EventSource(
          `${API_BASE}/api/run/${run_id}/stream`
        );

        eventSource.onmessage = (ev) => {
          try {
            const event: AgentEvent = JSON.parse(ev.data);
            handleEvent(event);
          } catch {
            // ignore parse errors on ping
          }
        };

        eventSource.onerror = () => {
          eventSource.close();
          setIsRunning(false);
        };
      } catch (err) {
        addMessage({
          id: nextId(),
          type: "error",
          content: `Failed to start agent: ${err}`,
          timestamp: Date.now(),
          isError: true,
        });
        setIsRunning(false);
      }
    },
    [addMessage]
  );

  const handleEvent = useCallback(
    (event: AgentEvent) => {
      switch (event.type) {
        case "step_start":
          stepRef.current = event.step;
          break;

        case "model_response": {
          if (event.content && event.actions.length === 0) {
            addMessage({
              id: nextId(),
              type: "think",
              content: event.content,
              timestamp: Date.now(),
              stepNumber: stepRef.current,
            });
          }
          break;
        }

        case "observation": {
          if (event.tool === "search") {
            const group: SearchGroup = {
              stepNumber: stepRef.current,
              query: event.query || "",
              results: event.search_results || [],
            };
            searchGroupsRef.current = [
              ...searchGroupsRef.current,
              group,
            ];
            onSearchResult.current?.(group);

            addMessage({
              id: nextId(),
              type: "step",
              content: "",
              timestamp: Date.now(),
              stepNumber: stepRef.current,
              toolName: "search",
              searchData: {
                query: event.query || "",
                results: event.search_results || [],
                count: event.search_results?.length || 0,
              },
            });
          } else if (event.tool === "add_source") {
            addMessage({
              id: nextId(),
              type: "step",
              content: "",
              timestamp: Date.now(),
              stepNumber: stepRef.current,
              toolName: "add_source",
              addSourceData: {
                sourceId: event.source_id || "",
                note: event.note || "",
              },
            });
          } else if (event.tool === "edit_note") {
            addMessage({
              id: nextId(),
              type: "step",
              content: "",
              timestamp: Date.now(),
              stepNumber: stepRef.current,
              toolName: "edit_note",
              editNoteData: {
                boardId: event.board_id || 0,
                newNote: event.new_note || "",
              },
            });
          } else if (event.tool === "submit") {
            // handled by run_end
          }
          break;
        }

        case "run_end": {
          if (event.board && event.board.length > 0) {
            boardRef.current = event.board;
            onBoardUpdate.current?.(event.board);
          }

          addMessage({
            id: nextId(),
            type: "result",
            content: "",
            timestamp: Date.now(),
            submission: event.submission,
            exitStatus: event.exit_status,
            board: event.board,
          });
          setIsRunning(false);
          break;
        }
      }
    },
    [addMessage]
  );

  return {
    messages,
    isRunning,
    isPlanning,
    plan,
    startRun,
    onSearchResult,
    onBoardUpdate,
  };
}
