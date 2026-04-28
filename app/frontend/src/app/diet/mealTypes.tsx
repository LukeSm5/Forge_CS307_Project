import { CSSProperties, ReactNode } from "react";
import { C } from "../../constants/dietConstants"

export type SpiceLevel = "mild" | "medium" | "hot" | "extra_hot";
export type Cuisine    = "american" | "italian" | "mexican" | "asian" | "mediterranean" | "indian" | "middle_eastern" | "other";
export type Complexity = "simple" | "moderate" | "complex";
export type Goal       = "fat_loss" | "muscle_gain" | "maintenance";
export type TimeLabel  = "quick" | "medium" | "long";
export type Dietary    = "vegetarian" | "vegan" | "gluten_free" | "dairy_free" | "nut_free" | "halal" | "kosher" | "low_carb" | "high_protein";
export type MacroFilterKey = 'calories' | 'protein' | 'fat' | 'carbs' | 'sugar' | 'fiber' | 'sodium';

export type IngredientUnit =
  | "g" | "kg" | "oz" | "lb"
  | "ml" | "l" | "cup" | "tbsp" | "tsp" | "fl_oz"
  | "piece" | "slice" | "clove" | "pinch" | "to_taste" | "whole";

export interface Ingredient {
  id:       string;
  name:     string;
  quantity: number | null;
  unit:     IngredientUnit;
  note:     string;
}

export const INGREDIENT_UNITS: { value: IngredientUnit; label: string; group: string }[] = [
  { value: "g",        label: "g",        group: "Weight" },
  { value: "kg",       label: "kg",       group: "Weight" },
  { value: "oz",       label: "oz",       group: "Weight" },
  { value: "lb",       label: "lb",       group: "Weight" },
  { value: "ml",       label: "ml",       group: "Volume" },
  { value: "l",        label: "L",        group: "Volume" },
  { value: "cup",      label: "cup",      group: "Volume" },
  { value: "tbsp",     label: "tbsp",     group: "Volume" },
  { value: "tsp",      label: "tsp",      group: "Volume" },
  { value: "fl_oz",    label: "fl oz",    group: "Volume" },
  { value: "piece",    label: "piece",    group: "Count" },
  { value: "slice",    label: "slice",    group: "Count" },
  { value: "clove",    label: "clove",    group: "Count" },
  { value: "whole",    label: "whole",    group: "Count" },
  { value: "pinch",    label: "pinch",    group: "Other" },
  { value: "to_taste", label: "to taste", group: "Other" },
];

export const INGREDIENT_CATEGORIES = [
  "Proteins", "Vegetables", "Fruits", "Grains & Starches",
  "Dairy", "Oils & Fats", "Herbs & Spices", "Sauces & Condiments",
  "Nuts & Seeds", "Other",
] as const;
export type IngredientCategory = typeof INGREDIENT_CATEGORIES[number];

export interface CommonIngredient {
  name:     string;
  category: IngredientCategory;
  defaultUnit: IngredientUnit;
}

