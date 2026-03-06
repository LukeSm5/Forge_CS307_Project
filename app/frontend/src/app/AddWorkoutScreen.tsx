import ForgeButton from "@/components/ForgeButton";
import { useState, useEffect, CSSProperties } from "react";
import { Text, View } from "@/components/Themed";
import { ScrollView, StyleProp, StyleSheet, TextStyle } from 'react-native';
import { useRouter } from "expo-router";
import { api } from "@/core/api";
import { Dropdown } from "react-native-element-dropdown";

// Types

export type MuscleGroup =
  | "Chest" | "Back" | "Shoulders" | "Biceps" | "Triceps" | "Forearms"
  | "Abs" | "Obliques" | "Lower Back"
  | "Quads" | "Hamstrings" | "Glutes" | "Calves" | "Hip Flexors" | "Full Body";
export type Difficulty   = "Beginner" | "Intermediate" | "Advanced" | "Elite";
export type ExerciseType = "Strength" | "Cardio" | "Hybrid";
export interface TagSet {
  muscleGroups: MuscleGroup[];
  difficulty:   Difficulty | null;
  exerciseType: ExerciseType | null;
}
export interface TaggedExercise {
  id:   number;
  name: string;
  tags: TagSet;
}

// Constants

const MACHINE_IDS: Record<MachineType, number> = {
  'Barbell': 2,
  'Body': 1,
  'Cable': 0,
  'Dumbbell': 3
};
const MUSCLE_SECTIONS: { label: string; muscles: MuscleGroup[] }[] = [
  { label: "Upper Body", muscles: ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Forearms"] },
  { label: "Core",       muscles: ["Abs", "Obliques", "Lower Back"] },
  { label: "Lower Body", muscles: ["Quads", "Hamstrings", "Glutes", "Calves", "Hip Flexors"] },
  { label: "Full Body",  muscles: ["Full Body"] },
];
const DIFFICULTIES:   Difficulty[]   = ["Beginner", "Intermediate", "Advanced", "Elite"];
const EXERCISE_TYPES: ExerciseType[] = ["Strength", "Cardio", "Hybrid"];
const MACHINE_TYPES: MachineType[] = ["Dumbbell", "Barbell", "Cable", "Body"];
const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  Beginner: "#4ade80", Intermediate: "#facc15", Advanced: "#f97316", Elite: "#f43f5e",
};
const TYPE_COLOR: Record<ExerciseType, string> = {
  Strength: "#818cf8", Cardio: "#fb7185", Hybrid: "#fb923c",
};
const EMPTY_TAGS: TagSet = { muscleGroups: [], difficulty: null, exerciseType: null };
const labelStyle: StyleProp<TextStyle> = {
  color: "#475569", fontSize: 10, textTransform: "uppercase", marginBottom: 8,
};
const MUSCLE_SECTIONS_COLOR: Record<string, string> = {
  "Upper Body": "#0530b1ff",
  "Lower Body": "#ab0000ff",
  "Core": "#8800e3ff",
  "Full Body": "#00a26cff",
};

export type MachineType =
  | "Cable" | "Dumbbell" | "Barbell" | "Body";
const MACHINE_COLORS: Record<MachineType, string> = {
  Cable: "#818cf8", Barbell: "#fb7185", Dumbbell: "#fb923c", Body: "#4bf16fff"
};
export type SingleExercise = {
  name: string,
  machine: MachineType | undefined,
  weight: number,
  sets: number,
  reps: number
};

// Primitives

function MusclePill({ label, active, onClick, activeColor }: { label: string; active: boolean; activeColor: string; onClick: () => void }) {
  return (
    <ForgeButton onPress={onClick} color={active ? activeColor : '#aeaeaeff'} text={label}/>
  );
}
function TypeBtn({ value, active, onClick }: { value: ExerciseType; active: boolean; onClick: () => void }) {
  const c = TYPE_COLOR[value];
  return (
    <ForgeButton onPress={onClick} color={active ? c : "#475569"} text={value}/>
  );
}
function DiffBtn({ value, active, onClick }: { value: Difficulty; active: boolean; onClick: () => void }) {
  const c = DIFFICULTY_COLOR[value];
  return (
    <ForgeButton onPress={onClick} color={active ? c : "#475569"} text={value}/>
  );
}
function MachineBtn({ value, active, onClick }: { value: MachineType; active: boolean; onClick: () => void }) {
  const c = MACHINE_COLORS[value];
  return (
    <ForgeButton onPress={onClick} color={active ? c : "#475569"} text={value}/>
  );
}
// Props

