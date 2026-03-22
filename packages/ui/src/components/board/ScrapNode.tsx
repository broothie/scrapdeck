import { memo } from "react";
import { NodeResizer, NodeToolbar, Position, type Node, type NodeProps } from "@xyflow/react";
import type { Scrap } from "@plumboard/core";
import { ImageScrapCard } from "./scraps/ImageScrap";
import { LinkScrapCard } from "./scraps/LinkScrap";
import { NoteScrapCard } from "./scraps/NoteScrap";
import {
  resolveScrapMenuActions,
  ScrapActionMenu,
  type ScrapContextMenuAction,
} from "./ScrapActionMenu";

export type ScrapNodeData = {
  scrap: Scrap;
  boardId: string;
  showPinnedMenu: boolean;
  onMenuAction: (scrapId: string, action: ScrapContextMenuAction) => void;
  onAutoGrowHeight: (scrapId: string, nextHeight: number) => void;
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
        position: "relative",
      }}
    >
      <NodeToolbar
        isVisible={selected && data.showPinnedMenu}
        position={Position.Right}
        align="start"
        offset={10}
      >
        <ScrapActionMenu
          actions={resolveScrapMenuActions(data.scrap.type)}
          onAction={(action) => data.onMenuAction(data.scrap.id, action)}
        />
      </NodeToolbar>
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
            ? "0 10px 22px rgba(5, 8, 14, 0.12)"
            : "0 4px 10px rgba(5, 8, 14, 0.08)",
        }}
      >
        {data.scrap.type === "note" ? (
          <NoteScrapCard
            boardId={data.boardId}
            scrap={data.scrap}
            onAutoGrowHeight={(nextHeight) => data.onAutoGrowHeight(data.scrap.id, nextHeight)}
          />
        ) : null}
        {data.scrap.type === "image" ? <ImageScrapCard scrap={data.scrap} /> : null}
        {data.scrap.type === "link" ? <LinkScrapCard scrap={data.scrap} /> : null}
      </div>
    </div>
  );
}

export const ScrapNode = memo(ScrapNodeComponent);
