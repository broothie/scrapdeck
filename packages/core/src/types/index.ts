export type Board = {
  id: string;
  title: string;
  description: string;
  ownerUserId?: string;
  notes: Note[];
};

type NoteBase = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type TextNote = NoteBase & {
  type: "text";
  title?: string;
  body: string;
};

export type ImageNote = NoteBase & {
  type: "image";
  src: string;
  alt: string;
  caption?: string;
};

export type LinkNote = NoteBase & {
  type: "link";
  url: string;
  siteName: string;
  title: string;
  description?: string;
  previewImage?: string;
};

export type Note = TextNote | ImageNote | LinkNote;
