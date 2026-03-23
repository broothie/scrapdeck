import { describe, expect, it } from "vitest";
import type { Node } from "@xyflow/react";
import {
  buildPlacementPreviewNode,
  clampContextMenuPosition,
  extractDroppedUrl,
  getMiniMapNodeColor,
  resolveDroppedContentType,
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
      { type: "text", width: 260, height: 190 },
      { x: 120, y: 80 },
    );

    expect(node.id).toBe("__placement-preview__");
    expect(node.type).toBe("placement-preview");
    expect(node.data.width).toBe(260);
    expect(node.data.height).toBe(190);
    expect(node.selectable).toBe(false);
  });

  it("resolves minimap colors by note type", () => {
    const palette = {
      textMuted: "#111",
      accentLight: "#222",
      accentDefault: "#333",
      accentStrong: "#444",
    };
    const noteNode = { data: { note: { type: "text" } } } as unknown as Node;
    const imageNode = { data: { note: { type: "image" } } } as unknown as Node;
    const linkNode = { data: { note: { type: "link" } } } as unknown as Node;
    const emptyNode = { data: {} } as unknown as Node;

    expect(getMiniMapNodeColor(noteNode, palette)).toBe("#222");
    expect(getMiniMapNodeColor(imageNode, palette)).toBe("#333");
    expect(getMiniMapNodeColor(linkNode, palette)).toBe("#444");
    expect(getMiniMapNodeColor(emptyNode, palette)).toBe("#111");
  });

  it("resolves dropped content type for files and links", () => {
    expect(
      resolveDroppedContentType({
        files: { length: 0 },
        types: ["Files"],
      }),
    ).toBe("image");

    expect(
      resolveDroppedContentType({
        files: { length: 2 },
        types: ["Files"],
      }),
    ).toBe("image");

    expect(
      resolveDroppedContentType({
        files: { length: 0 },
        types: ["text/uri-list"],
      }),
    ).toBe("link");

    expect(
      resolveDroppedContentType({
        files: { length: 0 },
        types: ["text/plain"],
      }),
    ).toBe("link");

    expect(
      resolveDroppedContentType({
        files: { length: 0 },
        types: ["application/json"],
      }),
    ).toBeNull();
  });

  it("extracts dropped urls from uri-list and plain text payloads", () => {
    expect(
      extractDroppedUrl({
        getData: (format) => {
          if (format === "text/uri-list") {
            return "# comment\nhttps://example.com/listing\n";
          }

          return "";
        },
      }),
    ).toBe("https://example.com/listing");

    expect(
      extractDroppedUrl({
        getData: (format) => {
          if (format === "text/plain") {
            return "https://example.com/plain";
          }

          return "";
        },
      }),
    ).toBe("https://example.com/plain");

    expect(
      extractDroppedUrl({
        getData: (format) => {
          if (format === "text/plain") {
            return "not a url";
          }

          return "";
        },
      }),
    ).toBe("");
  });
});
