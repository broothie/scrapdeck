import { memo, type MouseEvent } from "react";
import { NodeResizer, type Node, type NodeProps } from "@xyflow/react";
import { useTheme } from "tamagui";
import type { Scrap } from "@scrapdeck/core";
import { ImageScrapCard } from "./scraps/ImageScrap";
import { LinkScrapCard } from "./scraps/LinkScrap";
import { NoteScrapCard } from "./scraps/NoteScrap";

export type ScrapNodeData = {
  scrap: Scrap;
  boardId: string;
  onDelete: (scrapId: string) => void;
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
  const theme = useTheme();

  const handleDelete = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    data.onDelete(data.scrap.id);
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      <button
        type="button"
        aria-label={`Delete ${data.scrap.type} scrap`}
        className="nodrag nopan"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={handleDelete}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 10,
          border: `1px solid ${theme.borderSubtle.val}`,
          borderRadius: 999,
          backgroundColor: theme.overlay.val,
          color: theme.textPrimary.val,
          fontSize: 12,
          lineHeight: 1,
          padding: "0.3rem 0.45rem",
          cursor: "pointer",
        }}
      >
        Del
      </button>
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
        {data.scrap.type === "note" ? (
          <NoteScrapCard boardId={data.boardId} scrap={data.scrap} />
        ) : null}
        {data.scrap.type === "image" ? <ImageScrapCard scrap={data.scrap} /> : null}
        {data.scrap.type === "link" ? <LinkScrapCard scrap={data.scrap} /> : null}
      </div>
    </div>
  );
}

export const ScrapNode = memo(ScrapNodeComponent);
