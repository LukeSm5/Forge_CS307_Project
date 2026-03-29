import { CSSProperties, ReactNode } from "react";

export type SpiceLevel = "mild" | "medium" | "hot" | "extra_hot";
export type Cuisine    = "american" | "italian" | "mexican" | "asian" | "mediterranean" | "indian" | "middle_eastern" | "other";
export type Complexity = "simple" | "moderate" | "complex";
export type Goal       = "fat_loss" | "muscle_gain" | "maintenance";
export type TimeLabel  = "quick" | "medium" | "long";
export type Dietary    = "vegetarian" | "vegan" | "gluten_free" | "dairy_free" | "nut_free" | "halal" | "kosher" | "low_carb" | "high_protein";

export interface MealTagSet {
  spiceLevel: SpiceLevel | null;
  cuisine:    Cuisine    | null;
  complexity: Complexity | null;
  goal:       Goal       | null;
  prepTime:   TimeLabel  | null;
  cookTime:   TimeLabel  | null;
  dietary:    Dietary[];
}

export interface MealMacros {
  calories: number | null;
  protein:  number | null;
  fat:      number | null;
  carbs:    number | null;
  sugar:    number | null;
  fiber:    number | null;
  sodium:   number | null;
}

export interface TaggedMeal {
  id:     number;
  name:   string;
  tags:   MealTagSet;
  macros: MealMacros;
}

export const SPICE_LEVELS: SpiceLevel[] = ["mild", "medium", "hot", "extra_hot"];
export const CUISINES:     Cuisine[]    = ["american", "italian", "mexican", "asian", "mediterranean", "indian", "middle_eastern", "other"];
export const COMPLEXITIES: Complexity[] = ["simple", "moderate", "complex"];
export const GOALS:        Goal[]       = ["fat_loss", "muscle_gain", "maintenance"];
export const TIME_LABELS:  TimeLabel[]  = ["quick", "medium", "long"];
export const DIETARY_OPTS: Dietary[]    = ["vegetarian", "vegan", "gluten_free", "dairy_free", "nut_free", "halal", "kosher", "low_carb", "high_protein"];

export const SPICE_COLOR: Record<SpiceLevel, string> = {
  mild: "#6ee7b7", medium: "#fbbf24", hot: "#f97316", extra_hot: "#ef4444",
};
export const SPICE_ICON: Record<SpiceLevel, string> = {
  mild: "🌿", medium: "🌶", hot: "🔥", extra_hot: "💀",
};
export const GOAL_COLOR: Record<Goal, string> = {
  fat_loss: "#f97316", muscle_gain: "#fbbf24", maintenance: "#a78bfa",
};
export const GOAL_ICON: Record<Goal, string> = {
  fat_loss: "🔻", muscle_gain: "💪", maintenance: "⚖️",
};
export const COMPLEXITY_COLOR: Record<Complexity, string> = {
  simple: "#6ee7b7", moderate: "#fbbf24", complex: "#f97316",
};
export const TIME_COLOR: Record<TimeLabel, string> = {
  quick: "#6ee7b7", medium: "#fbbf24", long: "#f97316",
};
export const TIME_ICON: Record<TimeLabel, string> = {
  quick: "⚡", medium: "⏱", long: "🕐",
};

export type MacroKey = keyof MealMacros;

export interface MacroDisplayConfig {
  key:   MacroKey;
  label: string;
  unit:  string;
  color: string;
}

export const MACRO_DISPLAY: MacroDisplayConfig[] = [
  { key: "calories", label: "Cal",     unit: "kcal", color: "#f97316" },
  { key: "protein",  label: "Protein", unit: "g",    color: "#60a5fa" },
  { key: "carbs",    label: "Carbs",   unit: "g",    color: "#a78bfa" },
  { key: "fat",      label: "Fat",     unit: "g",    color: "#fbbf24" },
  { key: "sugar",    label: "Sugar",   unit: "g",    color: "#f472b6" },
  { key: "fiber",    label: "Fiber",   unit: "g",    color: "#34d399" },
  { key: "sodium",   label: "Sodium",  unit: "mg",   color: "#94a3b8" },
];

export const EMPTY_TAGS: MealTagSet = {
  spiceLevel: null, cuisine: null, complexity: null,
  goal: null, prepTime: null, cookTime: null, dietary: [],
};

export const EMPTY_MACROS: MealMacros = {
  calories: null, protein: null, fat:   null,
  carbs:    null, sugar:   null, fiber: null, sodium: null,
};

