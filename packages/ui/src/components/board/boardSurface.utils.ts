import type { Scrap } from "@scrapdeck/core";
import { placementColors } from "@scrapdeck/core";
import type { Node } from "@xyflow/react";
import { PLACEMENT_PREVIEW_NODE_ID } from "./boardSurface.constants";
import type { PlacementNodeData, PlacementPreview } from "./boardSurface.types";

export function getPlacementColor(scrapType: Scrap["type"]): string {
  return placementColors[scrapType];
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
  const scrap = (node.data as { scrap?: Scrap } | undefined)?.scrap;

  if (!scrap) {
    return palette.textMuted;
  }

  if (scrap.type === "note") {
    return palette.accentLight;
  }

  if (scrap.type === "image") {
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
