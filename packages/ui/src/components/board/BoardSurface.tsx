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
import { MousePointer2 } from "lucide-react";
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
  onEditImageNote?: (noteId: string) => boolean;
  onEditLinkNote?: (noteId: string) => boolean;
  placementPreview?: PlacementPreview | null;
  onPlaceNote?: (position: { x: number; y: number }) => void;
  onCreateTextNoteAtPosition?: (position: { x: number; y: number }) => void;
  onCreateFileAtPosition?: (position: { x: number; y: number }) => void;
  onCreateLinkAtPosition?: (position: { x: number; y: number }) => void;
  activeLightboxImageNoteId?: string | null;
  onLightboxImageNoteHandled?: (noteId: string) => void;
  onViewImageNote?: (noteId: string) => boolean;
  autoEditTextNoteId?: string | null;
  onAutoEditTextNoteHandled?: (noteId: string) => void;
  onDropFileAtPosition?: (file: File, position: { x: number; y: number }) => void | Promise<void>;
  onDropLinkAtPosition?: (url: string, position: { x: number; y: number }) => void | Promise<void>;
  remotePresenceParticipants?: Array<{
    id: string;
    name: string;
    color?: string;
    cursor?: {
      x: number;
      y: number;
    } | null;
    selectedNoteIds?: string[];
  }>;
  onCursorPositionChange?: (position: { x: number; y: number } | null) => void;
  onSelectedNoteIdsChange?: (noteIds: string[]) => void;
};

