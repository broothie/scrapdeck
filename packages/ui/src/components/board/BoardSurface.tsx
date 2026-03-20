import { useEffect, type MouseEvent } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useNodesState,
} from "@xyflow/react";
import { Text, View } from "tamagui";
import { useAppStore, type Board, type Scrap } from "@scrapdeck/core";
import { ScrapNode, type ScrapFlowNode } from "./ScrapNode";

const nodeTypes = {
  scrap: ScrapNode,
};

type BoardSurfaceProps = {
  board: Board;
};

export function BoardSurface({ board }: BoardSurfaceProps) {
  const updateScrapLayout = useAppStore((state) => state.updateScrapLayout);
  const [nodes, setNodes, onNodesChange] = useNodesState<ScrapFlowNode>([]);

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
          scrap,
          onResizeEnd: (scrapId, nextLayout) => {
            updateScrapLayout(board.id, scrapId, nextLayout);
          },
        },
      })),
    );
  }, [board, setNodes, updateScrapLayout]);

  const handleNodeDragStop = (_event: MouseEvent, node: ScrapFlowNode) => {
    updateScrapLayout(board.id, node.id, {
      x: Math.max(24, node.position.x),
      y: Math.max(24, node.position.y),
    });
  };

  return (
    <View
      style={{
        position: "relative",
        flex: 1,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 28,
        background:
          "linear-gradient(0deg, rgba(5, 10, 14, 0.08), rgba(5, 10, 14, 0.08)), radial-gradient(circle at 20% 0%, rgba(240, 189, 102, 0.12), transparent 28%), linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02))",
        boxShadow:
          "inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 32px 80px rgba(0, 0, 0, 0.24)",
      }}
    >
      <ReactFlow
        key={board.id}
        className="scrapdeck-flow"
        nodes={nodes}
        edges={[]}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeDragStop={handleNodeDragStop}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        minZoom={0.4}
        maxZoom={1.8}
        panOnScroll
        deleteKeyCode={null}
        nodesConnectable={false}
        nodesFocusable
      >
        <Background
          color="rgba(255,255,255,0.1)"
          gap={28}
          variant={BackgroundVariant.Dots}
        />
        <MiniMap
          pannable
          zoomable
          maskColor="rgba(8, 12, 18, 0.76)"
          nodeColor={(node) => {
            const scrap = node.data?.scrap as Scrap | undefined;

            if (!scrap) {
              return "#8c96aa";
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
      <View
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 6,
          padding: "0.45rem 0.8rem",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 999,
          background: "rgba(9,16,23,0.72)",
          backdropFilter: "blur(12px)",
          pointerEvents: "none",
        }}
      >
        <Text style={{ color: "rgba(245,239,226,0.78)", fontSize: 13 }}>
          Drag, pan, zoom, and resize scraps.
        </Text>
      </View>
    </View>
  );
}
