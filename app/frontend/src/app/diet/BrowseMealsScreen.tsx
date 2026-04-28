import { useState } from "react";
import { C } from "@/constants/dietConstants";
import {
  TaggedMeal, MealTagSet, MealMacros, Ingredient, Dietary, SpiceLevel, Cuisine, Complexity, Goal, TimeLabel,
  SPICE_LEVELS, CUISINES, COMPLEXITIES, GOALS, TIME_LABELS, DIETARY_OPTS,
  SPICE_COLOR, SPICE_ICON, GOAL_COLOR, GOAL_ICON, COMPLEXITY_COLOR, TIME_COLOR, TIME_ICON,
  INGREDIENT_UNITS,
  C, chip, Pill, GLOBAL_STYLES,
  chip, Pill, GLOBAL_STYLES,
} from "./mealTypes";

type MacroRange = { min: number | null; max: number | null };
type FilterState = Partial<Omit<MealTagSet, "dietary">> & {
  dietary:  Dietary[];
  calories: MacroRange;
  protein:  MacroRange;
  fat:      MacroRange;
  carbs:    MacroRange;
  sugar:    MacroRange;
  fiber:    MacroRange;
  sodium:   MacroRange;
};

const EMPTY_RANGE: MacroRange = { min: null, max: null };
const EMPTY_FILTER: FilterState = {
  spiceLevel: null, cuisine: null, complexity: null,
  goal: null, prepTime: null, cookTime: null,
  dietary:  [],
  calories: { ...EMPTY_RANGE },
  protein:  { ...EMPTY_RANGE },
  fat:      { ...EMPTY_RANGE },
  carbs:    { ...EMPTY_RANGE },
  sugar:    { ...EMPTY_RANGE },
  fiber:    { ...EMPTY_RANGE },
  sodium:   { ...EMPTY_RANGE },
};

type MacroFilterKey = "calories" | "protein" | "fat" | "carbs" | "sugar" | "fiber" | "sodium";

const MACRO_FILTER_FIELDS: { key: MacroFilterKey; label: string; unit: string }[] = [
  { key: "calories", label: "Calories", unit: "kcal" },
  { key: "protein",  label: "Protein",  unit: "g"    },
  { key: "carbs",    label: "Carbs",    unit: "g"    },
  { key: "fat",      label: "Fat",      unit: "g"    },
  { key: "sugar",    label: "Sugar",    unit: "g"    },
  { key: "fiber",    label: "Fiber",    unit: "g"    },
  { key: "sodium",   label: "Sodium",   unit: "mg"   },
];

function MacroBadge({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      background: `${color}14`, borderRadius: 5, padding: "5px 8px", minWidth: 44,
    }}>
      <span style={{
        color, fontSize: 13, fontWeight: 700,
        fontFamily: "'Barlow Condensed', sans-serif", lineHeight: 1,
      }}>
        {value % 1 === 0 ? value : value.toFixed(1)}
      </span>
      <span style={{
        color: C.dimmer, fontSize: 8, marginTop: 2,
        fontFamily: "'Barlow Condensed', sans-serif",
        textTransform: "uppercase", letterSpacing: "0.08em",
      }}>
        {label}
      </span>
      <span style={{
        color: C.dimmer, fontSize: 7,
        fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em",
      }}>
        {unit}
      </span>
    </div>
  );
}

const MACRO_DISPLAY: { key: MacroFilterKey; label: string; unit: string; color: string }[] = [
  { key: "calories", label: "Cal",     unit: "kcal", color: C.orange  },
  { key: "protein",  label: "Protein", unit: "g",    color: "#60a5fa" },
  { key: "carbs",    label: "Carbs",   unit: "g",    color: "#a78bfa" },
  { key: "fat",      label: "Fat",     unit: "g",    color: "#fbbf24" },
  { key: "sugar",    label: "Sugar",   unit: "g",    color: "#f472b6" },
  { key: "fiber",    label: "Fiber",   unit: "g",    color: "#34d399" },
  { key: "sodium",   label: "Sodium",  unit: "mg",   color: "#94a3b8" },
];

