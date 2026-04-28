import type { MacroRange, BrowseFilterState, TrackerState, GoalDirection } from '../app/diet/dietTypes';
import type { MacroFilterKey, MealMacros } from '@/app/diet/mealTypes';

/* ----------------- constants -----------------*/
export const C = {
  bg:      "#ffffffff",
  surface: "#ffffffff",
  border:  "#ccccccff",
  orange:  "#165ef9ff",
  amber:   "#2452fbff",
  gold:    "#0b46f5ff",
  muted:   "#686868ff",
  dimmer:  "#474747ff",
  text:    "#2e2e2eff",
};

export const EMPTY_RANGE: MacroRange = { min: null, max: null };

export const EMPTY_BROWSE_FILTER: BrowseFilterState = {
  spiceLevel: null,
  cuisine: null,
  complexity: null,
  goal: null,
  prepTime: null,
  cookTime: null,
  dietary: [],
  calories: { ...EMPTY_RANGE },
  protein: { ...EMPTY_RANGE },
  fat: { ...EMPTY_RANGE },
  carbs: { ...EMPTY_RANGE },
  sugar: { ...EMPTY_RANGE },
  fiber: { ...EMPTY_RANGE },
  sodium: { ...EMPTY_RANGE },
};

export const MACRO_FILTER_FIELDS: { key: MacroFilterKey; label: string; unit: string }[] = [
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'carbs', label: 'Carbs', unit: 'g' },
  { key: 'fat', label: 'Fat', unit: 'g' },
  { key: 'sugar', label: 'Sugar', unit: 'g' },
  { key: 'fiber', label: 'Fiber', unit: 'g' },
  { key: 'sodium', label: 'Sodium', unit: 'mg' },
];

export const MACRO_DISPLAY: { key: MacroFilterKey; label: string; unit: string; color: string }[] = [
  { key: 'calories', label: 'Cal', unit: 'kcal', color: C?.orange ?? '#f97316' },
  { key: 'protein', label: 'Protein', unit: 'g', color: '#60a5fa' },
  { key: 'carbs', label: 'Carbs', unit: 'g', color: '#a78bfa' },
  { key: 'fat', label: 'Fat', unit: 'g', color: '#fbbf24' },
  { key: 'sugar', label: 'Sugar', unit: 'g', color: '#f472b6' },
  { key: 'fiber', label: 'Fiber', unit: 'g', color: '#34d399' },
  { key: 'sodium', label: 'Sodium', unit: 'mg', color: '#94a3b8' },
];

export const MACRO_FIELDS: { key: keyof MealMacros; label: string; unit: string; placeholder: string; max: number }[] = [
  { key: 'calories', label: 'Calories', unit: 'kcal', placeholder: 'e.g. 450', max: 5000 },
  { key: 'protein', label: 'Protein', unit: 'g', placeholder: 'e.g. 35', max: 300 },
  { key: 'carbs', label: 'Carbs', unit: 'g', placeholder: 'e.g. 55', max: 500 },
  { key: 'fat', label: 'Fat', unit: 'g', placeholder: 'e.g. 14', max: 200 },
  { key: 'sugar', label: 'Sugar', unit: 'g', placeholder: 'e.g. 8', max: 200 },
  { key: 'fiber', label: 'Fiber', unit: 'g', placeholder: 'e.g. 6', max: 100 },
  { key: 'sodium', label: 'Sodium', unit: 'mg', placeholder: 'e.g. 620', max: 5000 },
];

export const FORGE = {
  orange: '#0a49e8ff',
  orangeGlow: '#2f66d3ff',
  red: '#C94040',
  steel: '#414140ff',
  charcoal: '#ffffffff',
  cardBg: '#fffdfbff',
  cardBorder: '#333230',
  trackEmpty: '#e3e3e3ff',
  trackMet: '#2871d7ff',
  textPrimary: '#020202ff',
  dim: '#a3a19fff',
} as const;

export const ALL_TRACKERS: Omit<TrackerState, 'value'>[] = [
  { id: 'calories', name: 'Calories', unit: 'kcal', goal: 2000, direction: 'under' },
  { id: 'protein', name: 'Protein', unit: 'g', goal: 150, direction: 'over' },
  { id: 'carbs', name: 'Carbs', unit: 'g', goal: 250, direction: 'under' },
  { id: 'fat', name: 'Fat', unit: 'g', goal: 65, direction: 'under' },
  { id: 'sugar', name: 'Sugar', unit: 'g', goal: 50, direction: 'under' },
  { id: 'sodium', name: 'Sodium', unit: 'mg', goal: 2300, direction: 'under' },
  { id: 'fiber', name: 'Fiber', unit: 'g', goal: 28, direction: 'over' },
  { id: 'water', name: 'Water', unit: 'cups', goal: 8, direction: 'over' },
];

export const DEFAULT_SLOTS = ['calories', 'protein', 'carbs', 'water'];

/* ----------------- helpers ----------------- */
export const colorWithAlpha = (hex: string, alpha = '22') => `${hex}${alpha}`;
export const formatLabel = (value: string) => value.replace(/_/g, ' ');

export function isGoalMet(t: TrackerState): boolean | null {
  if (t.goal === null || t.value === 0) return null;
  return t.direction === 'under' ? t.value <= t.goal : t.value >= t.goal;
}

export function progressPct(t: TrackerState): number {
  if (t.goal === null || t.goal <= 0) return 0;
  return Math.min(t.value / t.goal, 1);
}

export function statusText(t: TrackerState): string {
  const met = isGoalMet(t);
  if (met === null || t.goal === null) return '';
  const diff = Math.abs(t.goal - t.value);
  if (met) return t.direction === 'under' ? `${Math.round(diff)}${t.unit} left` : 'goal met';
  return t.direction === 'under'
    ? `${Math.round(diff)}${t.unit} over`
    : `${Math.round(diff)}${t.unit} to go`;
}
export function logAmount(trackers: TrackerState[], id: string, amount: number): TrackerState[] {
  return trackers.map((t) =>
    t.id === id ? { ...t, value: Math.max(0, t.value + amount) } : t
  );
}

export function setGoalValue(
  trackers: TrackerState[],
  id: string,
  goal: number | null,
  direction?: GoalDirection
): TrackerState[] {
  return trackers.map((t) =>
    t.id === id
      ? { ...t, goal, value: goal === null ? 0 : t.value, ...(direction ? { direction } : {}) }
      : t
  );
}

let _ingredientCounter = 0;
export function nextIngredientId(): string {
  return `ing_${Date.now()}_${++_ingredientCounter}`;
}


/** Map MealMacros fields to tracker IDs and log each non-null value */
export const MACRO_TO_TRACKER: { macroKey: keyof MealMacros; trackerId: string }[] = [
  { macroKey: 'calories', trackerId: 'calories' },
  { macroKey: 'protein', trackerId: 'protein' },
  { macroKey: 'carbs', trackerId: 'carbs' },
  { macroKey: 'fat', trackerId: 'fat' },
  { macroKey: 'sugar', trackerId: 'sugar' },
  { macroKey: 'fiber', trackerId: 'fiber' },
  { macroKey: 'sodium', trackerId: 'sodium' },
];

export function logMealMacrosToTrackers(trackers: TrackerState[], m: MealMacros): TrackerState[] {
  let next = trackers;
  for (const { macroKey, trackerId } of MACRO_TO_TRACKER) {
    const val = m[macroKey];
    if (val != null && val > 0) {
      next = logAmount(next, trackerId, val);
    }
  }
  return next;
}
