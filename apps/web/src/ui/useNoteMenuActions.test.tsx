import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAppStore, type Board } from "@plumboard/core";
import {
  useNoteMenuActions,
} from "../../../../packages/ui/src/components/board/useNoteMenuActions";

const baseBoard: Board = {
  id: "board-1",
  title: "Board",
  description: "Desc",
  notes: [
    {
      id: "note-1",
      type: "text",
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

describe("useNoteMenuActions", () => {
  it("uses inline text-note editing flow for text notes", () => {
    const prompt = vi.fn();
    const alert = vi.fn();
    const { result } = renderHook(() =>
      useNoteMenuActions(baseBoard, {
        editAdapter: { prompt, alert },
      }),
    );

    act(() => {
      result.current.runNoteMenuAction("note-1", "edit");
    });

    expect(prompt).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith("Text notes are edited directly on the canvas.");
  });

  it("notifies completion for send-back action", () => {
    const onActionComplete = vi.fn();
    const { result } = renderHook(() =>
      useNoteMenuActions(baseBoard, {
        onActionComplete,
      }),
    );

    act(() => {
      result.current.runNoteMenuAction("note-1", "send-back");
    });

    expect(onActionComplete).toHaveBeenCalledWith("note-1", "send-back");
  });
});
