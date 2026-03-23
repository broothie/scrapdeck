import { useEffect, useState } from "react";
import { ExternalLink, FileImage } from "lucide-react";
import { createPortal } from "react-dom";
import { Card, Paragraph, XStack, YStack, useTheme } from "tamagui";
import type { ImageNote } from "@plumboard/core";

type ImageNoteCardProps = {
  note: ImageNote;
  shouldOpenLightbox?: boolean;
  onOpenLightboxHandled?: () => void;
};

export function ImageNoteCard({
  note,
  shouldOpenLightbox = false,
  onOpenLightboxHandled,
}: ImageNoteCardProps) {
  const theme = useTheme();
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setHasImageError(false);
    setIsLightboxOpen(false);
  }, [note.id, note.src]);

  useEffect(() => {
    if (!isLightboxOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsLightboxOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isLightboxOpen]);

  useEffect(() => {
    if (!shouldOpenLightbox || hasImageError) {
      return;
    }

    setIsLightboxOpen(true);
    onOpenLightboxHandled?.();
  }, [hasImageError, onOpenLightboxHandled, shouldOpenLightbox]);

  return (
    <>
      <Card
        height="100%"
        overflow="hidden"
        style={{ borderRadius: 18, borderWidth: 1, borderColor: theme.borderSubtle.val }}
      >
        <YStack height="100%">
          {!hasImageError ? (
            <button
              type="button"
              className="nodrag nopan"
              onDoubleClick={(event) => {
                event.stopPropagation();
                setIsLightboxOpen(true);
              }}
              onPointerDown={(event) => event.stopPropagation()}
              style={{
                width: "100%",
                flex: 1,
                minHeight: 0,
                border: 0,
                margin: 0,
                padding: 0,
                display: "block",
                background: "transparent",
                cursor: "default",
              }}
            >
              <img
                alt={note.alt}
                src={note.src}
                onError={() => {
                  setHasImageError(true);
                  setIsLightboxOpen(false);
                }}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </button>
          ) : (
            <YStack
              className="nodrag nopan"
              style={{
                flex: 1,
                minHeight: 0,
                alignItems: "center",
                justifyContent: "center",
                gap: "0.55rem",
                padding: "0.85rem",
                backgroundColor: theme.surfaceHover.val,
              }}
            >
              <FileImage size={22} color={theme.textSecondary.val} />
              <Paragraph
                style={{
                  margin: 0,
                  textAlign: "center",
                  color: theme.textSecondary.val,
                  lineHeight: 1.35,
                }}
              >
                Preview not available for this file type.
              </Paragraph>
              <a
                href={note.src}
                target="_blank"
                rel="noreferrer"
                className="nodrag nopan"
                onPointerDown={(event) => event.stopPropagation()}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  fontSize: 13,
                  fontWeight: 600,
                  color: theme.accentStrong.val,
                  textDecoration: "none",
                }}
              >
                Open file
                <ExternalLink size={12} />
              </a>
            </YStack>
          )}
          {note.caption ? (
            <Paragraph
              style={{
                margin: 0,
                padding: "0.9rem 0.75rem",
                lineHeight: 1.3,
              }}
            >
              {note.caption}
            </Paragraph>
          ) : null}
        </YStack>
      </Card>
      {isLightboxOpen && !hasImageError && typeof document !== "undefined"
        ? createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={note.alt || "Image preview"}
            onClick={() => setIsLightboxOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1.25rem",
              backgroundColor: "rgba(7, 8, 12, 0.78)",
            }}
          >
            <div
              className="nodrag nopan"
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
              style={{
                maxWidth: "94vw",
                maxHeight: "92vh",
                display: "flex",
                flexDirection: "column",
                gap: "0.55rem",
              }}
            >
              <img
                alt={note.alt}
                src={note.src}
                style={{
                  maxWidth: "94vw",
                  maxHeight: "86vh",
                  objectFit: "contain",
                  borderRadius: 10,
                  border: `1px solid ${theme.borderDefault.val}`,
                  backgroundColor: theme.surface.val,
                }}
              />
              {note.caption ? (
                <XStack
                  style={{
                    justifyContent: "center",
                  }}
                >
                  <Paragraph
                    style={{
                      margin: 0,
                      padding: "0.45rem 0.65rem",
                      borderRadius: 8,
                      border: `1px solid ${theme.borderDefault.val}`,
                      backgroundColor: theme.surface.val,
                      color: theme.textPrimary.val,
                      maxWidth: "94vw",
                    }}
                  >
                    {note.caption}
                  </Paragraph>
                </XStack>
              ) : null}
            </div>
          </div>
          ,
          document.body,
        )
        : null}
    </>
  );
}
