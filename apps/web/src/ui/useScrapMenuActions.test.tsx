import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAppStore, type Board } from "@scrapdeck/core";
import {
  useScrapMenuActions,
} from "../../../../packages/ui/src/components/board/useScrapMenuActions";

const baseBoard: Board = {
  id: "board-1",
  title: "Board",
  description: "Desc",
  scraps: [
    {
      id: "note-1",
      type: "note",
      x: 10,
      y: 20,
      width: 260,
      height: 190,
      title: "Old title",
      body: "Old body",
    },
  ],
};

beforeEach(() => {
  useAppStore.setState({
    boards: [structuredClone(baseBoard)],
    activeBoardId: "board-1",
  });
});

describe("useScrapMenuActions", () => {
  it("supports injectable prompt adapter for edit actions", () => {
    const prompt = vi
      .fn()
      .mockReturnValueOnce("New title")
      .mockReturnValueOnce("New body");
    const alert = vi.fn();
    const { result } = renderHook(() =>
      useScrapMenuActions(baseBoard, {
        editAdapter: { prompt, alert },
      }),
    );

    act(() => {
      result.current.runScrapMenuAction("note-1", "edit");
    });

    const updatedNote = useAppStore
      .getState()
      .boards[0]
      .scraps.find((scrap) => scrap.id === "note-1");

    expect(updatedNote).toMatchObject({
      id: "note-1",
      type: "note",
      title: "New title",
      body: "New body",
    });
    expect(alert).not.toHaveBeenCalled();
  });

  it("notifies completion for send-back action", () => {
    const onActionComplete = vi.fn();
    const { result } = renderHook(() =>
      useScrapMenuActions(baseBoard, {
        onActionComplete,
      }),
    );

    act(() => {
      result.current.runScrapMenuAction("note-1", "send-back");
    });

    expect(onActionComplete).toHaveBeenCalledWith("note-1", "send-back");
  });
});
