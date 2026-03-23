import { beforeEach, describe, expect, it } from "vitest";
import { useAppStore, type Board } from "@plumboard/core";

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
      notes: [],
    };
    const secondBoard: Board = {
      id: "board-2",
      title: "Later",
      description: "Secondary",
      notes: [],
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
      notes: [],
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

  it("updates note contents, layout, and supports note deletion", () => {
    const board: Board = {
      id: "board-1",
      title: "Board",
      description: "Working",
      notes: [
        {
          id: "note-1",
          type: "text",
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

    useAppStore.getState().updateTextNote("board-1", "note-1", { title: "Fresh" });
    useAppStore
      .getState()
      .updateNoteLayout("board-1", "image-1", { x: 400, y: 80, width: 280, height: 240 });

    expect(useAppStore.getState().boards[0].notes[0]).toMatchObject({
      id: "note-1",
      type: "text",
      title: "Fresh",
    });

    useAppStore.getState().deleteNote("board-1", "note-1");

    const activeBoard = useAppStore.getState().boards[0];
    const image = activeBoard.notes[0];

    expect(image).toMatchObject({
      id: "image-1",
      type: "image",
      x: 400,
      y: 80,
      width: 280,
      height: 240,
    });
    expect(activeBoard.notes).toHaveLength(1);
  });

  it("duplicates, reorders, and edits link/image notes", () => {
    const board: Board = {
      id: "board-1",
      title: "Board",
      description: "Working",
      notes: [
        {
          id: "note-1",
          type: "text",
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

    useAppStore.getState().duplicateNote("board-1", "link-1");
    const duplicatedBoard = useAppStore.getState().boards[0];
    expect(duplicatedBoard.notes).toHaveLength(4);
    expect(duplicatedBoard.notes[3].type).toBe("link");

    useAppStore.getState().moveNoteToBack("board-1", "link-1");
    expect(useAppStore.getState().boards[0].notes[0].id).toBe("link-1");

    useAppStore.getState().moveNoteToFront("board-1", "note-1");
    const notesAfterReorder = useAppStore.getState().boards[0].notes;
    expect(notesAfterReorder[notesAfterReorder.length - 1].id).toBe("note-1");

    useAppStore.getState().updateImageNote("board-1", "image-1", {
      caption: "Updated caption",
    });
    useAppStore.getState().updateLinkNote("board-1", "link-1", {
      title: "Updated link",
      url: "https://example.com/new",
    });

    const updatedNotes = useAppStore.getState().boards[0].notes;
    const updatedImage = updatedNotes.find((note) => note.id === "image-1");
    const updatedLink = updatedNotes.find((note) => note.id === "link-1");

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
