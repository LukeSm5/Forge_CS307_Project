import { useState, useEffect, CSSProperties } from "react";

// Types

export type MuscleGroup =
  | "chest" | "back" | "shoulders" | "biceps" | "triceps" | "forearms"
  | "abs" | "obliques" | "lower_back"
  | "quads" | "hamstrings" | "glutes" | "calves" | "hip_flexors" | "full_body";
export type Difficulty   = "beginner" | "intermediate" | "advanced" | "elite";
export type ExerciseType = "strength" | "cardio" | "hybrid";
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

const MUSCLE_SECTIONS: { label: string; muscles: MuscleGroup[] }[] = [
  { label: "Upper Body", muscles: ["chest", "back", "shoulders", "biceps", "triceps", "forearms"] },
  { label: "Core",       muscles: ["abs", "obliques", "lower_back"] },
  { label: "Lower Body", muscles: ["quads", "hamstrings", "glutes", "calves", "hip_flexors"] },
  { label: "Full Body",  muscles: ["full_body"] },
];
const DIFFICULTIES:   Difficulty[]   = ["beginner", "intermediate", "advanced", "elite"];
const EXERCISE_TYPES: ExerciseType[] = ["strength", "cardio", "hybrid"];
const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  beginner: "#4ade80", intermediate: "#facc15", advanced: "#f97316", elite: "#f43f5e",
};
const TYPE_COLOR: Record<ExerciseType, string> = {
  strength: "#818cf8", cardio: "#fb7185", hybrid: "#fb923c",
};
const TYPE_ICON: Record<ExerciseType, string> = {
  strength: "⚡", cardio: "🫀", hybrid: "🔥",
};
const EMPTY_TAGS: TagSet = { muscleGroups: [], difficulty: null, exerciseType: null };
const labelStyle: CSSProperties = {
  display: "block", color: "#475569", fontSize: 10,
  letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8,
};

// Primitives

function MusclePill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "4px 12px", borderRadius: 999, cursor: "pointer", transition: "all 0.15s",
      border:     active ? "1.5px solid #e2e8f0" : "1.5px solid #334155",
      background: active ? "#e2e8f0" : "transparent",
      color:      active ? "#0f172a" : "#94a3b8",
      fontSize: 11, fontFamily: "'DM Mono', monospace",
      textTransform: "uppercase", letterSpacing: "0.05em",
    }}>
      {label.replace(/_/g, " ")}
    </button>
  );
}
function TypeBtn({ value, active, onClick }: { value: ExerciseType; active: boolean; onClick: () => void }) {
  const c = TYPE_COLOR[value];
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: "10px 0", borderRadius: 8, cursor: "pointer", transition: "all 0.15s",
      border:     active ? `2px solid ${c}` : "2px solid #1e293b",
      background: active ? `${c}1a` : "transparent",
      color:      active ? c : "#475569",
      fontFamily: "'DM Mono', monospace",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      fontWeight: active ? 700 : 400,
    }}>
      <span style={{ fontSize: 22 }}>{TYPE_ICON[value]}</span>
      <span style={{ textTransform: "uppercase", letterSpacing: "0.05em", fontSize: 11 }}>{value}</span>
    </button>
  );
}
function DiffBtn({ value, active, onClick }: { value: Difficulty; active: boolean; onClick: () => void }) {
  const c = DIFFICULTY_COLOR[value];
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: "8px 0", borderRadius: 6, cursor: "pointer", transition: "all 0.15s",
      border:     active ? `2px solid ${c}` : "2px solid #1e293b",
      background: active ? `${c}1a` : "transparent",
      color:      active ? c : "#475569",
      fontSize: 11, fontFamily: "'DM Mono', monospace",
      textTransform: "uppercase", letterSpacing: "0.06em",
      fontWeight: active ? 700 : 400,
    }}>
      {value}
    </button>
  );
}
// Props

export interface AddScreenProps {
  editing:  TaggedExercise | null;
  onSave:   (name: string, tags: TagSet, editingId?: number) => void;
  onCancel: () => void;
}

// Screen

