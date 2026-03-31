import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  Modal
} from 'react-native';

import { useAuth } from '@/core/auth';

import ForgeButton from '@/components/ForgeButton'; // Adjust path if needed
import { Text, View } from '@/components/Themed';
import {
  TaggedMeal,
  MealTagSet,
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
  EMPTY_TAGS,
  C,
} from '../mealTypes';

import { api } from '../../core/api'

type FilterState = Partial<Omit<MealTagSet, 'dietary'>> & { dietary: Dietary[] };

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
  beef?: boolean
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

const EMPTY_FILTER: FilterState = {
  spiceLevel: null,
  cuisine: null,
  complexity: null,
  goal: null,
  prepTime: null,
  cookTime: null,
  dietary: [],
};

const colorWithAlpha = (hex: string, alpha = '22') => `${hex}${alpha}`;

const formatLabel = (value: string) => value.replace(/_/g, ' ');

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

function MealCard({
  meal,
  onEdit,
  onDelete,
}: {
  meal: TaggedMeal;
  onEdit: (meal: TaggedMeal) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <View style={styles.mealCard}>
      <View style={styles.mealCardHeader}>
        <Text style={styles.mealCardTitle}>{meal.name}</Text>
      </View>

      <MealMetaChips tags={meal.tags} />

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

export default function Diet() {
  const [savedMeals, setSavedMeals] = useState<TaggedMeal[]>([]);
  const [editing, setEditing] = useState<TaggedMeal | null>(null);

  const [name, setName] = useState('');
  const [tags, setTags] = useState<MealTagSet>({ ...EMPTY_TAGS, dietary: [] });
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER);

  const [restaurant, setRestaurant] = useState('');
  const [restaurantMeals, setRestaurantMeals] = useState<RestaurantMeal[]>([]);
  
  const [restaurantLoading, setRestaurantLoading] = useState(false);
  const [restaurantError, setRestaurantError] = useState('');
  const [proteinFilter, setProteinFilter] = useState<ProteinFilter>(null);
  const [proteinFetched, setProteinFetched] = useState(false);
  const [minProtein, setMinProtein] = useState('');

  const [calorieGoal, setCalorieGoal] = useState<number | null>(null);


  const [myMealFilter, setMyMealFilter] = useState<'at_home' | 'restaurant'>('restaurant');

  const [loggedMenuMeals, setLoggedMenuMeals] = useState<LoggedMenuMeal[]>([]);
  const [loggedMealsLoading, setLoggedMealsLoading] = useState(false);

  const [mealTypeModalVisible, setMealTypeModalVisible] = useState(false);
  const [selectedMenuMeal, setSelectedMenuMeal] = useState<RestaurantMeal | null>(null);
  const [deleteMealModalVisible, setDeleteMealModalVisible] = useState(false);
  const [mealToDelete, setMealToDelete] = useState<LoggedMenuMeal | null>(null);
  const [deletingMeal, setDeletingMeal] = useState(false);

  const [loggingMeal, setLoggingMeal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealTypeOption | null>(null);

  

  const API_BASE_URL = 'http://localhost:8000';

  useEffect(() => {
    setName(editing?.name ?? '');
    setTags(
      editing?.tags
        ? { ...editing.tags, dietary: [...editing.tags.dietary] }
        : { ...EMPTY_TAGS, dietary: [] }
    );
    setError('');
    setSaved(false);
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

  const validateMeal = () => {
    if (!name.trim()) return 'Meal name is required.';
    if (!tags.spiceLevel) return 'Select a spice level.';
    if (!tags.cuisine) return 'Select a cuisine.';
    if (!tags.complexity) return 'Select a complexity.';
    if (!tags.goal) return 'Select a goal.';
    if (!tags.prepTime) return 'Select a prep time.';
    if (!tags.cookTime) return 'Select a cook time.';
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
      tags: {
        ...tags,
        dietary: [...tags.dietary],
      },
    };

    setSavedMeals((current) => {
      if (editing) {
        return current.map((meal) => (meal.id === editing.id ? payload : meal));
      }
      return [payload, ...current];
    });

    setError('');
    setSaved(true);

    if (editing) {
      setEditing(null);
    } else {
      setName('');
      setTags({ ...EMPTY_TAGS, dietary: [] });
    }

    setTimeout(() => setSaved(false), 2500);
  };

  const handleDeleteMeal = (id: number) => {
    Alert.alert('Delete meal', 'Are you sure you want to remove this meal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setSavedMeals((current) => current.filter((meal) => meal.id !== id));
          if (editing?.id === id) {
            setEditing(null);
          }
        },
      },
    ]);
  };

  const handleCancelEdit = () => {
    setEditing(null);
    setName('');
    setTags({ ...EMPTY_TAGS, dietary: [] });
    setError('');
    setSaved(false);
  };

  const toggleFilter = <K extends keyof Omit<FilterState, 'dietary'>>(key: K, value: FilterState[K]) => {
    setFilter((current) => ({
      ...current,
      [key]: current[key] === value ? null : value,
    }));
  };

  const toggleDietaryFilter = (value: Dietary) => {
    setFilter((current) => ({
      ...current,
      dietary: current.dietary.includes(value)
        ? current.dietary.filter((item) => item !== value)
        : [...current.dietary, value],
    }));
  };

  const clearFilters = () => setFilter(EMPTY_FILTER);

  const filteredMeals = useMemo(() => {
    return savedMeals.filter((meal) => {
      if (filter.spiceLevel && meal.tags.spiceLevel !== filter.spiceLevel) return false;
      if (filter.cuisine && meal.tags.cuisine !== filter.cuisine) return false;
      if (filter.complexity && meal.tags.complexity !== filter.complexity) return false;
      if (filter.goal && meal.tags.goal !== filter.goal) return false;
      if (filter.prepTime && meal.tags.prepTime !== filter.prepTime) return false;
      if (filter.cookTime && meal.tags.cookTime !== filter.cookTime) return false;
      if (filter.dietary.length > 0 && !filter.dietary.every((d) => meal.tags.dietary.includes(d))) {
        return false;
      }
      return true;
    });
  }, [savedMeals, filter]);

  const consumedCalories = useMemo(() => {
    return loggedMenuMeals.reduce((sum, meal) => sum + (meal.energy_kcal ?? 0), 0);
  }, [loggedMenuMeals]);

  const remainingCalories = useMemo(() => {
    if (calorieGoal == null) return null;
    return Math.max(Math.round(calorieGoal) - consumedCalories, 0);
  }, [calorieGoal, consumedCalories]);

  const activeFilterCount = [
    filter.spiceLevel,
    filter.cuisine,
    filter.complexity,
    filter.goal,
    filter.prepTime,
    filter.cookTime,
  ].filter(Boolean).length + filter.dietary.length;

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
        // min protein only — fetch all meals from DB
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
    // toggle off
    if (proteinFilter === protein) {
      setProteinFilter(null);
      if (proteinFetched) {
        setRestaurantMeals([]);  // clear only if results came from protein fetch
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
        setProteinFetched(true);  // mark that results came from protein fetch
      } catch (err) {
        setRestaurantError('Could not load protein-filtered meals.');
      } finally {
        setRestaurantLoading(false);
      }
    } else {
      setProteinFetched(false);  // results came from restaurant search
    }
  };


  const filteredRestaurantMeals = useMemo(() => {
    let meals = restaurantMeals;

    if (proteinFilter) {
      meals = meals.filter((meal) => meal[proteinFilter] === true);
    }

    const minP = parseFloat(minProtein);
    if (!isNaN(minP)) {
      meals = meals.filter((meal) => (meal.protein_g ?? 0) >= minP);
    }

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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
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

            <ForgeButton onPress={() => {}} text="Recalibrate" />
          </View>
      </View>
      
      <SectionCard title="My Meals">
        <View style={styles.pillWrap}>
          <Pill
            label="At Home"
            active={myMealFilter === 'at_home'}
            color={C?.orange ?? '#f97316'}
            onPress={() => setMyMealFilter('at_home')}
          />
          <Pill
            label="Restaurant"
            active={myMealFilter === 'restaurant'}
            color={C?.orange ?? '#f97316'}
            onPress={() => setMyMealFilter('restaurant')}
          />
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
                      <Text style={styles.restaurantMealProtein}>
                        {item.restaurant} · {item.category}
                      </Text>
                    </View>
                    <View style={styles.myMealMeta}>
                      <Text style={styles.myMealDate}>
                        {new Date(`${item.date}Z`).toLocaleDateString()}
                      </Text>

                      <Text style={styles.myMealType}>
                        {item.meal_type.charAt(0).toUpperCase() + item.meal_type.slice(1)}
                      </Text>
                      <ForgeButton onPress={() => openDeleteMealModal(item)} text="-" />
                      <Text style={styles.addButtonText}>-</Text>
                    </View>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.nutritionScroll}
                    contentContainerStyle={styles.nutritionScrollContent}
                  >
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


      <SectionCard title={editing ? 'Meal Tagging · Edit Meal' : 'Meal Tagging · Add Meal'}>
        <Text style={styles.sectionLabel}>Meal Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Grilled Chicken & Rice"
          placeholderTextColor="#6b7280"
          style={styles.input}
          returnKeyType="done"
          onSubmitEditing={handleSaveMeal}
        />

        <Text style={styles.sectionLabel}>Spice Level</Text>
        <View style={styles.pillWrap}>
          {SPICE_LEVELS.map((value: SpiceLevel) => (
            <Pill
              key={value}
              label={value}
              active={tags.spiceLevel === value}
              color={SPICE_COLOR[value]}
              onPress={() => setSingleTag('spiceLevel', value)}
            />
          ))}
        </View>

        <Text style={styles.sectionLabel}>Cuisine</Text>
        <View style={styles.pillWrap}>
          {CUISINES.map((value: Cuisine) => (
            <Pill
              key={value}
              label={value}
              active={tags.cuisine === value}
              color={C?.amber ?? '#f5c56b'}
              onPress={() => setSingleTag('cuisine', value)}
            />
          ))}
        </View>

        <Text style={styles.sectionLabel}>Complexity</Text>
        <View style={styles.pillWrap}>
          {COMPLEXITIES.map((value: Complexity) => (
            <Pill
              key={value}
              label={value}
              active={tags.complexity === value}
              color={COMPLEXITY_COLOR[value]}
              onPress={() => setSingleTag('complexity', value)}
            />
          ))}
        </View>

        <Text style={styles.sectionLabel}>Goal</Text>
        <View style={styles.pillWrap}>
          {GOALS.map((value: Goal) => (
            <Pill
              key={value}
              label={value}
              active={tags.goal === value}
              color={GOAL_COLOR[value]}
              onPress={() => setSingleTag('goal', value)}
            />
          ))}
        </View>

        <Text style={styles.sectionLabel}>Prep Time</Text>
        <View style={styles.pillWrap}>
          {TIME_LABELS.map((value: TimeLabel) => (
            <Pill
              key={value}
              label={value}
              active={tags.prepTime === value}
              color={TIME_COLOR[value]}
              onPress={() => setSingleTag('prepTime', value)}
            />
          ))}
        </View>

        <Text style={styles.sectionLabel}>Cook Time</Text>
        <View style={styles.pillWrap}>
          {TIME_LABELS.map((value: TimeLabel) => (
            <Pill
              key={value}
              label={value}
              active={tags.cookTime === value}
              color={TIME_COLOR[value]}
              onPress={() => setSingleTag('cookTime', value)}
            />
          ))}
        </View>

        <Text style={styles.sectionLabel}>Dietary Restrictions (Optional)</Text>
        <View style={styles.pillWrap}>
          {DIETARY_OPTS.map((value: Dietary) => (
            <Pill
              key={value}
              label={value}
              active={tags.dietary.includes(value)}
              color={C?.amber ?? '#f5c56b'}
              onPress={() => toggleDietaryTag(value)}
            />
          ))}
        </View>

        {error ? <Text style={styles.errorText}>⚠ {error}</Text> : null}
        {saved ? <Text style={styles.successText}>✓ Meal saved successfully.</Text> : null}

        <View style={styles.rowGap}>
          {editing ? (
            <View style={styles.flex1}>
              <ForgeButton onPress={handleCancelEdit} text={'Cancel'} />
            </View>
          ) : null}
          <View style={[styles.flex1, editing ? styles.flex2 : undefined]}>
            <ForgeButton onPress={handleSaveMeal} text={editing ? 'Update Meal' : 'Save Meal'} />
          </View>
        </View>
      </SectionCard>

      <SectionCard title={`Meal Browser${activeFilterCount ? ` · ${activeFilterCount} Active Filters` : ''}`}>
        <FilterSection
          title="Spice"
          values={SPICE_LEVELS}
          activeValue={filter.spiceLevel}
          colorFor={(value) => SPICE_COLOR[value as SpiceLevel]}
          onPress={(value) => toggleFilter('spiceLevel', value as SpiceLevel)}
        />

        <FilterSection
          title="Cuisine"
          values={CUISINES}
          activeValue={filter.cuisine}
          colorFor={() => C?.amber ?? '#f5c56b'}
          onPress={(value) => toggleFilter('cuisine', value as Cuisine)}
        />

        <FilterSection
          title="Complexity"
          values={COMPLEXITIES}
          activeValue={filter.complexity}
          colorFor={(value) => COMPLEXITY_COLOR[value as Complexity]}
          onPress={(value) => toggleFilter('complexity', value as Complexity)}
        />

        <FilterSection
          title="Goal"
          values={GOALS}
          activeValue={filter.goal}
          colorFor={(value) => GOAL_COLOR[value as Goal]}
          onPress={(value) => toggleFilter('goal', value as Goal)}
        />

        <FilterSection
          title="Prep Time"
          values={TIME_LABELS}
          activeValue={filter.prepTime}
          colorFor={(value) => TIME_COLOR[value as TimeLabel]}
          onPress={(value) => toggleFilter('prepTime', value as TimeLabel)}
        />

        <FilterSection
          title="Cook Time"
          values={TIME_LABELS}
          activeValue={filter.cookTime}
          colorFor={(value) => TIME_COLOR[value as TimeLabel]}
          onPress={(value) => toggleFilter('cookTime', value as TimeLabel)}
        />

        <View style={styles.filterBlock}>
          <Text style={styles.sectionLabel}>Dietary</Text>
          <View style={styles.pillWrap}>
            {DIETARY_OPTS.map((value: Dietary) => (
              <Pill
                key={value}
                label={value}
                active={filter.dietary.includes(value)}
                color={C?.amber ?? '#f5c56b'}
                onPress={() => toggleDietaryFilter(value)}
              />
            ))}
          </View>
        </View>

        <ForgeButton onPress={clearFilters} text={'Clear Filters'} />

        <Text style={styles.resultsLabel}>
          {filteredMeals.length} meal{filteredMeals.length === 1 ? '' : 's'}
          {activeFilterCount ? ' matching filters' : ' total'}
        </Text>

        {filteredMeals.length === 0 ? (
          <Text style={styles.emptyText}>No meals match these filters.</Text>
        ) : (
          <View style={styles.cardList}>
            {filteredMeals.map((meal) => (
              <MealCard key={meal.id} meal={meal} onEdit={setEditing} onDelete={handleDeleteMeal} />
            ))}
          </View>
        )}
      </SectionCard>

      <SectionCard title="Menu Meal Search">
        <View style={styles.rowGap}>
          <View style={styles.flex1}>
            <TextInput
              style={styles.input}
              placeholder="Enter restaurant"
              placeholderTextColor="#6b7280"
              value={restaurant}
              onChangeText={setRestaurant}
              returnKeyType="search"
              onSubmitEditing={searchMeals}
            />
          </View>
          <View style={styles.flex1}>
            <TextInput
              style={styles.input}
              placeholder="Min protein (g)"
              placeholderTextColor="#6b7280"
              value={minProtein}
              onChangeText={setMinProtein}
              keyboardType="numeric"
              returnKeyType="done"
            />
          </View>
        </View>

        <View style={styles.pillWrap}>
          <Pill
            label="chicken"
            active={proteinFilter === 'chicken'}
            color={C?.amber ?? '#f5c56b'}
            onPress={() => handleProteinPress('chicken')}
          />
          <Pill
            label="beef"
            active={proteinFilter === 'beef'}
            color={C?.amber ?? '#f5c56b'}
            onPress={() => handleProteinPress('beef')}
          />
        </View>

        <View style={styles.rowGap}>
          <View style={styles.flex1}>
            <ForgeButton onPress={searchMeals} text={'Search'} />
          </View>
          <View style={styles.flex1}>
            <ForgeButton
              onPress={() => {
                setRestaurant('');
                setRestaurantMeals([]);
                setProteinFilter(null);
                setProteinFetched(false);
                setMinProtein('');
                setRestaurantError('');
              }}
              text={'Clear'}
            />
          </View>
        </View>

        {restaurantLoading ? <ActivityIndicator style={styles.loader} /> : null}
        {restaurantError ? <Text style={styles.errorText}>{restaurantError}</Text> : null}

        <View style={filteredRestaurantMeals.length ? styles.restaurantList : undefined}>
          {filteredRestaurantMeals.map((item, index) => (
            <View
              key={item.id != null ? String(item.id) : String(index)}
              style={styles.restaurantMealRow}
            >
              <View style={styles.restaurantMealInfo}>
                <Text style={styles.restaurantMealName}>{item.product}</Text>
                <Text style={styles.restaurantMealProtein}>
                  {item.restaurant} · {item.category}
                </Text>
              </View>
              <View style={styles.restaurantMealStats}>
                <Text style={styles.restaurantMealCalories}>
                  {item.protein_g ?? 0}g protein
                </Text>
                <Text style={styles.restaurantMealCalories}>
                  {item.energy_kcal ?? 0} cal
                </Text>
              </View>
              <ForgeButton onPress={() => openMealTypeModal(item)} text="+" />
              <Text style={styles.addButtonText}>+</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <Modal
        visible={mealTypeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMealTypeModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Log meal as</Text>

            {selectedMenuMeal ? (
              <Text style={styles.modalSubtitle}>
                {selectedMenuMeal.product} · {selectedMenuMeal.restaurant}
              </Text>
            ) : null}

            {(['breakfast', 'lunch', 'dinner', 'snack'] as MealTypeOption[]).map((option) => {
              const active = selectedMealType === option;

              return (
                <Pressable
                  key={option}
                  disabled={loggingMeal}
                  onPress={() => setSelectedMealType(option)}
                  style={({ pressed }) => [
                    styles.modalOption,
                    active && styles.modalOptionActive,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      active && styles.modalOptionTextActive,
                    ]}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </Pressable>
              );
            })}

            <View style={styles.modalButtonRow}>
              <View style={styles.modalButtonHalf}>
                <ForgeButton onPress={closeMealTypeModal} text="Cancel" />
              </View>
              <View style={styles.modalButtonHalf}>
                <ForgeButton
                  onPress={handleConfirmMealType}
                  text={loggingMeal ? 'Saving...' : 'Confirm'}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={deleteMealModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeDeleteMealModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Remove logged meal?</Text>

            {mealToDelete ? (
              <>
                <Text style={styles.modalSubtitle}>
                  {mealToDelete.product} · {mealToDelete.restaurant}
                </Text>

                <Text style={styles.modalSubtitleSecondary}>
                  {new Date(`${mealToDelete.date}Z`).toLocaleDateString()} ·{" "}
                  {mealToDelete.meal_type.charAt(0).toUpperCase() +
                    mealToDelete.meal_type.slice(1)}
                </Text>
              </>
            ) : null}

            <View style={styles.modalButtonRow}>
              <View style={styles.modalButtonHalf}>
                <ForgeButton onPress={closeDeleteMealModal} text="Cancel" />
              </View>
              <View style={styles.modalButtonHalf}>
                <ForgeButton
                  onPress={handleConfirmDeleteMeal}
                  text={deletingMeal ? 'Removing...' : 'Confirm'}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C?.bg ?? '#ffffff',
  },
  content: {
    padding: 20,
    paddingBottom: 48,
    gap: 20,
  },
  pageEyebrow: {
    color: C?.orange ?? '#f97316',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  pageTitle: {
    color: C?.text ?? '#000000',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  sectionCard: {
    backgroundColor: C?.surface ?? '#ffffff',
    borderWidth: 1,
    borderColor: C?.border ?? '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  sectionEyebrow: {
    color: C?.muted ?? '#5a5757',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  inputLabel: {
    color: C?.muted ?? '#666b75',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: C?.border ?? '#8a93a7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: C?.text ?? '#000000',
    backgroundColor: '#ffffff',
    fontSize: 15,
  },
  sectionLabel: {
    color: C?.text ?? '#000000',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  rowGap: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mealCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: C?.border ?? '#898f9f',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  mealCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealCardTitle: {
    color: C?.text ?? '#000000',
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
  },
  filterBlock: {
    gap: 10,
  },
  resultsLabel: {
    color: C?.muted ?? '#40454e',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  emptyText: {
    color: '#474d56',
    fontSize: 14,
    lineHeight: 20,
  },
  cardList: {
    gap: 12,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 14,
    lineHeight: 20,
  },
  successText: {
    color: '#86efac',
    fontSize: 14,
    lineHeight: 20,
  },
  loader: {
    marginTop: 4,
  },
  restaurantList: {
    gap: 10,
  },
  restaurantMealRow: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: C?.border ?? '#9199ab',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  restaurantMealInfo: {
    flex: 1,
    gap: 4,
  },
  restaurantMealName: {
    color: C?.text ?? '#000000',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  restaurantMealProtein: {
    color: C?.muted ?? '#434850',
    fontSize: 13,
    fontWeight: '600',
  },
  restaurantMealCalories: {
    color: C?.orange ?? '#f97316',
    fontSize: 14,
    fontWeight: '700',
  },
  restaurantMealStats: {
    alignItems: 'flex-end',
    gap: 2,
  },

  pageTitleRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 4,
  },
  calorieWidget: {
    backgroundColor: C?.surface ?? '#ffffff',
    borderWidth: 1,
    borderColor: C?.border ?? '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  calorieWidgetLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: C?.muted ?? '#6b7280',
  },
  calorieWidgetNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: C?.orange ?? '#f97316',
  },

  myMealList: {
    gap: 10,
  },
  myMealRow: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: C?.border ?? '#9199ab',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  myMealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nutritionScroll: {
    flexGrow: 0,
  },
  nutritionScrollContent: {
    gap: 8,
    paddingRight: 4,
  },
  nutritionChip: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 64,
  },
  nutritionChipLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C?.muted ?? '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nutritionChipValue: {
    fontSize: 13,
    fontWeight: '700',
    color: C?.text ?? '#000000',
    marginTop: 2,
  },
  myMealMeta: {
    alignItems: 'flex-end',
    gap: 2,
  },
  myMealDate: {
    fontSize: 12,
    fontWeight: '600',
    color: C?.muted ?? '#6b7280',
  },
  myMealType: {
    fontSize: 12,
    fontWeight: '700',
    color: C?.orange ?? '#f97316',
  },

  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f97316',
    alignSelf: 'center',
  },

  addButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 24,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 20,
    gap: 12,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },

  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },

  modalOption: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
  },

  modalOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },

  modalOptionActive: {
    borderColor: '#f97316',
    backgroundColor: '#fff7ed',
  },

  modalOptionTextActive: {
    color: '#f97316',
  },

  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },

  modalButtonHalf: {
    flex: 1,
  },

  myMealActionButton: {
    marginTop: 8,
  },
  modalSubtitleSecondary: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: -4,
    marginBottom: 8,
  },

  calorieWidgetStats: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: 'transparent',
    width: '100%',
    columnGap: 16,
  },
  calorieWidgetStat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  calorieWidgetStatLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#6b7280',
    fontWeight: '700',
  },
  calorieWidgetStatValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2,
  },
  calorieWidgetButton: {
    marginTop: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d4d8e1',
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
  },
  calorieWidgetButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2e2f30',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
