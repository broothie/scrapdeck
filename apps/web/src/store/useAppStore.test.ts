import { beforeEach, describe, expect, it } from "vitest";
import { useAppStore, type Board } from "@scrapdeck/core";

beforeEach(() => {
  useAppStore.setState({
    boards: [],
    activeBoardId: "",
  });
});

describe("useAppStore", () => {
  it("adds boards and keeps active board fallback behavior", () => {
    const firstBoard: Board = {
      id: "board-1",
      title: "Active",
      description: "Primary",
      scraps: [],
    };
    const secondBoard: Board = {
      id: "board-2",
      title: "Later",
      description: "Secondary",
      scraps: [],
    };

    useAppStore.getState().addBoard(firstBoard);
    expect(useAppStore.getState().activeBoardId).toBe("board-1");

    useAppStore.getState().setBoards([firstBoard, secondBoard]);
    expect(useAppStore.getState().activeBoardId).toBe("board-1");

    useAppStore.getState().setBoards([secondBoard]);
    expect(useAppStore.getState().activeBoardId).toBe("board-2");
  });

  it("updates note contents and scrap layout", () => {
    const board: Board = {
      id: "board-1",
      title: "Board",
      description: "Working",
      scraps: [
        {
          id: "note-1",
          type: "note",
          x: 10,
          y: 20,
          width: 260,
          height: 190,
          title: "Old",
          body: "Body",
        },
        {
          id: "image-1",
          type: "image",
          x: 300,
          y: 20,
          width: 320,
          height: 250,
          src: "/image.png",
          alt: "Image",
          caption: undefined,
        },
      ],
    };

    useAppStore.getState().addBoard(board);

    useAppStore.getState().updateNoteScrap("board-1", "note-1", { title: "Fresh" });
    useAppStore
      .getState()
      .updateScrapLayout("board-1", "image-1", { x: 400, y: 80, width: 280, height: 240 });

    const activeBoard = useAppStore.getState().boards[0];
    const note = activeBoard.scraps[0];
    const image = activeBoard.scraps[1];

    expect(note).toMatchObject({
      id: "note-1",
      type: "note",
      title: "Fresh",
    });

    expect(image).toMatchObject({
      id: "image-1",
      type: "image",
      x: 400,
      y: 80,
      width: 280,
      height: 240,
    });
  });
});
