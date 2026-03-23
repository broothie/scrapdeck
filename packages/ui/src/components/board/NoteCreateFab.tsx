import { Plus } from "lucide-react";
import { Text, XStack } from "tamagui";
import { AppButton } from "../primitives/AppButton";
import type { FabAction } from "./boardSurface.types";

type NoteCreateFabProps = {
  isOpen: boolean;
  isUploadingFile?: boolean;
  onToggle: () => void;
  onAction: (action: FabAction) => void;
};

export function NoteCreateFab({
  isOpen,
  isUploadingFile,
  onToggle,
  onAction,
}: NoteCreateFabProps) {
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
        <AppButton
          className="nodrag nopan"
          onClick={onToggle}
          aria-label="Create note"
        variant="cta"
        style={{
          width: "fit-content",
          height: 44,
          padding: "0 0.7rem",
          borderRadius: 12,
          boxShadow: "0 2px 7px rgba(5, 8, 14, 0.14)",
        }}
      >
        <XStack style={{ alignItems: "center", gap: "0.34rem" }}>
          <Text style={{ fontSize: 15, lineHeight: 1.1, fontWeight: 700, color: "currentColor" }}>
            Add
          </Text>
          <Plus
            size={14}
            strokeWidth={2.8}
            color="currentColor"
            style={{
              transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
              transition: "transform 160ms ease",
            }}
          />
        </XStack>
      </AppButton>
      {isOpen ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "0.38rem",
          }}
        >
          <AppButton
            className="nodrag nopan"
            variant="outline"
            style={fabOptionButtonStyle()}
            onClick={() => onAction("text")}
          >
            Add text note
          </AppButton>
          <AppButton
            className="nodrag nopan"
            variant="outline"
            style={fabOptionButtonStyle()}
            onClick={() => onAction("file")}
            disabled={isUploadingFile}
          >
            {isUploadingFile ? "Uploading file..." : "Add file"}
          </AppButton>
          <AppButton
            className="nodrag nopan"
            variant="outline"
            style={fabOptionButtonStyle()}
            onClick={() => onAction("link")}
          >
            Add link
          </AppButton>
        </div>
      ) : null}
    </div>
  );
}

function fabOptionButtonStyle() {
  return {
    minWidth: 112,
    borderRadius: 10,
    textAlign: "left" as const,
    padding: "0.42rem 0.72rem",
    fontSize: 13,
    fontWeight: 500,
    boxShadow: "0 2px 6px rgba(5, 8, 14, 0.1)",
  };
}