export const COMMON_INGREDIENTS: CommonIngredient[] = [
  // Proteins
  { name: "Chicken Breast",   category: "Proteins", defaultUnit: "g" },
  { name: "Ground Beef",      category: "Proteins", defaultUnit: "g" },
  { name: "Ground Turkey",    category: "Proteins", defaultUnit: "g" },
  { name: "Salmon",           category: "Proteins", defaultUnit: "g" },
  { name: "Shrimp",           category: "Proteins", defaultUnit: "g" },
  { name: "Tofu",             category: "Proteins", defaultUnit: "g" },
  { name: "Eggs",             category: "Proteins", defaultUnit: "piece" },
  { name: "Bacon",            category: "Proteins", defaultUnit: "slice" },
  { name: "Steak",            category: "Proteins", defaultUnit: "g" },
  { name: "Pork Chop",        category: "Proteins", defaultUnit: "piece" },
  // Vegetables
  { name: "Onion",            category: "Vegetables", defaultUnit: "piece" },
  { name: "Garlic",           category: "Vegetables", defaultUnit: "clove" },
  { name: "Bell Pepper",      category: "Vegetables", defaultUnit: "piece" },
  { name: "Tomato",           category: "Vegetables", defaultUnit: "piece" },
  { name: "Spinach",          category: "Vegetables", defaultUnit: "cup" },
  { name: "Broccoli",         category: "Vegetables", defaultUnit: "cup" },
  { name: "Carrot",           category: "Vegetables", defaultUnit: "piece" },
  { name: "Mushrooms",        category: "Vegetables", defaultUnit: "cup" },
  { name: "Zucchini",         category: "Vegetables", defaultUnit: "piece" },
  { name: "Sweet Potato",     category: "Vegetables", defaultUnit: "piece" },
  { name: "Jalapeño",         category: "Vegetables", defaultUnit: "piece" },
  { name: "Corn",             category: "Vegetables", defaultUnit: "cup" },
  // Fruits
  { name: "Lemon",            category: "Fruits", defaultUnit: "piece" },
  { name: "Lime",             category: "Fruits", defaultUnit: "piece" },
  { name: "Avocado",          category: "Fruits", defaultUnit: "piece" },
  { name: "Banana",           category: "Fruits", defaultUnit: "piece" },
  // Grains & Starches
  { name: "White Rice",       category: "Grains & Starches", defaultUnit: "cup" },
  { name: "Brown Rice",       category: "Grains & Starches", defaultUnit: "cup" },
  { name: "Pasta",            category: "Grains & Starches", defaultUnit: "g" },
  { name: "Bread",            category: "Grains & Starches", defaultUnit: "slice" },
  { name: "Tortilla",         category: "Grains & Starches", defaultUnit: "piece" },
  { name: "Quinoa",           category: "Grains & Starches", defaultUnit: "cup" },
  { name: "Oats",             category: "Grains & Starches", defaultUnit: "cup" },
  { name: "Flour",            category: "Grains & Starches", defaultUnit: "cup" },
  // Dairy
  { name: "Butter",           category: "Dairy", defaultUnit: "tbsp" },
  { name: "Cheddar Cheese",   category: "Dairy", defaultUnit: "g" },
  { name: "Mozzarella",       category: "Dairy", defaultUnit: "g" },
  { name: "Parmesan",         category: "Dairy", defaultUnit: "g" },
  { name: "Heavy Cream",      category: "Dairy", defaultUnit: "cup" },
  { name: "Greek Yogurt",     category: "Dairy", defaultUnit: "cup" },
  { name: "Milk",             category: "Dairy", defaultUnit: "cup" },
  { name: "Sour Cream",       category: "Dairy", defaultUnit: "tbsp" },
  // Oils & Fats
  { name: "Olive Oil",        category: "Oils & Fats", defaultUnit: "tbsp" },
  { name: "Vegetable Oil",    category: "Oils & Fats", defaultUnit: "tbsp" },
  { name: "Coconut Oil",      category: "Oils & Fats", defaultUnit: "tbsp" },
  { name: "Sesame Oil",       category: "Oils & Fats", defaultUnit: "tsp" },
  // Herbs & Spices
  { name: "Salt",             category: "Herbs & Spices", defaultUnit: "to_taste" },
  { name: "Black Pepper",     category: "Herbs & Spices", defaultUnit: "to_taste" },
  { name: "Cumin",            category: "Herbs & Spices", defaultUnit: "tsp" },
  { name: "Paprika",          category: "Herbs & Spices", defaultUnit: "tsp" },
  { name: "Chili Powder",     category: "Herbs & Spices", defaultUnit: "tsp" },
  { name: "Oregano",          category: "Herbs & Spices", defaultUnit: "tsp" },
  { name: "Basil",            category: "Herbs & Spices", defaultUnit: "tsp" },
  { name: "Cilantro",         category: "Herbs & Spices", defaultUnit: "tbsp" },
  { name: "Ginger",           category: "Herbs & Spices", defaultUnit: "tsp" },
  { name: "Turmeric",         category: "Herbs & Spices", defaultUnit: "tsp" },
  { name: "Rosemary",         category: "Herbs & Spices", defaultUnit: "tsp" },
  { name: "Thyme",            category: "Herbs & Spices", defaultUnit: "tsp" },
  // Sauces & Condiments
  { name: "Soy Sauce",        category: "Sauces & Condiments", defaultUnit: "tbsp" },
  { name: "Hot Sauce",        category: "Sauces & Condiments", defaultUnit: "tsp" },
  { name: "Tomato Sauce",     category: "Sauces & Condiments", defaultUnit: "cup" },
  { name: "Honey",            category: "Sauces & Condiments", defaultUnit: "tbsp" },
  { name: "Vinegar",          category: "Sauces & Condiments", defaultUnit: "tbsp" },
  { name: "Mustard",          category: "Sauces & Condiments", defaultUnit: "tsp" },
  { name: "Ketchup",          category: "Sauces & Condiments", defaultUnit: "tbsp" },
  { name: "Worcestershire",   category: "Sauces & Condiments", defaultUnit: "tsp" },
  // Nuts & Seeds
  { name: "Almonds",          category: "Nuts & Seeds", defaultUnit: "g" },
  { name: "Walnuts",          category: "Nuts & Seeds", defaultUnit: "g" },
  { name: "Peanuts",          category: "Nuts & Seeds", defaultUnit: "g" },
  { name: "Sesame Seeds",     category: "Nuts & Seeds", defaultUnit: "tbsp" },
  { name: "Chia Seeds",       category: "Nuts & Seeds", defaultUnit: "tbsp" },
  // Other
  { name: "Black Beans",      category: "Other", defaultUnit: "cup" },
  { name: "Chickpeas",        category: "Other", defaultUnit: "cup" },
  { name: "Lentils",          category: "Other", defaultUnit: "cup" },
  { name: "Coconut Milk",     category: "Other", defaultUnit: "cup" },
  { name: "Chicken Broth",    category: "Other", defaultUnit: "cup" },
  { name: "Vegetable Broth",  category: "Other", defaultUnit: "cup" },
];

