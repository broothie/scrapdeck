import { useState, type CSSProperties } from "react";
import { FileImage, Link2, Type } from "lucide-react";
import { useTheme } from "tamagui";
import type { FabAction } from "./boardSurface.types";

type AddNoteContextMenuProps = {
  onAction: (action: FabAction) => void;
};

const addMenuItems: Array<{
  action: FabAction;
  label: string;
  Icon: typeof Type;
}> = [
  { action: "text", label: "Add text note", Icon: Type },
  { action: "file", label: "Add file", Icon: FileImage },
  { action: "link", label: "Add link", Icon: Link2 },
];

export function AddNoteContextMenu({ onAction }: AddNoteContextMenuProps) {
  const theme = useTheme();
  const [hoveredAction, setHoveredAction] = useState<FabAction | null>(null);

  return (
    <div
      className="nodrag nopan"
      onPointerDown={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "0.28rem",
      }}
    >
      {addMenuItems.map((item) => {
        const isHovered = hoveredAction === item.action;
        const Icon = item.Icon;

        return (
          <button
            key={item.action}
            type="button"
            className="nodrag nopan"
            style={menuButtonStyle({
              color: theme.textPrimary.val,
              isHovered,
              hoverColor: theme.surfaceHover.val,
              borderColor: theme.borderDefault.val,
              backgroundColor: theme.surface.val,
            })}
            onMouseEnter={() => setHoveredAction(item.action)}
            onMouseLeave={() => setHoveredAction(null)}
            onClick={() => onAction(item.action)}
          >
            <Icon size={13} strokeWidth={2.2} />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function menuButtonStyle(options: {
  color: string;
  isHovered: boolean;
  hoverColor: string;
  borderColor: string;
  backgroundColor: string;
}): CSSProperties {
  return {
    width: "fit-content",
    border: `1px solid ${options.borderColor}`,
    borderRadius: 8,
    whiteSpace: "nowrap",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: "0.34rem",
    backgroundColor: options.isHovered ? options.hoverColor : options.backgroundColor,
    color: options.color,
    textAlign: "left",
    padding: "0.26rem 0.5rem",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    boxShadow: "0 7px 18px rgba(5, 8, 14, 0.14)",
  };
}
