import { useState, CSSProperties } from "react";
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

// Style helpers

const chip = (bg: string, color: string, extra: CSSProperties = {}): CSSProperties => ({
  background: bg, color, borderRadius: 999,
  padding: "2px 10px", fontSize: 11,
  fontFamily: "'DM Mono', monospace",
  textTransform: "uppercase", letterSpacing: "0.05em",
  display: "inline-block",
  ...extra,
});

// FilterState

interface FilterState {
  muscleGroups: MuscleGroup[];
  difficulty:   Difficulty | null;
  exerciseType: ExerciseType | null;
}
const EMPTY_FILTER: FilterState = { muscleGroups: [], difficulty: null, exerciseType: null };

// ExerciseCard

function ExerciseCard({ ex, onEdit, onDelete }: { ex: TaggedExercise; onEdit: (ex: TaggedExercise) => void; onDelete: (id: number) => void }) {
  const { difficulty: diff, exerciseType: type, muscleGroups } = ex.tags;
  const [hover, setHover] = useState<boolean>(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: "#0c1628",
        border: `1px solid ${hover ? "#334155" : "#1e293b"}`,
        borderRadius: 12, padding: "16px 18px",
        display: "flex", flexDirection: "column", gap: 12,
        transition: "border-color 0.15s, transform 0.15s",
        transform: hover ? "translateY(-1px)" : "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ color: "#f1f5f9", fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, lineHeight: 1.3, flex: 1 }}>
          {ex.name}
        </span>
        <div style={{ display: "flex", gap: 5, flexShrink: 0, marginLeft: 8, opacity: hover ? 1 : 0, transition: "opacity 0.15s" }}>
          <button onClick={() => onEdit(ex)}      style={{ background: "#1e293b", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 12 }}>✏️</button>
          <button onClick={() => onDelete(ex.id)} style={{ background: "#450a0a", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 12 }}>🗑</button>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {muscleGroups.map(mg => (
          <span key={mg} style={chip("#1e293b", "#64748b")}>{mg.replace(/_/g, " ")}</span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {diff && <span style={chip(`${DIFFICULTY_COLOR[diff]}18`, DIFFICULTY_COLOR[diff])}>{diff}</span>}
        {type && <span style={chip(`${TYPE_COLOR[type]}18`, TYPE_COLOR[type])}>{TYPE_ICON[type]} {type}</span>}
      </div>
    </div>
  );
}
function MusclePill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "3px 9px", borderRadius: 999, cursor: "pointer", transition: "all 0.15s",
      border:     active ? "1.5px solid #e2e8f0" : "1.5px solid #334155",
      background: active ? "#e2e8f0" : "transparent",
      color:      active ? "#0f172a" : "#94a3b8",
      fontSize: 10, fontFamily: "'DM Mono', monospace",
      textTransform: "uppercase", letterSpacing: "0.05em",
    }}>
      {label.replace(/_/g, " ")}
    </button>
  );
}

// Props

export interface LibraryScreenProps {
  exercises: TaggedExercise[];
  onEdit:    (ex: TaggedExercise) => void;
  onDelete:  (id: number) => void;
}

// Screen

