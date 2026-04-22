import { useState } from "react";
import { StyleSheet } from "react-native";
import ProgressionInterface from "@/components/workoutProgression/ProgressionInterface";
import ForgeButton from "../ForgeButton";

export default function ProgressionButton({
  exerciseId,
}: {
  exerciseId: string;
}) {
  const [isOpen, setOpen] = useState(false);

  return (
    <>
      <ForgeButton text="Progression" onPress={() => setOpen(true)} />

      {isOpen ? (
        <ProgressionInterface
          exerciseId={exerciseId}
          visible={isOpen}
          setVisible={setOpen}
        />
      ) : null}
    </>
  );
}
