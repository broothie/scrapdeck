import { useState, type CSSProperties } from "react";
import { useTheme } from "tamagui";
import type { Scrap } from "@plumboard/core";

export type ScrapContextMenuAction = "edit" | "duplicate" | "bring-front" | "send-back" | "delete";

type ScrapActionMenuProps = {
  onAction: (action: ScrapContextMenuAction) => void;
  actions?: ScrapContextMenuAction[];
};

const menuItems: Array<{
  action: ScrapContextMenuAction;
  label: string;
  isDanger?: boolean;
}> = [
  { action: "edit", label: "Edit" },
  { action: "duplicate", label: "Duplicate" },
  { action: "bring-front", label: "Bring To Front" },
  { action: "send-back", label: "Send To Back" },
  { action: "delete", label: "Delete", isDanger: true },
];

const defaultScrapMenuActions = menuItems.map((item) => item.action);

export function resolveScrapMenuActions(scrapType: Scrap["type"]): ScrapContextMenuAction[] {
  if (scrapType === "note") {
    return defaultScrapMenuActions.filter((action) => action !== "edit");
  }

  return defaultScrapMenuActions;
}

export function ScrapActionMenu({ onAction, actions = defaultScrapMenuActions }: ScrapActionMenuProps) {
  const theme = useTheme();
  const [hoveredAction, setHoveredAction] = useState<ScrapContextMenuAction | null>(null);
  const filteredMenuItems = menuItems.filter((item) => actions.includes(item.action));

  return (
    <div
      className="nodrag nopan"
      onPointerDown={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
      style={{
        width: "fit-content",
        borderRadius: 3,
        border: `1px solid ${theme.borderDefault.val}`,
        backgroundColor: theme.surface.val,
        boxShadow: "0 10px 30px rgba(5, 8, 14, 0.18)",
        padding: "0.25rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: 0,
      }}
    >
      {filteredMenuItems.map((item, index) => {
        const isHovered = hoveredAction === item.action;

        return (
          <div key={item.action} style={{ width: "100%" }}>
            {index > 0 ? (
              <div
                aria-hidden="true"
                style={{
                  height: 1,
                  backgroundColor: theme.borderSubtle.val,
                  margin: "0.08rem 0.35rem",
                }}
              />
            ) : null}
            <button
              type="button"
              className="nodrag nopan"
              style={menuButtonStyle({
                color: item.isDanger ? theme.danger.val : theme.textPrimary.val,
                isDanger: Boolean(item.isDanger),
                isHovered,
                hoverColor: theme.surfaceHover.val,
              })}
              onMouseEnter={() => setHoveredAction(item.action)}
              onMouseLeave={() => setHoveredAction(null)}
              onClick={() => onAction(item.action)}
            >
              {item.label}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function menuButtonStyle(options: {
  color: string;
  isDanger: boolean;
  isHovered: boolean;
  hoverColor: string;
}): CSSProperties {
  return {
    width: "100%",
    border: 0,
    borderRadius: 4,
    whiteSpace: "nowrap",
    display: "block",
    backgroundColor: options.isHovered ? options.hoverColor : "transparent",
    color: options.color,
    textAlign: "left",
    padding: "0.32rem 0.55rem",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: options.isDanger ? 700 : 500,
  };
}
