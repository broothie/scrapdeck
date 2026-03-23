import { FileImage, Link2, Type } from "lucide-react";
import type { FabAction } from "./boardSurface.types";
import {
  ContextActionMenu,
  type ContextActionMenuAlignment,
  type ContextActionMenuItem,
} from "./ContextActionMenu";

type AddNoteContextMenuProps = {
  onAction: (action: FabAction) => void;
  align?: ContextActionMenuAlignment;
  isUploadingFile?: boolean;
};

export function AddNoteContextMenu({ onAction, align, isUploadingFile }: AddNoteContextMenuProps) {
  const addMenuItems: ContextActionMenuItem<FabAction>[] = [
    { action: "text", label: "Add text note", Icon: Type },
    {
      action: "file",
      label: isUploadingFile ? "Uploading file..." : "Add file",
      Icon: FileImage,
      isDisabled: Boolean(isUploadingFile),
    },
    { action: "link", label: "Add link", Icon: Link2 },
  ];

  return <ContextActionMenu items={addMenuItems} onAction={onAction} align={align} />;
}