export interface MealTagSet {
  spiceLevel: SpiceLevel | null;
  cuisine:    Cuisine    | null;
  complexity: Complexity | null;
  goal:       Goal       | null;
  prepTime:   TimeLabel  | null;
  cookTime:   TimeLabel  | null;
  dietary:    Dietary[];
}

/* export interface MealMacros {
  calories: number | null;
  protein:  number | null;
  fat:      number | null;
  carbs:    number | null;
  sugar:    number | null;
  fiber:    number | null;
  sodium:   number | null;
} */

export type MealMacros = Record<MacroFilterKey, number | null>;

export interface TaggedMeal {
  id:          number;
  name:        string;
  tags:        MealTagSet;
  macros:      MealMacros;
  ingredients: Ingredient[];
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
    ingredients: [
      { id: "i1", name: "Chicken Breast", quantity: 200, unit: "g", note: "" },
      { id: "i2", name: "White Rice",     quantity: 1,   unit: "cup", note: "uncooked" },
      { id: "i3", name: "Olive Oil",      quantity: 1,   unit: "tbsp", note: "" },
      { id: "i4", name: "Garlic",         quantity: 2,   unit: "clove", note: "minced" },
      { id: "i5", name: "Salt",           quantity: null, unit: "to_taste", note: "" },
      { id: "i6", name: "Black Pepper",   quantity: null, unit: "to_taste", note: "" },
    ],
  },
  {
    id: 2, name: "Spicy Tofu Stir Fry",
    tags:   { spiceLevel: "hot",    cuisine: "asian",          complexity: "moderate", goal: "fat_loss",    prepTime: "medium", cookTime: "quick",  dietary: ["vegan", "gluten_free"] },
    macros: { calories: 320, protein: 18, fat: 12, carbs: 36, sugar: 8,  fiber: 5, sodium: 820 },
    ingredients: [
      { id: "i1", name: "Tofu",         quantity: 200, unit: "g", note: "extra firm, pressed" },
      { id: "i2", name: "Bell Pepper",  quantity: 1,   unit: "piece", note: "sliced" },
      { id: "i3", name: "Broccoli",     quantity: 1,   unit: "cup", note: "florets" },
      { id: "i4", name: "Soy Sauce",    quantity: 2,   unit: "tbsp", note: "" },
      { id: "i5", name: "Sesame Oil",   quantity: 1,   unit: "tsp", note: "" },
      { id: "i6", name: "Hot Sauce",    quantity: 1,   unit: "tsp", note: "" },
      { id: "i7", name: "Garlic",       quantity: 3,   unit: "clove", note: "minced" },
      { id: "i8", name: "Ginger",       quantity: 1,   unit: "tsp", note: "grated" },
    ],
  },
  {
    id: 3, name: "Pasta Bolognese",
    tags:   { spiceLevel: "mild",   cuisine: "italian",        complexity: "moderate", goal: "muscle_gain", prepTime: "medium", cookTime: "long",   dietary: [] },
    macros: { calories: 610, protein: 28, fat: 22, carbs: 70, sugar: 9,  fiber: 4, sodium: 740 },
    ingredients: [
      { id: "i1", name: "Pasta",         quantity: 200, unit: "g", note: "spaghetti or penne" },
      { id: "i2", name: "Ground Beef",   quantity: 150, unit: "g", note: "" },
      { id: "i3", name: "Tomato Sauce",  quantity: 1,   unit: "cup", note: "" },
      { id: "i4", name: "Onion",         quantity: 1,   unit: "piece", note: "diced" },
      { id: "i5", name: "Garlic",        quantity: 3,   unit: "clove", note: "minced" },
      { id: "i6", name: "Olive Oil",     quantity: 1,   unit: "tbsp", note: "" },
      { id: "i7", name: "Parmesan",      quantity: 20,  unit: "g", note: "grated" },
      { id: "i8", name: "Basil",         quantity: 1,   unit: "tsp", note: "dried" },
    ],
  },
  {
    id: 4, name: "Black Bean Tacos",
    tags:   { spiceLevel: "medium", cuisine: "mexican",        complexity: "simple",   goal: "maintenance", prepTime: "quick",  cookTime: "quick",  dietary: ["vegetarian", "gluten_free"] },
    macros: { calories: 390, protein: 16, fat: 11, carbs: 55, sugar: 5,  fiber: 12, sodium: 620 },
    ingredients: [
      { id: "i1", name: "Black Beans",  quantity: 1,   unit: "cup", note: "drained and rinsed" },
      { id: "i2", name: "Tortilla",     quantity: 3,   unit: "piece", note: "corn" },
      { id: "i3", name: "Avocado",      quantity: 0.5, unit: "piece", note: "sliced" },
      { id: "i4", name: "Lime",         quantity: 1,   unit: "piece", note: "juiced" },
      { id: "i5", name: "Cilantro",     quantity: 1,   unit: "tbsp", note: "chopped" },
      { id: "i6", name: "Cumin",        quantity: 1,   unit: "tsp", note: "" },
      { id: "i7", name: "Hot Sauce",    quantity: 1,   unit: "tsp", note: "" },
    ],
  },
  {
    id: 5, name: "Lamb Tagine",
    tags:   { spiceLevel: "medium", cuisine: "middle_eastern", complexity: "complex",  goal: "maintenance", prepTime: "long",   cookTime: "long",   dietary: ["gluten_free"] },
    macros: { calories: 550, protein: 34, fat: 24, carbs: 40, sugar: 11, fiber: 6, sodium: 680 },
    ingredients: [
      { id: "i1", name: "Steak",         quantity: 250, unit: "g", note: "lamb shoulder, cubed" },
      { id: "i2", name: "Onion",         quantity: 1,   unit: "piece", note: "diced" },
      { id: "i3", name: "Sweet Potato",  quantity: 1,   unit: "piece", note: "cubed" },
      { id: "i4", name: "Chickpeas",     quantity: 0.5, unit: "cup", note: "" },
      { id: "i5", name: "Cumin",         quantity: 2,   unit: "tsp", note: "" },
      { id: "i6", name: "Turmeric",      quantity: 1,   unit: "tsp", note: "" },
      { id: "i7", name: "Ginger",        quantity: 1,   unit: "tsp", note: "" },
      { id: "i8", name: "Honey",         quantity: 1,   unit: "tbsp", note: "" },
      { id: "i9", name: "Chicken Broth", quantity: 1,   unit: "cup", note: "" },
      { id: "i10", name: "Olive Oil",    quantity: 2,   unit: "tbsp", note: "" },
      { id: "i11", name: "Cilantro",     quantity: 1,   unit: "tbsp", note: "garnish" },
    ],
  },
];

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
