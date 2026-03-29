import { useState, useEffect } from "react";
import {
  TaggedMeal, MealTagSet, MealMacros, Dietary, SpiceLevel, Cuisine, Complexity, Goal, TimeLabel,
  SPICE_LEVELS, CUISINES, COMPLEXITIES, GOALS, TIME_LABELS, DIETARY_OPTS,
  SPICE_COLOR, SPICE_ICON, GOAL_COLOR, GOAL_ICON, COMPLEXITY_COLOR, TIME_COLOR, TIME_ICON,
  EMPTY_TAGS, EMPTY_MACROS, C, sectionLabel, Pill, TagSection, GLOBAL_STYLES,
} from "./mealTypes";
export interface TagMealScreenProps {
  editing:   TaggedMeal | null;
  mealCount: number;
  onSave:    (name: string, tags: MealTagSet, macros: MealMacros, id?: number) => void;
  onCancel:  () => void;
}
type MacroField = {
  key:         keyof MealMacros;
  label:       string;
  unit:        string;
  placeholder: string;
  max:         number;
};
const MACRO_FIELDS: MacroField[] = [
  { key: "calories", label: "Calories",  unit: "kcal", placeholder: "e.g. 450",  max: 5000 },
  { key: "protein",  label: "Protein",   unit: "g",    placeholder: "e.g. 35",   max: 300  },
  { key: "carbs",    label: "Carbs",     unit: "g",    placeholder: "e.g. 55",   max: 500  },
  { key: "fat",      label: "Fat",       unit: "g",    placeholder: "e.g. 14",   max: 200  },
  { key: "sugar",    label: "Sugar",     unit: "g",    placeholder: "e.g. 8",    max: 200  },
  { key: "fiber",    label: "Fiber",     unit: "g",    placeholder: "e.g. 6",    max: 100  },
  { key: "sodium",   label: "Sodium",    unit: "mg",   placeholder: "e.g. 620",  max: 5000 },
];
export default function TagMealScreen({ editing, mealCount, onSave, onCancel }: TagMealScreenProps) {
  const [name,   setName]   = useState<string>(editing?.name ?? "");
  const [tags,   setTags]   = useState<MealTagSet>(
    editing?.tags ? { ...editing.tags, dietary: [...editing.tags.dietary] } : { ...EMPTY_TAGS }
  );
  const [macros, setMacros] = useState<MealMacros>(
    editing?.macros ? { ...editing.macros } : { ...EMPTY_MACROS }
  );
  const [error,  setError]  = useState<string>("");
  const [saved,  setSaved]  = useState<boolean>(false);
  useEffect(() => {
    setName(editing?.name ?? "");
    setTags(editing?.tags ? { ...editing.tags, dietary: [...editing.tags.dietary] } : { ...EMPTY_TAGS });
    setMacros(editing?.macros ? { ...editing.macros } : { ...EMPTY_MACROS });
    setError("");
    setSaved(false);
  }, [editing]);
  const set = <K extends keyof MealTagSet>(key: K, val: MealTagSet[K]): void =>
    setTags(t => ({ ...t, [key]: t[key] === val ? null : val }));
  const toggleDietary = (d: Dietary): void =>
    setTags(t => ({
      ...t,
      dietary: t.dietary.includes(d) ? t.dietary.filter(x => x !== d) : [...t.dietary, d],
    }));
  const setMacro = (key: keyof MealMacros, raw: string): void => {
    const parsed = raw === "" ? null : parseFloat(raw);
    setMacros(m => ({ ...m, [key]: parsed === null || isNaN(parsed) ? null : parsed }));
  };
  const handleSave = (): void => {
    if (!name.trim())     { setError("Meal name is required.");  return; }
    if (!tags.spiceLevel) { setError("Select a spice level.");   return; }
    if (!tags.cuisine)    { setError("Select a cuisine.");       return; }
    if (!tags.complexity) { setError("Select a complexity.");    return; }
    if (!tags.goal)       { setError("Select a goal.");          return; }
    if (!tags.prepTime)   { setError("Select a prep time.");     return; }
    if (!tags.cookTime)   { setError("Select a cook time.");     return; }
    for (const { key, label, max } of MACRO_FIELDS) {
      const v = macros[key];
      if (v !== null && v !== undefined) {
        if (v < 0)   { setError(`${label} cannot be negative.`);          return; }
        if (v > max) { setError(`${label} seems too high (max ${max}).`); return; }
      }
    }
    setError("");
    onSave(name.trim(), tags, macros, editing?.id);
    if (!editing) {
      setName("");
      setTags({ ...EMPTY_TAGS });
      setMacros({ ...EMPTY_MACROS });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };
  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <div style={{ minHeight: "100vh", background: C.bg }}>
        <div style={{
          maxWidth: 640, margin: "0 auto",
          padding: "40px 24px 80px",
          display: "flex", flexDirection: "column", gap: 26,
        }}>
          <div>
            <div style={{
              color: C.orange, fontSize: 9, letterSpacing: "0.3em",
              textTransform: "uppercase", marginBottom: 6,
              fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600,
            }}>
              {editing ? "Editing meal" : "Nutrition · Tag a Meal"}
            </div>
            <h2 style={{
              color: C.text, fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 32, fontWeight: 800, margin: 0,
              letterSpacing: "0.03em", textTransform: "uppercase",
            }}>
              {editing ? `Edit "${editing.name}"` : "Add Meal Tags"}
            </h2>
          </div>
          <div style={{ height: 1, background: `linear-gradient(90deg, ${C.orange}, transparent)` }} />
          <div>
            <span style={sectionLabel}>Meal Name</span>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSave()}
              placeholder="e.g. Grilled Chicken & Rice"
              style={{
                width: "100%", background: C.surface, border: `1.5px solid ${C.border}`,
                borderRadius: 6, padding: "11px 15px", color: C.text,
                fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, outline: "none",
                transition: "border-color 0.15s", letterSpacing: "0.02em",
              }}
              onFocus={e => (e.target.style.borderColor = C.orange)}
              onBlur={e  => (e.target.style.borderColor = C.border)}
            />
          </div>
          <TagSection title="Spice Level">
            {SPICE_LEVELS.map((s: SpiceLevel) => (
              <Pill key={s} label={s} active={tags.spiceLevel === s}
                color={SPICE_COLOR[s]} icon={SPICE_ICON[s]}
                onClick={() => set("spiceLevel", s)} />
            ))}
          </TagSection>
          <TagSection title="Cuisine">
            {CUISINES.map((c: Cuisine) => (
              <Pill key={c} label={c} active={tags.cuisine === c}
                color={C.amber} onClick={() => set("cuisine", c)} />
            ))}
          </TagSection>
          <TagSection title="Complexity">
            {COMPLEXITIES.map((c: Complexity) => (
              <Pill key={c} label={c} active={tags.complexity === c}
                color={COMPLEXITY_COLOR[c]} onClick={() => set("complexity", c)} />
            ))}
          </TagSection>
          <TagSection title="Goal">
            {GOALS.map((g: Goal) => (
              <Pill key={g} label={g} active={tags.goal === g}
                color={GOAL_COLOR[g]} icon={GOAL_ICON[g]}
                onClick={() => set("goal", g)} />
            ))}
          </TagSection>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <TagSection title="Prep Time">
              {TIME_LABELS.map((t: TimeLabel) => (
                <Pill key={t} label={t} active={tags.prepTime === t}
                  color={TIME_COLOR[t]} icon={TIME_ICON[t]}
                  onClick={() => set("prepTime", t)} />
              ))}
            </TagSection>
            <TagSection title="Cook Time">
              {TIME_LABELS.map((t: TimeLabel) => (
                <Pill key={t} label={t} active={tags.cookTime === t}
                  color={TIME_COLOR[t]} icon={TIME_ICON[t]}
                  onClick={() => set("cookTime", t)} />
              ))}
            </TagSection>
          </div>
          <TagSection title="Dietary Restrictions" optional>
            {DIETARY_OPTS.map((d: Dietary) => (
              <Pill key={d} label={d} active={tags.dietary.includes(d)}
                color={C.amber} onClick={() => toggleDietary(d)} />
            ))}
          </TagSection>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 14 }}>
              <span style={sectionLabel}>Macros</span>
              <span style={{
                color: C.dimmer, fontSize: 10,
                fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: "0.08em", textTransform: "uppercase",
              }}>
                (optional · per serving)
              </span>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 12,
            }}>
              {MACRO_FIELDS.map(({ key, label, unit, placeholder }) => (
                <div key={key}>
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginBottom: 5,
                  }}>
                    <span style={{
                      color: C.muted, fontSize: 10, fontWeight: 600,
                      fontFamily: "'Barlow Condensed', sans-serif",
                      textTransform: "uppercase", letterSpacing: "0.12em",
                    }}>
                      {label}
                    </span>
                    <span style={{
                      color: C.dimmer, fontSize: 9,
                      fontFamily: "'Barlow Condensed', sans-serif",
                      letterSpacing: "0.08em",
                      background: C.border, borderRadius: 3,
                      padding: "1px 5px",
                    }}>
                      {unit}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    step={key === "sodium" ? 1 : 0.1}
                    value={macros[key] ?? ""}
                    onChange={e => setMacro(key, e.target.value)}
                    placeholder={placeholder}
                    style={{
                      width: "100%", background: C.surface,
                      border: `1.5px solid ${C.border}`,
                      borderRadius: 6, padding: "9px 12px",
                      color: C.text,
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 14, outline: "none",
                      transition: "border-color 0.15s",
                      letterSpacing: "0.02em",
                      MozAppearance: "textfield",
                    } as React.CSSProperties}
                    onFocus={e => (e.target.style.borderColor = C.orange)}
                    onBlur={e  => (e.target.style.borderColor = C.border)}
                  />
                </div>
              ))}
            </div>
            {macros.calories !== null && macros.calories !== undefined && (
              <div style={{ marginTop: 14 }}>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 10, color: C.muted, marginBottom: 5,
                  textTransform: "uppercase", letterSpacing: "0.1em",
                }}>
                  <span>Calorie density</span>
                  <span style={{ color: macros.calories > 600 ? "#f87171" : macros.calories > 300 ? C.amber : "#6ee7b7" }}>
                    {macros.calories} kcal
                  </span>
                </div>
                <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${Math.min((macros.calories / 800) * 100, 100)}%`,
                    background: macros.calories > 600
                      ? "linear-gradient(90deg, #f97316, #ef4444)"
                      : macros.calories > 300
                      ? `linear-gradient(90deg, ${C.orange}, ${C.amber})`
                      : "linear-gradient(90deg, #34d399, #6ee7b7)",
                    borderRadius: 2,
                    transition: "width 0.3s, background 0.3s",
                  }} />
                </div>
              </div>
            )}
          </div>
          {error && (
            <div style={{
              color: "#fca5a5", fontSize: 12,
              background: "#3a0d0d30", border: "1px solid #7f1d1d",
              borderRadius: 5, padding: "10px 14px",
              fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em",
            }}>
              ⚠ {error}
            </div>
          )}
          {saved && (
            <div style={{
              color: "#6ee7b7", fontSize: 12,
              background: "#0d3a1630", border: "1px solid #166534",
              borderRadius: 5, padding: "10px 14px",
              fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em",
            }}>
              ✓ Meal saved successfully.
            </div>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            {editing && (
              <button onClick={onCancel} style={{
                flex: 1, padding: "12px 0", borderRadius: 5,
                border: `1.5px solid ${C.border}`,
                background: "transparent", color: C.muted,
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 13, fontWeight: 600,
                cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.1em",
              }}>
                Cancel
              </button>
            )}
            <button onClick={handleSave} style={{
              flex: 2, padding: "12px 0", borderRadius: 5, border: "none",
              background: `linear-gradient(135deg, ${C.orange}, ${C.gold})`,
              color: "#111214",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 15, fontWeight: 800, cursor: "pointer",
              letterSpacing: "0.1em", textTransform: "uppercase",
              boxShadow: `0 0 24px ${C.orange}40`,
            }}>
              {editing ? "Update Meal" : "Save Meal"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
