import type { Note } from "@plumboard/core";

export type PlacementPreview = {
  type: Note["type"];
  width: number;
  height: number;
};

export type PlacementNodeData = {
  width: number;
  height: number;
  borderColor: string;
};

export type NoteContextMenuState = {
  noteId: string;
  x: number;
  y: number;
};

export type CanvasAddMenuState = {
  x: number;
  y: number;
};

export type FabAction = "text" | "file" | "link";
