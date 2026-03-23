import type { Note } from "@plumboard/core";
import { placementColors } from "@plumboard/core";
import type { Node } from "@xyflow/react";
import { PLACEMENT_PREVIEW_NODE_ID } from "./boardSurface.constants";
import type { PlacementNodeData, PlacementPreview } from "./boardSurface.types";

type DragDataSource = {
  files?: ArrayLike<unknown>;
  types?: Iterable<string>;
  getData?: (format: string) => string;
};

export function getPlacementColor(noteType: Note["type"]): string {
  return placementColors[noteType];
}

export function withAlpha(hexColor: string, alpha: number) {
  const normalized = hexColor.replace("#", "");
  const hasValidLength = normalized.length === 3 || normalized.length === 6;

  if (!hasValidLength) {
    return hexColor;
  }

  const expanded = normalized.length === 3
    ? normalized.split("").map((value) => `${value}${value}`).join("")
    : normalized;

  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

type ClampContextMenuPositionOptions = {
  rawX: number;
  rawY: number;
  paneWidth: number;
  paneHeight: number;
  clampWidth: number;
  menuHeight: number;
  inset: number;
};

export function clampContextMenuPosition(options: ClampContextMenuPositionOptions) {
  return {
    x: Math.max(
      options.inset,
      Math.min(options.rawX, options.paneWidth - options.clampWidth - options.inset),
    ),
    y: Math.max(
      options.inset,
      Math.min(options.rawY, options.paneHeight - options.menuHeight - options.inset),
    ),
  };
}

type MiniMapPalette = {
  textMuted: string;
  accentLight: string;
  accentDefault: string;
  accentStrong: string;
};

export function getMiniMapNodeColor(node: Node, palette: MiniMapPalette): string {
  const note = (node.data as { note?: Note } | undefined)?.note;

  if (!note) {
    return palette.textMuted;
  }

  if (note.type === "text") {
    return palette.accentLight;
  }

  if (note.type === "image") {
    return palette.accentDefault;
  }

  return palette.accentStrong;
}

export function buildPlacementPreviewNode(
  placementPreview: PlacementPreview,
  placementPosition: { x: number; y: number },
): Node<PlacementNodeData, "placement-preview"> {
  return {
    id: PLACEMENT_PREVIEW_NODE_ID,
    type: "placement-preview",
    position: placementPosition,
    width: placementPreview.width,
    height: placementPreview.height,
    data: {
      width: placementPreview.width,
      height: placementPreview.height,
      borderColor: getPlacementColor(placementPreview.type),
    },
    selectable: false,
    draggable: false,
    deletable: false,
  };
}

export function resolveDroppedContentType(dataTransfer: DragDataSource | null | undefined): Note["type"] | null {
  if (!dataTransfer) {
    return null;
  }

  if ((dataTransfer.files?.length ?? 0) > 0) {
    return "image";
  }

  const dataTypes = new Set(
    Array.from(dataTransfer.types ?? [])
      .map((type) => type.toLowerCase()),
  );

  if (dataTypes.has("files")) {
    return "image";
  }

  if (dataTypes.has("text/uri-list") || dataTypes.has("text/plain")) {
    return "link";
  }

  return null;
}

function normalizeUrlCandidate(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  try {
    const parsedUrl = new URL(trimmed);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return "";
    }

    return parsedUrl.toString();
  } catch {
    return "";
  }
}

export function extractDroppedUrl(dataTransfer: DragDataSource | null | undefined): string {
  if (!dataTransfer?.getData) {
    return "";
  }

  const uriList = dataTransfer.getData("text/uri-list");
  const uriListCandidate = uriList
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("#"));
  const normalizedFromUriList = normalizeUrlCandidate(uriListCandidate ?? "");

  if (normalizedFromUriList) {
    return normalizedFromUriList;
  }

  const plainText = dataTransfer
    .getData("text/plain")
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line);

  return normalizeUrlCandidate(plainText ?? "");
}
