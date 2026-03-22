import { describe, expect, it } from "vitest";
import type { Node } from "@xyflow/react";
import {
  buildPlacementPreviewNode,
  clampContextMenuPosition,
  getMiniMapNodeColor,
} from "../../../../packages/ui/src/components/board/boardSurface.utils";

describe("boardSurface utils", () => {
  it("clamps context menu coordinates into the canvas bounds", () => {
    const position = clampContextMenuPosition({
      rawX: 999,
      rawY: -40,
      paneWidth: 800,
      paneHeight: 600,
      clampWidth: 172,
      menuHeight: 212,
      inset: 12,
    });

    expect(position).toEqual({
      x: 616,
      y: 12,
    });
  });

  it("builds a placement preview node with expected shape", () => {
    const node = buildPlacementPreviewNode(
      { type: "note", width: 260, height: 190 },
      { x: 120, y: 80 },
    );

    expect(node.id).toBe("__placement-preview__");
    expect(node.type).toBe("placement-preview");
    expect(node.data.width).toBe(260);
    expect(node.data.height).toBe(190);
    expect(node.selectable).toBe(false);
  });

  it("resolves minimap colors by scrap type", () => {
    const palette = {
      textMuted: "#111",
      accentLight: "#222",
      accentDefault: "#333",
      accentStrong: "#444",
    };
    const noteNode = { data: { scrap: { type: "note" } } } as unknown as Node;
    const imageNode = { data: { scrap: { type: "image" } } } as unknown as Node;
    const linkNode = { data: { scrap: { type: "link" } } } as unknown as Node;
    const emptyNode = { data: {} } as unknown as Node;

    expect(getMiniMapNodeColor(noteNode, palette)).toBe("#222");
    expect(getMiniMapNodeColor(imageNode, palette)).toBe("#333");
    expect(getMiniMapNodeColor(linkNode, palette)).toBe("#444");
    expect(getMiniMapNodeColor(emptyNode, palette)).toBe("#111");
  });
});
