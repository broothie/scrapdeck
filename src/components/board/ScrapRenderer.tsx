import type { PointerEvent } from "react";
import type { Scrap } from "../../types";
import { ImageScrapCard } from "./scraps/ImageScrap";
import { LinkScrapCard } from "./scraps/LinkScrap";
import { NoteScrapCard } from "./scraps/NoteScrap";

type ScrapRendererProps = {
  scrap: Scrap;
  isDragging: boolean;
  onPointerDown: (
    event: PointerEvent<HTMLDivElement>,
    scrap: Scrap,
  ) => void;
};

export function ScrapRenderer({
  scrap,
  isDragging,
  onPointerDown,
}: ScrapRendererProps) {
  const style = {
    width: `${scrap.width}px`,
    height: `${scrap.height}px`,
    transform: `translate(${scrap.x}px, ${scrap.y}px)`,
  };

  return (
    <div
      className={`scrap-frame${isDragging ? " is-dragging" : ""}`}
      onPointerDown={(event) => onPointerDown(event, scrap)}
      style={style}
    >
      {scrap.type === "note" ? <NoteScrapCard scrap={scrap} /> : null}
      {scrap.type === "image" ? <ImageScrapCard scrap={scrap} /> : null}
      {scrap.type === "link" ? <LinkScrapCard scrap={scrap} /> : null}
    </div>
  );
}
