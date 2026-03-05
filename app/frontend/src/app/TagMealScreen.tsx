import { useState, useEffect } from "react";
import {
  TaggedMeal, MealTagSet, Dietary, SpiceLevel, Cuisine, Complexity, Goal, TimeLabel,
  SPICE_LEVELS, CUISINES, COMPLEXITIES, GOALS, TIME_LABELS, DIETARY_OPTS,
  SPICE_COLOR, SPICE_ICON, GOAL_COLOR, GOAL_ICON, COMPLEXITY_COLOR, TIME_COLOR, TIME_ICON,
  EMPTY_TAGS, C, sectionLabel, Pill, TagSection, NavBar, GLOBAL_STYLES,
} from "./mealTypes";

export interface TagMealScreenProps {
  editing:    TaggedMeal | null;
  mealCount:  number;
  onSave:     (name: string, tags: MealTagSet, id?: number) => void;
  onCancel:   () => void;
  onBrowse:   () => void;
}

export default function TagMealScreen({ editing, mealCount, onSave, onCancel, onBrowse }: TagMealScreenProps) {
  const [name,  setName]  = useState<string>(editing?.name ?? "");
  const [tags,  setTags]  = useState<MealTagSet>(
    editing?.tags ? { ...editing.tags, dietary: [...editing.tags.dietary] } : { ...EMPTY_TAGS }
  );
  const [error, setError] = useState<string>("");
  const [saved, setSaved] = useState<boolean>(false);

  useEffect(() => {
    setName(editing?.name ?? "");
    setTags(editing?.tags ? { ...editing.tags, dietary: [...editing.tags.dietary] } : { ...EMPTY_TAGS });
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

  const handleSave = (): void => {
    if (!name.trim())     { setError("Meal name is required.");  return; }
    if (!tags.spiceLevel) { setError("Select a spice level.");   return; }
    if (!tags.cuisine)    { setError("Select a cuisine.");       return; }
    if (!tags.complexity) { setError("Select a complexity.");    return; }
    if (!tags.goal)       { setError("Select a goal.");          return; }
    if (!tags.prepTime)   { setError("Select a prep time.");     return; }
    if (!tags.cookTime)   { setError("Select a cook time.");     return; }
    setError("");
    onSave(name.trim(), tags, editing?.id);
    if (!editing) {
      setName("");
      setTags({ ...EMPTY_TAGS });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  return (
    <>
      <style>{GLOBAL_STYLES}</style>

      <div style={{ minHeight: "100vh", background: C.bg }}>
        <NavBar screen="tag" onTag={() => {}} onBrowse={onBrowse} count={mealCount} />

        <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 24px 80px", display: "flex", flexDirection: "column", gap: 26 }}>

          {/* Header */}
          <div>
            <div style={{ color: C.orange, fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 6, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600 }}>
              {editing ? "Editing meal" : "Nutrition · Tag a Meal"}
            </div>
            <h2 style={{ color: C.text, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 800, margin: 0, letterSpacing: "0.03em", textTransform: "uppercase" }}>
              {editing ? `Edit "${editing.name}"` : "Add Meal Tags"}
            </h2>
          </div>

          {/* Orange accent rule */}
          <div style={{ height: 1, background: `linear-gradient(90deg, ${C.orange}, transparent)` }} />

          {/* Name */}
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

          {error && (
            <div style={{ color: "#fca5a5", fontSize: 12, background: "#3a0d0d30", border: "1px solid #7f1d1d", borderRadius: 5, padding: "10px 14px", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
              ⚠ {error}
            </div>
          )}
          {saved && (
            <div style={{ color: "#6ee7b7", fontSize: 12, background: "#0d3a1630", border: "1px solid #166534", borderRadius: 5, padding: "10px 14px", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
              ✓ Meal saved successfully.
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            {editing && (
              <button onClick={onCancel} style={{
                flex: 1, padding: "12px 0", borderRadius: 5, border: `1.5px solid ${C.border}`,
                background: "transparent", color: C.muted,
                fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 600,
                cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.1em",
              }}>
                Cancel
              </button>
            )}
            <button onClick={handleSave} style={{
              flex: 2, padding: "12px 0", borderRadius: 5, border: "none",
              background: `linear-gradient(135deg, ${C.orange}, ${C.gold})`,
              color: "#111214", fontFamily: "'Barlow Condensed', sans-serif",
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
