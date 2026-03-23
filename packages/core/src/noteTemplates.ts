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
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function resolveNoteDefaults(type: Note["type"]) {
  return noteDefaults[type];
}
