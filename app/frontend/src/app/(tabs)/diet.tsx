import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  Modal,
  Platform,
} from 'react-native';

import { useAuth } from '@/core/auth';

import ForgeButton from '@/components/ForgeButton';
import { Text, View } from '@/components/Themed';
import {
  TaggedMeal,
  MealTagSet,
  MealMacros,
  Ingredient,
  IngredientUnit,
  Dietary,
  SpiceLevel,
  Cuisine,
  Complexity,
  Goal,
  TimeLabel,
  SPICE_LEVELS,
  CUISINES,
  COMPLEXITIES,
  GOALS,
  TIME_LABELS,
  DIETARY_OPTS,
  SPICE_COLOR,
  SPICE_ICON,
  GOAL_COLOR,
  GOAL_ICON,
  COMPLEXITY_COLOR,
  TIME_COLOR,
  TIME_ICON,
  INGREDIENT_UNITS,
  COMMON_INGREDIENTS,
  INGREDIENT_CATEGORIES,
  EMPTY_TAGS,
  EMPTY_MACROS,
  C,
} from '../mealTypes';

import { api } from '../../core/api';

/* ─────────────────── types ─────────────────── */

type MacroRange = { min: number | null; max: number | null };

type BrowseFilterState = Partial<Omit<MealTagSet, 'dietary'>> & {
  dietary: Dietary[];
  calories: MacroRange;
  protein: MacroRange;
  fat: MacroRange;
  carbs: MacroRange;
  sugar: MacroRange;
  fiber: MacroRange;
  sodium: MacroRange;
};

type MacroFilterKey = 'calories' | 'protein' | 'fat' | 'carbs' | 'sugar' | 'fiber' | 'sodium';