export interface AddScreenProps {
  editing:  TaggedExercise | null;
  onSave:   (name: string, tags: TagSet, editingId?: number) => void;
  onCancel: () => void;
}

// Screen

export default function AddWorkoutScreen({ editing }: AddScreenProps) {
  const router = useRouter();

  const onCancel = () => router.back();
  const onSave = async () => {
    const res = await api.addWorkoutLog({
      profile_id: (await api.me()).profile_id,
      workout_name: name,
      exercises: exerciseList.map(ex => {
        return {
          exercise_id: exerciseMapping[ex.name],
          machine_id: MACHINE_IDS[ex.machine],
          weight: cexWeight,
          sets: cexSets,
          reps: cexReps
        }
      })
    });
  };

  const [exerciseMapping, setExerciseMapping] = useState<Record<string, number>>({});
  
  useEffect(() => {
    async function loadExercises() {
      const res = await api.getExercises();
      setExerciseMapping(res);
    }

    loadExercises();
  }, []);

  const [name,  setName]  = useState<string>(editing?.name ?? "");
  const [tags,  setTags]  = useState<TagSet>(editing?.tags ? { ...editing.tags } : { ...EMPTY_TAGS });
  const [error, setError] = useState<string>("");
  const [exerciseError, setExerciseError] = useState<string>("");
  const [saved, setSaved] = useState<boolean>(false);
  const [exAdded, setExAdded] = useState<boolean>(false);

  // cex = current exercise, the one being edited
  const [cexName, setCexName] = useState<string>("");
  const [cexMachine, setCexMachine] = useState<MachineType | undefined>(undefined);
  const [cexWeight, setCexWeight] = useState<number>(0);
  const [cexSets, setCexSets] = useState<number>(0);
  const [cexReps, setCexReps] = useState<number>(0);

  const [exerciseList, setExerciseList] = useState<SingleExercise[]>([]);

  useEffect(() => {
    setName(editing?.name ?? "");
    setTags(editing?.tags ? { ...editing.tags } : { ...EMPTY_TAGS });
    setError("");
    setSaved(false);
  }, [editing]);
  const toggleMuscle = (mg: MuscleGroup): void => {
    setTags(t => ({
      ...t,
      muscleGroups: [mg],
    }));
  };
  const handleSave = (): void => {
    if (!name.trim())              { setError("Workout name is required.");        return; }
    if (!tags.muscleGroups.length) { setError("Select at least one muscle group."); return; }
    if (!tags.difficulty)          { setError("Select a difficulty.");              return; }
    if (!tags.exerciseType)        { setError("Select an exercise type.");          return; }
    setError("");
    onSave();
    if (!editing) {
      setName("");
      setTags({ ...EMPTY_TAGS });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };
  const addExercise = (): void => {
    if (!cexName.trim())              { setExerciseError("Exercise name is required.");        return; }
    if (!cexMachine)                  { setExerciseError("Select an exercise machine.");       return; }
    if (!cexWeight)                   { setExerciseError("Select a target weight.");           return; }
    if (!cexSets)                     { setExerciseError("Select a target sets.");             return; }
    if (!cexReps)                     { setExerciseError("Select a target reps.");             return; }
    setExerciseError("");
    setExAdded(true);
    setExerciseList([
      ...exerciseList,
      {
        name: cexName,
        machine: cexMachine,
        weight: cexWeight,
        sets: cexSets,
        reps: cexReps
      }
    ]);
  }
  return (
    <View style={styles.container}>
    <ScrollView contentContainerStyle={styles.scroll}>
    <div style={{ overflowX: 'hidden', overflowY: 'visible', maxWidth: 580, margin: "0 auto", padding: "40px 24px 80px", display: "flex", flexDirection: "column", gap: 30 }}>
      <div>
        <Text style={styles.title}>{editing ? "Editing workout" : "New Workout"}</Text>
      </div>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <div>
        <Text style={labelStyle}>Workout Name</Text>
        <input
          key={1}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSave()}
          placeholder="e.g. Barbell Squat"
          style={{
            width: "100%", background: "#d7d7d7ff", border: "1.5px solid #1e293b",
            borderRadius: 8, padding: "12px 16px", color: "#000000ff", fontSize: 14, outline: "none",
            transition: "border-color 0.15s", boxSizing: "border-box",
          }}
          onFocus={e => (e.target.style.borderColor = "#475569")}
          onBlur={e  => (e.target.style.borderColor = "#1e293b")}
        />
      </div>
      <div>
        <Text style={labelStyle}>Workout Type</Text>
        <div style={{ display: "flex", gap: 10 }}>
          {EXERCISE_TYPES.map(t => (
            <TypeBtn key={t} value={t} active={tags.exerciseType === t}
              onClick={() => setTags(p => ({ ...p, exerciseType: t }))} />
          ))}
        </div>
      </div>
      <div>
        <Text style={labelStyle}>Difficulty</Text>
        <div style={{ display: "flex", gap: 8 }}>
          {DIFFICULTIES.map(d => (
            <DiffBtn key={d} value={d} active={tags.difficulty === d}
              onClick={() => setTags(p => ({ ...p, difficulty: d }))} />
          ))}
        </div>
      </div>
      <div>
        <Text style={labelStyle}>Muscle Groups</Text>
        <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {MUSCLE_SECTIONS.map(s => (
            <div key={s.label}>
              <Text style={{ color: "#334155", fontSize: 9, letterSpacing: 0.15, textTransform: "uppercase", marginBottom: 7 }}>
                {s.label}
              </Text>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {s.muscles.map(mg => (
                  <MusclePill key={mg} label={mg} active={tags.muscleGroups.includes(mg)} activeColor={MUSCLE_SECTIONS_COLOR[s.label]} onClick={() => toggleMuscle(mg)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {error && (
        <div style={{ color: "#f87171", fontSize: 12, background: "#450a0a22", border: "1px solid #7f1d1d", borderRadius: 6, padding: "10px 14px" }}>
          <Text lightColor="#f87171">{error}</Text>
        </div>
      )}
      {saved && (
        <div style={{ color: "#4ade80", fontSize: 12, background: "#052e1622", border: "1px solid #166534", borderRadius: 6, padding: "10px 14px" }}>
          <Text lightColor="#4ade80">Workout saved!</Text>
        </div>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        {editing && (
          <button onClick={onCancel} style={{
            flex: 1, padding: "13px 0", borderRadius: 8, border: "1.5px solid #1e293b",
            background: "transparent", color: "#475569",
            fontFamily: "'DM Mono', monospace", fontSize: 12,
            cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.08em",
          }}>
            Cancel
          </button>
        )}
      </div>

      <div><Text style={styles.title}>Exercises</Text></div>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />

      {exerciseList.length == 0 && <Text>No exercises added</Text>}
      {exerciseList.map((e, idx) => (
        <View key={idx} style={{
          width: "100%",
          padding: 15,
          margin: 5,
          borderRadius: 5,
        }} lightColor="#eee" darkColor="#333">
          <View style={{flexDirection: "row", justifyContent: "space-between"}} lightColor="#eee" darkColor="#333"><Text style={styles.title}>{e.name}</Text>
          <View style={{
            backgroundColor: MACHINE_COLORS[e.machine],
            width: "35%",
            padding: 5,
            alignItems: "center",
            borderRadius: 5,
            borderBottomWidth: 2,
          }}><Text lightColor="#ffffffff" style={{ textAlign: "center", ...styles.pillText }}>{e.machine}</Text></View></View>
          <View style={styles.separator} lightColor="#a4a4a4ff" darkColor="rgba(87, 87, 87, 0.1)" />
          <Text>{`${e.sets} set${e.sets > 1 ? 's' : ''} of ${e.weight}lbs for ${e.reps} rep${e.reps > 1 ? 's' : ''}.`}</Text>
        </View>
      ))}

      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />

      <Text style={styles.title}>Add Exercise</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <div>
        <Text style={labelStyle}>Exercise Name</Text>
        <Dropdown
          onChange={v => setCexName(v.value)}
          data={Object.keys(exerciseMapping).map(key => ({
            label: key
              .replace(/_/g, " ")
              .replace(/\b\w/g, c => c.toUpperCase()),
            value: key
          }))}
          placeholder={"Select exercise..."}
          style={{
            backgroundColor: "#d7d7d7ff", borderWidth: 1.5, borderColor: "#1e293b", borderStyle: "solid",
            borderRadius: 8, padding: 12, outline: "none",
            boxSizing: "border-box",
          }}
          labelField="label"
          valueField="value"
        />
      </div>
      <div>
        <Text style={labelStyle}>Machine</Text>
        <div style={{ display: "flex", gap: 10 }}>
          {MACHINE_TYPES.map(t => (
            <MachineBtn key={t} value={t} active={cexMachine === t}
              onClick={() => setCexMachine(t)} />
          ))}
        </div>
      </div>
      <div>
        <Text style={labelStyle}>{"Weight (lbs)"}</Text>
        <input
          key={3}
          onChange={e => setCexWeight(e.target.valueAsNumber)}
          onKeyDown={e => e.key === "Enter" && handleSave()}
          placeholder="15"
          type="number"
          style={{
            width: "100%", background: "#d7d7d7ff", border: "1.5px solid #1e293b",
            borderRadius: 8, padding: "12px 16px", color: "#000000ff", fontSize: 14, outline: "none",
            transition: "border-color 0.15s", boxSizing: "border-box",
          }}
          onFocus={e => (e.target.style.borderColor = "#475569")}
          onBlur={e  => (e.target.style.borderColor = "#1e293b")}
        />
      </div>
      <div>
        <Text style={labelStyle}>Sets</Text>
        <input
          key={4}
          onChange={e => setCexSets(e.target.valueAsNumber)}
          onKeyDown={e => e.key === "Enter" && handleSave()}
          placeholder="3"
          type="number"
          style={{
            width: "100%", background: "#d7d7d7ff", border: "1.5px solid #1e293b",
            borderRadius: 8, padding: "12px 16px", color: "#000000ff", fontSize: 14, outline: "none",
            transition: "border-color 0.15s", boxSizing: "border-box",
          }}
          onFocus={e => (e.target.style.borderColor = "#475569")}
          onBlur={e  => (e.target.style.borderColor = "#1e293b")}
        />
      </div>
      <div>
        <Text style={labelStyle}>Reps</Text>
        <input
          key={5}
          onChange={e => setCexReps(e.target.valueAsNumber)}
          onKeyDown={e => e.key === "Enter" && handleSave()}
          placeholder="8"
          type="number"
          style={{
            width: "100%", background: "#d7d7d7ff", border: "1.5px solid #1e293b",
            borderRadius: 8, padding: "12px 16px", color: "#000000ff", fontSize: 14, outline: "none",
            transition: "border-color 0.15s", boxSizing: "border-box",
          }}
          onFocus={e => (e.target.style.borderColor = "#475569")}
          onBlur={e  => (e.target.style.borderColor = "#1e293b")}
        />
      </div>
      {exerciseError && (
        <div style={{ color: "#f87171", fontSize: 12, background: "#450a0a22", border: "1px solid #7f1d1d", borderRadius: 6, padding: "10px 14px", margin: "14px 0" }}>
          <Text lightColor="#f87171">{exerciseError}</Text>
        </div>
      )}
      {exAdded && (
        <div style={{ color: "#4ade80", fontSize: 12, background: "#052e1622", border: "1px solid #166534", borderRadius: 6, padding: "10px 14px", margin: "14px 0" }}>
          <Text lightColor="#4ade80">Exercise added!</Text>
        </div>
      )}
      <ForgeButton onPress={addExercise} text={"Add Exercise"}/>
      
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <ForgeButton onPress={handleSave} text={editing ? "Update Workout" : "Log Workout"}/>
      <ForgeButton onPress={onCancel} text={"Back"}/>
    </div>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    width: "100%",
    alignItems: "center",
    paddingBottom: 80,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 10,
    height: 1,
    width: '80%',
  },
  pillText: {
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
  },
});
