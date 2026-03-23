import { useState, type CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import { useTheme } from "tamagui";

export type ContextActionMenuAlignment = "left" | "right";

export type ContextActionMenuItem<TAction extends string> = {
  action: TAction;
  label: string;
  Icon?: LucideIcon;
  isDanger?: boolean;
  isDisabled?: boolean;
};

type ContextActionMenuProps<TAction extends string> = {
  items: ContextActionMenuItem<TAction>[];
  onAction: (action: TAction) => void;
  align?: ContextActionMenuAlignment;
};

export function ContextActionMenu<TAction extends string>({
  items,
  onAction,
  align = "left",
}: ContextActionMenuProps<TAction>) {
  const theme = useTheme();
  const [hoveredAction, setHoveredAction] = useState<TAction | null>(null);

  return (
    <div
      className="nodrag nopan"
      onPointerDown={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: align === "right" ? "flex-end" : "flex-start",
        gap: "0.28rem",
      }}
    >
      {items.map((item) => {
        const isHovered = !item.isDisabled && hoveredAction === item.action;
        const Icon = item.Icon;

        return (
          <button
            key={item.action}
            type="button"
            className="nodrag nopan"
            style={menuButtonStyle({
              color: item.isDanger ? theme.danger.val : theme.textPrimary.val,
              isDanger: Boolean(item.isDanger),
              isHovered,
              isDisabled: Boolean(item.isDisabled),
              hoverColor: theme.surfaceHover.val,
              borderColor: theme.borderDefault.val,
              backgroundColor: theme.surface.val,
            })}
            onMouseEnter={() => {
              if (!item.isDisabled) {
                setHoveredAction(item.action);
              }
            }}
            onMouseLeave={() => setHoveredAction(null)}
            onClick={() => {
              if (!item.isDisabled) {
                onAction(item.action);
              }
            }}
            disabled={item.isDisabled}
          >
            {Icon ? <Icon size={13} strokeWidth={2.2} /> : null}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function menuButtonStyle(options: {
  color: string;
  isDanger: boolean;
  isHovered: boolean;
  isDisabled: boolean;
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
    cursor: options.isDisabled ? "not-allowed" : "pointer",
    fontSize: 13,
    fontWeight: options.isDanger ? 700 : 500,
    opacity: options.isDisabled ? 0.6 : 1,
    boxShadow: "0 7px 18px rgba(5, 8, 14, 0.14)",
  };
}
