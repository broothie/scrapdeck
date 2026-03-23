import { ArrowDown, ArrowUp, Copy, Pencil, Search, Trash2 } from "lucide-react";
import type { Note } from "@plumboard/core";
import { ContextActionMenu, type ContextActionMenuItem } from "./ContextActionMenu";
import { canRenderImagePreview } from "./filePreview.utils";

export type NoteContextMenuAction = "view" | "edit" | "duplicate" | "bring-front" | "send-back" | "delete";

type NoteActionMenuProps = {
  onAction: (action: NoteContextMenuAction) => void;
  actions?: NoteContextMenuAction[];
};

const menuItems: ContextActionMenuItem<NoteContextMenuAction>[] = [
  { action: "view", label: "View", Icon: Search },
  { action: "edit", label: "Edit", Icon: Pencil },
  { action: "duplicate", label: "Duplicate", Icon: Copy },
  { action: "bring-front", label: "Bring To Front", Icon: ArrowUp },
  { action: "send-back", label: "Send To Back", Icon: ArrowDown },
  { action: "delete", label: "Delete", Icon: Trash2, isDanger: true },
];

const defaultNoteMenuActions = menuItems.map((item) => item.action);

export function resolveNoteMenuActions(note: Note): NoteContextMenuAction[] {
  if (note.type === "image") {
    if (!canRenderImagePreview(note.src)) {
      return defaultNoteMenuActions.filter((action) => action !== "view");
    }

    return defaultNoteMenuActions;
  }

  if (note.type !== "link") {
    return defaultNoteMenuActions.filter((action) => action !== "edit" && action !== "view");
  }

  return defaultNoteMenuActions.filter((action) => action !== "view");
}

export function NoteActionMenu({ onAction, actions = defaultNoteMenuActions }: NoteActionMenuProps) {
  const filteredMenuItems = menuItems.filter((item) => actions.includes(item.action));

  return <ContextActionMenu items={filteredMenuItems} onAction={onAction} />;
}
