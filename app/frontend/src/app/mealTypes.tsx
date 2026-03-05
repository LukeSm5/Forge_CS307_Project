import { CSSProperties, ReactNode } from "react";

export type SpiceLevel = "mild" | "medium" | "hot" | "extra_hot";
export type Cuisine    = "american" | "italian" | "mexican" | "asian" | "mediterranean" | "indian" | "middle_eastern" | "other";
export type Complexity = "simple" | "moderate" | "complex";
export type Goal       = "fat_loss" | "muscle_gain" | "maintenance";
export type TimeLabel  = "quick" | "medium" | "long";
export type Dietary    = "vegetarian" | "vegan" | "gluten_free" | "dairy_free" | "nut_free" | "halal" | "kosher" | "low_carb" | "high_protein";
export type Screen     = "tag" | "browse";
export interface MealTagSet {
  spiceLevel: SpiceLevel | null;
  cuisine:    Cuisine    | null;
  complexity: Complexity | null;
  goal:       Goal       | null;
  prepTime:   TimeLabel  | null;
  cookTime:   TimeLabel  | null;
  dietary:    Dietary[];
}
export interface TaggedMeal {
  id:   number;
  name: string;
  tags: MealTagSet;
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
export const SEED: TaggedMeal[] = [
  { id: 1, name: "Grilled Chicken & Rice",   tags: { spiceLevel: "mild",   cuisine: "american",       complexity: "simple",   goal: "muscle_gain", prepTime: "quick",  cookTime: "medium", dietary: ["gluten_free", "high_protein"] } },
  { id: 2, name: "Spicy Tofu Stir Fry",      tags: { spiceLevel: "hot",    cuisine: "asian",          complexity: "moderate", goal: "fat_loss",    prepTime: "medium", cookTime: "quick",  dietary: ["vegan", "gluten_free"] } },
  { id: 3, name: "Pasta Bolognese",           tags: { spiceLevel: "mild",   cuisine: "italian",        complexity: "moderate", goal: "muscle_gain", prepTime: "medium", cookTime: "long",   dietary: [] } },
  { id: 4, name: "Black Bean Tacos",          tags: { spiceLevel: "medium", cuisine: "mexican",        complexity: "simple",   goal: "maintenance", prepTime: "quick",  cookTime: "quick",  dietary: ["vegetarian", "gluten_free"] } },
  { id: 5, name: "Lamb Tagine",               tags: { spiceLevel: "medium", cuisine: "middle_eastern", complexity: "complex",  goal: "maintenance", prepTime: "long",   cookTime: "long",   dietary: ["gluten_free"] } },
];
export const EMPTY_TAGS: MealTagSet = {
  spiceLevel: null, cuisine: null, complexity: null,
  goal: null, prepTime: null, cookTime: null, dietary: [],
};
export const C = {
  bg:      "#111214",
  surface: "#1a1c20",
  border:  "#2a2d33",
  orange:  "#f97316",
  amber:   "#fbbf24",
  gold:    "#f59e0b",
  muted:   "#6b7280",
  dimmer:  "#374151",
  text:    "#f3f4f6",
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
export function NavBar({ screen, onTag, onBrowse, count }: {
  screen: Screen; onTag: () => void; onBrowse: () => void; count: number;
}) {
  return (
    <nav style={{
      borderBottom: `1px solid ${C.border}`, height: 52,
      display: "flex", alignItems: "stretch", justifyContent: "center",
      background: C.bg, position: "sticky", top: 0, zIndex: 50,
    }}>
      <div style={{ display: "flex", alignItems: "stretch" }}>
        {([["tag", "Tag Meal", onTag], ["browse", `Browse (${count})`, onBrowse]] as const).map(([id, label, handler]) => (
          <button key={id} onClick={handler} style={{
            background: "transparent", border: "none",
            borderBottom: screen === id ? `2px solid ${C.orange}` : "2px solid transparent",
            color:        screen === id ? C.orange : C.muted,
            fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700,
            cursor: "pointer", padding: "0 28px",
            textTransform: "uppercase", letterSpacing: "0.12em", transition: "all 0.15s",
          }}>
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