function IngredientLine({ ingredient }: { ingredient: Ingredient }) {
  const unitLabel = INGREDIENT_UNITS.find(u => u.value === ingredient.unit)?.label ?? ingredient.unit;
  const showQty = ingredient.unit !== "to_taste" && ingredient.quantity !== null;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "5px 0", borderBottom: `1px solid ${C.border}40`,
    }}>
      <span style={{
        color: C.orange, fontSize: 11, fontWeight: 700, minWidth: 60, textAlign: "right",
        fontFamily: "'Barlow Condensed', sans-serif",
      }}>
        {showQty ? (
          <>
            {ingredient.quantity! % 1 === 0 ? ingredient.quantity : ingredient.quantity!.toFixed(2)}
            <span style={{ color: C.dimmer, fontWeight: 600, fontSize: 10, marginLeft: 2 }}>{unitLabel}</span>
          </>
        ) : (
          <span style={{ color: C.dimmer, fontWeight: 600, fontSize: 10 }}>{unitLabel}</span>
        )}
      </span>
      <span style={{
        color: C.text, fontSize: 13, fontWeight: 600,
        fontFamily: "'Barlow Condensed', sans-serif", flex: 1,
      }}>
        {ingredient.name}
      </span>
      {ingredient.note && (
        <span style={{
          color: C.dimmer, fontSize: 10, fontStyle: "italic",
          fontFamily: "'Barlow Condensed', sans-serif",
        }}>
          {ingredient.note}
        </span>
      )}
    </div>
  );
}

