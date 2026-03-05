import { useState } from "react";
import {
  TaggedMeal, MealTagSet, Dietary, SpiceLevel, Cuisine, Complexity, Goal, TimeLabel,
  SPICE_LEVELS, CUISINES, COMPLEXITIES, GOALS, TIME_LABELS, DIETARY_OPTS,
  SPICE_COLOR, SPICE_ICON, GOAL_COLOR, GOAL_ICON, COMPLEXITY_COLOR, TIME_COLOR, TIME_ICON,
  C, chip, NavBar, Pill, GLOBAL_STYLES,
} from "./mealTypes";

// ── FilterState ────────────────────────────────────────────────────────────

type FilterState = Partial<Omit<MealTagSet, "dietary">> & { dietary: Dietary[] };

const EMPTY_FILTER: FilterState = {
  spiceLevel: null, cuisine: null, complexity: null,
  goal: null, prepTime: null, cookTime: null, dietary: [],
};

// ── MealCard ───────────────────────────────────────────────────────────────

function MealCard({ meal, onEdit, onDelete }: {
  meal: TaggedMeal; onEdit: (m: TaggedMeal) => void; onDelete: (id: number) => void;
}) {
  const [hover, setHover] = useState<boolean>(false);
  const t = meal.tags;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: C.surface, border: `1px solid ${hover ? C.orange : C.border}`,
        borderRadius: 8, padding: "15px 17px",
        display: "flex", flexDirection: "column", gap: 10,
        transition: "all 0.15s", transform: hover ? "translateY(-2px)" : "none",
        boxShadow: hover ? `0 4px 20px ${C.orange}18` : "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ color: C.text, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 16, fontWeight: 700, lineHeight: 1.2, flex: 1, letterSpacing: "0.02em" }}>
          {meal.name}
        </span>
        <div style={{ display: "flex", gap: 5, opacity: hover ? 1 : 0, transition: "opacity 0.15s", flexShrink: 0, marginLeft: 8 }}>
          <button onClick={() => onEdit(meal)}      style={{ background: C.border,  border: "none", borderRadius: 4, padding: "4px 7px", cursor: "pointer", fontSize: 11 }}>✏️</button>
          <button onClick={() => onDelete(meal.id)} style={{ background: "#3a1a0d", border: "none", borderRadius: 4, padding: "4px 7px", cursor: "pointer", fontSize: 11 }}>🗑</button>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {t.spiceLevel && <span style={chip(`${SPICE_COLOR[t.spiceLevel]}20`, SPICE_COLOR[t.spiceLevel])}>{SPICE_ICON[t.spiceLevel]} {t.spiceLevel.replace("_", " ")}</span>}
        {t.goal       && <span style={chip(`${GOAL_COLOR[t.goal]}20`,        GOAL_COLOR[t.goal])}>{GOAL_ICON[t.goal]} {t.goal.replace("_", " ")}</span>}
        {t.complexity && <span style={chip(`${COMPLEXITY_COLOR[t.complexity]}20`, COMPLEXITY_COLOR[t.complexity])}>{t.complexity}</span>}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {t.cuisine  && <span style={chip(C.border, C.muted)}>{t.cuisine.replace("_", " ")}</span>}
        {t.prepTime && <span style={chip(`${TIME_COLOR[t.prepTime]}18`, TIME_COLOR[t.prepTime])}>{TIME_ICON[t.prepTime]} prep: {t.prepTime}</span>}
        {t.cookTime && <span style={chip(`${TIME_COLOR[t.cookTime]}18`, TIME_COLOR[t.cookTime])}>{TIME_ICON[t.cookTime]} cook: {t.cookTime}</span>}
      </div>

      {t.dietary.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
          {t.dietary.map(d => <span key={d} style={chip("#1e2533", C.muted)}>{d.replace(/_/g, " ")}</span>)}
        </div>
      )}
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────

export interface BrowseMealsScreenProps {
  meals:    TaggedMeal[];
  onEdit:   (m: TaggedMeal) => void;
  onDelete: (id: number) => void;
  onTag:    () => void;
}

// ── Screen ─────────────────────────────────────────────────────────────────

