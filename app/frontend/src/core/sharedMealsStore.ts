import { api, MealPost, PublishMealPostRequest } from './api';

export type SharedMealSource = 'tagged' | 'restaurant';

export interface SharedMeal {
  shareId: string;
  postId?: number;
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
  username?: string;
}

function postToSharedMeal(p: MealPost): SharedMeal {
  return {
    shareId: String(p.post_id),
    postId: p.post_id,
    sharedAt: new Date(p.created_at).getTime(),
    source: p.source,
    name: p.name,
    calories: p.calories,
    protein: p.protein,
    carbs: p.carbs,
    fat: p.fat,
    sugar: p.sugar,
    fiber: p.fiber,
    sodium: p.sodium,
    cuisine: p.cuisine,
    goal: p.goal,
    complexity: p.complexity,
    spiceLevel: p.spice_level,
    dietary: p.dietary ?? [],
    restaurant: p.restaurant,
    category: p.category,
    mealType: p.meal_type,
    username: p.username,
  };
}

type Listener = (meals: SharedMeal[]) => void;
let _meals: SharedMeal[] = [];
const _listeners = new Set<Listener>();

function _notify() {
  const snapshot = [..._meals];
  _listeners.forEach((l) => l(snapshot));
}

export async function shareMeal(
  meal: Omit<SharedMeal, 'shareId' | 'sharedAt' | 'postId' | 'username'>
): Promise<void> {
  const payload: PublishMealPostRequest = {
    source: meal.source,
    name: meal.name,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    sugar: meal.sugar,
    fiber: meal.fiber,
    sodium: meal.sodium,
    cuisine: meal.cuisine,
    goal: meal.goal,
    complexity: meal.complexity,
    spice_level: meal.spiceLevel,
    dietary: meal.dietary,
    restaurant: meal.restaurant,
    category: meal.category,
    meal_type: meal.mealType,
  };
  const post = await api.publishMealPost(payload);
  _meals = [postToSharedMeal(post), ..._meals];
  _notify();
}

export async function removeSharedMeal(shareId: string): Promise<void> {
  const postId = Number(shareId);
  if (!isNaN(postId)) {
    await api.deleteMealPost(postId);
  }
  _meals = _meals.filter((m) => m.shareId !== shareId);
  _notify();
}

export async function refreshFeed(): Promise<void> {
  const posts = await api.getFeed();
  _meals = posts.map(postToSharedMeal);
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
