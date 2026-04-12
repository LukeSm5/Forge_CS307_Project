import { MealTagSet, Dietary } from "./mealTypes";

export type MacroRange = { min: number | null; max: number | null };

export type BrowseFilterState = Partial<Omit<MealTagSet, 'dietary'>> & {
  dietary: Dietary[];
  calories: MacroRange;
  protein: MacroRange;
  fat: MacroRange;
  carbs: MacroRange;
  sugar: MacroRange;
  fiber: MacroRange;
  sodium: MacroRange;
};

export type MacroFilterKey = 'calories' | 'protein' | 'fat' | 'carbs' | 'sugar' | 'fiber' | 'sodium';

export type RestaurantMeal = {
  id: number;
  restaurant: string;
  category: string;
  product: string;
  serving_size?: number;
  energy_kcal?: number;
  carbohydrates_g?: number;
  protein_g?: number;
  fiber_g?: number;
  sugar_g?: number;
  total_fat_g?: number;
  saturated_fat_g?: number;
  trans_fat_g?: number;
  cholesterol_mg?: number;
  sodium_mg?: number;
  chicken?: boolean;
  beef?: boolean;
};

export type MealTypeOption = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type LoggedMenuMeal = {
  session_id: number;
  profile_id: number;
  menu_meal_id: number;
  date: string;
  meal_type: string;
  restaurant: string;
  category?: string | null;
  product: string;
  serving_size?: number | null;
  energy_kcal?: number | null;
  carbohydrates_g?: number | null;
  protein_g?: number | null;
  total_fat_g?: number | null;
  saturated_fat_g?: number | null;
  trans_fat_g?: number | null;
  sodium_mg?: number | null;
  sugar_g?: number | null;
  fiber_g?: number | null;
  cholesterol_mg?: number | null;
};

export type ProteinFilter = 'chicken' | 'beef' | null;

export type TagTab = 'tags' | 'ingredients';

/* ─────────────────── macro tracker types ─────────────────── */
export type GoalDirection = 'under' | 'over';
export type OverlayMode = 'log' | 'remove' | 'set-goal';

export interface TrackerState {
  id: string;
  name: string;
  unit: string;
  goal: number | null;
  direction: GoalDirection;
  value: number;
}
