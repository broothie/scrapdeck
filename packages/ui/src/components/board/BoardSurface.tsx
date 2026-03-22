import { useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type Node,
  type NodeProps,
  type NodeTypes,
  type ReactFlowInstance,
  useNodesState,
} from "@xyflow/react";
import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import { Text, View, useTheme } from "tamagui";
import { placementColors, useAppStore, type Board, type Scrap } from "@scrapdeck/core";
import { ScrapNode, type ScrapFlowNode } from "./ScrapNode";

const nodeTypes: NodeTypes = {
  scrap: ScrapNode,
  "placement-preview": PlacementPreviewNode,
};

type PlacementPreview = {
  type: Scrap["type"];
  width: number;
  height: number;
};

type PlacementNodeData = {
  width: number;
  height: number;
  borderColor: string;
};

type BoardSurfaceProps = {
  board: Board;
  placementPreview?: PlacementPreview | null;
  onPlaceScrap?: (position: { x: number; y: number }) => void;
};

type ScrapContextMenuAction = "edit" | "duplicate" | "bring-front" | "send-back" | "delete";

type ScrapContextMenuState = {
  scrapId: string;
  x: number;
  y: number;
};

const minimapSize = {
  width: 180,
  height: 120,
} as const;
const panelGap = 12;
const contextMenuClampWidth = 172;
const contextMenuHeight = 212;
const contextMenuInset = 12;

function PlacementPreviewNode(props: NodeProps) {
  const theme = useTheme();
  const data = props.data as PlacementNodeData;

  return (
    <View
      style={{
        width: data.width,
        height: data.height,
        borderWidth: 2,
        borderStyle: "dashed",
        borderColor: data.borderColor,
        backgroundColor: theme.accentSubtle.val,
        borderRadius: 16,
        pointerEvents: "none",
      }}
    />
  );
}

function getPlacementColor(scrapType: Scrap["type"]): string {
  if (scrapType === "note" || scrapType === "image" || scrapType === "link") {
    return placementColors[scrapType];
  }

  return "#82a7ff";
}

