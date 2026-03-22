import type { NodeProps } from "@xyflow/react";
import { View, useTheme } from "tamagui";
import type { PlacementNodeData } from "./boardSurface.types";

export function PlacementPreviewNode(props: NodeProps) {
  const theme = useTheme();
  const data = props.data as PlacementNodeData;

  return (
    <View
      style={{
        width: data.width,
        height: data.height,
        borderWidth: 2,
        borderStyle: "dashed",
        borderColor: data.borderColor,
        backgroundColor: theme.accentSubtle.val,
        borderRadius: 16,
        pointerEvents: "none",
      }}
    />
  );
}
