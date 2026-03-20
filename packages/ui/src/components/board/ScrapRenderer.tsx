import type { CSSProperties, PointerEvent } from "react";
import type { Scrap } from "@scrapdeck/core";
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
  const style: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: `${scrap.width}px`,
    height: `${scrap.height}px`,
    transform: `translate(${scrap.x}px, ${scrap.y}px)`,
    cursor: isDragging ? "grabbing" : "grab",
    transition: "box-shadow 140ms ease",
    willChange: "transform",
    zIndex: isDragging ? 5 : undefined,
  };

  return (
    <div
      onPointerDown={(event) => onPointerDown(event, scrap)}
      style={style}
    >
      {scrap.type === "note" ? <NoteScrapCard scrap={scrap} /> : null}
      {scrap.type === "image" ? <ImageScrapCard scrap={scrap} /> : null}
      {scrap.type === "link" ? <LinkScrapCard scrap={scrap} /> : null}
    </div>
  );
}
