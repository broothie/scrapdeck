import { useEffect, useMemo, useState } from "react";
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
import type { MouseEvent as ReactMouseEvent } from "react";
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

const minimapSize = {
  width: 180,
  height: 120,
} as const;
const panelGap = 12;

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
  const updateScrapLayout = useAppStore((state) => state.updateScrapLayout);
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [placementPosition, setPlacementPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    setNodes(
      board.scraps.map((scrap) => ({
        id: scrap.id,
        type: "scrap",
        position: {
          x: scrap.x,
          y: scrap.y,
        },
        width: scrap.width,
        height: scrap.height,
        data: {
          boardId: board.id,
          scrap,
          onDelete: (scrapId: string) => {
            deleteScrap(board.id, scrapId);
          },
          onResizeEnd: (
            scrapId: string,
            nextLayout: Pick<Scrap, "x" | "y" | "width" | "height">,
          ) => {
            updateScrapLayout(board.id, scrapId, nextLayout);
          },
        },
      })),
    );
  }, [board, deleteScrap, setNodes, updateScrapLayout]);

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
    <View
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
    </View>
  );
}
