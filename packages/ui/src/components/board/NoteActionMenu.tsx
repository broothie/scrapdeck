import { ArrowDown, ArrowUp, Copy, Pencil, Trash2 } from "lucide-react";
import type { Note } from "@plumboard/core";
import { ContextActionMenu, type ContextActionMenuItem } from "./ContextActionMenu";

export type NoteContextMenuAction = "edit" | "duplicate" | "bring-front" | "send-back" | "delete";

type NoteActionMenuProps = {
  onAction: (action: NoteContextMenuAction) => void;
  actions?: NoteContextMenuAction[];
};

const menuItems: ContextActionMenuItem<NoteContextMenuAction>[] = [
  { action: "edit", label: "Edit", Icon: Pencil },
  { action: "duplicate", label: "Duplicate", Icon: Copy },
  { action: "bring-front", label: "Bring To Front", Icon: ArrowUp },
  { action: "send-back", label: "Send To Back", Icon: ArrowDown },
  { action: "delete", label: "Delete", Icon: Trash2, isDanger: true },
];

const defaultNoteMenuActions = menuItems.map((item) => item.action);

export function resolveNoteMenuActions(noteType: Note["type"]): NoteContextMenuAction[] {
  if (noteType !== "link") {
    return defaultNoteMenuActions.filter((action) => action !== "edit");
  }

  return defaultNoteMenuActions;
}

export function NoteActionMenu({ onAction, actions = defaultNoteMenuActions }: NoteActionMenuProps) {
  const filteredMenuItems = menuItems.filter((item) => actions.includes(item.action));

  return <ContextActionMenu items={filteredMenuItems} onAction={onAction} />;
}
