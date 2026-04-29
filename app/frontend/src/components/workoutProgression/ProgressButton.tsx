import { useState } from "react";
import type { ViewStyle } from "react-native";
import ProgressionInterface from "@/components/workoutProgression/ProgressionInterface";
import ForgeButton from "../ForgeButton";

export default function ProgressionButton({
  exerciseId,
  userId,
  text = "Progression",
  compact = false,
  style,
}: {
  exerciseId: string;
  userId?: number | null;
  text?: string;
  compact?: boolean;
  style?: ViewStyle;
}) {
  const [isOpen, setOpen] = useState(false);

  return (
    <>
      <ForgeButton
        text={text}
        compact={compact}
        style={style}
        onPress={() => setOpen(true)}
      />

      {isOpen ? (
        <ProgressionInterface
          exerciseId={exerciseId}
          visible={isOpen}
          setVisible={setOpen}
          userId={userId}
        />
      ) : null}
    </>
  );
}
