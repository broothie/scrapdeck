import { useEffect, useState, type PointerEvent } from "react";
import type { Board, Scrap } from "../../types";
import { ScrapRenderer } from "./ScrapRenderer";

type DragState = {
  scrapId: string;
  pointerOffsetX: number;
  pointerOffsetY: number;
};

type BoardSurfaceProps = {
  board: Board;
};

export function BoardSurface({ board }: BoardSurfaceProps) {
  const [scraps, setScraps] = useState(board.scraps);
  const [dragState, setDragState] = useState<DragState | null>(null);

  useEffect(() => {
    if (dragState === null) {
      setScraps(board.scraps);
    }
  }, [board.scraps, dragState]);

  const updateScrapPosition = (scrapId: string, x: number, y: number) => {
    setScraps((currentScraps) =>
      currentScraps.map((scrap) =>
        scrap.id === scrapId ? { ...scrap, x, y } : scrap,
      ),
    );
  };

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

    updateScrapPosition(
      dragState.scrapId,
      Math.max(24, nextX),
      Math.max(24, nextY),
    );
  };

  const handlePointerUp = () => {
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
        {scraps.map((scrap) => (
          <ScrapRenderer
            key={scrap.id}
            isDragging={dragState?.scrapId === scrap.id}
            onPointerDown={handlePointerDown}
            scrap={scrap}
          />
        ))}
      </div>
    </div>
  );
}
