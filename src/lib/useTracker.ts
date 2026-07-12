"use client";

import { useCallback, useEffect, useState } from "react";
import type { RankedJob } from "./types";

// Per-browser saved/applied tracker. No account needed; persists in
// localStorage. Cross-device sync is the phase-2 accounts upgrade.
const SAVED_KEY = "beacon.saved.v1";
const APPLIED_KEY = "beacon.applied.v1";

export type SavedJob = RankedJob;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked; ignore */
  }
}

export function useTracker() {
  const [saved, setSaved] = useState<SavedJob[]>([]);
  const [applied, setApplied] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSaved(read<SavedJob[]>(SAVED_KEY, []));
    setApplied(read<string[]>(APPLIED_KEY, []));
    setReady(true);
  }, []);

  const isSaved = useCallback(
    (id: string) => saved.some((j) => j.id === id),
    [saved]
  );
  const isApplied = useCallback(
    (id: string) => applied.includes(id),
    [applied]
  );

  const toggleSaved = useCallback((job: SavedJob) => {
    setSaved((prev) => {
      const next = prev.some((j) => j.id === job.id)
        ? prev.filter((j) => j.id !== job.id)
        : [job, ...prev];
      write(SAVED_KEY, next);
      return next;
    });
  }, []);

  const markApplied = useCallback((id: string) => {
    setApplied((prev) => {
      if (prev.includes(id)) return prev;
      const next = [id, ...prev];
      write(APPLIED_KEY, next);
      return next;
    });
  }, []);

  const unmarkApplied = useCallback((id: string) => {
    setApplied((prev) => {
      const next = prev.filter((x) => x !== id);
      write(APPLIED_KEY, next);
      return next;
    });
  }, []);

  return {
    ready,
    saved,
    applied,
    isSaved,
    isApplied,
    toggleSaved,
    markApplied,
    unmarkApplied,
  };
}
