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
          pannable
          zoomable
          maskColor={theme.overlay.val}
          nodeColor={(node) => {
            const scrap = node.data?.scrap as Scrap | undefined;

            if (!scrap) {
              return theme.textMuted.val;
            }

            if (scrap.type === "note") {
              return "#f1c66f";
            }

            if (scrap.type === "image") {
              return "#7fd3b5";
            }

            return "#82a7ff";
          }}
        />
        <Controls showInteractive={false} />
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