export default function AddScreen({ editing, onSave, onCancel }: AddScreenProps) {
  const [name,  setName]  = useState<string>(editing?.name ?? "");
  const [tags,  setTags]  = useState<TagSet>(editing?.tags ? { ...editing.tags } : { ...EMPTY_TAGS });
  const [error, setError] = useState<string>("");
  const [saved, setSaved] = useState<boolean>(false);
  useEffect(() => {
    setName(editing?.name ?? "");
    setTags(editing?.tags ? { ...editing.tags } : { ...EMPTY_TAGS });
    setError("");
    setSaved(false);
  }, [editing]);
  const toggleMuscle = (mg: MuscleGroup): void => {
    setTags(t => ({
      ...t,
      muscleGroups: t.muscleGroups.includes(mg)
        ? t.muscleGroups.filter(m => m !== mg)
        : [...t.muscleGroups, mg],
    }));
  };
  const handleSave = (): void => {
    if (!name.trim())              { setError("Exercise name is required.");        return; }
    if (!tags.muscleGroups.length) { setError("Select at least one muscle group."); return; }
    if (!tags.difficulty)          { setError("Select a difficulty.");              return; }
    if (!tags.exerciseType)        { setError("Select an exercise type.");          return; }
    setError("");
    onSave(name.trim(), tags, editing?.id);
    if (!editing) {
      setName("");
      setTags({ ...EMPTY_TAGS });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };
  return (
    <div style={{ maxWidth: 580, margin: "0 auto", padding: "40px 24px 80px", display: "flex", flexDirection: "column", gap: 30 }}>
      <div>
        <div style={{ color: "#475569", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4 }}>
          {editing ? "Editing exercise" : "New exercise"}
        </div>
        <h2 style={{ color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, margin: 0 }}>
          {editing ? `Edit "${editing.name}"` : "Tag an Exercise"}
        </h2>
      </div>
      <div>
        <label style={labelStyle}>Exercise Name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSave()}
          placeholder="e.g. Barbell Squat"
          style={{
            width: "100%", background: "#0f172a", border: "1.5px solid #1e293b",
            borderRadius: 8, padding: "12px 16px", color: "#f1f5f9",
            fontFamily: "'DM Mono', monospace", fontSize: 14, outline: "none",
            transition: "border-color 0.15s",
          }}
          onFocus={e => (e.target.style.borderColor = "#475569")}
          onBlur={e  => (e.target.style.borderColor = "#1e293b")}
        />
      </div>
      <div>
        <label style={labelStyle}>Exercise Type</label>
        <div style={{ display: "flex", gap: 10 }}>
          {EXERCISE_TYPES.map(t => (
            <TypeBtn key={t} value={t} active={tags.exerciseType === t}
              onClick={() => setTags(p => ({ ...p, exerciseType: t }))} />
          ))}
        </div>
      </div>
      <div>
        <label style={labelStyle}>Difficulty</label>
        <div style={{ display: "flex", gap: 8 }}>
          {DIFFICULTIES.map(d => (
            <DiffBtn key={d} value={d} active={tags.difficulty === d}
              onClick={() => setTags(p => ({ ...p, difficulty: d }))} />
          ))}
        </div>
      </div>
      <div>
        <label style={labelStyle}>Muscle Groups</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {MUSCLE_SECTIONS.map(s => (
            <div key={s.label}>
              <div style={{ color: "#334155", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 7 }}>
                {s.label}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {s.muscles.map(mg => (
                  <MusclePill key={mg} label={mg} active={tags.muscleGroups.includes(mg)} onClick={() => toggleMuscle(mg)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {error && (
        <div style={{ color: "#f87171", fontSize: 12, background: "#450a0a22", border: "1px solid #7f1d1d", borderRadius: 6, padding: "10px 14px" }}>
          ⚠ {error}
        </div>
      )}
      {saved && (
        <div style={{ color: "#4ade80", fontSize: 12, background: "#052e1622", border: "1px solid #166534", borderRadius: 6, padding: "10px 14px" }}>
          ✓ Exercise saved!
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
        <button onClick={handleSave} style={{
          flex: 2, padding: "13px 0", borderRadius: 8, border: "none",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          color: "#fff", fontFamily: "'Syne', sans-serif",
          fontSize: 13, fontWeight: 700, cursor: "pointer",
          letterSpacing: "0.05em", textTransform: "uppercase",
          boxShadow: "0 0 28px #6366f140",
        }}>
          {editing ? "Update Exercise" : "Save Exercise"}
        </button>
      </div>
    </div>
  );
}