import { useState, type PointerEvent } from "react";
import { useAppStore } from "../../store/useAppStore";
import type { Board, Scrap } from "../../types";
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
    <div className="board-surface-wrap">
      <div className="board-surface__hint">
        Drag scraps to rearrange this board.
      </div>
      <div
        className="board-surface"
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
    </div>
  );
}
