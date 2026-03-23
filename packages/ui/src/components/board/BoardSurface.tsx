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
import type { DragEvent as ReactDragEvent, MouseEvent as ReactMouseEvent } from "react";
import { Text, View, useTheme } from "tamagui";
import { resolveNoteDefaults, useAppStore, type Board, type Note } from "@plumboard/core";
import { PlacementPreviewNode } from "./PlacementPreviewNode";
import { AddNoteContextMenu } from "./AddNoteContextMenu";
import {
  resolveNoteMenuActions,
  NoteActionMenu,
  type NoteContextMenuAction,
} from "./NoteActionMenu";
import { NoteCreateFab } from "./NoteCreateFab";
import { NoteNode, type NoteFlowNode } from "./NoteNode";
import {
  ADD_MENU_CLAMP_WIDTH,
  ADD_MENU_HEIGHT,
  CONTEXT_MENU_CLAMP_WIDTH,
  CONTEXT_MENU_HEIGHT,
  CONTEXT_MENU_INSET,
  CONTROLS_PANEL_GAP,
  MINIMAP_SIZE,
} from "./boardSurface.constants";
import type {
  CanvasAddMenuState,
  FabAction,
  PlacementPreview,
  NoteContextMenuState,
} from "./boardSurface.types";
import {
  buildPlacementPreviewNode,
  clampContextMenuPosition,
  extractDroppedUrl,
  getMiniMapNodeColor,
  resolveDroppedContentType,
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
  onDropFileAtPosition?: (file: File, position: { x: number; y: number }) => void | Promise<void>;
  onDropLinkAtPosition?: (url: string, position: { x: number; y: number }) => void | Promise<void>;
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
  onDropFileAtPosition,
  onDropLinkAtPosition,
}: BoardSurfaceProps) {
  const theme = useTheme();
  const updateNoteLayout = useAppStore((state) => state.updateNoteLayout);
  const boardSurfaceRef = useRef<HTMLDivElement | null>(null);
  const dropDragDepthRef = useRef(0);
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [placementPosition, setPlacementPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [dragPlacementPreview, setDragPlacementPreview] = useState<PlacementPreview | null>(null);
  const [dragPlacementPosition, setDragPlacementPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isDropOverlayVisible, setIsDropOverlayVisible] = useState(false);
  const [noteContextMenu, setNoteContextMenu] = useState<NoteContextMenuState | null>(null);
  const [canvasAddMenu, setCanvasAddMenu] = useState<CanvasAddMenuState | null>(null);
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
    setCanvasAddMenu(null);
    setIsFabMenuOpen(false);
    dropDragDepthRef.current = 0;
    setIsDropOverlayVisible(false);
    setDragPlacementPreview(null);
    setDragPlacementPosition(null);
  }, [board.id]);

  useEffect(() => {
    if (!noteContextMenu && !canvasAddMenu && !isFabMenuOpen) {
      return;
    }

    const handleGlobalPointerDown = () => {
      setNoteContextMenu(null);
      setCanvasAddMenu(null);
      setIsFabMenuOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNoteContextMenu(null);
        setCanvasAddMenu(null);
        setIsFabMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", handleGlobalPointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("pointerdown", handleGlobalPointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [canvasAddMenu, isFabMenuOpen, noteContextMenu]);

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

  const getFlowPositionFromClientCoordinates = (coordinates: {
    clientX: number;
    clientY: number;
  }) => {
    if (!flowInstance) {
      return null;
    }

    if (
      typeof coordinates.clientX !== "number"
      || typeof coordinates.clientY !== "number"
    ) {
      return null;
    }

    return flowInstance.screenToFlowPosition({
      x: coordinates.clientX,
      y: coordinates.clientY,
    });
  };

  const clearDropOverlay = useCallback(() => {
    dropDragDepthRef.current = 0;
    setIsDropOverlayVisible(false);
    setDragPlacementPreview(null);
    setDragPlacementPosition(null);
  }, []);

  const handlePaneMouseMove = (event: ReactMouseEvent) => {
    if (!placementPreview) {
      return;
    }

    const resolvedPosition = getFlowPositionFromClientCoordinates(event);

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
    setCanvasAddMenu(null);
    setIsFabMenuOpen(false);

    if (!placementPreview || !onPlaceNote) {
      return;
    }

    const resolvedPosition = getFlowPositionFromClientCoordinates(event);

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
    setCanvasAddMenu(null);
    setIsFabMenuOpen(false);
  };

  const handlePaneContextMenu = (event: MouseEvent | ReactMouseEvent) => {
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
      clampWidth: ADD_MENU_CLAMP_WIDTH,
      menuHeight: ADD_MENU_HEIGHT,
      inset: CONTEXT_MENU_INSET,
    });

    setCanvasAddMenu({ x, y });
    setNoteContextMenu(null);
    setIsFabMenuOpen(false);
  };

  const handleCanvasDragEnter = (event: ReactDragEvent<HTMLDivElement>) => {
    const droppedType = resolveDroppedContentType(event.dataTransfer);
    if (droppedType !== "image" && droppedType !== "link") {
      return;
    }

    event.preventDefault();
    dropDragDepthRef.current += 1;

    const { width, height } = resolveNoteDefaults(droppedType);
    const flowPosition = getFlowPositionFromClientCoordinates(event);

    setIsDropOverlayVisible(true);
    setDragPlacementPreview({
      type: droppedType,
      width,
      height,
    });
    if (flowPosition) {
      setDragPlacementPosition(flowPosition);
    }
  };

  const handleCanvasDragOver = (event: ReactDragEvent<HTMLDivElement>) => {
    const droppedType = resolveDroppedContentType(event.dataTransfer);
    if (droppedType !== "image" && droppedType !== "link") {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";

    const { width, height } = resolveNoteDefaults(droppedType);
    const flowPosition = getFlowPositionFromClientCoordinates(event);

    setIsDropOverlayVisible(true);
    setDragPlacementPreview({
      type: droppedType,
      width,
      height,
    });
    if (flowPosition) {
      setDragPlacementPosition(flowPosition);
    }
  };

  const handleCanvasDragLeave = (event: ReactDragEvent<HTMLDivElement>) => {
    if (!isDropOverlayVisible) {
      return;
    }

    event.preventDefault();
    dropDragDepthRef.current = Math.max(0, dropDragDepthRef.current - 1);

    if (dropDragDepthRef.current === 0) {
      clearDropOverlay();
    }
  };

  const handleCanvasDrop = (event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const droppedType = resolveDroppedContentType(event.dataTransfer);
    if (droppedType !== "image" && droppedType !== "link") {
      clearDropOverlay();
      return;
    }

    const flowPosition = getFlowPositionFromClientCoordinates(event);
    if (!flowPosition) {
      clearDropOverlay();
      return;
    }

    if (droppedType === "image" && event.dataTransfer.files.length > 0) {
      const droppedFile = event.dataTransfer.files.item(0);
      if (droppedFile) {
        void onDropFileAtPosition?.(droppedFile, flowPosition);
      }

      clearDropOverlay();
      return;
    }

    const droppedUrl = extractDroppedUrl(event.dataTransfer);
    if (droppedUrl) {
      void onDropLinkAtPosition?.(droppedUrl, flowPosition);
    }

    clearDropOverlay();
  };

  const handleFabAction = (action: FabAction) => {
    if (action === "text") {
      onCreateTextNote?.();
      setCanvasAddMenu(null);
      setIsFabMenuOpen(false);
      return;
    }

    if (action === "file") {
      onCreateFile?.();
      setCanvasAddMenu(null);
      setIsFabMenuOpen(false);
      return;
    }

    onCreateLink?.();
    setCanvasAddMenu(null);
    setIsFabMenuOpen(false);
  };

  const activePlacementPreview = dragPlacementPreview ?? placementPreview;
  const activePlacementPosition = dragPlacementPreview
    ? dragPlacementPosition
    : placementPosition;

  const flowNodes = useMemo<Node[]>(() => {
    if (!activePlacementPreview || !activePlacementPosition) {
      return nodes;
    }

    return [...nodes, buildPlacementPreviewNode(activePlacementPreview, activePlacementPosition)];
  }, [activePlacementPosition, activePlacementPreview, nodes]);
  const contextMenuNote = noteContextMenu
    ? board.notes.find((note) => note.id === noteContextMenu.noteId)
    : null;
  const placementLabel = activePlacementPreview
    ? ({
        text: "text note",
        image: "file note",
        link: "link note",
      }[activePlacementPreview.type])
    : "";
  const dropOverlayLabel = dragPlacementPreview
    ? ({
        text: "Drop to create a text note",
        image: "Drop to create a file note",
        link: "Drop to create a link note",
      }[dragPlacementPreview.type])
    : "Drop to create a note";

  return (
    <div
      ref={boardSurfaceRef}
      onDragEnterCapture={handleCanvasDragEnter}
      onDragOverCapture={handleCanvasDragOver}
      onDragLeaveCapture={handleCanvasDragLeave}
      onDropCapture={handleCanvasDrop}
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
        onPaneContextMenu={handlePaneContextMenu}
        onPaneMouseMove={handlePaneMouseMove}
        onPaneMouseLeave={handlePaneMouseLeave}
        onPaneClick={handlePaneClick}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        minZoom={0.4}
        maxZoom={1.8}
        panOnDrag={!activePlacementPreview}
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
      {isDropOverlayVisible ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 8,
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: withAlpha(theme.overlay.val, 0.52),
          }}
        >
          <View
            style={{
              border: `1px dashed ${theme.borderStrong.val}`,
              borderRadius: 14,
              padding: "0.8rem 1rem",
              backgroundColor: withAlpha(theme.surface.val, 0.86),
              maxWidth: 380,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: theme.textPrimary.val,
                textAlign: "center",
              }}
            >
              {dropOverlayLabel}
            </Text>
          </View>
        </div>
      ) : null}
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
      {canvasAddMenu ? (
        <div
          style={{
            position: "absolute",
            left: canvasAddMenu.x,
            top: canvasAddMenu.y,
            zIndex: 30,
          }}
        >
          <AddNoteContextMenu onAction={handleFabAction} />
        </div>
      ) : null}
      <NoteCreateFab
        isOpen={isFabMenuOpen}
        isUploadingFile={isUploadingFile}
        onToggle={() => setIsFabMenuOpen((current) => !current)}
        onAction={handleFabAction}
      />
      {activePlacementPreview ? (
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