export default function LibraryScreen({ exercises, onEdit, onDelete }: LibraryScreenProps) {
  const [filter,      setFilter]      = useState<FilterState>(EMPTY_FILTER);
  const [showMuscles, setShowMuscles] = useState<boolean>(false);
  const toggleSingle = <K extends "difficulty" | "exerciseType">(key: K, value: FilterState[K]): void => {
    setFilter(f => ({ ...f, [key]: f[key] === value ? null : value }));
  };
  const toggleMuscle = (mg: MuscleGroup): void => {
    setFilter(f => ({
      ...f,
      muscleGroups: f.muscleGroups.includes(mg)
        ? f.muscleGroups.filter(m => m !== mg)
        : [...f.muscleGroups, mg],
    }));
  };
  const filtered = exercises.filter(ex => {
    if (filter.difficulty   && ex.tags.difficulty   !== filter.difficulty)   return false;
    if (filter.exerciseType && ex.tags.exerciseType !== filter.exerciseType) return false;
    if (filter.muscleGroups.length && !filter.muscleGroups.some(mg => ex.tags.muscleGroups.includes(mg))) return false;
    return true;
  });
  const hasFilter: boolean = !!filter.difficulty || !!filter.exerciseType || filter.muscleGroups.length > 0;
  const filterPillStyle = (active: boolean, color: string): CSSProperties => ({
    padding: "3px 12px", borderRadius: 999, cursor: "pointer", transition: "all 0.15s",
    border:     active ? `1.5px solid ${color}` : "1.5px solid #1e293b",
    background: active ? `${color}1a` : "transparent",
    color:      active ? color : "#475569",
    fontFamily: "'DM Mono', monospace", fontSize: 11,
    textTransform: "uppercase", letterSpacing: "0.05em",
  });
  return (
    <div style={{ paddingBottom: 80 }}>
      {/*Sticky filter bar*/}
      <div style={{
        borderBottom: "1px solid #1e293b", padding: "14px 32px",
        display: "flex", flexDirection: "column", gap: 10,
        background: "#020617", position: "sticky", top: 56, zIndex: 40,
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          <span style={{ color: "#334155", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", marginRight: 2 }}>Type</span>
          {EXERCISE_TYPES.map(t => (
            <button key={t} onClick={() => toggleSingle("exerciseType", t)} style={filterPillStyle(filter.exerciseType === t, TYPE_COLOR[t])}>
              {TYPE_ICON[t]} {t}
            </button>
          ))}
          <span style={{ color: "#1e293b", margin: "0 4px", fontSize: 16 }}>|</span>
          <span style={{ color: "#334155", fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", marginRight: 2 }}>Difficulty</span>
          {DIFFICULTIES.map(d => (
            <button key={d} onClick={() => toggleSingle("difficulty", d)} style={filterPillStyle(filter.difficulty === d, DIFFICULTY_COLOR[d])}>
              {d}
            </button>
          ))}
          <span style={{ color: "#1e293b", margin: "0 4px", fontSize: 16 }}>|</span>
          <button onClick={() => setShowMuscles(s => !s)} style={filterPillStyle(filter.muscleGroups.length > 0, "#818cf8")}>
            Muscles {filter.muscleGroups.length > 0 ? `(${filter.muscleGroups.length})` : showMuscles ? "▴" : "▾"}
          </button>
          {hasFilter && (
            <button onClick={() => setFilter(EMPTY_FILTER)} style={{
              background: "none", border: "none", color: "#475569",
              fontFamily: "'DM Mono', monospace", fontSize: 10,
              cursor: "pointer", textDecoration: "underline", letterSpacing: "0.05em",
            }}>
              Clear all
            </button>
          )}
        </div>
        {showMuscles && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
            {MUSCLE_SECTIONS.map(s => (
              <div key={s.label} style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
                <span style={{ color: "#334155", fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", width: 72, flexShrink: 0 }}>
                  {s.label}
                </span>
                {s.muscles.map(mg => (
                  <MusclePill key={mg} label={mg} active={filter.muscleGroups.includes(mg)} onClick={() => toggleMuscle(mg)} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
      {/*Results*/}
      <div style={{ padding: "24px 32px" }}>
        <div style={{ color: "#334155", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16 }}>
          {filtered.length} exercise{filtered.length !== 1 ? "s" : ""}{hasFilter ? " matching" : ""}
        </div>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 60, color: "#1e293b", fontFamily: "'Syne', sans-serif", fontSize: 15 }}>
            No exercises match these filters.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 12 }}>
            {filtered.map(ex => (
              <ExerciseCard key={ex.id} ex={ex} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