export const SEED: TaggedMeal[] = [
  {
    id: 1, name: "Grilled Chicken & Rice",
    tags:   { spiceLevel: "mild",   cuisine: "american",       complexity: "simple",   goal: "muscle_gain", prepTime: "quick",  cookTime: "medium", dietary: ["gluten_free", "high_protein"] },
    macros: { calories: 480, protein: 42, fat: 10, carbs: 52, sugar: 3,  fiber: 3, sodium: 540 },
  },
  {
    id: 2, name: "Spicy Tofu Stir Fry",
    tags:   { spiceLevel: "hot",    cuisine: "asian",          complexity: "moderate", goal: "fat_loss",    prepTime: "medium", cookTime: "quick",  dietary: ["vegan", "gluten_free"] },
    macros: { calories: 320, protein: 18, fat: 12, carbs: 36, sugar: 8,  fiber: 5, sodium: 820 },
  },
  {
    id: 3, name: "Pasta Bolognese",
    tags:   { spiceLevel: "mild",   cuisine: "italian",        complexity: "moderate", goal: "muscle_gain", prepTime: "medium", cookTime: "long",   dietary: [] },
    macros: { calories: 610, protein: 28, fat: 22, carbs: 70, sugar: 9,  fiber: 4, sodium: 740 },
  },
  {
    id: 4, name: "Black Bean Tacos",
    tags:   { spiceLevel: "medium", cuisine: "mexican",        complexity: "simple",   goal: "maintenance", prepTime: "quick",  cookTime: "quick",  dietary: ["vegetarian", "gluten_free"] },
    macros: { calories: 390, protein: 16, fat: 11, carbs: 55, sugar: 5,  fiber: 12, sodium: 620 },
  },
  {
    id: 5, name: "Lamb Tagine",
    tags:   { spiceLevel: "medium", cuisine: "middle_eastern", complexity: "complex",  goal: "maintenance", prepTime: "long",   cookTime: "long",   dietary: ["gluten_free"] },
    macros: { calories: 550, protein: 34, fat: 24, carbs: 40, sugar: 11, fiber: 6, sodium: 680 },
  },
];

export const C = {
  bg:      "#eef3fd",
  surface: "#ffffff",
  border:  "#b3bed4",
  orange:  "#f97316",
  amber:   "#fbbf24",
  gold:    "#f59e0b",
  muted:   "#929cb0",
  dimmer:  "#879ec4",
  text:    "#000000",
};

export const chip = (bg: string, color: string, extra: CSSProperties = {}): CSSProperties => ({
  background: bg, color, borderRadius: 4,
  padding: "2px 8px", fontSize: 10,
  fontFamily: "'Barlow Condensed', sans-serif",
  textTransform: "uppercase", letterSpacing: "0.08em",
  display: "inline-block", fontWeight: 600, ...extra,
});

export const sectionLabel: CSSProperties = {
  color: C.muted, fontSize: 9, letterSpacing: "0.25em",
  textTransform: "uppercase", marginBottom: 0, display: "block",
  fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600,
};

export const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #111214; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #1a1c20; }
  ::-webkit-scrollbar-thumb { background: #f97316; border-radius: 2px; }
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  input[type=number] { -moz-appearance: textfield; }
`;

export function Pill({ label, active, color, onClick, icon }: {
  label: string; active: boolean; color: string; onClick: () => void; icon?: string;
}) {
  return (
    <button onClick={onClick} style={{
      padding: "5px 12px", borderRadius: 4, cursor: "pointer", transition: "all 0.15s",
      border:     active ? `1.5px solid ${color}` : `1.5px solid ${C.border}`,
      background: active ? `${color}20` : "transparent",
      color:      active ? color : C.muted,
      fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 600,
      textTransform: "uppercase", letterSpacing: "0.07em",
      display: "flex", alignItems: "center", gap: 5,
    }}>
      {icon && <span style={{ fontSize: 13 }}>{icon}</span>}
      {label.replace(/_/g, " ")}
    </button>
  );
}

export function TagSection({ title, children, optional }: {
  title: string; children: ReactNode; optional?: boolean;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={sectionLabel}>{title}</span>
        {optional && (
          <span style={{ color: C.dimmer, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Barlow Condensed', sans-serif" }}>
            optional
          </span>
        )}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{children}</div>
    </div>
  );
}
