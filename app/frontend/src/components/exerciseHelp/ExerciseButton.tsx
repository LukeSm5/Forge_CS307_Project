import { useState } from "react";

import ForgeButton from "@/components/ForgeButton";
import ExerciseListInterface from "@/components/exerciseHelp/ExerciseListInterface";

export default function ExerciseButton() {
  const [isOpen, setOpen] = useState(false);

  return (
    <>
      <ForgeButton text="Exercises" onPress={() => setOpen(true)} />
      <ExerciseListInterface visible={isOpen} setVisible={setOpen} />
    </>
  );
}