export function BoardSurface({
  board,
  isUploadingFile,
  onCreateTextNote,
  onCreateFile,
  onCreateLink,
  onEditImageNote,
  onEditLinkNote,
  placementPreview,
  onPlaceNote,
  onCreateTextNoteAtPosition,
  onCreateFileAtPosition,
  onCreateLinkAtPosition,
  activeLightboxImageNoteId,
  onLightboxImageNoteHandled,
  onViewImageNote,
  autoEditTextNoteId,
  onAutoEditTextNoteHandled,
  onDropFileAtPosition,
  onDropLinkAtPosition,
  remotePresenceParticipants = [],
  onCursorPositionChange,
  onSelectedNoteIdsChange,
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
  const [viewportRevision, setViewportRevision] = useState(0);
  const isDraggingNoteRef = useRef(false);
  const isResizingNoteRef = useRef(false);
  const cursorEmitTimeoutRef = useRef<number | null>(null);
  const lastCursorEmitAtRef = useRef(0);
  const lastEmittedCursorRef = useRef<string>("none");
  const lastEmittedSelectionRef = useRef("");
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
    onEditImageNote,
    onEditLinkNote,
    onViewImageNote,
  });
  const remoteSelectionsSignature = useMemo(() =>
    JSON.stringify(
      remotePresenceParticipants
        .filter((participant) => (participant.selectedNoteIds?.length ?? 0) > 0)
        .map((participant) => ({
          id: participant.id,
          name: participant.name,
          color: participant.color ?? null,
          selectedNoteIds: [...new Set(participant.selectedNoteIds ?? [])].sort(),
        }))
        .sort((left, right) => left.id.localeCompare(right.id)),
    ), [remotePresenceParticipants]);
  const remoteSelectionsByNoteId = useMemo(() => {
    const selections = new Map<string, Array<{ name: string; color?: string }>>();

    if (!remoteSelectionsSignature) {
      return selections;
    }

    let parsedParticipants: Array<{
      id: string;
      name: string;
      color: string | null;
      selectedNoteIds: string[];
    }> = [];

    try {
      parsedParticipants = JSON.parse(remoteSelectionsSignature) as Array<{
        id: string;
        name: string;
        color: string | null;
        selectedNoteIds: string[];
      }>;
    } catch {
      return selections;
    }

    parsedParticipants.forEach((participant) => {
      participant.selectedNoteIds.forEach((noteId) => {
        const currentSelections = selections.get(noteId) ?? [];
        currentSelections.push({
          name: participant.name,
          color: participant.color ?? undefined,
        });
        selections.set(noteId, currentSelections);
      });
    });

    return selections;
  }, [remoteSelectionsSignature]);
  const remoteCursorOverlays = useMemo(() => {
    if (!flowInstance) {
      return [];
    }

    const paneBounds = boardSurfaceRef.current?.getBoundingClientRect();
    if (!paneBounds) {
      return [];
    }

    return remotePresenceParticipants
      .filter((participant) => participant.cursor && Number.isFinite(participant.cursor.x) && Number.isFinite(participant.cursor.y))
      .map((participant) => {
        const screenPosition = flowInstance.flowToScreenPosition({
          x: participant.cursor!.x,
          y: participant.cursor!.y,
        });

        return {
          id: participant.id,
          name: participant.name,
          color: participant.color ?? theme.accentDefault.val,
          left: screenPosition.x - paneBounds.left,
          top: screenPosition.y - paneBounds.top,
        };
      });
  }, [flowInstance, remotePresenceParticipants, theme.accentDefault.val, viewportRevision]);

  const emitCursorPosition = useCallback((position: { x: number; y: number } | null) => {
    if (!onCursorPositionChange) {
      return;
    }

    const now = Date.now();
    const nextCursor = position
      ? { x: Math.round(position.x), y: Math.round(position.y) }
      : null;
    const nextCursorKey = nextCursor ? `${nextCursor.x}:${nextCursor.y}` : "none";

    if (nextCursorKey === lastEmittedCursorRef.current) {
      return;
    }

    const flush = () => {
      lastCursorEmitAtRef.current = Date.now();
      lastEmittedCursorRef.current = nextCursorKey;
      onCursorPositionChange(nextCursor);
    };

    const elapsed = now - lastCursorEmitAtRef.current;
    if (elapsed >= 80 || nextCursor === null) {
      if (cursorEmitTimeoutRef.current) {
        window.clearTimeout(cursorEmitTimeoutRef.current);
        cursorEmitTimeoutRef.current = null;
      }
      flush();
      return;
    }

    if (cursorEmitTimeoutRef.current) {
      window.clearTimeout(cursorEmitTimeoutRef.current);
    }

    cursorEmitTimeoutRef.current = window.setTimeout(() => {
      cursorEmitTimeoutRef.current = null;
      flush();
    }, 80 - elapsed);
  }, [onCursorPositionChange]);

  const emitSelectedNoteIds = useCallback((noteIds: string[]) => {
    if (!onSelectedNoteIdsChange) {
      return;
    }

    const normalized = [...new Set(noteIds)].sort();
    const selectionKey = normalized.join("|");

    if (selectionKey === lastEmittedSelectionRef.current) {
      return;
    }

    lastEmittedSelectionRef.current = selectionKey;
    onSelectedNoteIdsChange(normalized);
  }, [onSelectedNoteIdsChange]);

  useEffect(() => {
    if (isDraggingNoteRef.current || isResizingNoteRef.current) {
      return;
    }

    setNodes((previousNodes) => {
      const selectedNodeIds = new Set(
        previousNodes
          .filter((node) => node.selected)
          .map((node) => node.id),
      );

      return board.notes.map((note, index) => {
        const isSelectionLocked = remoteSelectionsByNoteId.has(note.id);

        return {
          id: note.id,
          type: "note",
          selected: !isSelectionLocked && selectedNodeIds.has(note.id),
          selectable: !isSelectionLocked,
          draggable: !isSelectionLocked,
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
            remoteSelectedBy: remoteSelectionsByNoteId.get(note.id) ?? [],
            showPinnedMenu: !noteContextMenu,
            onMenuAction: runNoteMenuAction,
            onAutoGrowHeight: (noteId: string, nextHeight: number) => {
              if (nextHeight <= note.height + 1) {
                return;
              }

              updateNoteLayout(board.id, noteId, { height: nextHeight });
            },
            onResizeStart: () => {
              isResizingNoteRef.current = true;
            },
            onResizeEnd: (
              noteId: string,
              nextLayout: Pick<Note, "x" | "y" | "width" | "height">,
            ) => {
              isResizingNoteRef.current = false;
              updateNoteLayout(board.id, noteId, nextLayout);
            },
            shouldStartEditing: note.type === "text" && autoEditTextNoteId === note.id,
            onStartEditingHandled: () => onAutoEditTextNoteHandled?.(note.id),
            shouldOpenLightbox: note.type === "image" && activeLightboxImageNoteId === note.id,
            onOpenLightboxHandled: () => onLightboxImageNoteHandled?.(note.id),
          },
        };
      });
    });
  }, [
    activeLightboxImageNoteId,
    autoEditTextNoteId,
    board,
    noteContextMenu,
    remoteSelectionsByNoteId,
    onLightboxImageNoteHandled,
    onAutoEditTextNoteHandled,
    runNoteMenuAction,
    setNodes,
    updateNoteLayout,
  ]);

  useEffect(() => {
    setNoteContextMenu(null);
    setCanvasAddMenu(null);
    setIsFabMenuOpen(false);
    dropDragDepthRef.current = 0;
    setIsDropOverlayVisible(false);
    setDragPlacementPreview(null);
    setDragPlacementPosition(null);
    isDraggingNoteRef.current = false;
    isResizingNoteRef.current = false;
    emitCursorPosition(null);
    emitSelectedNoteIds([]);
  }, [board.id]);

  useEffect(() => () => {
    if (cursorEmitTimeoutRef.current) {
      window.clearTimeout(cursorEmitTimeoutRef.current);
    }
  }, []);
  useEffect(() => {
    const clearCursorSync = () => {
      emitCursorPosition(null);
    };

    const handleDocumentMouseOut = (event: MouseEvent) => {
      const relatedTarget = event.relatedTarget as Node | null;
      if (!relatedTarget) {
        clearCursorSync();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        clearCursorSync();
      }
    };

    window.addEventListener("blur", clearCursorSync);
    document.addEventListener("mouseout", handleDocumentMouseOut);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("blur", clearCursorSync);
      document.removeEventListener("mouseout", handleDocumentMouseOut);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [emitCursorPosition]);

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
    isDraggingNoteRef.current = false;

    if (node.type !== "note") {
      return;
    }

    const noteNode = node as NoteFlowNode;

    updateNoteLayout(board.id, node.id, {
      x: noteNode.position.x,
      y: noteNode.position.y,
    });
  };
  const handleNodeDragStart = () => {
    isDraggingNoteRef.current = true;
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
    const resolvedPosition = getFlowPositionFromClientCoordinates(event);

    if (!resolvedPosition) {
      return;
    }

    emitCursorPosition(resolvedPosition);

    if (!placementPreview) {
      return;
    }

    setPlacementPosition(resolvedPosition);
  };

  const handleCanvasPointerMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    const resolvedPosition = getFlowPositionFromClientCoordinates(event);
    if (!resolvedPosition) {
      return;
    }

    emitCursorPosition(resolvedPosition);
  };

  const handleCanvasPointerLeave = () => {
    emitCursorPosition(null);
  };

  const handlePaneMouseLeave = () => {
    emitCursorPosition(null);

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

    const flowPosition = getFlowPositionFromClientCoordinates(event);

    setCanvasAddMenu({ x, y, flowPosition });
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

  const handleCanvasAddMenuAction = (action: FabAction) => {
    const flowPosition = canvasAddMenu?.flowPosition;

    if (!flowPosition) {
      handleFabAction(action);
      return;
    }

    if (action === "text") {
      onCreateTextNoteAtPosition?.(flowPosition);
      setCanvasAddMenu(null);
      setIsFabMenuOpen(false);
      return;
    }

    if (action === "file") {
      onCreateFileAtPosition?.(flowPosition);
      setCanvasAddMenu(null);
      setIsFabMenuOpen(false);
      return;
    }

    onCreateLinkAtPosition?.(flowPosition);
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

    return [
      ...nodes,
      buildPlacementPreviewNode(activePlacementPreview, activePlacementPosition),
    ];
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
      onMouseMoveCapture={handleCanvasPointerMove}
      onMouseLeave={handleCanvasPointerLeave}
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
        onNodeDragStart={handleNodeDragStart}
        onNodeDragStop={handleNodeDragStop}
        onNodeContextMenu={handleNodeContextMenu}
        onPaneContextMenu={handlePaneContextMenu}
        onPaneMouseMove={handlePaneMouseMove}
        onPaneMouseLeave={handlePaneMouseLeave}
        onPaneClick={handlePaneClick}
        onSelectionChange={(selection) => {
          const selectedNoteIds = selection.nodes
            .filter((node) => node.type === "note")
            .map((node) => node.id)
            .filter((noteId) => !remoteSelectionsByNoteId.has(noteId));
          emitSelectedNoteIds(selectedNoteIds);
        }}
        onMove={() => {
          setViewportRevision((current) => current + 1);
        }}
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
            actions={contextMenuNote ? resolveNoteMenuActions(contextMenuNote) : undefined}
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
          <AddNoteContextMenu onAction={handleCanvasAddMenuAction} />
        </div>
      ) : null}
      <NoteCreateFab
        isOpen={isFabMenuOpen}
        isUploadingFile={isUploadingFile}
        onToggle={() => setIsFabMenuOpen((current) => !current)}
        onAction={handleFabAction}
      />
      {remoteCursorOverlays.map((cursor) => (
        <div
          key={`cursor-overlay-${cursor.id}`}
          style={{
            position: "absolute",
            left: cursor.left,
            top: cursor.top,
            transform: "translate(-2px, -2px)",
            pointerEvents: "none",
            zIndex: 34,
          }}
        >
          <div
            style={{
              color: cursor.color,
              filter: "drop-shadow(0 3px 8px rgba(13, 16, 32, 0.35))",
            }}
          >
            <MousePointer2 size={18} strokeWidth={2.35} />
          </div>
          <div
            style={{
              position: "absolute",
              left: 12,
              top: -8,
              borderRadius: 999,
              border: `1px solid ${cursor.color}`,
              backgroundColor: "rgba(23, 24, 42, 0.88)",
              color: "#f4f5ff",
              padding: "0.15rem 0.45rem",
              fontSize: 11,
              fontWeight: 600,
              whiteSpace: "nowrap",
              transform: "translate(0, -50%)",
            }}
          >
            {cursor.name}
          </div>
        </div>
      ))}
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