function withAlpha(hexColor: string, alpha: number) {
  const normalized = hexColor.replace("#", "");
  const hasValidLength = normalized.length === 3 || normalized.length === 6;

  if (!hasValidLength) {
    return hexColor;
  }

  const expanded = normalized.length === 3
    ? normalized.split("").map((value) => `${value}${value}`).join("")
    : normalized;

  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function BoardSurface({
  board,
  placementPreview,
  onPlaceScrap,
  }: BoardSurfaceProps) {
  const theme = useTheme();
  const deleteScrap = useAppStore((state) => state.deleteScrap);
  const duplicateScrap = useAppStore((state) => state.duplicateScrap);
  const moveScrapToFront = useAppStore((state) => state.moveScrapToFront);
  const moveScrapToBack = useAppStore((state) => state.moveScrapToBack);
  const updateNoteScrap = useAppStore((state) => state.updateNoteScrap);
  const updateImageScrap = useAppStore((state) => state.updateImageScrap);
  const updateLinkScrap = useAppStore((state) => state.updateLinkScrap);
  const updateScrapLayout = useAppStore((state) => state.updateScrapLayout);
  const boardSurfaceRef = useRef<HTMLDivElement | null>(null);
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [placementPosition, setPlacementPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [scrapContextMenu, setScrapContextMenu] = useState<ScrapContextMenuState | null>(null);
  const [hoveredContextMenuAction, setHoveredContextMenuAction] =
    useState<ScrapContextMenuAction | null>(null);

  useEffect(() => {
    setNodes(
      board.scraps.map((scrap, index) => ({
        id: scrap.id,
        type: "scrap",
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
          onResizeEnd: (
            scrapId: string,
            nextLayout: Pick<Scrap, "x" | "y" | "width" | "height">,
          ) => {
            updateScrapLayout(board.id, scrapId, nextLayout);
          },
        },
      })),
    );
  }, [board, setNodes, updateScrapLayout]);

  useEffect(() => {
    setScrapContextMenu(null);
  }, [board.id]);

  useEffect(() => {
    if (!scrapContextMenu) {
      setHoveredContextMenuAction(null);
      return;
    }

    const handleGlobalPointerDown = () => {
      setScrapContextMenu(null);
      setHoveredContextMenuAction(null);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setScrapContextMenu(null);
        setHoveredContextMenuAction(null);
      }
    };

    window.addEventListener("pointerdown", handleGlobalPointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("pointerdown", handleGlobalPointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [scrapContextMenu]);

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

  const handleEditScrap = (scrapId: string) => {
    const scrap = board.scraps.find((candidate) => candidate.id === scrapId);

    if (!scrap) {
      return;
    }

    if (scrap.type === "note") {
      const nextTitle = window.prompt("Edit note title", scrap.title ?? "");

      if (nextTitle === null) {
        return;
      }

      const nextBody = window.prompt("Edit note text", scrap.body);

      if (nextBody === null) {
        return;
      }

      updateNoteScrap(board.id, scrap.id, {
        title: nextTitle.trim() || undefined,
        body: nextBody,
      });
      return;
    }

    if (scrap.type === "image") {
      const nextCaption = window.prompt("Edit image caption", scrap.caption ?? "");

      if (nextCaption === null) {
        return;
      }

      updateImageScrap(board.id, scrap.id, {
        caption: nextCaption.trim() || undefined,
      });
      return;
    }

    const nextUrlInput = window.prompt("Edit link URL", scrap.url);

    if (nextUrlInput === null) {
      return;
    }

    const trimmedUrl = nextUrlInput.trim();
    let normalizedUrl = scrap.url;

    if (trimmedUrl) {
      try {
        normalizedUrl = new URL(trimmedUrl).toString();
      } catch {
        window.alert("Enter a valid URL, including https://");
        return;
      }
    }

    const nextTitle = window.prompt("Edit link label", scrap.title);

    if (nextTitle === null) {
      return;
    }

    let nextSiteName = scrap.siteName;

    try {
      nextSiteName = new URL(normalizedUrl).hostname.replace(/^www\./, "") || nextSiteName;
    } catch {
      nextSiteName = scrap.siteName;
    }

    updateLinkScrap(board.id, scrap.id, {
      url: normalizedUrl,
      siteName: nextSiteName,
      title: nextTitle.trim() || scrap.title,
      previewImage: normalizedUrl === scrap.url ? scrap.previewImage : undefined,
    });
  };

  const runScrapContextMenuAction = (action: ScrapContextMenuAction) => {
    if (!scrapContextMenu) {
      return;
    }

    const { scrapId } = scrapContextMenu;

    if (action === "edit") {
      handleEditScrap(scrapId);
      setScrapContextMenu(null);
      setHoveredContextMenuAction(null);
      return;
    }

    if (action === "duplicate") {
      duplicateScrap(board.id, scrapId);
      setScrapContextMenu(null);
      setHoveredContextMenuAction(null);
      return;
    }

    if (action === "bring-front") {
      moveScrapToFront(board.id, scrapId);
      setScrapContextMenu(null);
      setHoveredContextMenuAction(null);
      return;
    }

    if (action === "send-back") {
      moveScrapToBack(board.id, scrapId);
      setScrapContextMenu(null);
      setHoveredContextMenuAction(null);
      return;
    }

    deleteScrap(board.id, scrapId);
    setScrapContextMenu(null);
    setHoveredContextMenuAction(null);
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

  const handlePaneMouseMove = (_event: ReactMouseEvent) => {
    if (!placementPreview) {
      return;
    }

    const resolvedPosition = getFlowPositionFromEvent(_event);

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

  const handlePaneClick = (_event: ReactMouseEvent) => {
    setScrapContextMenu(null);
    setHoveredContextMenuAction(null);

    if (!placementPreview || !onPlaceScrap) {
      return;
    }

    const resolvedPosition = getFlowPositionFromEvent(_event);

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

    const x = Math.max(
      contextMenuInset,
      Math.min(rawX, paneBounds.width - contextMenuClampWidth - contextMenuInset),
    );
    const y = Math.max(
      contextMenuInset,
      Math.min(rawY, paneBounds.height - contextMenuHeight - contextMenuInset),
    );

    setScrapContextMenu({
      scrapId: node.id,
      x,
      y,
    });
    setHoveredContextMenuAction(null);
  };

  const contextMenuActions: Array<{
    action: ScrapContextMenuAction;
    label: string;
    isDanger?: boolean;
  }> = [
    { action: "edit", label: "Edit" },
    { action: "duplicate", label: "Duplicate" },
    { action: "bring-front", label: "Bring To Front" },
    { action: "send-back", label: "Send To Back" },
    { action: "delete", label: "Delete", isDanger: true },
  ];

  const flowNodes = useMemo<Node[]>(() => {
    if (!placementPreview || !placementPosition) {
      return nodes;
    }

    const previewNode: Node = {
      id: "__placement-preview__",
      type: "placement-preview",
      position: placementPosition,
      width: placementPreview.width,
      height: placementPreview.height,
      data: {
        width: placementPreview.width,
        height: placementPreview.height,
        borderColor: getPlacementColor(placementPreview.type),
      },
      selectable: false,
      draggable: false,
      deletable: false,
    };

    return [...nodes, previewNode];
  }, [nodes, placementPreview, placementPosition]);

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
          variant={BackgroundVariant.Dots}
        />
        <MiniMap
          position="bottom-right"
          style={{
            width: minimapSize.width,
            height: minimapSize.height,
          }}
          pannable
          zoomable
          bgColor={theme.surfaceHover.val}
          maskColor={withAlpha(theme.overlay.val, 0.68)}
          maskStrokeColor={theme.borderStrong.val}
          maskStrokeWidth={1.5}
          nodeStrokeColor={theme.borderStrong.val}
          nodeColor={(node) => {
            const scrap = node.data?.scrap as Scrap | undefined;

            if (!scrap) {
              return theme.textMuted.val;
            }

            if (scrap.type === "note") {
              return theme.accentLight.val;
            }

            if (scrap.type === "image") {
              return theme.accentDefault.val;
            }

            return theme.accentStrong.val;
          }}
        />
        <Controls
          showInteractive={false}
          position="bottom-right"
          style={{
            right: minimapSize.width + panelGap,
          }}
        />
      </ReactFlow>
      {scrapContextMenu ? (
        <div
          onPointerDown={(event) => event.stopPropagation()}
          onContextMenu={(event) => event.preventDefault()}
          style={{
            position: "absolute",
            left: scrapContextMenu.x,
            top: scrapContextMenu.y,
            width: "fit-content",
            zIndex: 30,
            borderRadius: 3,
            border: `1px solid ${theme.borderDefault.val}`,
            backgroundColor: theme.surface.val,
            boxShadow: "0 10px 30px rgba(5, 8, 14, 0.18)",
            padding: "0.25rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            gap: 0,
          }}
        >
          {contextMenuActions.map((item, index) => {
            const isHovered = hoveredContextMenuAction === item.action;

            return (
              <div key={item.action} style={{ width: "100%" }}>
                {index > 0 ? (
                  <div
                    aria-hidden="true"
                    style={{
                      height: 1,
                      backgroundColor: theme.borderSubtle.val,
                      margin: "0.08rem 0.35rem",
                    }}
                  />
                ) : null}
                <button
                  type="button"
                  className="nodrag nopan"
                  style={contextMenuButtonStyle({
                    color: item.isDanger ? theme.danger.val : theme.textPrimary.val,
                    isDanger: Boolean(item.isDanger),
                    isHovered,
                    hoverColor: theme.surfaceHover.val,
                  })}
                  onMouseEnter={() => setHoveredContextMenuAction(item.action)}
                  onMouseLeave={() => setHoveredContextMenuAction(null)}
                  onClick={() => runScrapContextMenuAction(item.action)}
                >
                  {item.label}
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
      {placementPreview ? (
        <View
          style={{
            position: "absolute",
            top: 16,
            right: 16,
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

function contextMenuButtonStyle(options: {
  color: string;
  isDanger: boolean;
  isHovered: boolean;
  hoverColor: string;
}): CSSProperties {
  return {
    width: "100%",
    border: 0,
    borderRadius: 4,
    whiteSpace: "nowrap",
    display: "block",
    backgroundColor: options.isHovered ? options.hoverColor : "transparent",
    color: options.color,
    textAlign: "left",
    padding: "0.32rem 0.55rem",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: options.isDanger ? 700 : 500,
  };
}
