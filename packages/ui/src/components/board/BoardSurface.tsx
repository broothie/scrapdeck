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
import { useAppStore, type Board, type Scrap } from "@scrapdeck/core";
import { PlacementPreviewNode } from "./PlacementPreviewNode";
import {
  resolveScrapMenuActions,
  ScrapActionMenu,
  type ScrapContextMenuAction,
} from "./ScrapActionMenu";
import { ScrapCreateFab } from "./ScrapCreateFab";
import { ScrapNode, type ScrapFlowNode } from "./ScrapNode";
import {
  CONTEXT_MENU_CLAMP_WIDTH,
  CONTEXT_MENU_HEIGHT,
  CONTEXT_MENU_INSET,
  CONTROLS_PANEL_GAP,
  MINIMAP_SIZE,
} from "./boardSurface.constants";
import type { FabAction, PlacementPreview, ScrapContextMenuState } from "./boardSurface.types";
import {
  buildPlacementPreviewNode,
  clampContextMenuPosition,
  getMiniMapNodeColor,
  withAlpha,
} from "./boardSurface.utils";
import { useScrapMenuActions } from "./useScrapMenuActions";

const nodeTypes: NodeTypes = {
  scrap: ScrapNode,
  "placement-preview": PlacementPreviewNode,
};

type BoardSurfaceProps = {
  board: Board;
  isUploadingFile?: boolean;
  onCreateNote?: () => void;
  onCreateFile?: () => void;
  onCreateLink?: () => void;
  placementPreview?: PlacementPreview | null;
  onPlaceScrap?: (position: { x: number; y: number }) => void;
};

export function BoardSurface({
  board,
  isUploadingFile,
  onCreateNote,
  onCreateFile,
  onCreateLink,
  placementPreview,
  onPlaceScrap,
}: BoardSurfaceProps) {
  const theme = useTheme();
  const updateScrapLayout = useAppStore((state) => state.updateScrapLayout);
  const boardSurfaceRef = useRef<HTMLDivElement | null>(null);
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [placementPosition, setPlacementPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [scrapContextMenu, setScrapContextMenu] = useState<ScrapContextMenuState | null>(null);
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const handleScrapActionComplete = useCallback((scrapId: string, action: ScrapContextMenuAction) => {
    if (action !== "send-back") {
      return;
    }

    setNodes((previousNodes) =>
      previousNodes.map((node) =>
        node.id === scrapId
          ? { ...node, selected: false }
          : node,
      ));
  }, [setNodes]);
  const { runScrapMenuAction } = useScrapMenuActions(board, {
    onActionComplete: handleScrapActionComplete,
  });

  useEffect(() => {
    setNodes((previousNodes) => {
      const selectedNodeIds = new Set(
        previousNodes
          .filter((node) => node.selected)
          .map((node) => node.id),
      );

      return board.scraps.map((scrap, index) => ({
        id: scrap.id,
        type: "scrap",
        selected: selectedNodeIds.has(scrap.id),
        position: {
          x: scrap.x,
          y: scrap.y,
        },
        zIndex: index + 1,
        width: scrap.width,
        height: scrap.height,
        data: {
          boardId: board.id,
          scrap,
          showPinnedMenu: !scrapContextMenu,
          onMenuAction: runScrapMenuAction,
          onAutoGrowHeight: (scrapId: string, nextHeight: number) => {
            if (nextHeight <= scrap.height + 1) {
              return;
            }

            updateScrapLayout(board.id, scrapId, { height: nextHeight });
          },
          onResizeEnd: (
            scrapId: string,
            nextLayout: Pick<Scrap, "x" | "y" | "width" | "height">,
          ) => {
            updateScrapLayout(board.id, scrapId, nextLayout);
          },
        },
      }));
    });
  }, [board, runScrapMenuAction, scrapContextMenu, setNodes, updateScrapLayout]);

  useEffect(() => {
    setScrapContextMenu(null);
    setIsFabMenuOpen(false);
  }, [board.id]);

  useEffect(() => {
    if (!scrapContextMenu && !isFabMenuOpen) {
      return;
    }

    const handleGlobalPointerDown = () => {
      setScrapContextMenu(null);
      setIsFabMenuOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setScrapContextMenu(null);
        setIsFabMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", handleGlobalPointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("pointerdown", handleGlobalPointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isFabMenuOpen, scrapContextMenu]);

  const handleNodeDragStop = (_event: unknown, node: Node) => {
    if (node.type !== "scrap") {
      return;
    }

    const scrapNode = node as ScrapFlowNode;

    updateScrapLayout(board.id, node.id, {
      x: scrapNode.position.x,
      y: scrapNode.position.y,
    });
  };

  const runScrapContextMenuAction = (action: ScrapContextMenuAction) => {
    if (!scrapContextMenu) {
      return;
    }

    runScrapMenuAction(scrapContextMenu.scrapId, action);
    setScrapContextMenu(null);
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
    setScrapContextMenu(null);
    setIsFabMenuOpen(false);

    if (!placementPreview || !onPlaceScrap) {
      return;
    }

    const resolvedPosition = getFlowPositionFromEvent(event);

    if (!resolvedPosition) {
      return;
    }

    onPlaceScrap({
      x: resolvedPosition.x,
      y: resolvedPosition.y,
    });
    setPlacementPosition(null);
  };

  const handleInit = (instance: ReactFlowInstance<Node>) => {
    setFlowInstance(instance);
  };

  const handleNodeContextMenu = (event: ReactMouseEvent, node: Node) => {
    if (node.type !== "scrap") {
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

    setScrapContextMenu({
      scrapId: node.id,
      x,
      y,
    });
    setIsFabMenuOpen(false);
  };

  const handleFabAction = (action: FabAction) => {
    if (action === "note") {
      onCreateNote?.();
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
  const contextMenuScrap = scrapContextMenu
    ? board.scraps.find((scrap) => scrap.id === scrapContextMenu.scrapId)
    : null;

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
        className="scrapdeck-flow"
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
          color={theme.borderSubtle.val}
          gap={28}
          size={1.25}
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
      {scrapContextMenu ? (
        <div
          style={{
            position: "absolute",
            left: scrapContextMenu.x,
            top: scrapContextMenu.y,
            zIndex: 30,
          }}
        >
          <ScrapActionMenu
            actions={contextMenuScrap ? resolveScrapMenuActions(contextMenuScrap.type) : undefined}
            onAction={runScrapContextMenuAction}
          />
        </div>
      ) : null}
      <ScrapCreateFab
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
            {`Place ${placementPreview.type}`}
          </Text>
        </View>
      ) : null}
    </div>
  );
}
