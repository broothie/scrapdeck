import type { NoteScrap } from "../../../types";

type NoteScrapCardProps = {
  scrap: NoteScrap;
};

export function NoteScrapCard({ scrap }: NoteScrapCardProps) {
  return (
    <article className="scrap-card scrap-card--note">
      <div className="scrap-card__pill">Note</div>
      {scrap.title ? <h3>{scrap.title}</h3> : null}
      <p>{scrap.body}</p>
    </article>
  );
}
