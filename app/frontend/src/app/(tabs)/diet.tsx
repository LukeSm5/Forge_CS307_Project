import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';

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
  sodium_mg?: boolean;
};

type ProteinFilter = 'chicken' | null;

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

    if (!trimmed) {
      setRestaurantError('Please enter a restaurant name.');
      return;
    }

    setRestaurantLoading(true);
    setRestaurantError('');
    setProteinFilter(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/meals/restaurant/${encodeURIComponent(trimmed)}`
      );

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      setRestaurantMeals(Array.isArray(data) ? data : []);
    } catch (err) {
      setRestaurantMeals([]);
      setRestaurantError(
        'Could not load restaurant meals. Check that your API is running and reachable from the app.'
      );
    } finally {
      setRestaurantLoading(false);
    }
  };


  const fetchMealsByProtein = async (protein: ProteinFilter) => {
    if (!protein) {
      setProteinFilter(null);
      setRestaurantError('');
      return;
    }

    setRestaurantLoading(true);
    setRestaurantError('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/meals/protein/${encodeURIComponent(protein)}`
      );

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();
      setRestaurantMeals(Array.isArray(data) ? data : []);
      setProteinFilter(protein);
    } catch (err) {
      setRestaurantMeals([]);
      setRestaurantError(
        'Could not load protein-filtered menu meals. Check that your API is running and reachable from the app.'
      );
    } finally {
      setRestaurantLoading(false);
    }
  };

  const filteredRestaurantMeals = useMemo(() => {
    return restaurantMeals;
  }, [restaurantMeals]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Diet</Text>

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
        <TextInput
          style={styles.input}
          placeholder="Enter restaurant"
          placeholderTextColor="#6b7280"
          value={restaurant}
          onChangeText={setRestaurant}
          returnKeyType="search"
          onSubmitEditing={searchMeals}
        />

        <ForgeButton onPress={searchMeals} text={'Search'} />

        {restaurantLoading ? <ActivityIndicator style={styles.loader} /> : null}
        {restaurantError ? <Text style={styles.errorText}>{restaurantError}</Text> : null}

        <FlatList
          data={filteredRestaurantMeals}
          keyExtractor={(item) => String(item.id)}
          scrollEnabled={false}
          contentContainerStyle={filteredRestaurantMeals.length ? styles.restaurantList : undefined}
          renderItem={({ item }) => (
            <View style={styles.restaurantMealRow}>
              <View style={styles.restaurantMealInfo}>
                <Text style={styles.restaurantMealName}>{item.product}</Text>
                <Text style={styles.restaurantMealProtein}>
                  {item.restaurant} · {item.category}
                </Text>
              </View>
              <Text style={styles.restaurantMealCalories}>
                {item.energy_kcal ?? 0} cal
              </Text>
            </View>
          )}
        />
      </SectionCard>

      <SectionCard title="Menu Meal Filter">
        <Text style={styles.sectionLabel}>Protein</Text>
        <View style={styles.pillWrap}>
          <Pill
            label="chicken"
            active={proteinFilter === 'chicken'}
            color={C?.amber ?? '#f5c56b'}
            onPress={() => {
              const nextProtein = proteinFilter === 'chicken' ? null : 'chicken';

              if (nextProtein) {
                fetchMealsByProtein(nextProtein);
              } else {
                setProteinFilter(null);
              }
            }}
          />
        </View>

        <Text style={styles.resultsLabel}>
          {filteredRestaurantMeals.length} menu meal{filteredRestaurantMeals.length === 1 ? '' : 's'}
          {proteinFilter ? ' matching protein filter' : ' available'}
        </Text>

        <ForgeButton
          onPress={() => {
            setProteinFilter(null);
          }}
          text={'Clear Protein Filter'}
        />
      </SectionCard>
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
});
