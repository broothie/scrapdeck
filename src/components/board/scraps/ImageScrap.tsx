import type { ImageScrap } from "../../../types";

type ImageScrapCardProps = {
  scrap: ImageScrap;
};

export function ImageScrapCard({ scrap }: ImageScrapCardProps) {
  return (
    <article className="scrap-card scrap-card--image">
      <img alt={scrap.alt} className="scrap-card__image" src={scrap.src} />
      {scrap.caption ? <p className="scrap-card__caption">{scrap.caption}</p> : null}
    </article>
  );
}
