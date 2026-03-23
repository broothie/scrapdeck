import { beforeEach, describe, expect, it } from "vitest";
import { useAppStore, type Board } from "@plumboard/core";
import {
  assembleBoards,
  mapNoteRowToNote,
  mapNoteToRow,
  mapBoardToRow,
  resolveNoteIdsToSoftDelete,
} from "./boards";

type SampleNoteRow = {
  id: string;
  board_id: string;
  user_id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string | null;
  body: string | null;
  src: string | null;
  alt: string | null;
  caption: string | null;
  url: string | null;
  site_name: string | null;
  description: string | null;
  preview_image: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

const noteNoteRow: SampleNoteRow = {
  id: "note-note",
  board_id: "board-1",
  user_id: "user-1",
  type: "text",
  x: 16,
  y: 24,
  width: 300,
  height: 220,
  title: "Note title",
  body: "Note body",
  src: null,
  alt: null,
  caption: null,
  url: null,
  site_name: null,
  description: null,
  preview_image: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  deleted_at: null,
};

beforeEach(() => {
  useAppStore.setState({ boards: [], activeBoardId: "" });
});

describe("mapNoteRowToNote", () => {
  it("maps a text note row", () => {
    const note = mapNoteRowToNote(noteNoteRow);
    expect(note).toEqual({
      id: "note-note",
      type: "text",
      x: 16,
      y: 24,
      width: 300,
      height: 220,
      title: "Note title",
      body: "Note body",
    });
  });

  it("throws for unknown note types", () => {
    const invalidRow = {
      ...noteNoteRow,
      type: "video",
    } as unknown as SampleNoteRow;

    expect(() => mapNoteRowToNote(invalidRow)).toThrowError(
      "Unsupported note row type: video",
    );
  });
});

describe("board row helpers", () => {
  it("maps rows to domain models", () => {
    const boardRowsInput = [
      {
        id: "board-1",
        title: "Ideas",
        description: "Board description",
        user_id: "user-1",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
        deleted_at: null,
      },
      {
        id: "board-2",
        title: "Archive",
        description: "Other",
        user_id: "user-1",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
        deleted_at: null,
      },
    ];

    const imageNoteRow = {
      ...noteNoteRow,
      id: "note-image",
      type: "image",
      board_id: "board-1",
      src: "/asset.png",
      alt: "Alt text",
    } as unknown as SampleNoteRow;

    const linkNoteRow = {
      ...noteNoteRow,
      id: "note-link",
      type: "link",
      board_id: "board-1",
      title: "Note title",
      description: "desc",
      url: "https://example.com",
      site_name: "example.com",
      preview_image: "/preview.png",
    } as unknown as SampleNoteRow;

    const boardModels = assembleBoards(
      boardRowsInput,
      [noteNoteRow, imageNoteRow, linkNoteRow],
    );

    expect(boardModels).toEqual([
      {
        id: "board-1",
        title: "Ideas",
        description: "Board description",
        ownerUserId: "user-1",
        notes: [
          {
            id: "note-note",
            type: "text",
            x: 16,
            y: 24,
            width: 300,
            height: 220,
            title: "Note title",
            body: "Note body",
          },
          {
            id: "note-image",
            type: "image",
            x: 16,
            y: 24,
            width: 300,
            height: 220,
            src: "/asset.png",
            alt: "Alt text",
            caption: undefined,
          },
          {
            id: "note-link",
            type: "link",
            x: 16,
            y: 24,
            width: 300,
            height: 220,
            url: "https://example.com",
            siteName: "example.com",
            title: "Note title",
            description: "desc",
            previewImage: "/preview.png",
          },
        ],
      },
      {
        id: "board-2",
        title: "Archive",
        description: "Other",
        ownerUserId: "user-1",
        notes: [],
      },
    ]);
  });
});

describe("save mapping helpers", () => {
  it("maps board and note data to insert payloads", () => {
      const board: Board = {
        id: "board-1",
        title: "Workspace",
        description: "Focus area",
      notes: [
        {
          id: "note-note",
          type: "text",
          x: 0,
          y: 0,
          width: 260,
          height: 190,
          title: "Draft",
          body: "Hello",
        },
      ],
    };

    expect(mapBoardToRow("user-1", board)).toEqual({
      id: "board-1",
      user_id: "user-1",
      title: "Workspace",
      description: "Focus area",
      deleted_at: null,
    });

    expect(mapNoteToRow("user-1", board.id, board.notes[0])).toEqual({
      id: "note-note",
      board_id: "board-1",
      user_id: "user-1",
      type: "text",
      x: 0,
      y: 0,
      width: 260,
      height: 190,
      title: "Draft",
      body: "Hello",
      src: null,
      alt: null,
      caption: null,
      url: null,
      site_name: null,
      description: null,
      preview_image: null,
      deleted_at: null,
    });
  });
});

describe("resolveNoteIdsToSoftDelete", () => {
  it("skips notes that belong to soft-deleted boards", () => {
    const existingNotes = [
      { id: "note-on-active-board", board_id: "board-1", deleted_at: null },
      { id: "note-on-removed-board", board_id: "board-2", deleted_at: null },
      { id: "already-deleted", board_id: "board-1", deleted_at: "2026-01-01T00:00:00.000Z" },
      { id: "still-present", board_id: "board-1", deleted_at: null },
    ];

    const noteIdsToSoftDelete = resolveNoteIdsToSoftDelete(
      existingNotes,
      new Set(["board-1"]),
      new Set(["still-present"]),
    );

    expect(noteIdsToSoftDelete).toEqual(["note-on-active-board"]);
  });
});
