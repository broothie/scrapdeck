import { memo } from "react";
import { NodeResizer, NodeToolbar, Position, type Node, type NodeProps } from "@xyflow/react";
import type { Note } from "@plumboard/core";
import { ImageNoteCard } from "./notes/ImageNote";
import { LinkNoteCard } from "./notes/LinkNote";
import { TextNoteCard } from "./notes/TextNote";
import {
  resolveNoteMenuActions,
  NoteActionMenu,
  type NoteContextMenuAction,
} from "./NoteActionMenu";

export type NoteNodeData = {
  note: Note;
  boardId: string;
  showPinnedMenu: boolean;
  shouldStartEditing?: boolean;
  onStartEditingHandled?: () => void;
  shouldOpenLightbox?: boolean;
  onOpenLightboxHandled?: () => void;
  onMenuAction: (noteId: string, action: NoteContextMenuAction) => void;
  onAutoGrowHeight: (noteId: string, nextHeight: number) => void;
  onResizeEnd: (
    noteId: string,
    nextLayout: Pick<Note, "x" | "y" | "width" | "height">,
  ) => void;
};

export type NoteFlowNode = Node<NoteNodeData, "note">;

function NoteNodeComponent({
  data,
  selected,
  positionAbsoluteX,
  positionAbsoluteY,
}: NodeProps<NoteFlowNode>) {
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
        <NoteActionMenu
          actions={resolveNoteMenuActions(data.note)}
          onAction={(action) => data.onMenuAction(data.note.id, action)}
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
          data.onResizeEnd(data.note.id, {
            x: params.x ?? positionAbsoluteX ?? data.note.x,
            y: params.y ?? positionAbsoluteY ?? data.note.y,
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
        {data.note.type === "text" ? (
          <TextNoteCard
            boardId={data.boardId}
            note={data.note}
            shouldStartEditing={data.shouldStartEditing}
            onStartEditingHandled={data.onStartEditingHandled}
            onAutoGrowHeight={(nextHeight) => data.onAutoGrowHeight(data.note.id, nextHeight)}
          />
        ) : null}
        {data.note.type === "image" ? (
          <ImageNoteCard
            note={data.note}
            shouldOpenLightbox={data.shouldOpenLightbox}
            onOpenLightboxHandled={data.onOpenLightboxHandled}
          />
        ) : null}
        {data.note.type === "link" ? <LinkNoteCard note={data.note} /> : null}
      </div>
    </div>
  );
}

export const NoteNode = memo(NoteNodeComponent);