type RestaurantMeal = {
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

type MealTypeOption = 'breakfast' | 'lunch' | 'dinner' | 'snack';

type LoggedMenuMeal = {
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

type ProteinFilter = 'chicken' | 'beef' | null;

type TagTab = 'tags' | 'ingredients';

/* ─────── macro tracker types ─────── */

type GoalDirection = 'under' | 'over';
type OverlayMode = 'log' | 'remove' | 'set-goal';

interface TrackerState {
  id: string;
  name: string;
  unit: string;
  goal: number | null;
  direction: GoalDirection;
  value: number;
}

const ALL_TRACKERS: Omit<TrackerState, 'value'>[] = [
  { id: 'calories', name: 'Calories', unit: 'kcal', goal: 2000, direction: 'under' },
  { id: 'protein', name: 'Protein', unit: 'g', goal: 150, direction: 'over' },
  { id: 'carbs', name: 'Carbs', unit: 'g', goal: 250, direction: 'under' },
  { id: 'fat', name: 'Fat', unit: 'g', goal: 65, direction: 'under' },
  { id: 'sugar', name: 'Sugar', unit: 'g', goal: 50, direction: 'under' },
  { id: 'sodium', name: 'Sodium', unit: 'mg', goal: 2300, direction: 'under' },
  { id: 'fiber', name: 'Fiber', unit: 'g', goal: 28, direction: 'over' },
  { id: 'water', name: 'Water', unit: 'cups', goal: 8, direction: 'over' },
];

const DEFAULT_SLOTS = ['calories', 'protein', 'carbs', 'water'];

/* ─────────────────── constants ─────────────────── */

const EMPTY_RANGE: MacroRange = { min: null, max: null };

const EMPTY_BROWSE_FILTER: BrowseFilterState = {
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

const MACRO_FILTER_FIELDS: { key: MacroFilterKey; label: string; unit: string }[] = [
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'carbs', label: 'Carbs', unit: 'g' },
  { key: 'fat', label: 'Fat', unit: 'g' },
  { key: 'sugar', label: 'Sugar', unit: 'g' },
  { key: 'fiber', label: 'Fiber', unit: 'g' },
  { key: 'sodium', label: 'Sodium', unit: 'mg' },
];

const MACRO_DISPLAY: { key: MacroFilterKey; label: string; unit: string; color: string }[] = [
  { key: 'calories', label: 'Cal', unit: 'kcal', color: C?.orange ?? '#f97316' },
  { key: 'protein', label: 'Protein', unit: 'g', color: '#60a5fa' },
  { key: 'carbs', label: 'Carbs', unit: 'g', color: '#a78bfa' },
  { key: 'fat', label: 'Fat', unit: 'g', color: '#fbbf24' },
  { key: 'sugar', label: 'Sugar', unit: 'g', color: '#f472b6' },
  { key: 'fiber', label: 'Fiber', unit: 'g', color: '#34d399' },
  { key: 'sodium', label: 'Sodium', unit: 'mg', color: '#94a3b8' },
];

const MACRO_FIELDS: { key: keyof MealMacros; label: string; unit: string; placeholder: string; max: number }[] = [
  { key: 'calories', label: 'Calories', unit: 'kcal', placeholder: 'e.g. 450', max: 5000 },
  { key: 'protein', label: 'Protein', unit: 'g', placeholder: 'e.g. 35', max: 300 },
  { key: 'carbs', label: 'Carbs', unit: 'g', placeholder: 'e.g. 55', max: 500 },
  { key: 'fat', label: 'Fat', unit: 'g', placeholder: 'e.g. 14', max: 200 },
  { key: 'sugar', label: 'Sugar', unit: 'g', placeholder: 'e.g. 8', max: 200 },
  { key: 'fiber', label: 'Fiber', unit: 'g', placeholder: 'e.g. 6', max: 100 },
  { key: 'sodium', label: 'Sodium', unit: 'mg', placeholder: 'e.g. 620', max: 5000 },
];

const FORGE = {
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

let _ingredientCounter = 0;
function nextIngredientId(): string {
  return `ing_${Date.now()}_${++_ingredientCounter}`;
}

/* ─────────────────── helpers ─────────────────── */

const colorWithAlpha = (hex: string, alpha = '22') => `${hex}${alpha}`;
const formatLabel = (value: string) => value.replace(/_/g, ' ');

function isGoalMet(t: TrackerState): boolean | null {
  if (t.goal === null || t.value === 0) return null;
  return t.direction === 'under' ? t.value <= t.goal : t.value >= t.goal;
}

function progressPct(t: TrackerState): number {
  if (t.goal === null || t.goal <= 0) return 0;
  return Math.min(t.value / t.goal, 1);
}

function statusText(t: TrackerState): string {
  const met = isGoalMet(t);
  if (met === null || t.goal === null) return '';
  const diff = Math.abs(t.goal - t.value);
  if (met) return t.direction === 'under' ? `${Math.round(diff)}${t.unit} left` : 'goal met';
  return t.direction === 'under'
    ? `${Math.round(diff)}${t.unit} over`
    : `${Math.round(diff)}${t.unit} to go`;
}

function logAmount(trackers: TrackerState[], id: string, amount: number): TrackerState[] {
  return trackers.map((t) =>
    t.id === id ? { ...t, value: Math.max(0, t.value + amount) } : t
  );
}

function setGoalValue(
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

/** Map MealMacros fields to tracker IDs and log each non-null value */
const MACRO_TO_TRACKER: { macroKey: keyof MealMacros; trackerId: string }[] = [
  { macroKey: 'calories', trackerId: 'calories' },
  { macroKey: 'protein', trackerId: 'protein' },
  { macroKey: 'carbs', trackerId: 'carbs' },
  { macroKey: 'fat', trackerId: 'fat' },
  { macroKey: 'sugar', trackerId: 'sugar' },
  { macroKey: 'fiber', trackerId: 'fiber' },
  { macroKey: 'sodium', trackerId: 'sodium' },
];

function logMealMacrosToTrackers(trackers: TrackerState[], m: MealMacros): TrackerState[] {
  let next = trackers;
  for (const { macroKey, trackerId } of MACRO_TO_TRACKER) {
    const val = m[macroKey];
    if (val != null && val > 0) {
      next = logAmount(next, trackerId, val);
    }
  }
  return next;
}

/** Build a partial MealMacros from a restaurant RestaurantMeal / LoggedMenuMeal row */
function restaurantMealToMacros(meal: {
  energy_kcal?: number | null;
  protein_g?: number | null;
  carbohydrates_g?: number | null;
  total_fat_g?: number | null;
  sugar_g?: number | null;
  fiber_g?: number | null;
  sodium_mg?: number | null;
}): MealMacros {
  return {
    calories: meal.energy_kcal ?? 0,
    protein: meal.protein_g ?? 0,
    carbs: meal.carbohydrates_g ?? 0,
    fat: meal.total_fat_g ?? 0,
    sugar: meal.sugar_g ?? 0,
    fiber: meal.fiber_g ?? 0,
    sodium: meal.sodium_mg ?? 0,
  };
}

/* ─────────────────── shared components ─────────────────── */

function Pill({
  label,
  active,
  color,
  icon,
  onPress,
}: {
  label: string;
  active: boolean;
  color: string;
  icon?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        {
          borderColor: active ? color : '#d4d8e1',
          backgroundColor: active ? colorWithAlpha(color, '24') : '#ffffff',
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text style={[styles.pillText, { color: active ? color : '#2e2f30' }]}>
        {icon ? `${icon} ${formatLabel(label)}` : formatLabel(label)}
      </Text>
    </Pressable>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionEyebrow}>{title}</Text>
      {children}
    </View>
  );
}

function CollapsibleSection({
  title,
  open,
  onToggle,
  badge,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.collapsible}>
      <Pressable onPress={onToggle} style={styles.collapsibleHeader}>
        <Text style={styles.collapsibleTitle}>{title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {badge ? <Text style={styles.collapsibleBadge}>{badge}</Text> : null}
          <Text style={styles.collapsibleArrow}>{open ? '▲' : '▼'}</Text>
        </View>
      </Pressable>
      {open && <View style={styles.collapsibleBody}>{children}</View>}
    </View>
  );
}

function MealMetaChips({ tags }: { tags: MealTagSet }) {
  return (
    <View style={styles.chipGroup}>
      {tags.spiceLevel ? (
        <View style={[styles.chip, { backgroundColor: colorWithAlpha(SPICE_COLOR[tags.spiceLevel], '22') }]}>
          <Text style={[styles.chipText, { color: SPICE_COLOR[tags.spiceLevel] }]}>
            {SPICE_ICON[tags.spiceLevel]} {formatLabel(tags.spiceLevel)}
          </Text>
        </View>
      ) : null}

      {tags.goal ? (
        <View style={[styles.chip, { backgroundColor: colorWithAlpha(GOAL_COLOR[tags.goal], '22') }]}>
          <Text style={[styles.chipText, { color: GOAL_COLOR[tags.goal] }]}>
            {GOAL_ICON[tags.goal]} {formatLabel(tags.goal)}
          </Text>
        </View>
      ) : null}

      {tags.complexity ? (
        <View style={[styles.chip, { backgroundColor: colorWithAlpha(COMPLEXITY_COLOR[tags.complexity], '22') }]}>
          <Text style={[styles.chipText, { color: COMPLEXITY_COLOR[tags.complexity] }]}>
            {formatLabel(tags.complexity)}
          </Text>
        </View>
      ) : null}

      {tags.cuisine ? (
        <View style={[styles.chip, { backgroundColor: '#20242c' }]}>
          <Text style={[styles.chipText, { color: '#d1d5db' }]}>{formatLabel(tags.cuisine)}</Text>
        </View>
      ) : null}

      {tags.prepTime ? (
        <View style={[styles.chip, { backgroundColor: colorWithAlpha(TIME_COLOR[tags.prepTime], '20') }]}>
          <Text style={[styles.chipText, { color: TIME_COLOR[tags.prepTime] }]}>
            {TIME_ICON[tags.prepTime]} prep: {formatLabel(tags.prepTime)}
          </Text>
        </View>
      ) : null}

      {tags.cookTime ? (
        <View style={[styles.chip, { backgroundColor: colorWithAlpha(TIME_COLOR[tags.cookTime], '20') }]}>
          <Text style={[styles.chipText, { color: TIME_COLOR[tags.cookTime] }]}>
            {TIME_ICON[tags.cookTime]} cook: {formatLabel(tags.cookTime)}
          </Text>
        </View>
      ) : null}

      {tags.dietary.map((d) => (
        <View key={d} style={[styles.chip, { backgroundColor: '#1d2330' }]}>
          <Text style={[styles.chipText, { color: '#f5c56b' }]}>{formatLabel(d)}</Text>
        </View>
      ))}
    </View>
  );
}

function MacroBadge({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <View style={[styles.macroBadge, { backgroundColor: colorWithAlpha(color, '14') }]}>
      <Text style={[styles.macroBadgeValue, { color }]}>
        {value % 1 === 0 ? value : value.toFixed(1)}
      </Text>
      <Text style={styles.macroBadgeLabel}>{label}</Text>
      <Text style={styles.macroBadgeUnit}>{unit}</Text>
    </View>
  );
}

function FilterSection({
  title,
  values,
  activeValue,
  onPress,
  colorFor,
  iconFor,
}: {
  title: string;
  values: string[];
  activeValue: string | null | undefined;
  onPress: (value: string) => void;
  colorFor: (value: string) => string;
  iconFor?: (value: string) => string;
}) {
  return (
    <View style={styles.filterBlock}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <View style={styles.pillWrap}>
        {values.map((value) => (
          <Pill
            key={value}
            label={value}
            active={activeValue === value}
            color={colorFor(value)}
            icon={iconFor ? iconFor(value) : undefined}
            onPress={() => onPress(value)}
          />
        ))}
      </View>
    </View>
  );
}

/* ─────── Browse Meal Card (enhanced) ─────── */

function BrowseMealCard({
  meal,
  onEdit,
  onDelete,
  expanded,
  onToggle,
}: {
  meal: TaggedMeal;
  onEdit: (meal: TaggedMeal) => void;
  onDelete: (id: number) => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  const t = meal.tags;
  const m = meal.macros;
  const hasMacros = m && MACRO_DISPLAY.some(({ key }) => m[key] !== null && m[key] !== undefined);
  const hasIngredients = meal.ingredients && meal.ingredients.length > 0;

  return (
    <View style={[styles.mealCard, expanded && { borderColor: C?.orange ?? '#f97316' }]}>
      <Pressable onPress={onToggle} style={styles.mealCardHeader}>
        <Text style={styles.mealCardTitle}>
          {meal.name} {expanded ? '▲' : '▼'}
        </Text>
      </Pressable>

      {/* Top-level chips always visible */}
      <View style={styles.chipGroup}>
        {t.spiceLevel ? (
          <View style={[styles.chip, { backgroundColor: colorWithAlpha(SPICE_COLOR[t.spiceLevel], '22') }]}>
            <Text style={[styles.chipText, { color: SPICE_COLOR[t.spiceLevel] }]}>
              {SPICE_ICON[t.spiceLevel]} {formatLabel(t.spiceLevel)}
            </Text>
          </View>
        ) : null}
        {t.goal ? (
          <View style={[styles.chip, { backgroundColor: colorWithAlpha(GOAL_COLOR[t.goal], '22') }]}>
            <Text style={[styles.chipText, { color: GOAL_COLOR[t.goal] }]}>
              {GOAL_ICON[t.goal]} {formatLabel(t.goal)}
            </Text>
          </View>
        ) : null}
        {t.complexity ? (
          <View style={[styles.chip, { backgroundColor: colorWithAlpha(COMPLEXITY_COLOR[t.complexity], '22') }]}>
            <Text style={[styles.chipText, { color: COMPLEXITY_COLOR[t.complexity] }]}>
              {formatLabel(t.complexity)}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Collapsed summary */}
      {!expanded && (
        <>
          <View style={styles.chipGroup}>
            {t.cuisine ? (
              <View style={[styles.chip, { backgroundColor: C?.border ?? '#e2e8f0' }]}>
                <Text style={[styles.chipText, { color: C?.muted ?? '#6b7280' }]}>{formatLabel(t.cuisine)}</Text>
              </View>
            ) : null}
            {t.prepTime ? (
              <View style={[styles.chip, { backgroundColor: colorWithAlpha(TIME_COLOR[t.prepTime], '18') }]}>
                <Text style={[styles.chipText, { color: TIME_COLOR[t.prepTime] }]}>
                  {TIME_ICON[t.prepTime]} prep: {formatLabel(t.prepTime)}
                </Text>
              </View>
            ) : null}
            {t.cookTime ? (
              <View style={[styles.chip, { backgroundColor: colorWithAlpha(TIME_COLOR[t.cookTime], '18') }]}>
                <Text style={[styles.chipText, { color: TIME_COLOR[t.cookTime] }]}>
                  {TIME_ICON[t.cookTime]} cook: {formatLabel(t.cookTime)}
                </Text>
              </View>
            ) : null}
            {hasIngredients ? (
              <View style={[styles.chip, { backgroundColor: colorWithAlpha(C?.orange ?? '#f97316', '18') }]}>
                <Text style={[styles.chipText, { color: C?.orange ?? '#f97316' }]}>
                  🥘 {meal.ingredients!.length} ingredient{meal.ingredients!.length !== 1 ? 's' : ''}
                </Text>
              </View>
            ) : null}
          </View>

          {t.dietary.length > 0 && (
            <View style={[styles.chipGroup, { borderTopWidth: 1, borderTopColor: C?.border ?? '#e2e8f0', paddingTop: 8 }]}>
              {t.dietary.map((d) => (
                <View key={d} style={[styles.chip, { backgroundColor: '#1d2330' }]}>
                  <Text style={[styles.chipText, { color: C?.muted ?? '#6b7280' }]}>{formatLabel(d)}</Text>
                </View>
              ))}
            </View>
          )}

          {hasMacros && (
            <View style={{ borderTopWidth: 1, borderTopColor: C?.border ?? '#e2e8f0', paddingTop: 8, gap: 6 }}>
              <Text style={styles.browseSubheading}>Macros · per serving</Text>
              <View style={styles.chipGroup}>
                {MACRO_DISPLAY.map(({ key, label, unit, color }) => {
                  const val = m![key];
                  if (val === null || val === undefined) return null;
                  return <MacroBadge key={key} label={label} value={val} unit={unit} color={color} />;
                })}
              </View>
            </View>
          )}
        </>
      )}

      {/* Expanded detail */}
      {expanded && (
        <View style={{ borderTopWidth: 1, borderTopColor: colorWithAlpha(C?.orange ?? '#f97316', '30'), paddingTop: 12, gap: 14 }}>
          <View style={{ gap: 8 }}>
            <Text style={styles.browseExpandHeading}>Tags</Text>
            <View style={styles.chipGroup}>
              {t.cuisine ? (
                <View style={[styles.chip, { backgroundColor: C?.border ?? '#e2e8f0' }]}>
                  <Text style={[styles.chipText, { color: C?.muted ?? '#6b7280' }]}>{formatLabel(t.cuisine)}</Text>
                </View>
              ) : null}
              {t.prepTime ? (
                <View style={[styles.chip, { backgroundColor: colorWithAlpha(TIME_COLOR[t.prepTime], '18') }]}>
                  <Text style={[styles.chipText, { color: TIME_COLOR[t.prepTime] }]}>
                    {TIME_ICON[t.prepTime]} prep: {formatLabel(t.prepTime)}
                  </Text>
                </View>
              ) : null}
              {t.cookTime ? (
                <View style={[styles.chip, { backgroundColor: colorWithAlpha(TIME_COLOR[t.cookTime], '18') }]}>
                  <Text style={[styles.chipText, { color: TIME_COLOR[t.cookTime] }]}>
                    {TIME_ICON[t.cookTime]} cook: {formatLabel(t.cookTime)}
                  </Text>
                </View>
              ) : null}
            </View>
            {t.dietary.length > 0 && (
              <View style={[styles.chipGroup, { marginTop: 4 }]}>
                {t.dietary.map((d) => (
                  <View key={d} style={[styles.chip, { backgroundColor: '#1d2330' }]}>
                    <Text style={[styles.chipText, { color: C?.muted ?? '#6b7280' }]}>{formatLabel(d)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {hasMacros && (
            <View style={{ gap: 8 }}>
              <Text style={styles.browseExpandHeading}>Macros · per serving</Text>
              <View style={styles.chipGroup}>
                {MACRO_DISPLAY.map(({ key, label, unit, color }) => {
                  const val = m![key];
                  if (val === null || val === undefined) return null;
                  return <MacroBadge key={key} label={label} value={val} unit={unit} color={color} />;
                })}
              </View>
            </View>
          )}

          <View style={{ gap: 8 }}>
            <Text style={styles.browseExpandHeading}>
              Ingredients {hasIngredients ? `(${meal.ingredients!.length})` : ''}
            </Text>
            {hasIngredients ? (
              <View style={{ backgroundColor: colorWithAlpha(C?.border ?? '#e2e8f0', '20'), borderRadius: 6, padding: 10, gap: 4 }}>
                {meal.ingredients!.map((ing) => {
                  const unitLabel = INGREDIENT_UNITS.find((u) => u.value === ing.unit)?.label ?? ing.unit;
                  const showQty = ing.unit !== 'to_taste' && ing.quantity !== null;
                  return (
                    <View key={ing.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: colorWithAlpha(C?.border ?? '#e2e8f0', '40') }}>
                      <Text style={{ color: C?.orange ?? '#f97316', fontSize: 11, fontWeight: '700', minWidth: 60, textAlign: 'right' }}>
                        {showQty
                          ? `${ing.quantity! % 1 === 0 ? ing.quantity : ing.quantity!.toFixed(2)} ${unitLabel}`
                          : unitLabel}
                      </Text>
                      <Text style={{ color: C?.text ?? '#000000', fontSize: 13, fontWeight: '600', flex: 1 }}>
                        {ing.name}
                      </Text>
                      {ing.note ? (
                        <Text style={{ color: C?.muted ?? '#6b7280', fontSize: 10, fontStyle: 'italic' }}>{ing.note}</Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={[styles.emptyText, { fontStyle: 'italic' }]}>
                No ingredients listed. Edit this meal to add some.
              </Text>
            )}
          </View>
        </View>
      )}

      <View style={styles.rowGap}>
        <View style={styles.flex1}>
          <ForgeButton onPress={() => onEdit(meal)} text={'Edit Meal'} />
        </View>
        <View style={styles.flex1}>
          <ForgeButton onPress={() => onDelete(meal.id)} text={'Delete Meal'} />
        </View>
      </View>
    </View>
  );
}

/* ─────── Macro Range Filter Row ─────── */

function MacroRangeFilterRow({
  filterKey,
  label,
  unit,
  range,
  isOpen,
  isActive,
  onToggleOpen,
  onChangeMin,
  onChangeMax,
}: {
  filterKey: string;
  label: string;
  unit: string;
  range: MacroRange;
  isOpen: boolean;
  isActive: boolean;
  onToggleOpen: () => void;
  onChangeMin: (val: string) => void;
  onChangeMax: (val: string) => void;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Pressable onPress={onToggleOpen} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}>
        <Text style={[styles.filterToggleLabel, isActive && { color: C?.orange ?? '#f97316' }]}>
          {label}
        </Text>
        {isActive && (
          <Text style={{ color: C?.amber ?? '#f5c56b', fontSize: 9 }}>
            · {range.min ?? '…'}–{range.max ?? '…'} {unit}
          </Text>
        )}
        <Text style={{ fontSize: 8, color: C?.muted ?? '#6b7280' }}>{isOpen ? '▴' : '▾'}</Text>
      </Pressable>
      {isOpen && (
        <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.miniLabel}>Min</Text>
            <TextInput
              keyboardType="numeric"
              value={range.min != null ? String(range.min) : ''}
              onChangeText={onChangeMin}
              placeholder="—"
              placeholderTextColor="#6b7280"
              style={styles.rangeInput}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.miniLabel}>Max</Text>
            <TextInput
              keyboardType="numeric"
              value={range.max != null ? String(range.max) : ''}
              onChangeText={onChangeMax}
              placeholder="—"
              placeholderTextColor="#6b7280"
              style={styles.rangeInput}
            />
          </View>
        </View>
      )}
    </View>
  );
}

/* ─────── Ingredient Row (tag screen) ─────── */

function IngredientRowView({
  ingredient,
  onUpdate,
  onRemove,
}: {
  ingredient: Ingredient;
  onUpdate: (updated: Ingredient) => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.ingredientRow}>
      <View style={{ flex: 2, minWidth: 0 }}>
        <Text style={styles.ingredientFieldLabel}>Ingredient</Text>
        <Text style={{ color: C?.text ?? '#000000', fontSize: 14, fontWeight: '700' }} numberOfLines={1}>{ingredient.name}</Text>
      </View>
      <View style={{ width: 70 }}>
        <Text style={styles.ingredientFieldLabel}>Qty</Text>
        <TextInput
          keyboardType="numeric"
          value={ingredient.quantity != null ? String(ingredient.quantity) : ''}
          onChangeText={(val) => {
            const parsed = val === '' ? null : parseFloat(val);
            onUpdate({ ...ingredient, quantity: parsed === null || isNaN(parsed) ? null : parsed });
          }}
          placeholder="—"
          placeholderTextColor="#6b7280"
          style={[styles.rangeInput, { paddingVertical: 5, paddingHorizontal: 7, fontSize: 13 }]}
        />
      </View>
      <View style={{ flex: 1, minWidth: 80 }}>
        <Text style={styles.ingredientFieldLabel}>Note</Text>
        <TextInput
          value={ingredient.note}
          onChangeText={(val) => onUpdate({ ...ingredient, note: val })}
          placeholder="optional"
          placeholderTextColor="#6b7280"
          style={[styles.rangeInput, { paddingVertical: 5, paddingHorizontal: 7, fontSize: 12 }]}
        />
      </View>
      <Pressable onPress={onRemove} style={styles.ingredientRemoveBtn}>
        <Text style={{ color: '#fca5a5', fontSize: 12 }}>✕</Text>
      </Pressable>
    </View>
  );
}

/* ─────── Macro Tracker Ring ─────── */

function TrackerRing({
  tracker: t,
  onLog,
  onSetGoal,
  onDirectionChange,
  onSwapClick,
}: {
  tracker: TrackerState;
  onLog: (id: string, amount: number) => void;
  onSetGoal: (id: string, goal: number | null) => void;
  onDirectionChange: (id: string, dir: GoalDirection) => void;
  onSwapClick: () => void;
}) {
  const [overlayMode, setOverlayMode] = useState<OverlayMode | null>(null);
  const [inputVal, setInputVal] = useState('');

  const hasGoal = t.goal !== null;
  const met = isGoalMet(t);
  const pct = progressPct(t);
  const ringColor = met === null ? FORGE.trackEmpty : met ? FORGE.orange : FORGE.red;
  const statusColor = met === null ? FORGE.steel : met ? FORGE.orangeGlow : FORGE.red;

  const handleRingPress = useCallback(() => {
    if (overlayMode) return;
    setInputVal('');
    setOverlayMode(hasGoal ? 'log' : 'set-goal');
  }, [overlayMode, hasGoal]);

  const handleRingLongPress = useCallback(() => {
    if (hasGoal && !overlayMode) {
      setInputVal('');
      setOverlayMode('remove');
    }
  }, [hasGoal, overlayMode]);

  const handleConfirm = () => {
    const n = parseFloat(inputVal);
    if (isNaN(n) || n <= 0) {
      setOverlayMode(null);
      return;
    }
    if (overlayMode === 'set-goal') onSetGoal(t.id, n);
    else if (overlayMode === 'remove') onLog(t.id, -n);
    else onLog(t.id, n);
    setOverlayMode(null);
  };

  const overlayLabel =
    overlayMode === 'set-goal' ? `Set goal (${t.unit})` :
    overlayMode === 'remove' ? 'Remove amount' : 'Add amount';

  const confirmLabel =
    overlayMode === 'set-goal' ? 'Set' :
    overlayMode === 'remove' ? 'Remove' : 'Add';

  return (
    <View style={[
      trackerStyles.card,
      met === true && trackerStyles.cardMet,
      !hasGoal && trackerStyles.cardNoGoal,
    ]}>
      <Pressable style={trackerStyles.swapBtn} onPress={onSwapClick}>
        <Text style={{ fontSize: 11, color: FORGE.steel }}>⇄</Text>
      </Pressable>

      <Pressable onPress={handleRingPress} onLongPress={handleRingLongPress} style={trackerStyles.barWrap}>
        {hasGoal ? (
          <>
            <Text style={trackerStyles.barNum}>{Math.round(t.value)}</Text>
            <Text style={trackerStyles.barUnit}>{t.unit}</Text>
            <View style={trackerStyles.barTrack}>
              <View style={[trackerStyles.barFill, { flex: Math.min(pct, 1), backgroundColor: ringColor }]} />
              <View style={{ flex: Math.max(1 - Math.min(pct, 1), 0) }} />
            </View>
            {pct > 1 && (
              <Text style={[trackerStyles.barOverflow, { color: ringColor }]}>
                {Math.round((pct - 1) * 100)}% over
              </Text>
            )}
          </>
        ) : (
          <Text style={trackerStyles.barPrompt}>Set a{'\n'}goal</Text>
        )}
      </Pressable>

      <Text style={trackerStyles.ringName}>{t.name}</Text>
      <Text style={[trackerStyles.ringStatus, { color: statusColor }]}>{statusText(t)}</Text>

      {hasGoal ? (
        <View style={trackerStyles.cfgRow}>
          <Text style={trackerStyles.cfgLabel}>Goal</Text>
          <TextInput
            style={trackerStyles.cfgInput}
            keyboardType="numeric"
            value={String(Math.round(t.goal!))}
            onChangeText={(val) => {
              const n = parseFloat(val);
              if (!isNaN(n) && n >= 0) onSetGoal(t.id, n);
            }}
          />
          <Text style={trackerStyles.cfgLabel}>{t.unit}</Text>
          <Pressable onPress={() => onSetGoal(t.id, null)} style={trackerStyles.clearGoalBtn}>
            <Text style={{ color: FORGE.dim, fontSize: 14 }}>×</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={() => { setInputVal(''); setOverlayMode('set-goal'); }} style={trackerStyles.setGoalBtn}>
          <Text style={{ color: FORGE.orange, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>+ Set goal</Text>
        </Pressable>
      )}

      <View style={trackerStyles.dirToggle}>
        {(['under', 'over'] as GoalDirection[]).map((dir) => (
          <Pressable
            key={dir}
            onPress={() => onDirectionChange(t.id, dir)}
            style={[trackerStyles.dirBtn, t.direction === dir && trackerStyles.dirBtnActive]}
          >
            <Text style={[
              { fontSize: 10, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, color: FORGE.steel },
              t.direction === dir && { color: FORGE.charcoal },
            ]}>
              {dir.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Overlay modal */}
      {overlayMode && (
        <View style={trackerStyles.overlay}>
          <Text style={trackerStyles.ovLabel}>{overlayLabel}</Text>
          <TextInput
            style={trackerStyles.ovInput}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={FORGE.dim}
            value={inputVal}
            onChangeText={setInputVal}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleConfirm}
          />
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Pressable onPress={() => setOverlayMode(null)} style={trackerStyles.ovBtn}>
              <Text style={{ color: FORGE.steel, fontSize: 11 }}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleConfirm} style={[trackerStyles.ovBtn, trackerStyles.ovBtnConfirm]}>
              <Text style={{ color: FORGE.charcoal, fontSize: 11, fontWeight: '500' }}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

function TrackerPicker({
  slots,
  swapIndex,
  onPick,
  onClose,
}: {
  slots: string[];
  swapIndex: number;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const currentId = slots[swapIndex];
  const currentName = ALL_TRACKERS.find((t) => t.id === currentId)?.name ?? '';

  return (
    <View style={trackerStyles.picker}>
      <Text style={trackerStyles.pickerTitle}>Swap "{currentName}" with</Text>
      <View style={trackerStyles.pickerGrid}>
        {ALL_TRACKERS.map((t) => {
          const inSlot = slots.includes(t.id) && t.id !== currentId;
          const isCurrent = t.id === currentId;
          return (
            <Pressable
              key={t.id}
              disabled={inSlot}
              onPress={() => onPick(t.id)}
              style={[
                trackerStyles.pickerItem,
                isCurrent && trackerStyles.pickerItemCurrent,
                inSlot && { opacity: 0.35 },
              ]}
            >
              <Text style={trackerStyles.pickerItemName}>{t.name}</Text>
              <Text style={trackerStyles.pickerItemUnit}>{t.unit}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={{ alignItems: 'flex-end', marginTop: 10 }}>
        <Pressable onPress={onClose} style={trackerStyles.doneBtn}>
          <Text style={{ color: FORGE.steel, fontSize: 11 }}>Done</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ════════════════════════════════════════════════════ */
/*                    MAIN COMPONENT                    */
/* ════════════════════════════════════════════════════ */

export default function Diet() {
  /* ─── shared state ─── */
  const [savedMeals, setSavedMeals] = useState<TaggedMeal[]>([]);
  const [editing, setEditing] = useState<TaggedMeal | null>(null);

  /* ─── tag meal state ─── */
  const [name, setName] = useState('');
  const [tags, setTags] = useState<MealTagSet>({ ...EMPTY_TAGS, dietary: [] });
  const [macros, setMacros] = useState<MealMacros>({ ...EMPTY_MACROS });
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [tagTab, setTagTab] = useState<TagTab>('tags');
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [ingredientCat, setIngredientCat] = useState<string | null>(null);

  /* ─── dropdown toggles for tags / macros sections ─── */
  const [addTagsOpen, setAddTagsOpen] = useState(false);
  const [addMacrosOpen, setAddMacrosOpen] = useState(false);
  const [browseTagsOpen, setBrowseTagsOpen] = useState(false);
  const [browseMacrosOpen, setBrowseMacrosOpen] = useState(false);

  /* ─── browse filter state ─── */
  const [browseFilter, setBrowseFilter] = useState<BrowseFilterState>(EMPTY_BROWSE_FILTER);
  const [browseOpenSection, setBrowseOpenSection] = useState<string | null>(null);
  const [expandedMealId, setExpandedMealId] = useState<number | null>(null);

  /* ─── restaurant / menu state ─── */
  const [restaurant, setRestaurant] = useState('');
  const [restaurantMeals, setRestaurantMeals] = useState<RestaurantMeal[]>([]);
  const [restaurantLoading, setRestaurantLoading] = useState(false);
  const [restaurantError, setRestaurantError] = useState('');
  const [proteinFilter, setProteinFilter] = useState<ProteinFilter>(null);
  const [proteinFetched, setProteinFetched] = useState(false);
  const [minProtein, setMinProtein] = useState('');

  /* ─── calorie / logged meals state ─── */
  const [calorieGoal, setCalorieGoal] = useState<number | null>(null);
  const [myMealFilter, setMyMealFilter] = useState<'at_home' | 'restaurant'>('restaurant');
  const [loggedMenuMeals, setLoggedMenuMeals] = useState<LoggedMenuMeal[]>([]);
  const [loggedMealsLoading, setLoggedMealsLoading] = useState(false);

  /* ─── modals ─── */
  const [mealTypeModalVisible, setMealTypeModalVisible] = useState(false);
  const [selectedMenuMeal, setSelectedMenuMeal] = useState<RestaurantMeal | null>(null);
  const [deleteMealModalVisible, setDeleteMealModalVisible] = useState(false);
  const [mealToDelete, setMealToDelete] = useState<LoggedMenuMeal | null>(null);
  const [deletingMeal, setDeletingMeal] = useState(false);
  const [taggedMealToDelete, setTaggedMealToDelete] = useState<number | null>(null);
  const [loggingMeal, setLoggingMeal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealTypeOption | null>(null);
  const [recalibrateLoading, setRecalibrateLoading] = useState(false);

  /* ─── macro tracker state ─── */
  const [trackers, setTrackers] = useState<TrackerState[]>(
    ALL_TRACKERS.map((t) => ({ ...t, value: 0 }))
  );
  const [trackerSlots, setTrackerSlots] = useState<string[]>(DEFAULT_SLOTS);
  const [swapIndex, setSwapIndex] = useState<number | null>(null);

  const API_BASE_URL = 'http://localhost:8000';

  /* ─── effects ─── */
  useEffect(() => {
    setName(editing?.name ?? '');
    setTags(
      editing?.tags
        ? { ...editing.tags, dietary: [...editing.tags.dietary] }
        : { ...EMPTY_TAGS, dietary: [] }
    );
    setMacros(editing?.macros ? { ...editing.macros } : { ...EMPTY_MACROS });
    setIngredients(editing?.ingredients ? editing.ingredients.map((i) => ({ ...i })) : []);
    setError('');
    setSaved(false);
    setTagTab('tags');
  }, [editing]);

  const { isLoadingAuth } = useAuth();

  useEffect(() => {
    if (isLoadingAuth) return;
    api.me().then((user) => {
      if (user?.calorie_goal != null) setCalorieGoal(user.calorie_goal);
    }).catch(() => {});
  }, [isLoadingAuth]);

  useEffect(() => {
    if (isLoadingAuth) return;
    loadLoggedMenuMeals().catch(() => {});
  }, [isLoadingAuth]);

  /* ─── tag helpers ─── */
  const setSingleTag = <K extends keyof MealTagSet>(key: K, value: MealTagSet[K]) => {
    setTags((current) => ({
      ...current,
      [key]: current[key] === value ? null : value,
    }));
  };

  const toggleDietaryTag = (value: Dietary) => {
    setTags((current) => ({
      ...current,
      dietary: current.dietary.includes(value)
        ? current.dietary.filter((item) => item !== value)
        : [...current.dietary, value],
    }));
  };

  const setMacro = (key: keyof MealMacros, raw: string) => {
    const parsed = raw === '' ? null : parseFloat(raw);
    setMacros((m) => ({ ...m, [key]: parsed === null || isNaN(parsed) ? null : parsed }));
  };

  const addIngredient = (ingredientName: string, defaultUnit: IngredientUnit) => {
    setIngredients((prev) => [
      ...prev,
      { id: nextIngredientId(), name: ingredientName, quantity: null, unit: defaultUnit, note: '' },
    ]);
    setIngredientSearch('');
  };

  const updateIngredient = (id: string, updated: Ingredient) => {
    setIngredients((prev) => prev.map((i) => (i.id === id ? updated : i)));
  };

  const removeIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  };

  const filteredIngredients = useMemo(() => {
    const q = ingredientSearch.toLowerCase().trim();
    let items = COMMON_INGREDIENTS;
    if (ingredientCat) items = items.filter((i) => i.category === ingredientCat);
    if (q) items = items.filter((i) => i.name.toLowerCase().includes(q));
    return items;
  }, [ingredientSearch, ingredientCat]);

  const validateMeal = () => {
    if (!name.trim()) return 'Meal name is required.';
    if (!tags.spiceLevel) return 'Select a spice level.';
    if (!tags.cuisine) return 'Select a cuisine.';
    if (!tags.complexity) return 'Select a complexity.';
    if (!tags.goal) return 'Select a goal.';
    if (!tags.prepTime) return 'Select a prep time.';
    if (!tags.cookTime) return 'Select a cook time.';
    for (const { key, label, max } of MACRO_FIELDS) {
      const v = macros[key];
      if (v !== null && v !== undefined) {
        if (v < 0) return `${label} cannot be negative.`;
        if (v > max) return `${label} seems too high (max ${max}).`;
      }
    }
    return '';
  };

  const handleSaveMeal = () => {
    const validationError = validateMeal();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload: TaggedMeal = {
      id: editing?.id ?? Date.now(),
      name: name.trim(),
      tags: { ...tags, dietary: [...tags.dietary] },
      macros: { ...macros },
      ingredients: ingredients.map((i) => ({ ...i })),
    };

    setSavedMeals((current) => {
      if (editing) {
        return current.map((meal) => (meal.id === editing.id ? payload : meal));
      }
      return [payload, ...current];
    });

    setError('');
    setSaved(true);

    /* Auto-update macro tracker when adding a new meal (not editing) */
    if (!editing) {
      setTrackers((prev) => logMealMacrosToTrackers(prev, macros));
    }

    if (editing) {
      setEditing(null);
    } else {
      setName('');
      setTags({ ...EMPTY_TAGS, dietary: [] });
      setMacros({ ...EMPTY_MACROS });
      setIngredients([]);
    }

    setTimeout(() => setSaved(false), 2500);
  };

  const handleDeleteMeal = (id: number) => {
    setTaggedMealToDelete(id);
  };

  const confirmDeleteTaggedMeal = () => {
    if (taggedMealToDelete === null) return;
    setSavedMeals((current) => current.filter((meal) => meal.id !== taggedMealToDelete));
    if (editing?.id === taggedMealToDelete) setEditing(null);
    setTaggedMealToDelete(null);
  };

  const cancelDeleteTaggedMeal = () => {
    setTaggedMealToDelete(null);
  };

  const handleCancelEdit = () => {
    setEditing(null);
    setName('');
    setTags({ ...EMPTY_TAGS, dietary: [] });
    setMacros({ ...EMPTY_MACROS });
    setIngredients([]);
    setError('');
    setSaved(false);
  };

  /* ─── browse filter helpers ─── */
  const toggleBrowseFilter = <K extends keyof Omit<BrowseFilterState, 'dietary' | MacroFilterKey>>(
    key: K,
    value: BrowseFilterState[K]
  ) => {
    setBrowseFilter((f) => ({ ...f, [key]: f[key] === value ? null : value }));
  };

  const toggleBrowseDietary = (value: Dietary) => {
    setBrowseFilter((f) => ({
      ...f,
      dietary: f.dietary.includes(value)
        ? f.dietary.filter((d) => d !== value)
        : [...f.dietary, value],
    }));
  };

  const setBrowseMacroRange = (key: MacroFilterKey, bound: 'min' | 'max', raw: string) => {
    const parsed = raw === '' ? null : parseFloat(raw);
    setBrowseFilter((f) => ({
      ...f,
      [key]: { ...(f[key] as MacroRange), [bound]: parsed === null || isNaN(parsed) ? null : parsed },
    }));
  };

  const macroRangeActive = (key: MacroFilterKey): boolean => {
    const r = browseFilter[key] as MacroRange;
    return r.min !== null || r.max !== null;
  };

  const clearBrowseFilters = () => setBrowseFilter(EMPTY_BROWSE_FILTER);

  const filteredMeals = useMemo(() => {
    return savedMeals.filter((meal) => {
      const t = meal.tags;
      if (browseFilter.spiceLevel && t.spiceLevel !== browseFilter.spiceLevel) return false;
      if (browseFilter.cuisine && t.cuisine !== browseFilter.cuisine) return false;
      if (browseFilter.complexity && t.complexity !== browseFilter.complexity) return false;
      if (browseFilter.goal && t.goal !== browseFilter.goal) return false;
      if (browseFilter.prepTime && t.prepTime !== browseFilter.prepTime) return false;
      if (browseFilter.cookTime && t.cookTime !== browseFilter.cookTime) return false;
      if (browseFilter.dietary.length > 0 && !browseFilter.dietary.every((d) => t.dietary.includes(d))) return false;
      for (const { key } of MACRO_FILTER_FIELDS) {
        const range = browseFilter[key] as MacroRange;
        if (range.min === null && range.max === null) continue;
        const val = meal.macros?.[key] ?? null;
        if (val === null) return false;
        if (range.min !== null && val < range.min) return false;
        if (range.max !== null && val > range.max) return false;
      }
      return true;
    });
  }, [savedMeals, browseFilter]);

  const browseTagActiveCount = [
    browseFilter.spiceLevel, browseFilter.cuisine, browseFilter.complexity,
    browseFilter.goal, browseFilter.prepTime, browseFilter.cookTime,
  ].filter(Boolean).length + browseFilter.dietary.length;
  const browseMacroActiveCount = MACRO_FILTER_FIELDS.filter(({ key }) => macroRangeActive(key)).length;
  const browseActiveCount = browseTagActiveCount + browseMacroActiveCount;

  /* ─── calorie & restaurant helpers ─── */
  const consumedCalories = useMemo(() => {
    return Math.round(loggedMenuMeals.reduce((sum, meal) => sum + (meal.energy_kcal ?? 0), 0));
  }, [loggedMenuMeals]);

  const remainingCalories = useMemo(() => {
    if (calorieGoal == null) return null;
    return Math.max(Math.round(calorieGoal) - consumedCalories, 0);
  }, [calorieGoal, consumedCalories]);

  const searchMeals = async () => {
    const trimmed = restaurant.trim();
    const minP = parseFloat(minProtein);
    const hasRestaurant = trimmed.length > 0;
    const hasMinProtein = !isNaN(minP);

    if (!hasRestaurant && !hasMinProtein) {
      setRestaurantError('Please enter a restaurant or minimum protein.');
      return;
    }

    setRestaurantLoading(true);
    setRestaurantError('');
    setProteinFetched(false);

    try {
      let data: RestaurantMeal[] = [];
      if (hasRestaurant) {
        data = await api.searchByRestaurant(trimmed);
      } else {
        data = await api.getAllMenuMeals();
      }
      setRestaurantMeals(Array.isArray(data) ? data : []);
    } catch (err) {
      setRestaurantMeals([]);
      setRestaurantError('Could not load menu meals.');
    } finally {
      setRestaurantLoading(false);
    }
  };

  const handleProteinPress = async (protein: 'chicken' | 'beef') => {
    if (proteinFilter === protein) {
      setProteinFilter(null);
      if (proteinFetched) {
        setRestaurantMeals([]);
        setProteinFetched(false);
      }
      return;
    }

    setProteinFilter(protein);

    if (restaurantMeals.length === 0) {
      setRestaurantLoading(true);
      setRestaurantError('');
      try {
        const data = await api.searchByProtein(protein);
        setRestaurantMeals(Array.isArray(data) ? data : []);
        setProteinFetched(true);
      } catch (err) {
        setRestaurantError('Could not load protein-filtered meals.');
      } finally {
        setRestaurantLoading(false);
      }
    } else {
      setProteinFetched(false);
    }
  };

  const filteredRestaurantMeals = useMemo(() => {
    let meals = restaurantMeals;
    if (proteinFilter) meals = meals.filter((meal) => meal[proteinFilter] === true);
    const minP = parseFloat(minProtein);
    if (!isNaN(minP)) meals = meals.filter((meal) => (meal.protein_g ?? 0) >= minP);
    return meals;
  }, [restaurantMeals, proteinFilter, minProtein]);

  const loadLoggedMenuMeals = async () => {
    setLoggedMealsLoading(true);
    try {
      const data = await api.getLoggedMenuMeals();
      setLoggedMenuMeals(Array.isArray(data) ? data : []);
    } catch (err) {
      setLoggedMenuMeals([]);
    } finally {
      setLoggedMealsLoading(false);
    }
  };

  const openMealTypeModal = (meal: RestaurantMeal) => {
    setSelectedMenuMeal(meal);
    setSelectedMealType(null);
    setMealTypeModalVisible(true);
  };

  const closeMealTypeModal = () => {
    if (loggingMeal) return;
    setMealTypeModalVisible(false);
    setSelectedMenuMeal(null);
    setSelectedMealType(null);
  };

  const openDeleteMealModal = (meal: LoggedMenuMeal) => {
    setMealToDelete(meal);
    setDeleteMealModalVisible(true);
  };

  const closeDeleteMealModal = () => {
    if (deletingMeal) return;
    setDeleteMealModalVisible(false);
    setMealToDelete(null);
  };

  const handleConfirmDeleteMeal = async () => {
    if (!mealToDelete) return;
    setDeletingMeal(true);
    try {
      await api.deleteLoggedMenuMeal(mealToDelete.session_id);
      setLoggedMenuMeals((current) =>
        current.filter((meal) => meal.session_id !== mealToDelete.session_id)
      );
      closeDeleteMealModal();
    } catch {
      Alert.alert('Could not remove meal', 'Please try again.');
    } finally {
      setDeletingMeal(false);
    }
  };

  const handleConfirmMealType = async () => {
    if (!selectedMenuMeal || !selectedMealType) {
      Alert.alert('Select meal type', 'Please choose breakfast, lunch, dinner, or snack.');
      return;
    }

    setLoggingMeal(true);
    try {
      const created = await api.logMenuMeal(selectedMenuMeal.id, selectedMealType);
      setLoggedMenuMeals((current) => [created, ...current]);

      /* Auto-update macro tracker from the restaurant meal's nutrition */
      setTrackers((prev) => logMealMacrosToTrackers(prev, restaurantMealToMacros(selectedMenuMeal)));

      setMealTypeModalVisible(false);
      setSelectedMenuMeal(null);
      setSelectedMealType(null);
      setMyMealFilter('restaurant');
    } catch (err) {
      Alert.alert('Could not log meal', 'Please try again.');
    } finally {
      setLoggingMeal(false);
    }
  };

  async function handleRecalibrate() {
    setRecalibrateLoading(true);
    try {
      const result = await api.recalibrateCalories({
        current_calorie_goal: calorieGoal,
        consumed_calories: consumedCalories,
        remaining_calories: remainingCalories,
      });
      setCalorieGoal(result.calorie_goal);
      Alert.alert('Calorie goal updated', `Your new calorie goal is ${result.calorie_goal}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to recalibrate calorie goal.';
      Alert.alert('Recalibrate failed', message);
    } finally {
      setRecalibrateLoading(false);
    }
  }

  /* ─── macro tracker handlers ─── */
  const getTracker = (id: string) => trackers.find((t) => t.id === id)!;

  const handleTrackerLog = (id: string, amount: number) =>
    setTrackers((prev) => logAmount(prev, id, amount));

  const handleTrackerSetGoal = (id: string, goal: number | null) =>
    setTrackers((prev) => setGoalValue(prev, id, goal));

  const handleTrackerDirection = (id: string, dir: GoalDirection) =>
    setTrackers((prev) => setGoalValue(prev, id, getTracker(id).goal, dir));

  const handleTrackerPick = (id: string) => {
    if (swapIndex === null) return;
    const currentId = trackerSlots[swapIndex];
    if (id === currentId) { setSwapIndex(null); return; }
    setTrackerSlots((prev) => {
      const next = [...prev];
      const otherIdx = next.indexOf(id);
      if (otherIdx !== -1) next[otherIdx] = currentId;
      next[swapIndex] = id;
      return next;
    });
    setSwapIndex(null);
  };

  /* ════════════════════════════════ RENDER ════════════════════════════════ */

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>

      {/* ─── PAGE HEADER + CALORIE WIDGET ─── */}
      <View style={styles.pageTitleRow}>
        <Text style={styles.pageTitle}>Diet</Text>
        <View style={styles.calorieWidget}>
          <Text style={styles.calorieWidgetLabel}>Calorie Goal</Text>
          <Text style={styles.calorieWidgetNumber}>
            {calorieGoal != null ? Math.round(calorieGoal) : '—'}
          </Text>
          <View style={styles.calorieWidgetStats}>
            <View style={styles.calorieWidgetStat}>
              <Text style={styles.calorieWidgetStatLabel}>Consumed</Text>
              <Text style={styles.calorieWidgetStatValue}>{consumedCalories}</Text>
            </View>
            <View style={styles.calorieWidgetStat}>
              <Text style={styles.calorieWidgetStatLabel}>Remaining</Text>
              <Text style={styles.calorieWidgetStatValue}>
                {remainingCalories != null ? remainingCalories : '—'}
              </Text>
            </View>
          </View>
          <ForgeButton
            onPress={() => { void handleRecalibrate(); }}
            text={recalibrateLoading ? 'Recalibrating...' : 'Recalibrate'}
          />
        </View>
      </View>

      {/* ─── MACRO TRACKER ─── */}
      <SectionCard title="Macro Tracker">
        <View style={trackerStyles.grid}>
          {trackerSlots.map((id, i) => (
            <TrackerRing
              key={id}
              tracker={getTracker(id)}
              onLog={handleTrackerLog}
              onSetGoal={handleTrackerSetGoal}
              onDirectionChange={handleTrackerDirection}
              onSwapClick={() => setSwapIndex(swapIndex === i ? null : i)}
            />
          ))}
        </View>
        {swapIndex !== null && (
          <TrackerPicker
            slots={trackerSlots}
            swapIndex={swapIndex}
            onPick={handleTrackerPick}
            onClose={() => setSwapIndex(null)}
          />
        )}
        <Text style={{ color: FORGE.dim, fontSize: 11, textAlign: 'center' }}>
          Tap ring to log · long-press to remove · ⇄ to swap
        </Text>
      </SectionCard>

      {/* ─── MY MEALS ─── */}
      <SectionCard title="My Meals">
        <View style={styles.pillWrap}>
          <Pill label="At Home" active={myMealFilter === 'at_home'} color={C?.orange ?? '#f97316'} onPress={() => setMyMealFilter('at_home')} />
          <Pill label="Restaurant" active={myMealFilter === 'restaurant'} color={C?.orange ?? '#f97316'} onPress={() => setMyMealFilter('restaurant')} />
        </View>

        {myMealFilter === 'restaurant' && (
          loggedMealsLoading ? (
            <ActivityIndicator style={styles.loader} />
          ) : loggedMenuMeals.length === 0 ? (
            <Text style={styles.emptyText}>No restaurant meals logged yet.</Text>
          ) : (
            <View style={styles.myMealList}>
              {loggedMenuMeals.map((item) => (
                <View key={item.session_id} style={styles.myMealRow}>
                  <View style={styles.myMealHeader}>
                    <View style={styles.restaurantMealInfo}>
                      <Text style={styles.restaurantMealName}>{item.product}</Text>
                      <Text style={styles.restaurantMealProtein}>{item.restaurant} · {item.category}</Text>
                    </View>
                    <View style={styles.myMealMeta}>
                      <Text style={styles.myMealDate}>{new Date(`${item.date}Z`).toLocaleDateString()}</Text>
                      <Text style={styles.myMealType}>{item.meal_type.charAt(0).toUpperCase() + item.meal_type.slice(1)}</Text>
                      <ForgeButton onPress={() => openDeleteMealModal(item)} text="-" />
                    </View>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.nutritionScroll} contentContainerStyle={styles.nutritionScrollContent}>
                    {[
                      { label: 'Serving', value: `${item.serving_size ?? 0}g` },
                      { label: 'Cal', value: `${item.energy_kcal ?? 0} kcal` },
                      { label: 'Protein', value: `${item.protein_g ?? 0}g` },
                      { label: 'Carbs', value: `${item.carbohydrates_g ?? 0}g` },
                      { label: 'Fat', value: `${item.total_fat_g ?? 0}g` },
                      { label: 'Sat Fat', value: `${item.saturated_fat_g ?? 0}g` },
                      { label: 'Trans Fat', value: `${item.trans_fat_g ?? 0}g` },
                      { label: 'Sodium', value: `${item.sodium_mg ?? 0}mg` },
                      { label: 'Sugar', value: `${item.sugar_g ?? 0}g` },
                      { label: 'Fiber', value: `${item.fiber_g ?? 0}g` },
                      { label: 'Cholesterol', value: `${item.cholesterol_mg ?? 0}mg` },
                    ].map((nutrient) => (
                      <View key={nutrient.label} style={styles.nutritionChip}>
                        <Text style={styles.nutritionChipLabel}>{nutrient.label}</Text>
                        <Text style={styles.nutritionChipValue}>{nutrient.value}</Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              ))}
            </View>
          )
        )}

        {myMealFilter === 'at_home' && (
          <Text style={styles.emptyText}>At home meals coming soon.</Text>
        )}
      </SectionCard>

      {/* ─── MEAL TAGGING (enhanced with macros + ingredients) ─── */}
      <SectionCard title={editing ? 'Meal Tagging · Edit Meal' : 'Meal Tagging · Add Meal'}>
        <Text style={styles.sectionLabel}>Meal Name</Text>
        <TextInput value={name} onChangeText={setName} placeholder="e.g. Grilled Chicken & Rice" placeholderTextColor="#6b7280" style={styles.input} returnKeyType="done" onSubmitEditing={handleSaveMeal} />

        {/* Tab switcher */}
        <View style={styles.tabRow}>
          <Pressable onPress={() => setTagTab('tags')} style={[styles.tabBtn, tagTab === 'tags' && styles.tabBtnActive]}>
            <Text style={[styles.tabBtnText, tagTab === 'tags' && styles.tabBtnTextActive]}>🏷 Tags & Macros</Text>
          </Pressable>
          <Pressable onPress={() => setTagTab('ingredients')} style={[styles.tabBtn, tagTab === 'ingredients' && styles.tabBtnActive]}>
            <Text style={[styles.tabBtnText, tagTab === 'ingredients' && styles.tabBtnTextActive]}>🥘 Ingredients {ingredients.length > 0 ? `(${ingredients.length})` : ''}</Text>
          </Pressable>
        </View>

        {tagTab === 'tags' && (
          <>
            <CollapsibleSection
              title="🏷 Tags"
              open={addTagsOpen}
              onToggle={() => setAddTagsOpen(!addTagsOpen)}
              badge={(() => {
                const count = [tags.spiceLevel, tags.cuisine, tags.complexity, tags.goal, tags.prepTime, tags.cookTime].filter(Boolean).length + tags.dietary.length;
                return count > 0 ? `${count} set` : undefined;
              })()}
            >
              <Text style={styles.sectionLabel}>Spice Level</Text>
              <View style={styles.pillWrap}>
                {SPICE_LEVELS.map((value: SpiceLevel) => (
                  <Pill key={value} label={value} active={tags.spiceLevel === value} color={SPICE_COLOR[value]} icon={SPICE_ICON[value]} onPress={() => setSingleTag('spiceLevel', value)} />
                ))}
              </View>

              <Text style={styles.sectionLabel}>Cuisine</Text>
              <View style={styles.pillWrap}>
                {CUISINES.map((value: Cuisine) => (
                  <Pill key={value} label={value} active={tags.cuisine === value} color={C?.amber ?? '#f5c56b'} onPress={() => setSingleTag('cuisine', value)} />
                ))}
              </View>

              <Text style={styles.sectionLabel}>Complexity</Text>
              <View style={styles.pillWrap}>
                {COMPLEXITIES.map((value: Complexity) => (
                  <Pill key={value} label={value} active={tags.complexity === value} color={COMPLEXITY_COLOR[value]} onPress={() => setSingleTag('complexity', value)} />
                ))}
              </View>

              <Text style={styles.sectionLabel}>Goal</Text>
              <View style={styles.pillWrap}>
                {GOALS.map((value: Goal) => (
                  <Pill key={value} label={value} active={tags.goal === value} color={GOAL_COLOR[value]} icon={GOAL_ICON[value]} onPress={() => setSingleTag('goal', value)} />
                ))}
              </View>

              <Text style={styles.sectionLabel}>Prep Time</Text>
              <View style={styles.pillWrap}>
                {TIME_LABELS.map((value: TimeLabel) => (
                  <Pill key={value} label={value} active={tags.prepTime === value} color={TIME_COLOR[value]} icon={TIME_ICON[value]} onPress={() => setSingleTag('prepTime', value)} />
                ))}
              </View>

              <Text style={styles.sectionLabel}>Cook Time</Text>
              <View style={styles.pillWrap}>
                {TIME_LABELS.map((value: TimeLabel) => (
                  <Pill key={value} label={value} active={tags.cookTime === value} color={TIME_COLOR[value]} icon={TIME_ICON[value]} onPress={() => setSingleTag('cookTime', value)} />
                ))}
              </View>

              <Text style={styles.sectionLabel}>Dietary Restrictions (Optional)</Text>
              <View style={styles.pillWrap}>
                {DIETARY_OPTS.map((value: Dietary) => (
                  <Pill key={value} label={value} active={tags.dietary.includes(value)} color={C?.amber ?? '#f5c56b'} onPress={() => toggleDietaryTag(value)} />
                ))}
              </View>
            </CollapsibleSection>

            <CollapsibleSection
              title="📊 Macros"
              open={addMacrosOpen}
              onToggle={() => setAddMacrosOpen(!addMacrosOpen)}
              badge={(() => {
                const count = MACRO_FIELDS.filter(({ key }) => macros[key] != null && macros[key] !== 0).length;
                return count > 0 ? `${count} filled` : undefined;
              })()}
            >
              <Text style={styles.sectionLabel}>Macros (Optional · per serving)</Text>
              <View style={{ gap: 10 }}>
                {MACRO_FIELDS.map(({ key, label, unit, placeholder }) => (
                  <View key={key}>
                    <Text style={styles.miniLabel}>{label} ({unit})</Text>
                    <TextInput keyboardType="numeric" value={macros[key] != null ? String(macros[key]) : ''} onChangeText={(val) => setMacro(key, val)} placeholder={placeholder} placeholderTextColor="#6b7280" style={styles.input} />
                  </View>
                ))}
              </View>

              {/* Calorie density bar */}
              {macros.calories != null && (
                <View style={{ gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.miniLabel}>Calorie density</Text>
                    <Text style={[styles.miniLabel, { color: macros.calories > 600 ? '#f87171' : macros.calories > 300 ? (C?.amber ?? '#f5c56b') : '#6ee7b7' }]}>
                      {macros.calories} kcal
                    </Text>
                  </View>
                  <View style={{ height: 4, backgroundColor: C?.border ?? '#e2e8f0', borderRadius: 2, overflow: 'hidden', flexDirection: 'row' }}>
                    <View style={{ flex: Math.min(macros.calories / 800, 1), height: 4, backgroundColor: macros.calories > 600 ? '#ef4444' : macros.calories > 300 ? (C?.orange ?? '#f97316') : '#34d399', borderRadius: 2 }} />
                    <View style={{ flex: Math.max(1 - macros.calories / 800, 0) }} />
                  </View>
                </View>
              )}
            </CollapsibleSection>
          </>
        )}

        {tagTab === 'ingredients' && (
          <View style={{ gap: 14 }}>
            <Text style={styles.sectionLabel}>Add Ingredient</Text>
            <View style={styles.rowGap}>
              <View style={styles.flex1}>
                <TextInput value={ingredientSearch} onChangeText={setIngredientSearch} placeholder="Search ingredients…" placeholderTextColor="#6b7280" style={styles.input} />
              </View>
              <Pressable onPress={() => { const trimmed = ingredientSearch.trim(); if (trimmed) addIngredient(trimmed, 'g'); }} style={[styles.pill, { borderColor: C?.orange ?? '#f97316', backgroundColor: colorWithAlpha(C?.orange ?? '#f97316', '18') }]}>
                <Text style={[styles.pillText, { color: C?.orange ?? '#f97316' }]}>+ Custom</Text>
              </Pressable>
            </View>

            {/* Category pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={[styles.pillWrap, { paddingRight: 10 }]}>
                <Pill label="All" active={!ingredientCat} color={C?.orange ?? '#f97316'} onPress={() => setIngredientCat(null)} />
                {INGREDIENT_CATEGORIES.map((cat) => (
                  <Pill key={cat} label={cat} active={ingredientCat === cat} color={C?.orange ?? '#f97316'} onPress={() => setIngredientCat(ingredientCat === cat ? null : cat)} />
                ))}
              </View>
            </ScrollView>

            {/* Filtered ingredient list */}
            {ingredientSearch.trim().length > 0 && (
              <View style={{ maxHeight: 200, borderWidth: 1, borderColor: C?.border ?? '#e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                <ScrollView nestedScrollEnabled>
                  {filteredIngredients.length === 0 ? (
                    <Text style={[styles.emptyText, { padding: 16, textAlign: 'center' }]}>No matches. Press + Custom to add "{ingredientSearch.trim()}"</Text>
                  ) : (
                    filteredIngredients.slice(0, 20).map((item) => (
                      <Pressable key={item.name} onPress={() => addIngredient(item.name, item.defaultUnit)} style={({ pressed }) => [{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: C?.border ?? '#e2e8f0' }, pressed && { backgroundColor: colorWithAlpha(C?.orange ?? '#f97316', '10') }]}>
                        <Text style={{ color: C?.text ?? '#000000', fontSize: 13, fontWeight: '600' }}>{item.name}</Text>
                        <Text style={{ color: C?.muted ?? '#6b7280', fontSize: 10, backgroundColor: colorWithAlpha(C?.border ?? '#e2e8f0', '60'), borderRadius: 3, paddingHorizontal: 6, paddingVertical: 1 }}>
                          {INGREDIENT_UNITS.find((u) => u.value === item.defaultUnit)?.label ?? item.defaultUnit}
                        </Text>
                      </Pressable>
                    ))
                  )}
                </ScrollView>
              </View>
            )}

            {/* Current ingredients */}
            {ingredients.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40, borderWidth: 1.5, borderColor: C?.border ?? '#e2e8f0', borderRadius: 8, opacity: 0.7 }}>
                <Text style={[styles.emptyText, { textAlign: 'center' }]}>
                  No ingredients added yet.{'\n'}
                  <Text style={{ fontSize: 12, color: C?.muted ?? '#6b7280' }}>Search above or press "+ Custom" to add your own.</Text>
                </Text>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.sectionLabel}>{ingredients.length} Ingredient{ingredients.length !== 1 ? 's' : ''}</Text>
                  <Pressable onPress={() => setIngredients([])}>
                    <Text style={{ color: '#f87171', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 }}>Clear all</Text>
                  </Pressable>
                </View>
                {ingredients.map((ing) => (
                  <IngredientRowView key={ing.id} ingredient={ing} onUpdate={(updated) => updateIngredient(ing.id, updated)} onRemove={() => removeIngredient(ing.id)} />
                ))}
              </View>
            )}
          </View>
        )}

        {error ? <Text style={styles.errorText}>⚠ {error}</Text> : null}
        {saved ? <Text style={styles.successText}>✓ Meal saved successfully.</Text> : null}

        <View style={styles.rowGap}>
          {editing ? (
            <View style={styles.flex1}><ForgeButton onPress={handleCancelEdit} text={'Cancel'} /></View>
          ) : null}
          <View style={[styles.flex1, editing ? styles.flex2 : undefined]}>
            <ForgeButton onPress={handleSaveMeal} text={editing ? 'Update Meal' : 'Save Meal'} />
          </View>
        </View>
      </SectionCard>

      {/* ─── MEAL BROWSER (enhanced) ─── */}
      <SectionCard title={`Meal Browser${browseActiveCount ? ` · ${browseActiveCount} Active Filters` : ''}`}>
        <CollapsibleSection
          title="🏷 Filter by Tags"
          open={browseTagsOpen}
          onToggle={() => setBrowseTagsOpen(!browseTagsOpen)}
          badge={browseTagActiveCount > 0 ? `${browseTagActiveCount} active` : undefined}
        >
          <FilterSection title="Spice" values={SPICE_LEVELS} activeValue={browseFilter.spiceLevel} colorFor={(v) => SPICE_COLOR[v as SpiceLevel]} onPress={(v) => toggleBrowseFilter('spiceLevel', v as SpiceLevel)} />
          <FilterSection title="Cuisine" values={CUISINES} activeValue={browseFilter.cuisine} colorFor={() => C?.amber ?? '#f5c56b'} onPress={(v) => toggleBrowseFilter('cuisine', v as Cuisine)} />
          <FilterSection title="Complexity" values={COMPLEXITIES} activeValue={browseFilter.complexity} colorFor={(v) => COMPLEXITY_COLOR[v as Complexity]} onPress={(v) => toggleBrowseFilter('complexity', v as Complexity)} />
          <FilterSection title="Goal" values={GOALS} activeValue={browseFilter.goal} colorFor={(v) => GOAL_COLOR[v as Goal]} onPress={(v) => toggleBrowseFilter('goal', v as Goal)} />
          <FilterSection title="Prep Time" values={TIME_LABELS} activeValue={browseFilter.prepTime} colorFor={(v) => TIME_COLOR[v as TimeLabel]} onPress={(v) => toggleBrowseFilter('prepTime', v as TimeLabel)} />
          <FilterSection title="Cook Time" values={TIME_LABELS} activeValue={browseFilter.cookTime} colorFor={(v) => TIME_COLOR[v as TimeLabel]} onPress={(v) => toggleBrowseFilter('cookTime', v as TimeLabel)} />

          <View style={styles.filterBlock}>
            <Text style={styles.sectionLabel}>Dietary</Text>
            <View style={styles.pillWrap}>
              {DIETARY_OPTS.map((value: Dietary) => (
                <Pill key={value} label={value} active={browseFilter.dietary.includes(value)} color={C?.amber ?? '#f5c56b'} onPress={() => toggleBrowseDietary(value)} />
              ))}
            </View>
          </View>
        </CollapsibleSection>

        <CollapsibleSection
          title="📊 Filter by Macros"
          open={browseMacrosOpen}
          onToggle={() => setBrowseMacrosOpen(!browseMacrosOpen)}
          badge={browseMacroActiveCount > 0 ? `${browseMacroActiveCount} active` : undefined}
        >
          <Text style={styles.sectionLabel}>Macro Ranges (per serving)</Text>
          {MACRO_FILTER_FIELDS.map(({ key, label, unit }) => (
            <MacroRangeFilterRow key={key} filterKey={key} label={label} unit={unit} range={browseFilter[key] as MacroRange} isOpen={browseOpenSection === `macro_${key}`} isActive={macroRangeActive(key)} onToggleOpen={() => setBrowseOpenSection(browseOpenSection === `macro_${key}` ? null : `macro_${key}`)} onChangeMin={(val) => setBrowseMacroRange(key, 'min', val)} onChangeMax={(val) => setBrowseMacroRange(key, 'max', val)} />
          ))}
        </CollapsibleSection>

        <ForgeButton onPress={clearBrowseFilters} text={'Clear Filters'} />

        <Text style={styles.resultsLabel}>
          {filteredMeals.length} meal{filteredMeals.length === 1 ? '' : 's'}
          {browseActiveCount ? ' matching filters' : ' total'}
        </Text>

        {filteredMeals.length === 0 ? (
          <Text style={styles.emptyText}>No meals match these filters.</Text>
        ) : (
          <View style={styles.cardList}>
            {filteredMeals.map((meal) => (
              <BrowseMealCard key={meal.id} meal={meal} onEdit={setEditing} onDelete={handleDeleteMeal} expanded={expandedMealId === meal.id} onToggle={() => setExpandedMealId(expandedMealId === meal.id ? null : meal.id)} />
            ))}
          </View>
        )}
      </SectionCard>

      {/* ─── MENU MEAL SEARCH ─── */}
      <SectionCard title="Menu Meal Search">
        <View style={styles.rowGap}>
          <View style={styles.flex1}>
            <TextInput style={styles.input} placeholder="Enter restaurant" placeholderTextColor="#6b7280" value={restaurant} onChangeText={setRestaurant} returnKeyType="search" onSubmitEditing={searchMeals} />
          </View>
          <View style={styles.flex1}>
            <TextInput style={styles.input} placeholder="Min protein (g)" placeholderTextColor="#6b7280" value={minProtein} onChangeText={setMinProtein} keyboardType="numeric" returnKeyType="done" />
          </View>
        </View>

        <View style={styles.pillWrap}>
          <Pill label="chicken" active={proteinFilter === 'chicken'} color={C?.amber ?? '#f5c56b'} onPress={() => handleProteinPress('chicken')} />
          <Pill label="beef" active={proteinFilter === 'beef'} color={C?.amber ?? '#f5c56b'} onPress={() => handleProteinPress('beef')} />
        </View>

        <View style={styles.rowGap}>
          <View style={styles.flex1}><ForgeButton onPress={searchMeals} text={'Search'} /></View>
          <View style={styles.flex1}>
            <ForgeButton onPress={() => { setRestaurant(''); setRestaurantMeals([]); setProteinFilter(null); setProteinFetched(false); setMinProtein(''); setRestaurantError(''); }} text={'Clear'} />
          </View>
        </View>

        {restaurantLoading ? <ActivityIndicator style={styles.loader} /> : null}
        {restaurantError ? <Text style={styles.errorText}>{restaurantError}</Text> : null}

        <View style={filteredRestaurantMeals.length ? styles.restaurantList : undefined}>
          {filteredRestaurantMeals.map((item, index) => (
            <View key={item.id != null ? String(item.id) : String(index)} style={styles.restaurantMealRow}>
              <View style={styles.restaurantMealInfo}>
                <Text style={styles.restaurantMealName}>{item.product}</Text>
                <Text style={styles.restaurantMealProtein}>{item.restaurant} · {item.category}</Text>
              </View>
              <View style={styles.restaurantMealStats}>
                <Text style={styles.restaurantMealCalories}>{item.protein_g ?? 0}g protein</Text>
                <Text style={styles.restaurantMealCalories}>{item.energy_kcal ?? 0} cal</Text>
              </View>
              <ForgeButton onPress={() => openMealTypeModal(item)} text="+" />
            </View>
          ))}
        </View>
      </SectionCard>

      {/* ─── MODALS ─── */}
      <Modal visible={mealTypeModalVisible} transparent animationType="fade" onRequestClose={closeMealTypeModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Log meal as</Text>
            {selectedMenuMeal ? (<Text style={styles.modalSubtitle}>{selectedMenuMeal.product} · {selectedMenuMeal.restaurant}</Text>) : null}
            {(['breakfast', 'lunch', 'dinner', 'snack'] as MealTypeOption[]).map((option) => {
              const active = selectedMealType === option;
              return (
                <Pressable key={option} disabled={loggingMeal} onPress={() => setSelectedMealType(option)} style={({ pressed }) => [styles.modalOption, active && styles.modalOptionActive, pressed && { opacity: 0.85 }]}>
                  <Text style={[styles.modalOptionText, active && styles.modalOptionTextActive]}>{option.charAt(0).toUpperCase() + option.slice(1)}</Text>
                </Pressable>
              );
            })}
            <View style={styles.modalButtonRow}>
              <View style={styles.modalButtonHalf}><ForgeButton onPress={closeMealTypeModal} text="Cancel" /></View>
              <View style={styles.modalButtonHalf}><ForgeButton onPress={handleConfirmMealType} text={loggingMeal ? 'Saving...' : 'Confirm'} /></View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={deleteMealModalVisible} transparent animationType="fade" onRequestClose={closeDeleteMealModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Remove logged meal?</Text>
            {mealToDelete ? (
              <>
                <Text style={styles.modalSubtitle}>{mealToDelete.product} · {mealToDelete.restaurant}</Text>
                <Text style={styles.modalSubtitleSecondary}>
                  {new Date(`${mealToDelete.date}Z`).toLocaleDateString()} ·{' '}
                  {mealToDelete.meal_type.charAt(0).toUpperCase() + mealToDelete.meal_type.slice(1)}
                </Text>
              </>
            ) : null}
            <View style={styles.modalButtonRow}>
              <View style={styles.modalButtonHalf}><ForgeButton onPress={closeDeleteMealModal} text="Cancel" /></View>
              <View style={styles.modalButtonHalf}><ForgeButton onPress={handleConfirmDeleteMeal} text={deletingMeal ? 'Removing...' : 'Confirm'} /></View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Tagged meal delete confirmation modal ─── */}
      <Modal visible={taggedMealToDelete !== null} transparent animationType="fade" onRequestClose={cancelDeleteTaggedMeal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete meal?</Text>
            <Text style={styles.modalSubtitle}>
              {savedMeals.find((m) => m.id === taggedMealToDelete)?.name ?? 'This meal'}
            </Text>
            <Text style={styles.modalSubtitleSecondary}>This action cannot be undone.</Text>
            <View style={styles.modalButtonRow}>
              <View style={styles.modalButtonHalf}><ForgeButton onPress={cancelDeleteTaggedMeal} text="Cancel" /></View>
              <View style={styles.modalButtonHalf}><ForgeButton onPress={confirmDeleteTaggedMeal} text="Delete" /></View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

/* ════════════════════════════════════════════════════ */
/*                      STYLES                          */
/* ════════════════════════════════════════════════════ */

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C?.bg ?? '#ffffff' },
  content: { padding: 20, paddingBottom: 48, gap: 20 },
  pageTitle: { color: C?.text ?? '#000000', fontSize: 28, fontWeight: '800', marginBottom: 4 },
  sectionCard: { backgroundColor: C?.surface ?? '#ffffff', borderWidth: 1, borderColor: C?.border ?? '#ffffff', borderRadius: 16, padding: 16, gap: 14 },
  sectionEyebrow: { color: C?.muted ?? '#5a5757', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
  input: { width: '100%', borderWidth: 1.5, borderColor: C?.border ?? '#8a93a7', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: C?.text ?? '#000000', backgroundColor: '#ffffff', fontSize: 15 },
  sectionLabel: { color: C?.text ?? '#000000', fontSize: 15, fontWeight: '700', marginTop: 4 },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  pillText: { fontSize: 13, fontWeight: '600' },
  rowGap: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  chipGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  chipText: { fontSize: 12, fontWeight: '600' },
  mealCard: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: C?.border ?? '#898f9f', borderRadius: 14, padding: 14, gap: 12 },
  mealCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mealCardTitle: { color: C?.text ?? '#000000', fontSize: 18, fontWeight: '800', flex: 1 },
  filterBlock: { gap: 10 },
  collapsible: { borderWidth: 1, borderColor: C?.border ?? '#e2e8f0', borderRadius: 12, overflow: 'hidden' },
  collapsibleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, backgroundColor: C?.surface ?? '#f8fafc' },
  collapsibleTitle: { fontSize: 15, fontWeight: '700', color: C?.text ?? '#000000' },
  collapsibleBadge: { fontSize: 11, fontWeight: '600', color: C?.orange ?? '#f97316', backgroundColor: colorWithAlpha(C?.orange ?? '#f97316', '18'), paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  collapsibleArrow: { fontSize: 10, color: C?.muted ?? '#6b7280' },
  collapsibleBody: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  resultsLabel: { color: C?.muted ?? '#40454e', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  emptyText: { color: '#474d56', fontSize: 14, lineHeight: 20 },
  cardList: { gap: 12 },
  errorText: { color: '#fca5a5', fontSize: 14, lineHeight: 20 },
  successText: { color: '#86efac', fontSize: 14, lineHeight: 20 },
  loader: { marginTop: 4 },
  restaurantList: { gap: 10 },
  restaurantMealRow: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: C?.border ?? '#9199ab', borderRadius: 12, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  restaurantMealInfo: { flex: 1, gap: 4 },
  restaurantMealName: { color: C?.text ?? '#000000', fontSize: 15, fontWeight: '700', flex: 1 },
  restaurantMealProtein: { color: C?.muted ?? '#434850', fontSize: 13, fontWeight: '600' },
  restaurantMealCalories: { color: C?.orange ?? '#f97316', fontSize: 14, fontWeight: '700' },
  restaurantMealStats: { alignItems: 'flex-end', gap: 2 },
  pageTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  calorieWidget: { backgroundColor: C?.surface ?? '#ffffff', borderWidth: 1, borderColor: C?.border ?? '#e2e8f0', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center' },
  calorieWidgetLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: C?.muted ?? '#6b7280' },
  calorieWidgetNumber: { fontSize: 28, fontWeight: '800', color: C?.orange ?? '#f97316' },
  calorieWidgetStats: { flexDirection: 'row', marginTop: 10, marginBottom: 10, backgroundColor: 'transparent', width: '100%', columnGap: 16 },
  calorieWidgetStat: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  calorieWidgetStatLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, color: '#6b7280', fontWeight: '700' },
  calorieWidgetStatValue: { fontSize: 16, fontWeight: '800', color: '#111827', marginTop: 2 },
  myMealList: { gap: 10 },
  myMealRow: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: C?.border ?? '#9199ab', borderRadius: 12, padding: 12, gap: 10 },
  myMealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nutritionScroll: { flexGrow: 0 },
  nutritionScrollContent: { gap: 8, paddingRight: 4 },
  nutritionChip: { backgroundColor: '#f1f5f9', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center', minWidth: 64 },
  nutritionChipLabel: { fontSize: 10, fontWeight: '700', color: C?.muted ?? '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  nutritionChipValue: { fontSize: 13, fontWeight: '700', color: C?.text ?? '#000000', marginTop: 2 },
  myMealMeta: { alignItems: 'flex-end', gap: 2 },
  myMealDate: { fontSize: 12, fontWeight: '600', color: C?.muted ?? '#6b7280' },
  myMealType: { fontSize: 12, fontWeight: '700', color: C?.orange ?? '#f97316' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 420, borderRadius: 16, backgroundColor: '#fff', padding: 20, gap: 12 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  modalSubtitle: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  modalOption: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, backgroundColor: '#f9fafb' },
  modalOptionText: { fontSize: 16, fontWeight: '600', color: '#111827' },
  modalOptionActive: { borderColor: '#f97316', backgroundColor: '#fff7ed' },
  modalOptionTextActive: { color: '#f97316' },
  modalButtonRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalButtonHalf: { flex: 1 },
  modalSubtitleSecondary: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: -4, marginBottom: 8 },

  /* ─── New styles for enhanced features ─── */
  tabRow: { flexDirection: 'row', gap: 6, backgroundColor: colorWithAlpha(C?.border ?? '#e2e8f0', '40'), borderRadius: 6, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 5, alignItems: 'center' },
  tabBtnActive: { backgroundColor: C?.orange ?? '#f97316' },
  tabBtnText: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, color: C?.muted ?? '#6b7280' },
  tabBtnTextActive: { color: '#ffffff' },
  miniLabel: { color: C?.muted ?? '#6b7280', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  rangeInput: { width: '100%', backgroundColor: C?.surface ?? '#ffffff', borderWidth: 1.5, borderColor: C?.border ?? '#8a93a7', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 7, color: C?.text ?? '#000000', fontSize: 13 },
  filterToggleLabel: { color: C?.muted ?? '#6b7280', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.2 },
  macroBadge: { alignItems: 'center', borderRadius: 5, paddingHorizontal: 8, paddingVertical: 5, minWidth: 44 },
  macroBadgeValue: { fontSize: 13, fontWeight: '700', lineHeight: 13 },
  macroBadgeLabel: { color: C?.muted ?? '#6b7280', fontSize: 8, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.6 },
  macroBadgeUnit: { color: C?.muted ?? '#6b7280', fontSize: 7, letterSpacing: 0.4 },
  browseSubheading: { fontSize: 8, color: C?.muted ?? '#6b7280', letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: '600' },
  browseExpandHeading: { color: C?.orange ?? '#f97316', fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: '700' },
  ingredientRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: 10, backgroundColor: C?.surface ?? '#ffffff', borderWidth: 1, borderColor: C?.border ?? '#e2e8f0', borderRadius: 6 },
  ingredientFieldLabel: { color: C?.muted ?? '#6b7280', fontSize: 8, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  ingredientRemoveBtn: { marginTop: 16, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: '#fef2f240', borderWidth: 1, borderColor: '#fca5a540', borderRadius: 4 },
});

/* ─── Macro Tracker styles ─── */
const trackerStyles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { flex: 1, minWidth: 70, backgroundColor: FORGE.cardBg, borderWidth: 1, borderColor: FORGE.cardBorder, borderRadius: 10, paddingTop: 16, paddingBottom: 12, paddingHorizontal: 6, alignItems: 'center', gap: 6, position: 'relative' },
  cardMet: { borderColor: FORGE.orange },
  cardNoGoal: { borderColor: FORGE.dim, opacity: 0.75 },
  swapBtn: { position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: FORGE.cardBorder, backgroundColor: FORGE.charcoal, alignItems: 'center', justifyContent: 'center' },
  barWrap: { width: '100%', paddingHorizontal: 8, paddingVertical: 10, alignItems: 'center', gap: 4 },
  barNum: { fontSize: 22, fontWeight: '700', color: FORGE.textPrimary, lineHeight: 24 },
  barUnit: { fontSize: 10, color: FORGE.steel, letterSpacing: 0.4, marginBottom: 4 },
  barTrack: { width: '100%', height: 6, backgroundColor: FORGE.trackEmpty, borderRadius: 3, flexDirection: 'row', overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  barOverflow: { fontSize: 9, fontWeight: '600', marginTop: 2 },
  barPrompt: { fontSize: 11, fontWeight: '500', color: FORGE.dim, letterSpacing: 0.4, textTransform: 'uppercase', textAlign: 'center', lineHeight: 14, paddingVertical: 10 },
  ringName: { fontSize: 13, fontWeight: '700', color: FORGE.textPrimary, textAlign: 'center', letterSpacing: 0.6, textTransform: 'uppercase' },
  ringStatus: { fontSize: 11, textAlign: 'center', minHeight: 13 },
  cfgRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cfgLabel: { fontSize: 10, color: FORGE.steel },
  cfgInput: { width: 50, paddingVertical: 3, paddingHorizontal: 4, borderRadius: 4, borderWidth: 1, borderColor: FORGE.cardBorder, backgroundColor: FORGE.charcoal, color: FORGE.textPrimary, fontSize: 11, textAlign: 'center' },
  clearGoalBtn: { width: 16, height: 16, borderRadius: 3, alignItems: 'center', justifyContent: 'center' },
  setGoalBtn: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 4, borderWidth: 1, borderColor: FORGE.orange },
  dirToggle: { flexDirection: 'row', borderRadius: 4, overflow: 'hidden', borderWidth: 1, borderColor: FORGE.cardBorder },
  dirBtn: { flex: 1, paddingVertical: 2, paddingHorizontal: 5, alignItems: 'center' },
  dirBtnActive: { backgroundColor: FORGE.orange },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(18,17,16,0.9)', borderRadius: 10, zIndex: 10, alignItems: 'center', justifyContent: 'center', gap: 8 },
  ovLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', color: FORGE.steel },
  ovInput: { width: 86, paddingVertical: 7, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, borderColor: FORGE.orange, backgroundColor: FORGE.charcoal, color: FORGE.textPrimary, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  ovBtn: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 5, borderWidth: 1, borderColor: FORGE.cardBorder, backgroundColor: FORGE.charcoal },
  ovBtnConfirm: { backgroundColor: FORGE.orange, borderColor: FORGE.orange },
  picker: { backgroundColor: FORGE.cardBg, borderWidth: 1, borderColor: FORGE.cardBorder, borderRadius: 10, padding: 16, marginBottom: 12 },
  pickerTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: FORGE.orange, marginBottom: 10 },
  pickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  pickerItem: { paddingVertical: 9, paddingHorizontal: 6, borderRadius: 7, borderWidth: 1, borderColor: FORGE.cardBorder, backgroundColor: FORGE.charcoal, alignItems: 'center', gap: 2, minWidth: 70 },
  pickerItemCurrent: { borderColor: FORGE.orange, backgroundColor: '#2A2826' },
  pickerItemName: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: FORGE.textPrimary },
  pickerItemUnit: { fontSize: 10, color: FORGE.steel },
  doneBtn: { paddingVertical: 5, paddingHorizontal: 16, borderRadius: 5, borderWidth: 1, borderColor: FORGE.cardBorder },
});
