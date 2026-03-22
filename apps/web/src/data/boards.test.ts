import { beforeEach, describe, expect, it } from "vitest";
import { useAppStore, type Board } from "@scrapdeck/core";
import { assembleBoards, mapScrapRowToScrap, mapScrapToRow, mapBoardToRow } from "./boards";

type SampleScrapRow = {
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
};

const noteScrapRow: SampleScrapRow = {
  id: "scrap-note",
  board_id: "board-1",
  user_id: "user-1",
  type: "note",
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
};

beforeEach(() => {
  useAppStore.setState({ boards: [], activeBoardId: "" });
});

describe("mapScrapRowToScrap", () => {
  it("maps a note scrap row", () => {
    const scrap = mapScrapRowToScrap(noteScrapRow);
    expect(scrap).toEqual({
      id: "scrap-note",
      type: "note",
      x: 16,
      y: 24,
      width: 300,
      height: 220,
      title: "Note title",
      body: "Note body",
    });
  });

  it("throws for unknown scrap types", () => {
    const invalidRow = {
      ...noteScrapRow,
      type: "video",
    } as unknown as SampleScrapRow;

    expect(() => mapScrapRowToScrap(invalidRow)).toThrowError(
      "Unsupported scrap row type: video",
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
      },
      {
        id: "board-2",
        title: "Archive",
        description: "Other",
        user_id: "user-1",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    ];

    const imageScrapRow = {
      ...noteScrapRow,
      id: "scrap-image",
      type: "image",
      board_id: "board-1",
      src: "/asset.png",
      alt: "Alt text",
    } as unknown as SampleScrapRow;

    const linkScrapRow = {
      ...noteScrapRow,
      id: "scrap-link",
      type: "link",
      board_id: "board-1",
      title: "Scrap title",
      description: "desc",
      url: "https://example.com",
      site_name: "example.com",
      preview_image: "/preview.png",
    } as unknown as SampleScrapRow;

    const boardModels = assembleBoards(
      boardRowsInput,
      [noteScrapRow, imageScrapRow, linkScrapRow],
    );

    expect(boardModels).toEqual([
      {
        id: "board-1",
        title: "Ideas",
        description: "Board description",
        scraps: [
          {
            id: "scrap-note",
            type: "note",
            x: 16,
            y: 24,
            width: 300,
            height: 220,
            title: "Note title",
            body: "Note body",
          },
          {
            id: "scrap-image",
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
            id: "scrap-link",
            type: "link",
            x: 16,
            y: 24,
            width: 300,
            height: 220,
            url: "https://example.com",
            siteName: "example.com",
            title: "Scrap title",
            description: "desc",
            previewImage: "/preview.png",
          },
        ],
      },
      {
        id: "board-2",
        title: "Archive",
        description: "Other",
        scraps: [],
      },
    ]);
  });
});

describe("save mapping helpers", () => {
  it("maps board and scrap data to insert payloads", () => {
      const board: Board = {
        id: "board-1",
        title: "Workspace",
        description: "Focus area",
      scraps: [
        {
          id: "scrap-note",
          type: "note",
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
    });

    expect(mapScrapToRow("user-1", board.id, board.scraps[0])).toEqual({
      id: "scrap-note",
      board_id: "board-1",
      user_id: "user-1",
      type: "note",
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
    });
  });
});