function MealCard({ meal, onEdit, onDelete, expanded, onToggle }: {
  meal: TaggedMeal;
  onEdit: (m: TaggedMeal) => void;
  onDelete: (id: number) => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [hover, setHover] = useState<boolean>(false);
  const t = meal.tags;
  const m = meal.macros;
  const hasMacros = m && MACRO_DISPLAY.some(({ key }) => m[key] !== null && m[key] !== undefined);
  const hasIngredients = meal.ingredients && meal.ingredients.length > 0;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: C.surface, border: `1px solid ${expanded ? C.orange : hover ? C.orange : C.border}`,
        borderRadius: 8, padding: "15px 17px",
        display: "flex", flexDirection: "column", gap: 10,
        transition: "all 0.15s", transform: hover ? "translateY(-2px)" : "none",
        boxShadow: hover ? `0 4px 20px ${C.orange}18` : expanded ? `0 2px 12px ${C.orange}12` : "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <button
          onClick={onToggle}
          style={{
            background: "none", border: "none", cursor: "pointer", padding: 0,
            color: C.text, fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 16, fontWeight: 700, lineHeight: 1.2,
            flex: 1, letterSpacing: "0.02em", textAlign: "left",
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          {meal.name}
          <span style={{
            fontSize: 9, color: C.dimmer, transition: "transform 0.15s",
            transform: expanded ? "rotate(180deg)" : "none",
          }}>
            ▼
          </span>
        </button>
        <div style={{
          display: "flex", gap: 5,
          opacity: hover ? 1 : 0, transition: "opacity 0.15s",
          flexShrink: 0, marginLeft: 8,
        }}>
          <button onClick={() => onEdit(meal)}
            style={{ background: C.border,  border: "none", borderRadius: 4, padding: "4px 7px", cursor: "pointer", fontSize: 11 }}>
            ✏️
          </button>
          <button onClick={() => onDelete(meal.id)}
            style={{ background: "#3a1a0d", border: "none", borderRadius: 4, padding: "4px 7px", cursor: "pointer", fontSize: 11 }}>
            🗑
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {t.spiceLevel && <span style={chip(`${SPICE_COLOR[t.spiceLevel]}20`, SPICE_COLOR[t.spiceLevel])}>{SPICE_ICON[t.spiceLevel]} {t.spiceLevel.replace("_", " ")}</span>}
        {t.goal       && <span style={chip(`${GOAL_COLOR[t.goal]}20`,        GOAL_COLOR[t.goal])}>{GOAL_ICON[t.goal]} {t.goal.replace("_", " ")}</span>}
        {t.complexity && <span style={chip(`${COMPLEXITY_COLOR[t.complexity]}20`, COMPLEXITY_COLOR[t.complexity])}>{t.complexity}</span>}
      </div>

      {!expanded && (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {t.cuisine  && <span style={chip(C.border, C.muted)}>{t.cuisine.replace("_", " ")}</span>}
            {t.prepTime && <span style={chip(`${TIME_COLOR[t.prepTime]}18`, TIME_COLOR[t.prepTime])}>{TIME_ICON[t.prepTime]} prep: {t.prepTime}</span>}
            {t.cookTime && <span style={chip(`${TIME_COLOR[t.cookTime]}18`, TIME_COLOR[t.cookTime])}>{TIME_ICON[t.cookTime]} cook: {t.cookTime}</span>}
            {hasIngredients && (
              <span style={chip(`${C.orange}18`, C.orange)}>
                🥘 {meal.ingredients.length} ingredient{meal.ingredients.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          {t.dietary.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
              {t.dietary.map(d => <span key={d} style={chip("#1e2533", C.muted)}>{d.replace(/_/g, " ")}</span>)}
            </div>
          )}
          {hasMacros && (
            <div style={{ paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
              <div style={{
                fontSize: 8, color: C.dimmer, letterSpacing: "0.2em",
                textTransform: "uppercase", marginBottom: 7,
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600,
              }}>
                Macros · per serving
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {MACRO_DISPLAY.map(({ key, label, unit, color }) => {
                  const val = m![key];
                  if (val === null || val === undefined) return null;
                  return <MacroBadge key={key} label={label} value={val} unit={unit} color={color} />;
                })}
              </div>
            </div>
          )}
        </>
      )}

      {expanded && (
        <div style={{
          display: "flex", flexDirection: "column", gap: 14,
          borderTop: `1px solid ${C.orange}30`, paddingTop: 12,
        }}>
          <div>
            <div style={{
              fontSize: 9, color: C.orange, letterSpacing: "0.2em",
              textTransform: "uppercase", marginBottom: 8,
              fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
            }}>
              Tags
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {t.cuisine  && <span style={chip(C.border, C.muted)}>{t.cuisine.replace("_", " ")}</span>}
              {t.prepTime && <span style={chip(`${TIME_COLOR[t.prepTime]}18`, TIME_COLOR[t.prepTime])}>{TIME_ICON[t.prepTime]} prep: {t.prepTime}</span>}
              {t.cookTime && <span style={chip(`${TIME_COLOR[t.cookTime]}18`, TIME_COLOR[t.cookTime])}>{TIME_ICON[t.cookTime]} cook: {t.cookTime}</span>}
            </div>
            {t.dietary.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
                {t.dietary.map(d => <span key={d} style={chip("#1e2533", C.muted)}>{d.replace(/_/g, " ")}</span>)}
              </div>
            )}
          </div>

          {hasMacros && (
            <div>
              <div style={{
                fontSize: 9, color: C.orange, letterSpacing: "0.2em",
                textTransform: "uppercase", marginBottom: 8,
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
              }}>
                Macros · per serving
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {MACRO_DISPLAY.map(({ key, label, unit, color }) => {
                  const val = m![key];
                  if (val === null || val === undefined) return null;
                  return <MacroBadge key={key} label={label} value={val} unit={unit} color={color} />;
                })}
              </div>
            </div>
          )}
          <div>
            <div style={{
              fontSize: 9, color: C.orange, letterSpacing: "0.2em",
              textTransform: "uppercase", marginBottom: 8,
              fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
            }}>
              Ingredients {hasIngredients ? `(${meal.ingredients.length})` : ""}
            </div>
            {hasIngredients ? (
              <div style={{
                background: `${C.border}20`, borderRadius: 6,
                padding: "8px 12px",
              }}>
                {meal.ingredients.map(ing => (
                  <IngredientLine key={ing.id} ingredient={ing} />
                ))}
              </div>
            ) : (
              <div style={{
                color: C.dimmer, fontSize: 12,
                fontFamily: "'Barlow Condensed', sans-serif",
                fontStyle: "italic", padding: "8px 0",
              }}>
                No ingredients listed. Edit this meal to add some.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export interface BrowseMealsScreenProps {
  meals:    TaggedMeal[];
  onEdit:   (m: TaggedMeal) => void;
  onDelete: (id: number) => void;
}

export default function BrowseMealsScreen({ meals, onEdit, onDelete }: BrowseMealsScreenProps) {
  const [filter,      setFilter]      = useState<FilterState>(EMPTY_FILTER);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [expandedId,  setExpandedId]  = useState<number | null>(null);

  const toggleFilter = <K extends keyof Omit<FilterState, "dietary" | MacroFilterKey>>(
    key: K, val: FilterState[K]
  ): void =>
    setFilter(f => ({ ...f, [key]: f[key] === val ? null : val }));

  const toggleDietary = (d: Dietary): void =>
    setFilter(f => ({
      ...f,
      dietary: f.dietary.includes(d) ? f.dietary.filter(x => x !== d) : [...f.dietary, d],
    }));

  const setMacroRange = (key: MacroFilterKey, bound: "min" | "max", raw: string): void => {
    const parsed = raw === "" ? null : parseFloat(raw);
    setFilter(f => ({
      ...f,
      [key]: { ...f[key], [bound]: parsed === null || isNaN(parsed) ? null : parsed },
    }));
  };

  const macroRangeActive = (key: MacroFilterKey): boolean => {
    const r = filter[key] as MacroRange;
    return r.min !== null || r.max !== null;
  };

  const filtered = meals.filter(m => {
    const t = m.tags;
    if (filter.spiceLevel && t.spiceLevel !== filter.spiceLevel) return false;
    if (filter.cuisine    && t.cuisine    !== filter.cuisine)    return false;
    if (filter.complexity && t.complexity !== filter.complexity) return false;
    if (filter.goal       && t.goal       !== filter.goal)       return false;
    if (filter.prepTime   && t.prepTime   !== filter.prepTime)   return false;
    if (filter.cookTime   && t.cookTime   !== filter.cookTime)   return false;
    if (filter.dietary.length && !filter.dietary.every(d => t.dietary.includes(d))) return false;
    for (const { key } of MACRO_FILTER_FIELDS) {
      const range = filter[key] as MacroRange;
      if (range.min === null && range.max === null) continue;
      const val = m.macros?.[key] ?? null;
      if (val === null) return false;
      if (range.min !== null && val < range.min) return false;
      if (range.max !== null && val > range.max) return false;
    }
    return true;
  });

  const tagActiveCount: number = [
    filter.spiceLevel, filter.cuisine, filter.complexity,
    filter.goal, filter.prepTime, filter.cookTime,
  ].filter(Boolean).length + filter.dietary.length;
  const macroActiveCount: number = MACRO_FILTER_FIELDS.filter(({ key }) => macroRangeActive(key)).length;
  const activeCount = tagActiveCount + macroActiveCount;
  const hasFilter   = activeCount > 0;

  const filterRow = (
    label:   string,
    key:     string,
    items:   string[],
    colorFn: (v: string) => string,
    iconFn?: (v: string) => string,
  ) => {
    const isOpen    = openSection === key;
    const activeVal = filter[key as keyof FilterState];
    const isActive  = activeVal && !Array.isArray(activeVal) && typeof activeVal !== "object";

    return (
      <div key={key}>
        <button
          onClick={() => setOpenSection(isOpen ? null : key)}
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            color: isActive ? C.orange : C.muted,
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 600,
            textTransform: "uppercase", letterSpacing: "0.15em",
            display: "flex", alignItems: "center", gap: 6, padding: "4px 0",
          }}
        >
          {label}
          {isActive && (
            <span style={{ color: C.amber, fontSize: 9 }}>
              · {String(activeVal).replace(/_/g, " ")}
            </span>
          )}
          <span style={{ fontSize: 8 }}>{isOpen ? "▴" : "▾"}</span>
        </button>
        {isOpen && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingTop: 8, paddingBottom: 4 }}>
            {items.map(v => (
              <Pill key={v} label={v} active={activeVal === v} color={colorFn(v)}
                icon={iconFn ? iconFn(v) : undefined}
                onClick={() => toggleFilter(key as any, v as any)} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const macroRangeRow = ({ key, label, unit }: { key: MacroFilterKey; label: string; unit: string }) => {
    const isOpen  = openSection === `macro_${key}`;
    const isActive = macroRangeActive(key);
    const range   = filter[key] as MacroRange;

    return (
      <div key={key}>
        <button
          onClick={() => setOpenSection(isOpen ? null : `macro_${key}`)}
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            color: isActive ? C.orange : C.muted,
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 600,
            textTransform: "uppercase", letterSpacing: "0.15em",
            display: "flex", alignItems: "center", gap: 6, padding: "4px 0",
          }}
        >
          {label}
          {isActive && (
            <span style={{ color: C.amber, fontSize: 9 }}>
              · {range.min ?? "…"}–{range.max ?? "…"} {unit}
            </span>
          )}
          <span style={{ fontSize: 8 }}>{isOpen ? "▴" : "▾"}</span>
        </button>
        {isOpen && (
          <div style={{ display: "flex", gap: 6, paddingTop: 8, paddingBottom: 4 }}>
            <div style={{ flex: 1 }}>
              <div style={miniLabel}>Min</div>
              <input
                type="number" min={0} step={key === "sodium" ? 1 : 0.1}
                value={range.min ?? ""}
                onChange={e => setMacroRange(key, "min", e.target.value)}
                placeholder="—"
                style={rangeInput(C)}
                onFocus={e => (e.target.style.borderColor = C.orange)}
                onBlur={e  => (e.target.style.borderColor = C.border)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={miniLabel}>Max</div>
              <input
                type="number" min={0} step={key === "sodium" ? 1 : 0.1}
                value={range.max ?? ""}
                onChange={e => setMacroRange(key, "max", e.target.value)}
                placeholder="—"
                style={rangeInput(C)}
                onFocus={e => (e.target.style.borderColor = C.orange)}
                onBlur={e  => (e.target.style.borderColor = C.border)}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <div style={{ minHeight: "100vh", background: C.bg }}>
        <div style={{
          borderBottom: `1px solid ${C.border}`, padding: "16px 32px",
          background: C.bg, position: "sticky", top: 0, zIndex: 40,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{
              color: C.muted, fontSize: 9, letterSpacing: "0.25em",
              textTransform: "uppercase",
              fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600,
            }}>
              Filters {activeCount > 0 ? `· ${activeCount} active` : ""}
            </span>
            {hasFilter && (
              <button onClick={() => setFilter(EMPTY_FILTER)} style={{
                background: "none", border: "none", color: C.orange,
                fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 600,
                cursor: "pointer", textDecoration: "underline",
                letterSpacing: "0.1em", textTransform: "uppercase",
              }}>
                Clear all
              </button>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "4px 24px", marginBottom: 8 }}>
            {filterRow("Spice",      "spiceLevel",  SPICE_LEVELS,  v => SPICE_COLOR[v as SpiceLevel],     v => SPICE_ICON[v as SpiceLevel])}
            {filterRow("Cuisine",    "cuisine",     CUISINES,      () => C.amber)}
            {filterRow("Complexity", "complexity",  COMPLEXITIES,  v => COMPLEXITY_COLOR[v as Complexity])}
            {filterRow("Goal",       "goal",        GOALS,         v => GOAL_COLOR[v as Goal],             v => GOAL_ICON[v as Goal])}
            {filterRow("Prep Time",  "prepTime",    TIME_LABELS,   v => TIME_COLOR[v as TimeLabel],        v => TIME_ICON[v as TimeLabel])}
            {filterRow("Cook Time",  "cookTime",    TIME_LABELS,   v => TIME_COLOR[v as TimeLabel],        v => TIME_ICON[v as TimeLabel])}
            <div>
              <button
                onClick={() => setOpenSection(openSection === "dietary" ? null : "dietary")}
                style={{
                  background: "transparent", border: "none", cursor: "pointer",
                  color: filter.dietary.length > 0 ? C.orange : C.muted,
                  fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 600,
                  textTransform: "uppercase", letterSpacing: "0.15em",
                  display: "flex", alignItems: "center", gap: 6, padding: "4px 0",
                }}
              >
                Dietary
                {filter.dietary.length > 0 && <span style={{ color: C.amber, fontSize: 9 }}>· {filter.dietary.length}</span>}
                <span style={{ fontSize: 8 }}>{openSection === "dietary" ? "▴" : "▾"}</span>
              </button>
              {openSection === "dietary" && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingTop: 8, paddingBottom: 4 }}>
                  {DIETARY_OPTS.map(d => (
                    <Pill key={d} label={d} active={filter.dietary.includes(d)}
                      color={C.amber} onClick={() => toggleDietary(d)} />
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{
            borderTop: `1px solid ${C.border}`, paddingTop: 10, marginTop: 4,
          }}>
            <div style={{
              fontSize: 8, color: C.dimmer, letterSpacing: "0.25em",
              textTransform: "uppercase", marginBottom: 8,
              fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600,
            }}>
              Macro ranges (per serving)
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "4px 24px" }}>
              {MACRO_FILTER_FIELDS.map(macroRangeRow)}
            </div>
          </div>
        </div>
        <div style={{ padding: "24px 32px", paddingBottom: 80 }}>
          <div style={{
            color: C.dimmer, fontSize: 9, letterSpacing: "0.25em",
            textTransform: "uppercase", marginBottom: 16,
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600,
          }}>
            {filtered.length} meal{filtered.length !== 1 ? "s" : ""}{hasFilter ? " matching" : ""}
          </div>

          {filtered.length === 0 ? (
            <div style={{
              textAlign: "center", paddingTop: 60, color: C.dimmer,
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, letterSpacing: "0.05em",
            }}>
              No meals match these filters.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 12 }}>
              {filtered.map(m => (
                <MealCard
                  key={m.id}
                  meal={m}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  expanded={expandedId === m.id}
                  onToggle={() => setExpandedId(expandedId === m.id ? null : m.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const miniLabel: React.CSSProperties = {
  color: C.dimmer, fontSize: 8,
  fontFamily: "'Barlow Condensed', sans-serif",
  textTransform: "uppercase", letterSpacing: "0.12em",
  marginBottom: 4,
};

const rangeInput = (C: Record<string, string>): React.CSSProperties => ({
  width: "100%", background: C.surface,
  border: `1.5px solid ${C.border}`,
  borderRadius: 5, padding: "7px 10px",
  color: C.text,
  fontFamily: "'Barlow Condensed', sans-serif",
  fontSize: 13, outline: "none",
  transition: "border-color 0.15s",
  MozAppearance: "textfield",
} as React.CSSProperties);
