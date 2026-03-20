import { memo } from "react";
import { NodeResizer, type Node, type NodeProps } from "@xyflow/react";
import type { Scrap } from "@scrapdeck/core";
import { ImageScrapCard } from "./scraps/ImageScrap";
import { LinkScrapCard } from "./scraps/LinkScrap";
import { NoteScrapCard } from "./scraps/NoteScrap";

export type ScrapNodeData = {
  scrap: Scrap;
  onResizeEnd: (
    scrapId: string,
    nextLayout: Pick<Scrap, "x" | "y" | "width" | "height">,
  ) => void;
};

export type ScrapFlowNode = Node<ScrapNodeData, "scrap">;

function ScrapNodeComponent({
  data,
  selected,
  positionAbsoluteX,
  positionAbsoluteY,
}: NodeProps<ScrapFlowNode>) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={220}
        minHeight={140}
        lineStyle={{ borderColor: "#7f8cff" }}
        handleStyle={{
          width: 10,
          height: 10,
          borderRadius: 999,
          border: "1px solid #dce4ff",
          background: "#7f8cff",
        }}
        onResizeEnd={(_, params) => {
          data.onResizeEnd(data.scrap.id, {
            x: params.x ?? positionAbsoluteX ?? data.scrap.x,
            y: params.y ?? positionAbsoluteY ?? data.scrap.y,
            width: params.width,
            height: params.height,
          });
        }}
      />
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 18,
          boxShadow: selected
            ? "0 0 0 2px rgba(127, 140, 255, 0.55), 0 18px 48px rgba(5, 8, 14, 0.24)"
            : "0 14px 34px rgba(5, 8, 14, 0.18)",
        }}
      >
        {data.scrap.type === "note" ? <NoteScrapCard scrap={data.scrap} /> : null}
        {data.scrap.type === "image" ? <ImageScrapCard scrap={data.scrap} /> : null}
        {data.scrap.type === "link" ? <LinkScrapCard scrap={data.scrap} /> : null}
      </div>
    </div>
  );
}

export const ScrapNode = memo(ScrapNodeComponent);
