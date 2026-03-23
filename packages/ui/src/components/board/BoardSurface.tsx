import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type Node,
  type NodeTypes,
  type ReactFlowInstance,
  useNodesState,
} from "@xyflow/react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { Text, View, useTheme } from "tamagui";
import { useAppStore, type Board, type Note } from "@plumboard/core";
import { PlacementPreviewNode } from "./PlacementPreviewNode";
import {
  resolveNoteMenuActions,
  NoteActionMenu,
  type NoteContextMenuAction,
} from "./NoteActionMenu";
import { NoteCreateFab } from "./NoteCreateFab";
import { NoteNode, type NoteFlowNode } from "./NoteNode";
import {
  CONTEXT_MENU_CLAMP_WIDTH,
  CONTEXT_MENU_HEIGHT,
  CONTEXT_MENU_INSET,
  CONTROLS_PANEL_GAP,
  MINIMAP_SIZE,
} from "./boardSurface.constants";
import type { FabAction, PlacementPreview, NoteContextMenuState } from "./boardSurface.types";
import {
  buildPlacementPreviewNode,
  clampContextMenuPosition,
  getMiniMapNodeColor,
  withAlpha,
} from "./boardSurface.utils";
import { useNoteMenuActions } from "./useNoteMenuActions";

const nodeTypes: NodeTypes = {
  note: NoteNode,
  "placement-preview": PlacementPreviewNode,
};

type BoardSurfaceProps = {
  board: Board;
  isUploadingFile?: boolean;
  onCreateTextNote?: () => void;
  onCreateFile?: () => void;
  onCreateLink?: () => void;
  onEditLinkNote?: (noteId: string) => boolean;
  placementPreview?: PlacementPreview | null;
  onPlaceNote?: (position: { x: number; y: number }) => void;
};

