import { useState, useEffect, useRef, useMemo } from "react";
import {
  TaggedMeal, MealTagSet, MealMacros, Ingredient, Dietary, SpiceLevel, Cuisine, Complexity, Goal, TimeLabel,
  IngredientUnit,
  SPICE_LEVELS, CUISINES, COMPLEXITIES, GOALS, TIME_LABELS, DIETARY_OPTS,
  SPICE_COLOR, SPICE_ICON, GOAL_COLOR, GOAL_ICON, COMPLEXITY_COLOR, TIME_COLOR, TIME_ICON,
  INGREDIENT_UNITS, COMMON_INGREDIENTS, INGREDIENT_CATEGORIES,
  EMPTY_TAGS, EMPTY_MACROS, C, sectionLabel, Pill, TagSection, GLOBAL_STYLES,
} from "./mealTypes";

export interface TagMealScreenProps {
  editing:   TaggedMeal | null;
  mealCount: number;
  onSave:    (name: string, tags: MealTagSet, macros: MealMacros, ingredients: Ingredient[], id?: number) => void;
  onCancel:  () => void;
}

type Tab = "tags" | "ingredients";

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

let _ingredientCounter = 0;
function nextIngredientId(): string {
  return `ing_${Date.now()}_${++_ingredientCounter}`;
}

