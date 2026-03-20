import { useEffect, useRef, useState } from "react";
import type { Board } from "../../types";
import { BoardSurface } from "./BoardSurface";
import { useAppStore } from "../../store/useAppStore";

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

type BoardViewProps = {
  board: Board;
};

export function BoardView({ board }: BoardViewProps) {
  const addScrap = useAppStore((state) => state.addScrap);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState("");
  const linkInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isAddingLink) {
      linkInputRef.current?.focus();
      linkInputRef.current?.select();
    }
  }, [isAddingLink]);

  const closeLinkComposer = () => {
    setIsAddingLink(false);
    setLinkUrl("");
    setLinkError("");
  };

  const nextPlacement = () => {
    const offset = board.scraps.length * 22;

    return {
      x: 72 + (offset % 220),
      y: 88 + (offset % 180),
    };
  };

  const handleAddNote = () => {
    const { x, y } = nextPlacement();

    addScrap(board.id, {
      id: createId("note"),
      type: "note",
      x,
      y,
      width: 260,
      height: 190,
      title: "Fresh note",
      body: "Drop quick thoughts here and drag them into place.",
    });
  };

  const handleAddImage = () => {
    const { x, y } = nextPlacement();

    addScrap(board.id, {
      id: createId("image"),
      type: "image",
      x,
      y,
      width: 320,
      height: 250,
      src: "/demo-assets/studio-board.svg",
      alt: "Demo image scrap",
      caption: "Placeholder image for the prototype.",
    });
  };

  const handleAddLink = () => {
    setIsAddingLink(true);
    setLinkError("");
  };

  const handleSaveLink = () => {
    const trimmedUrl = linkUrl.trim();

    if (!trimmedUrl) {
      setLinkError("Enter a URL to save.");
      return;
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(trimmedUrl);
    } catch {
      setLinkError("Enter a valid URL, including https://");
      return;
    }

    const { x, y } = nextPlacement();
    const hostname = parsedUrl.hostname.replace(/^www\./, "");
    const path = parsedUrl.pathname === "/" ? "" : parsedUrl.pathname;
    const summary = [hostname, path].filter(Boolean).join("");

    addScrap(board.id, {
      id: createId("link"),
      type: "link",
      x,
      y,
      width: 360,
      height: 208,
      url: parsedUrl.toString(),
      siteName: hostname || "Saved Link",
      title: summary || parsedUrl.toString(),
      description: "Saved from a pasted URL.",
    });

    closeLinkComposer();
  };

  return (
    <section className="board-view">
      <header className="board-view__header">
        <div className="board-view__title-block">
          <p className="board-view__eyebrow">Active board</p>
          <h2>{board.title}</h2>
          <p className="board-view__summary">{board.description}</p>
        </div>
        <div className="board-toolbar" aria-label="Create scraps">
          <button className="board-toolbar__button" onClick={handleAddNote} type="button">
            Add note
          </button>
          <button className="board-toolbar__button" onClick={handleAddImage} type="button">
            Add image
          </button>
          <button className="board-toolbar__button" onClick={handleAddLink} type="button">
            Add link
          </button>
        </div>
      </header>

      {isAddingLink ? (
        <div className="link-composer" role="dialog" aria-label="Add a link">
          <div className="link-composer__copy">
            <strong>Save a link</strong>
            <span>Paste a full URL and we’ll create a link scrap for this board.</span>
          </div>
          <input
            ref={linkInputRef}
            className="link-composer__input"
            onChange={(event) => setLinkUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSaveLink();
              }

              if (event.key === "Escape") {
                closeLinkComposer();
              }
            }}
            placeholder="https://example.com/article"
            type="url"
            value={linkUrl}
          />
          {linkError ? <p className="link-composer__error">{linkError}</p> : null}
          <div className="link-composer__actions">
            <button className="board-toolbar__button" onClick={closeLinkComposer} type="button">
              Cancel
            </button>
            <button className="board-toolbar__button is-primary" onClick={handleSaveLink} type="button">
              Save link
            </button>
          </div>
        </div>
      ) : null}

      <BoardSurface board={board} />
    </section>
  );
}
