import { beforeEach, describe, expect, it } from "vitest";
import { useAppStore, type Board } from "@scrapdeck/core";

beforeEach(() => {
  useAppStore.setState({
    boards: [],
    activeBoardId: "",
  });
});

describe("useAppStore", () => {
  it("adds and deletes boards while keeping active board fallback behavior", () => {
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

    useAppStore.getState().deleteBoard("board-2");
    expect(useAppStore.getState().boards).toEqual([]);
    expect(useAppStore.getState().activeBoardId).toBe("");
  });

  it("updates board metadata", () => {
    const board: Board = {
      id: "board-1",
      title: "Original",
      description: "Original description",
      scraps: [],
    };

    useAppStore.getState().addBoard(board);
    useAppStore.getState().updateBoard("board-1", {
      title: "Renamed board",
      description: "Updated description",
    });

    expect(useAppStore.getState().boards[0]).toMatchObject({
      id: "board-1",
      title: "Renamed board",
      description: "Updated description",
    });
  });

  it("updates note contents, layout, and supports scrap deletion", () => {
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

    expect(useAppStore.getState().boards[0].scraps[0]).toMatchObject({
      id: "note-1",
      type: "note",
      title: "Fresh",
    });

    useAppStore.getState().deleteScrap("board-1", "note-1");

    const activeBoard = useAppStore.getState().boards[0];
    const image = activeBoard.scraps[0];

    expect(image).toMatchObject({
      id: "image-1",
      type: "image",
      x: 400,
      y: 80,
      width: 280,
      height: 240,
    });
    expect(activeBoard.scraps).toHaveLength(1);
  });

  it("duplicates, reorders, and edits link/image scraps", () => {
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
        {
          id: "link-1",
          type: "link",
          x: 500,
          y: 30,
          width: 360,
          height: 208,
          url: "https://example.com",
          siteName: "example.com",
          title: "Example",
          description: "Sample",
          previewImage: undefined,
        },
      ],
    };

    useAppStore.getState().addBoard(board);

    useAppStore.getState().duplicateScrap("board-1", "link-1");
    const duplicatedBoard = useAppStore.getState().boards[0];
    expect(duplicatedBoard.scraps).toHaveLength(4);
    expect(duplicatedBoard.scraps[3].type).toBe("link");

    useAppStore.getState().moveScrapToBack("board-1", "link-1");
    expect(useAppStore.getState().boards[0].scraps[0].id).toBe("link-1");

    useAppStore.getState().moveScrapToFront("board-1", "note-1");
    const scrapsAfterReorder = useAppStore.getState().boards[0].scraps;
    expect(scrapsAfterReorder[scrapsAfterReorder.length - 1].id).toBe("note-1");

    useAppStore.getState().updateImageScrap("board-1", "image-1", {
      caption: "Updated caption",
    });
    useAppStore.getState().updateLinkScrap("board-1", "link-1", {
      title: "Updated link",
      url: "https://example.com/new",
    });

    const updatedScraps = useAppStore.getState().boards[0].scraps;
    const updatedImage = updatedScraps.find((scrap) => scrap.id === "image-1");
    const updatedLink = updatedScraps.find((scrap) => scrap.id === "link-1");

    expect(updatedImage).toMatchObject({
      id: "image-1",
      type: "image",
      caption: "Updated caption",
    });
    expect(updatedLink).toMatchObject({
      id: "link-1",
      type: "link",
      title: "Updated link",
      url: "https://example.com/new",
    });
  });
});
