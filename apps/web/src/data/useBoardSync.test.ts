import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAppStore, type Board } from "@scrapdeck/core";
import * as boardService from "./boards";
import { useBoardSync } from "./useBoardSync";

const boardsFixture: Board[] = [
  {
    id: "board-1",
    title: "Ideas",
    description: "Prototype ideas",
    scraps: [
      {
        id: "scrap-note",
        type: "note",
        x: 0,
        y: 0,
        width: 260,
        height: 190,
        title: "Welcome",
        body: "Start here.",
      },
    ],
  },
];

beforeEach(() => {
  useAppStore.setState({
    boards: [],
    activeBoardId: "",
    addBoard: useAppStore.getState().addBoard,
    setBoards: useAppStore.getState().setBoards,
    addScrap: useAppStore.getState().addScrap,
    setActiveBoard: useAppStore.getState().setActiveBoard,
    updateNoteScrap: useAppStore.getState().updateNoteScrap,
    updateScrapLayout: useAppStore.getState().updateScrapLayout,
  });
  vi.restoreAllMocks();
});

  afterEach(() => {
  vi.restoreAllMocks();
});

describe("useBoardSync", () => {
  it("hydrates boards on user load and clears loading state", async () => {
    const fetchSpy = vi.spyOn(boardService, "fetchBoards").mockResolvedValue(boardsFixture);

    const saveSpy = vi.spyOn(boardService, "saveBoards").mockResolvedValue(undefined);
    const { result } = renderHook(() => useBoardSync("user-1"));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetchSpy).toHaveBeenCalledWith("user-1");
    expect(useAppStore.getState().boards).toEqual(boardsFixture);
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it("debounces board save while avoiding immediate write during hydration", async () => {
    vi.spyOn(boardService, "fetchBoards").mockResolvedValue(boardsFixture);
    const saveSpy = vi.spyOn(boardService, "saveBoards").mockResolvedValue(undefined);

    const { unmount } = renderHook(() => useBoardSync("user-1"));

    await waitFor(() => {
      expect(useAppStore.getState().boards).toEqual(boardsFixture);
    });

    saveSpy.mockClear();

    act(() => {
      useAppStore.getState().addBoard({
        id: "board-2",
        title: "Draft board",
        description: "Needs polish",
        scraps: [],
      });
    });

    await new Promise((resolve) => {
      setTimeout(resolve, 249);
    });

    expect(saveSpy).not.toHaveBeenCalled();

    await new Promise((resolve) => {
      setTimeout(resolve, 2);
    });

    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(saveSpy).toHaveBeenCalledWith("user-1", useAppStore.getState().boards);

    unmount();
  });
});