export function BoardSurface({
  board,
  isUploadingFile,
  onCreateTextNote,
  onCreateFile,
  onCreateLink,
  onEditLinkNote,
  placementPreview,
  onPlaceNote,
}: BoardSurfaceProps) {
  const theme = useTheme();
  const updateNoteLayout = useAppStore((state) => state.updateNoteLayout);
  const boardSurfaceRef = useRef<HTMLDivElement | null>(null);
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [placementPosition, setPlacementPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [noteContextMenu, setNoteContextMenu] = useState<NoteContextMenuState | null>(null);
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const handleNoteActionComplete = useCallback((noteId: string, action: NoteContextMenuAction) => {
    if (action !== "send-back") {
      return;
    }

    setNodes((previousNodes) =>
      previousNodes.map((node) =>
        node.id === noteId
          ? { ...node, selected: false }
          : node,
      ));
  }, [setNodes]);
  const { runNoteMenuAction } = useNoteMenuActions(board, {
    onActionComplete: handleNoteActionComplete,
    onEditLinkNote,
  });

  useEffect(() => {
    setNodes((previousNodes) => {
      const selectedNodeIds = new Set(
        previousNodes
          .filter((node) => node.selected)
          .map((node) => node.id),
      );

      return board.notes.map((note, index) => ({
        id: note.id,
        type: "note",
        selected: selectedNodeIds.has(note.id),
        position: {
          x: note.x,
          y: note.y,
        },
        zIndex: index + 1,
        width: note.width,
        height: note.height,
        data: {
          boardId: board.id,
          note,
          showPinnedMenu: !noteContextMenu,
          onMenuAction: runNoteMenuAction,
          onAutoGrowHeight: (noteId: string, nextHeight: number) => {
            if (nextHeight <= note.height + 1) {
              return;
            }

            updateNoteLayout(board.id, noteId, { height: nextHeight });
          },
          onResizeEnd: (
            noteId: string,
            nextLayout: Pick<Note, "x" | "y" | "width" | "height">,
          ) => {
            updateNoteLayout(board.id, noteId, nextLayout);
          },
        },
      }));
    });
  }, [board, runNoteMenuAction, noteContextMenu, setNodes, updateNoteLayout]);

  useEffect(() => {
    setNoteContextMenu(null);
    setIsFabMenuOpen(false);
  }, [board.id]);

  useEffect(() => {
    if (!noteContextMenu && !isFabMenuOpen) {
      return;
    }

    const handleGlobalPointerDown = () => {
      setNoteContextMenu(null);
      setIsFabMenuOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNoteContextMenu(null);
        setIsFabMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", handleGlobalPointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("pointerdown", handleGlobalPointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isFabMenuOpen, noteContextMenu]);

  const handleNodeDragStop = (_event: unknown, node: Node) => {
    if (node.type !== "note") {
      return;
    }

    const noteNode = node as NoteFlowNode;

    updateNoteLayout(board.id, node.id, {
      x: noteNode.position.x,
      y: noteNode.position.y,
    });
  };

  const runNoteContextMenuAction = (action: NoteContextMenuAction) => {
    if (!noteContextMenu) {
      return;
    }

    runNoteMenuAction(noteContextMenu.noteId, action);
    setNoteContextMenu(null);
  };

  const getFlowPositionFromEvent = (event: ReactMouseEvent) => {
    if (!flowInstance) {
      return null;
    }

    if (typeof event.clientX !== "number" || typeof event.clientY !== "number") {
      return null;
    }

    return flowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handlePaneMouseMove = (event: ReactMouseEvent) => {
    if (!placementPreview) {
      return;
    }

    const resolvedPosition = getFlowPositionFromEvent(event);

    if (!resolvedPosition) {
      return;
    }

    setPlacementPosition(resolvedPosition);
  };

  const handlePaneMouseLeave = () => {
    if (!placementPreview) {
      return;
    }

    setPlacementPosition(null);
  };

  const handlePaneClick = (event: ReactMouseEvent) => {
    setNoteContextMenu(null);
    setIsFabMenuOpen(false);

    if (!placementPreview || !onPlaceNote) {
      return;
    }

    const resolvedPosition = getFlowPositionFromEvent(event);

    if (!resolvedPosition) {
      return;
    }

    onPlaceNote({
      x: resolvedPosition.x,
      y: resolvedPosition.y,
    });
    setPlacementPosition(null);
  };

  const handleInit = (instance: ReactFlowInstance<Node>) => {
    setFlowInstance(instance);
  };

  const handleNodeContextMenu = (event: ReactMouseEvent, node: Node) => {
    if (node.type !== "note") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const paneBounds = boardSurfaceRef.current?.getBoundingClientRect();

    if (!paneBounds) {
      return;
    }

    const rawX = event.clientX - paneBounds.left;
    const rawY = event.clientY - paneBounds.top;
    const { x, y } = clampContextMenuPosition({
      rawX,
      rawY,
      paneWidth: paneBounds.width,
      paneHeight: paneBounds.height,
      clampWidth: CONTEXT_MENU_CLAMP_WIDTH,
      menuHeight: CONTEXT_MENU_HEIGHT,
      inset: CONTEXT_MENU_INSET,
    });

    setNoteContextMenu({
      noteId: node.id,
      x,
      y,
    });
    setIsFabMenuOpen(false);
  };

  const handleFabAction = (action: FabAction) => {
    if (action === "text") {
      onCreateTextNote?.();
      setIsFabMenuOpen(false);
      return;
    }

    if (action === "file") {
      onCreateFile?.();
      setIsFabMenuOpen(false);
      return;
    }

    onCreateLink?.();
    setIsFabMenuOpen(false);
  };

  const flowNodes = useMemo<Node[]>(() => {
    if (!placementPreview || !placementPosition) {
      return nodes;
    }

    return [...nodes, buildPlacementPreviewNode(placementPreview, placementPosition)];
  }, [nodes, placementPreview, placementPosition]);
  const contextMenuNote = noteContextMenu
    ? board.notes.find((note) => note.id === noteContextMenu.noteId)
    : null;
  const placementLabel = placementPreview
    ? ({
        text: "text note",
        image: "file note",
        link: "link note",
      }[placementPreview.type])
    : "";

  return (
    <div
      ref={boardSurfaceRef}
      style={{
        position: "relative",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        backgroundColor: theme.surface.val,
      }}
    >
      <ReactFlow
        key={board.id}
        className="plumboard-flow"
        nodes={flowNodes}
        edges={[]}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeDragStop={handleNodeDragStop}
        onNodeContextMenu={handleNodeContextMenu}
        onPaneMouseMove={handlePaneMouseMove}
        onPaneMouseLeave={handlePaneMouseLeave}
        onPaneClick={handlePaneClick}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        minZoom={0.4}
        maxZoom={1.8}
        panOnDrag={!placementPreview}
        panOnScroll
        proOptions={{ hideAttribution: true }}
        onInit={handleInit}
        deleteKeyCode={null}
        nodesConnectable={false}
        nodesFocusable
      >
        <Background
          color={withAlpha(theme.borderDefault.val, 0.7)}
          gap={24}
          size={1.6}
          variant={BackgroundVariant.Dots}
        />
        <MiniMap
          position="bottom-right"
          style={{
            width: MINIMAP_SIZE.width,
            height: MINIMAP_SIZE.height,
          }}
          pannable
          zoomable
          bgColor={theme.surfaceHover.val}
          maskColor={withAlpha(theme.overlay.val, 0.68)}
          maskStrokeColor={theme.borderStrong.val}
          maskStrokeWidth={1.5}
          nodeStrokeColor={theme.borderStrong.val}
          nodeColor={(node) => getMiniMapNodeColor(node, {
            textMuted: theme.textMuted.val,
            accentLight: theme.accentLight.val,
            accentDefault: theme.accentDefault.val,
            accentStrong: theme.accentStrong.val,
          })}
        />
        <Controls
          showInteractive={false}
          position="bottom-right"
          style={{
            right: MINIMAP_SIZE.width + CONTROLS_PANEL_GAP,
          }}
        />
      </ReactFlow>
      {noteContextMenu ? (
        <div
          style={{
            position: "absolute",
            left: noteContextMenu.x,
            top: noteContextMenu.y,
            zIndex: 30,
          }}
        >
          <NoteActionMenu
            actions={contextMenuNote ? resolveNoteMenuActions(contextMenuNote.type) : undefined}
            onAction={runNoteContextMenuAction}
          />
        </div>
      ) : null}
      <NoteCreateFab
        isOpen={isFabMenuOpen}
        isUploadingFile={isUploadingFile}
        onToggle={() => setIsFabMenuOpen((current) => !current)}
        onAction={handleFabAction}
      />
      {placementPreview ? (
        <View
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            zIndex: 6,
            padding: "0.45rem 0.8rem",
            border: `1px solid ${theme.borderSubtle.val}`,
            borderRadius: 999,
            backgroundColor: theme.overlay.val,
            backdropFilter: "blur(12px)",
            pointerEvents: "none",
          }}
        >
          <Text style={{ color: theme.textPrimary.val, fontSize: 13 }}>
            {`Place ${placementLabel}`}
          </Text>
        </View>
      ) : null}
    </div>
  );
}