function IngredientSearchDropdown({
  onSelect,
}: {
  onSelect: (name: string, defaultUnit: IngredientUnit) => void;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let items = COMMON_INGREDIENTS;
    if (selectedCat) items = items.filter(i => i.category === selectedCat);
    if (q) items = items.filter(i => i.name.toLowerCase().includes(q));
    return items;
  }, [search, selectedCat]);

  const groupedFiltered = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    for (const item of filtered) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  }, [filtered]);

  const handleSelect = (name: string, defaultUnit: IngredientUnit) => {
    onSelect(name, defaultUnit);
    setSearch("");
    setOpen(false);
    setSelectedCat(null);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Search ingredients…"
            style={{
              width: "100%", background: C.surface, border: `1.5px solid ${C.border}`,
              borderRadius: 6, padding: "10px 14px", color: C.text,
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, outline: "none",
              transition: "border-color 0.15s", letterSpacing: "0.02em",
            }}
            onFocus={e => { e.target.style.borderColor = C.orange; setOpen(true); }}
            onBlur={e  => { e.target.style.borderColor = C.border; }}
          />
          <span style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            color: C.dimmer, fontSize: 14, pointerEvents: "none",
          }}>🔍</span>
        </div>
        <button
          onClick={() => {
            const name = search.trim();
            if (name) handleSelect(name, "g");
          }}
          style={{
            padding: "10px 16px", borderRadius: 6, border: `1.5px solid ${C.orange}`,
            background: `${C.orange}18`, color: C.orange,
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 700,
            cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.08em",
            whiteSpace: "nowrap",
          }}
        >
          + Custom
        </button>
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 8,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)", zIndex: 100,
          maxHeight: 340, display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 5, padding: "10px 12px",
            borderBottom: `1px solid ${C.border}`,
          }}>
            <button
              onClick={() => setSelectedCat(null)}
              style={{
                padding: "3px 10px", borderRadius: 4, cursor: "pointer",
                border: !selectedCat ? `1.5px solid ${C.orange}` : `1.5px solid ${C.border}`,
                background: !selectedCat ? `${C.orange}18` : "transparent",
                color: !selectedCat ? C.orange : C.muted,
                fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 600,
                textTransform: "uppercase", letterSpacing: "0.06em",
              }}
            >
              All
            </button>
            {INGREDIENT_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCat(selectedCat === cat ? null : cat)}
                style={{
                  padding: "3px 10px", borderRadius: 4, cursor: "pointer",
                  border: selectedCat === cat ? `1.5px solid ${C.orange}` : `1.5px solid ${C.border}`,
                  background: selectedCat === cat ? `${C.orange}18` : "transparent",
                  color: selectedCat === cat ? C.orange : C.muted,
                  fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 600,
                  textTransform: "uppercase", letterSpacing: "0.06em",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ overflowY: "auto", maxHeight: 250 }}>
            {filtered.length === 0 ? (
              <div style={{
                padding: "20px 16px", textAlign: "center", color: C.dimmer,
                fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13,
              }}>
                No matches.{search.trim() && (
                  <span> Press <strong style={{ color: C.orange }}>+ Custom</strong> to add "{search.trim()}"</span>
                )}
              </div>
            ) : (
              Object.entries(groupedFiltered).map(([cat, items]) => (
                <div key={cat}>
                  <div style={{
                    padding: "6px 14px", color: C.dimmer, fontSize: 9,
                    fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600,
                    textTransform: "uppercase", letterSpacing: "0.2em",
                    background: `${C.border}40`,
                  }}>
                    {cat}
                  </div>
                  {items.map(item => (
                    <button
                      key={item.name}
                      onClick={() => handleSelect(item.name, item.defaultUnit)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        width: "100%", padding: "8px 14px", border: "none",
                        background: "transparent", cursor: "pointer",
                        transition: "background 0.1s",
                        fontFamily: "'Barlow Condensed', sans-serif",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = `${C.orange}10`)}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>
                        {item.name}
                      </span>
                      <span style={{
                        color: C.dimmer, fontSize: 10,
                        background: `${C.border}60`, borderRadius: 3, padding: "1px 6px",
                      }}>
                        {INGREDIENT_UNITS.find(u => u.value === item.defaultUnit)?.label ?? item.defaultUnit}
                      </span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function IngredientRow({
  ingredient,
  onUpdate,
  onRemove,
}: {
  ingredient: Ingredient;
  onUpdate: (updated: Ingredient) => void;
  onRemove: () => void;
}) {
  const unitGroups = useMemo(() => {
    const groups: Record<string, typeof INGREDIENT_UNITS> = {};
    for (const u of INGREDIENT_UNITS) {
      if (!groups[u.group]) groups[u.group] = [];
      groups[u.group].push(u);
    }
    return groups;
  }, []);

  return (
    <div style={{
      display: "flex", gap: 8, alignItems: "flex-start",
      padding: "10px 12px", background: C.surface,
      border: `1px solid ${C.border}`, borderRadius: 6,
    }}>
      <div style={{ flex: 2, minWidth: 0 }}>
        <div style={{
          color: C.muted, fontSize: 8, fontWeight: 600,
          fontFamily: "'Barlow Condensed', sans-serif",
          textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4,
        }}>
          Ingredient
        </div>
        <div style={{
          color: C.text, fontSize: 14, fontWeight: 700,
          fontFamily: "'Barlow Condensed', sans-serif",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {ingredient.name}
        </div>
      </div>

      <div style={{ width: 70 }}>
        <div style={{
          color: C.muted, fontSize: 8, fontWeight: 600,
          fontFamily: "'Barlow Condensed', sans-serif",
          textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4,
        }}>
          Qty
        </div>
        <input
          type="number"
          min={0}
          step={0.25}
          value={ingredient.quantity ?? ""}
          onChange={e => {
            const val = e.target.value === "" ? null : parseFloat(e.target.value);
            onUpdate({ ...ingredient, quantity: val === null || isNaN(val) ? null : val });
          }}
          placeholder="—"
          style={{
            width: "100%", background: C.bg, border: `1px solid ${C.border}`,
            borderRadius: 4, padding: "5px 7px", color: C.text,
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13,
            outline: "none", MozAppearance: "textfield",
          } as React.CSSProperties}
          onFocus={e => (e.target.style.borderColor = C.orange)}
          onBlur={e  => (e.target.style.borderColor = C.border)}
        />
      </div>

      <div style={{ width: 85 }}>
        <div style={{
          color: C.muted, fontSize: 8, fontWeight: 600,
          fontFamily: "'Barlow Condensed', sans-serif",
          textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4,
        }}>
          Unit
        </div>
        <select
          value={ingredient.unit}
          onChange={e => onUpdate({ ...ingredient, unit: e.target.value as IngredientUnit })}
          style={{
            width: "100%", background: C.bg, border: `1px solid ${C.border}`,
            borderRadius: 4, padding: "5px 4px", color: C.text,
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12,
            outline: "none", cursor: "pointer",
          }}
        >
          {Object.entries(unitGroups).map(([group, units]) => (
            <optgroup key={group} label={group}>
              {units.map(u => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div style={{ flex: 1, minWidth: 80 }}>
        <div style={{
          color: C.muted, fontSize: 8, fontWeight: 600,
          fontFamily: "'Barlow Condensed', sans-serif",
          textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4,
        }}>
          Note
        </div>
        <input
          value={ingredient.note}
          onChange={e => onUpdate({ ...ingredient, note: e.target.value })}
          placeholder="optional"
          style={{
            width: "100%", background: C.bg, border: `1px solid ${C.border}`,
            borderRadius: 4, padding: "5px 7px", color: C.text,
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12,
            outline: "none",
          }}
          onFocus={e => (e.target.style.borderColor = C.orange)}
          onBlur={e  => (e.target.style.borderColor = C.border)}
        />
      </div>

      <button
        onClick={onRemove}
        style={{
          marginTop: 16, padding: "5px 8px", background: "#3a0d0d30",
          border: "1px solid #7f1d1d50", borderRadius: 4, cursor: "pointer",
          color: "#f87171", fontSize: 12, lineHeight: 1,
        }}
        title="Remove ingredient"
      >
        ✕
      </button>
    </div>
  );
}

export default function TagMealScreen({ editing, mealCount, onSave, onCancel }: TagMealScreenProps) {
  const [name,        setName]        = useState<string>(editing?.name ?? "");
  const [tags,        setTags]        = useState<MealTagSet>(
    editing?.tags ? { ...editing.tags, dietary: [...editing.tags.dietary] } : { ...EMPTY_TAGS }
  );
  const [macros,      setMacros]      = useState<MealMacros>(
    editing?.macros ? { ...editing.macros } : { ...EMPTY_MACROS }
  );
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    editing?.ingredients ? editing.ingredients.map(i => ({ ...i })) : []
  );
  const [error,  setError]  = useState<string>("");
  const [saved,  setSaved]  = useState<boolean>(false);
  const [tab,    setTab]    = useState<Tab>("tags");

  useEffect(() => {
    setName(editing?.name ?? "");
    setTags(editing?.tags ? { ...editing.tags, dietary: [...editing.tags.dietary] } : { ...EMPTY_TAGS });
    setMacros(editing?.macros ? { ...editing.macros } : { ...EMPTY_MACROS });
    setIngredients(editing?.ingredients ? editing.ingredients.map(i => ({ ...i })) : []);
    setError("");
    setSaved(false);
    setTab("tags");
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

  const addIngredient = (name: string, defaultUnit: IngredientUnit) => {
    setIngredients(prev => [
      ...prev,
      { id: nextIngredientId(), name, quantity: null, unit: defaultUnit, note: "" },
    ]);
  };

  const updateIngredient = (id: string, updated: Ingredient) => {
    setIngredients(prev => prev.map(i => i.id === id ? updated : i));
  };

  const removeIngredient = (id: string) => {
    setIngredients(prev => prev.filter(i => i.id !== id));
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
    onSave(name.trim(), tags, macros, ingredients, editing?.id);
    if (!editing) {
      setName("");
      setTags({ ...EMPTY_TAGS });
      setMacros({ ...EMPTY_MACROS });
      setIngredients([]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const tabStyle = (t: Tab): React.CSSProperties => ({
    flex: 1, padding: "10px 0", borderRadius: 5, border: "none", cursor: "pointer",
    fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.1em", transition: "all 0.15s",
    background: tab === t ? `linear-gradient(135deg, ${C.orange}, ${C.gold})` : "transparent",
    color: tab === t ? "#111214" : C.muted,
    boxShadow: tab === t ? `0 0 16px ${C.orange}30` : "none",
  });

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

          <div style={{
            display: "flex", gap: 6, background: `${C.border}40`,
            borderRadius: 6, padding: 4,
          }}>
            <button onClick={() => setTab("tags")} style={tabStyle("tags")}>
              🏷 Tags & Macros
            </button>
            <button onClick={() => setTab("ingredients")} style={tabStyle("ingredients")}>
              🥘 Ingredients {ingredients.length > 0 && `(${ingredients.length})`}
            </button>
          </div>

          {tab === "tags" && (
            <>
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
            </>
          )}

          {tab === "ingredients" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
                  <span style={sectionLabel}>Add Ingredient</span>
                  <span style={{
                    color: C.dimmer, fontSize: 10,
                    fontFamily: "'Barlow Condensed', sans-serif",
                    letterSpacing: "0.08em", textTransform: "uppercase",
                  }}>
                    search or add custom
                  </span>
                </div>
                <IngredientSearchDropdown onSelect={addIngredient} />
              </div>

              {ingredients.length === 0 ? (
                <div style={{
                  textAlign: "center", padding: "40px 20px", color: C.dimmer,
                  fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15,
                  border: `2px dashed ${C.border}`, borderRadius: 8, letterSpacing: "0.04em",
                }}>
                  No ingredients added yet.
                  <br />
                  <span style={{ fontSize: 12, color: C.muted }}>
                    Search above or press "+ Custom" to add your own.
                  </span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <span style={sectionLabel}>
                      {ingredients.length} Ingredient{ingredients.length !== 1 ? "s" : ""}
                    </span>
                    <button
                      onClick={() => setIngredients([])}
                      style={{
                        background: "none", border: "none", color: "#f87171",
                        fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 600,
                        cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.08em",
                      }}
                    >
                      Clear all
                    </button>
                  </div>
                  {ingredients.map(ing => (
                    <IngredientRow
                      key={ing.id}
                      ingredient={ing}
                      onUpdate={updated => updateIngredient(ing.id, updated)}
                      onRemove={() => removeIngredient(ing.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

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
