import type { LinkScrap } from "../../../types";

type LinkScrapCardProps = {
  scrap: LinkScrap;
};

export function LinkScrapCard({ scrap }: LinkScrapCardProps) {
  const hasPreview = Boolean(scrap.previewImage);

  return (
    <article
      className={`scrap-card scrap-card--link${hasPreview ? "" : " scrap-card--link-no-preview"}`}
    >
      {hasPreview ? (
        <img
          alt={scrap.title}
          className="scrap-card__preview"
          src={scrap.previewImage}
        />
      ) : null}
      <div className="scrap-card__link-body">
        <div className="scrap-card__pill">{scrap.siteName}</div>
        <h3>{scrap.title}</h3>
        {scrap.description ? <p>{scrap.description}</p> : null}
        <a href={scrap.url} onPointerDown={(event) => event.stopPropagation()}>
          {scrap.url}
        </a>
      </div>
    </article>
  );
}
