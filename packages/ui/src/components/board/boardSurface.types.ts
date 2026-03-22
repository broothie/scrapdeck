import type { Scrap } from "@scrapdeck/core";

export type PlacementPreview = {
  type: Scrap["type"];
  width: number;
  height: number;
};

export type PlacementNodeData = {
  width: number;
  height: number;
  borderColor: string;
};

export type ScrapContextMenuState = {
  scrapId: string;
  x: number;
  y: number;
};

export type FabAction = "note" | "file" | "link";
