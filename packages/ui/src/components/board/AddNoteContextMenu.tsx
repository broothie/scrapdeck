import { FileImage, Link2, Type } from "lucide-react";
import type { FabAction } from "./boardSurface.types";
import { ContextActionMenu, type ContextActionMenuItem } from "./ContextActionMenu";

type AddNoteContextMenuProps = {
  onAction: (action: FabAction) => void;
};

const addMenuItems: ContextActionMenuItem<FabAction>[] = [
  { action: "text", label: "Add text note", Icon: Type },
  { action: "file", label: "Add file", Icon: FileImage },
  { action: "link", label: "Add link", Icon: Link2 },
];

export function AddNoteContextMenu({ onAction }: AddNoteContextMenuProps) {
  return <ContextActionMenu items={addMenuItems} onAction={onAction} />;
}
