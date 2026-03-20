import { useState, type PointerEvent } from "react";
import { Text, View } from "tamagui";
import { useAppStore, type Board, type Scrap } from "@scrapdeck/core";
import { ScrapRenderer } from "./ScrapRenderer";

type DragState = {
  scrapId: string;
  pointerOffsetX: number;
  pointerOffsetY: number;
  x: number;
  y: number;
};

type BoardSurfaceProps = {
  board: Board;
};

export function BoardSurface({ board }: BoardSurfaceProps) {
  const updateScrapPosition = useAppStore((state) => state.updateScrapPosition);
  const [dragState, setDragState] = useState<DragState | null>(null);

  const handlePointerDown = (
    event: PointerEvent<HTMLDivElement>,
    scrap: Scrap,
  ) => {
    const bounds = event.currentTarget.parentElement?.getBoundingClientRect();

    if (!bounds) {
      return;
    }

    setDragState({
      scrapId: scrap.id,
      pointerOffsetX: event.clientX - bounds.left - scrap.x,
      pointerOffsetY: event.clientY - bounds.top - scrap.y,
      x: scrap.x,
      y: scrap.y,
    });

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragState) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const nextX = event.clientX - bounds.left - dragState.pointerOffsetX;
    const nextY = event.clientY - bounds.top - dragState.pointerOffsetY;

    setDragState((current) =>
      current
        ? {
            ...current,
            x: Math.max(24, nextX),
            y: Math.max(24, nextY),
          }
        : null,
    );
  };

  const handlePointerUp = () => {
    if (dragState) {
      updateScrapPosition(board.id, dragState.scrapId, dragState.x, dragState.y);
    }

    setDragState(null);
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
      <View
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.28,
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 2,
          padding: "0.45rem 0.8rem",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 999,
          background: "rgba(9,16,23,0.66)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Text style={{ color: "rgba(245,239,226,0.78)", fontSize: 13 }}>
          Drag scraps to rearrange this board.
        </Text>
      </View>
      <div
        style={{ position: "relative", minHeight: "100%", overflow: "hidden" }}
        onPointerLeave={handlePointerUp}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {board.scraps.map((scrap) => {
          const renderedScrap =
            dragState?.scrapId === scrap.id
              ? { ...scrap, x: dragState.x, y: dragState.y }
              : scrap;

          return (
            <ScrapRenderer
              key={scrap.id}
              isDragging={dragState?.scrapId === scrap.id}
              onPointerDown={handlePointerDown}
              scrap={renderedScrap}
            />
          );
        })}
      </div>
    </View>
  );
}