export default function BrowseMealsScreen({ meals, onEdit, onDelete, onTag }: BrowseMealsScreenProps) {
  const [filter,      setFilter]      = useState<FilterState>(EMPTY_FILTER);
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleFilter = <K extends keyof Omit<FilterState, "dietary">>(key: K, val: FilterState[K]): void =>
    setFilter(f => ({ ...f, [key]: f[key] === val ? null : val }));

  const toggleDietary = (d: Dietary): void =>
    setFilter(f => ({
      ...f,
      dietary: f.dietary.includes(d) ? f.dietary.filter(x => x !== d) : [...f.dietary, d],
    }));

  const filtered = meals.filter(m => {
    if (filter.spiceLevel && m.tags.spiceLevel  !== filter.spiceLevel)  return false;
    if (filter.cuisine    && m.tags.cuisine     !== filter.cuisine)     return false;
    if (filter.complexity && m.tags.complexity  !== filter.complexity)  return false;
    if (filter.goal       && m.tags.goal        !== filter.goal)        return false;
    if (filter.prepTime   && m.tags.prepTime    !== filter.prepTime)    return false;
    if (filter.cookTime   && m.tags.cookTime    !== filter.cookTime)    return false;
    if (filter.dietary.length && !filter.dietary.every(d => m.tags.dietary.includes(d))) return false;
    return true;
  });

  const activeCount: number = [
    filter.spiceLevel, filter.cuisine, filter.complexity,
    filter.goal, filter.prepTime, filter.cookTime,
  ].filter(Boolean).length + filter.dietary.length;

  const hasFilter: boolean = activeCount > 0;

  const filterRow = (
    label:   string,
    key:     string,
    items:   string[],
    colorFn: (v: string) => string,
    iconFn?: (v: string) => string,
  ) => {
    const isOpen    = openSection === key;
    const activeVal = filter[key as keyof FilterState];
    const isActive  = activeVal && !Array.isArray(activeVal);

    return (
      <div key={key}>
        <button onClick={() => setOpenSection(isOpen ? null : key)} style={{
          background: "transparent", border: "none", cursor: "pointer",
          color: isActive ? C.orange : C.muted,
          fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 600,
          textTransform: "uppercase", letterSpacing: "0.15em",
          display: "flex", alignItems: "center", gap: 6, padding: "4px 0",
        }}>
          {label}
          {isActive && <span style={{ color: C.amber, fontSize: 9 }}>· {String(activeVal).replace(/_/g, " ")}</span>}
          <span style={{ fontSize: 8 }}>{isOpen ? "▴" : "▾"}</span>
        </button>
        {isOpen && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingTop: 8, paddingBottom: 4 }}>
            {items.map(v => (
              <Pill key={v} label={v} active={activeVal === v} color={colorFn(v)}
                icon={iconFn ? iconFn(v) : undefined}
                onClick={() => toggleFilter(key as keyof Omit<FilterState, "dietary">, v as any)} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <style>{GLOBAL_STYLES}</style>

      <div style={{ minHeight: "100vh", background: C.bg }}>
        <NavBar screen="browse" onTag={onTag} onBrowse={() => {}} count={meals.length} />

        {/* Sticky filter bar */}
        <div style={{
          borderBottom: `1px solid ${C.border}`, padding: "16px 32px",
          background: C.bg, position: "sticky", top: 52, zIndex: 40,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ color: C.muted, fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600 }}>
              Filters {activeCount > 0 ? `· ${activeCount} active` : ""}
            </span>
            {hasFilter && (
              <button onClick={() => setFilter(EMPTY_FILTER)} style={{
                background: "none", border: "none", color: C.orange,
                fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 600,
                cursor: "pointer", textDecoration: "underline", letterSpacing: "0.1em", textTransform: "uppercase",
              }}>
                Clear all
              </button>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "4px 24px" }}>
            {filterRow("Spice",      "spiceLevel",  SPICE_LEVELS,  v => SPICE_COLOR[v as SpiceLevel],      v => SPICE_ICON[v as SpiceLevel])}
            {filterRow("Cuisine",    "cuisine",     CUISINES,      () => C.amber)}
            {filterRow("Complexity", "complexity",  COMPLEXITIES,  v => COMPLEXITY_COLOR[v as Complexity])}
            {filterRow("Goal",       "goal",        GOALS,         v => GOAL_COLOR[v as Goal],              v => GOAL_ICON[v as Goal])}
            {filterRow("Prep Time",  "prepTime",    TIME_LABELS,   v => TIME_COLOR[v as TimeLabel],         v => TIME_ICON[v as TimeLabel])}
            {filterRow("Cook Time",  "cookTime",    TIME_LABELS,   v => TIME_COLOR[v as TimeLabel],         v => TIME_ICON[v as TimeLabel])}

            {/* Dietary multi-select */}
            <div>
              <button onClick={() => setOpenSection(openSection === "dietary" ? null : "dietary")} style={{
                background: "transparent", border: "none", cursor: "pointer",
                color: filter.dietary.length > 0 ? C.orange : C.muted,
                fontFamily: "'Barlow Condensed', sans-serif", fontSize: 11, fontWeight: 600,
                textTransform: "uppercase", letterSpacing: "0.15em",
                display: "flex", alignItems: "center", gap: 6, padding: "4px 0",
              }}>
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
        </div>

        {/* Results */}
        <div style={{ padding: "24px 32px", paddingBottom: 80 }}>
          <div style={{ color: C.dimmer, fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 16, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600 }}>
            {filtered.length} meal{filtered.length !== 1 ? "s" : ""}{hasFilter ? " matching" : ""}
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", paddingTop: 60, color: C.dimmer, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, letterSpacing: "0.05em" }}>
              No meals match these filters.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 12 }}>
              {filtered.map(m => (
                <MealCard key={m.id} meal={m} onEdit={onEdit} onDelete={onDelete} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
