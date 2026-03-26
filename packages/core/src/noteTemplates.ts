import type { Note } from "./types";

export const noteDefaults = {
  text: {
    width: 260,
    height: 190,
  },
  image: {
    width: 320,
    height: 250,
  },
  link: {
    width: 360,
    height: 208,
  },
} as const;

export const placementColors = {
  text: "#f1c66f",
  image: "#7fd3b5",
  link: "#82a7ff",
} as const;

export function createNoteId(prefix: Note["type"]) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function resolveNoteDefaults(type: Note["type"]) {
  return noteDefaults[type];
}
