export type Board = {
  id: string;
  title: string;
  description: string;
  scraps: Scrap[];
};

type ScrapBase = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type NoteScrap = ScrapBase & {
  type: "note";
  title?: string;
  body: string;
};

export type ImageScrap = ScrapBase & {
  type: "image";
  src: string;
  alt: string;
  caption?: string;
};

export type LinkScrap = ScrapBase & {
  type: "link";
  url: string;
  siteName: string;
  title: string;
  description?: string;
  previewImage?: string;
};

export type Scrap = NoteScrap | ImageScrap | LinkScrap;
