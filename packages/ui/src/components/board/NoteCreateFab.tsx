import { Plus } from "lucide-react";
import { Text, XStack } from "tamagui";
import { AppButton } from "../primitives/AppButton";
import type { FabAction } from "./boardSurface.types";
import { AddNoteContextMenu } from "./AddNoteContextMenu";

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
        onPress={onToggle}
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
          <Plus
            size={14}
            strokeWidth={2.8}
            color="currentColor"
            style={{
              transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
              transition: "transform 160ms ease",
            }}
          />
          <Text style={{ fontSize: 15, lineHeight: 1.1, fontWeight: 700, color: "currentColor" }}>
            Add
          </Text>
        </XStack>
      </AppButton>
      {isOpen ? (
        <AddNoteContextMenu
          onAction={onAction}
          align="right"
          isUploadingFile={isUploadingFile}
        />
      ) : null}
    </div>
  );
}
