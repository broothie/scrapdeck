import { Plus } from "lucide-react";
import type { CSSProperties } from "react";
import { useTheme } from "tamagui";
import type { FabAction } from "./boardSurface.types";

type ScrapCreateFabProps = {
  isOpen: boolean;
  isUploadingFile?: boolean;
  onToggle: () => void;
  onAction: (action: FabAction) => void;
};

export function ScrapCreateFab({
  isOpen,
  isUploadingFile,
  onToggle,
  onAction,
}: ScrapCreateFabProps) {
  const theme = useTheme();

  return (
    <div
      onPointerDown={(event) => event.stopPropagation()}
      style={{
        position: "absolute",
        right: 16,
        top: 16,
        zIndex: 24,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "0.45rem",
      }}
    >
      <button
        type="button"
        className="nodrag nopan"
        onClick={onToggle}
        aria-label="Create scrap"
        style={{
          width: "fit-content",
          height: 44,
          padding: "0 0.7rem",
          borderRadius: 12,
          border: `1px solid ${theme.accentStrong.val}`,
          backgroundColor: theme.accentStrong.val,
          color: theme.accentSubtle.val,
          boxShadow: "0 2px 7px rgba(5, 8, 14, 0.14)",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          textAlign: "center",
          justifyContent: "center",
          gap: "0.34rem",
          fontSize: 15,
          lineHeight: 1.1,
          fontWeight: 700,
        }}
      >
        Add
        <Plus
          size={14}
          strokeWidth={2.8}
          style={{
            transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
            transition: "transform 160ms ease",
          }}
        />
      </button>
      {isOpen ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "0.38rem",
          }}
        >
          <button
            type="button"
            className="nodrag nopan"
            style={fabOptionButtonStyle({
              background: theme.surface.val,
              border: theme.borderDefault.val,
              text: theme.textPrimary.val,
            })}
            onClick={() => onAction("note")}
          >
            Add note
          </button>
          <button
            type="button"
            className="nodrag nopan"
            style={fabOptionButtonStyle({
              background: theme.surface.val,
              border: theme.borderDefault.val,
              text: theme.textPrimary.val,
            })}
            onClick={() => onAction("file")}
            disabled={isUploadingFile}
          >
            {isUploadingFile ? "Uploading file..." : "Add file"}
          </button>
          <button
            type="button"
            className="nodrag nopan"
            style={fabOptionButtonStyle({
              background: theme.surface.val,
              border: theme.borderDefault.val,
              text: theme.textPrimary.val,
            })}
            onClick={() => onAction("link")}
          >
            Add link
          </button>
        </div>
      ) : null}
    </div>
  );
}

function fabOptionButtonStyle(options: {
  background: string;
  border: string;
  text: string;
}): CSSProperties {
  return {
    minWidth: 112,
    border: `1px solid ${options.border}`,
    borderRadius: 10,
    backgroundColor: options.background,
    color: options.text,
    textAlign: "left",
    padding: "0.42rem 0.72rem",
    fontSize: 13,
    fontWeight: 500,
    boxShadow: "0 2px 6px rgba(5, 8, 14, 0.1)",
    cursor: "pointer",
  };
}
