export type SharedMealSource = 'tagged' | 'restaurant';

export interface SharedMeal {
  shareId: string;
  sharedAt: number;
  source: SharedMealSource;
  name: string;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  sugar?: number | null;
  fiber?: number | null;
  sodium?: number | null;
  cuisine?: string | null;
  goal?: string | null;
  complexity?: string | null;
  spiceLevel?: string | null;
  dietary?: string[];
  restaurant?: string | null;
  category?: string | null;
  mealType?: string | null;
}

type Listener = (meals: SharedMeal[]) => void;

let _meals: SharedMeal[] = [];
const _listeners = new Set<Listener>();

function _notify() {
  _listeners.forEach((l) => l([..._meals]));
}

export function shareMeal(meal: Omit<SharedMeal, 'shareId' | 'sharedAt'>) {
  const entry: SharedMeal = {
    ...meal,
    shareId: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
    sharedAt: Date.now(),
  };
  _meals = [entry, ..._meals];
  _notify();
}

export function removeSharedMeal(shareId: string) {
  _meals = _meals.filter((m) => m.shareId !== shareId);
  _notify();
}

export function getSharedMeals(): SharedMeal[] {
  return [..._meals];
}

export function subscribeToSharedMeals(listener: Listener): () => void {
  _listeners.add(listener);
  listener([..._meals]);
  return () => _listeners.delete(listener);
}
