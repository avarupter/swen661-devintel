import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  History,
  NotebookPen,
  Plus,
  Utensils,
} from 'lucide-react';

import { scheduleItems as initialItems } from '../data/mockData';
import type { ScheduleItem } from '../types';

const TODAY_DATE =
  new Date().toISOString().split('T')[0];

const LS_DONE_KEY =
  'careconnect_schedule_done';

const LS_MEAL_DETAILS_KEY =
  'careconnect_meal_details';

const LS_FOOD_HISTORY_KEY =
  'careconnect_food_history';

interface StoredDone {
  date: string;
  ids: string[];
}

interface MealDetail {
  food: string;
  notes: string;
}

interface StoredMealDetails {
  date: string;
  details: Record<string, MealDetail>;
}

type MealKey =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'meal';

type FoodHistory =
  Partial<Record<MealKey, string[]>>;

const COMMON_FOODS: Record<
  MealKey,
  string[]
> = {
  breakfast: [
    'Eggs',
    'Oatmeal',
    'Toast',
    'Fruit',
    'Yogurt',
    'Cereal',
    'Pancakes',
    'Breakfast sandwich',
  ],

  lunch: [
    'Sandwich',
    'Soup',
    'Salad',
    'Chicken',
    'Rice',
    'Vegetables',
    'Pasta',
    'Fruit',
  ],

  dinner: [
    'Chicken',
    'Fish',
    'Pasta',
    'Rice',
    'Vegetables',
    'Soup',
    'Salad',
    'Potatoes',
  ],

  meal: [
    'Chicken',
    'Rice',
    'Soup',
    'Salad',
    'Fruit',
    'Vegetables',
  ],
};

const categoryLabel: Record<
  ScheduleItem['category'],
  string
> = {
  meal: 'Meal',
  medication: 'Medicine',
  activity: 'Activity',
  appointment: 'Appointment',
  rest: 'Rest',
};

const categoryColour: Record<
  ScheduleItem['category'],
  string
> = {
  meal: 'bg-warm-100 text-warm-700',
  medication: 'bg-calm-100 text-calm-700',
  activity: 'bg-success-100 text-success-700',
  appointment: 'bg-neutral-200 text-neutral-700',
  rest: 'bg-neutral-100 text-neutral-600',
};

function formatTime(time: string) {
  const [h, m] =
    time.split(':').map(Number);

  const suffix =
    h >= 12 ? 'pm' : 'am';

  return `${h % 12 || 12}:${String(
    m,
  ).padStart(2, '0')} ${suffix}`;
}

function getMealKey(
  item: ScheduleItem,
): MealKey {
  const label =
    item.label.toLowerCase();

  if (label.includes('breakfast')) {
    return 'breakfast';
  }

  if (label.includes('lunch')) {
    return 'lunch';
  }

  if (label.includes('dinner')) {
    return 'dinner';
  }

  return 'meal';
}

function normaliseFood(
  value: string,
) {
  return value
    .trim()
    .toLowerCase();
}

function parseFoodInput(
  value: string,
): string[] {
  return value
    .split(/[,;\n]+/)
    .map((food) => food.trim())
    .filter(Boolean);
}

function extractFoodsForHistory(
  value: string,
): string[] {
  return value
    .split(
      /[,;\n]+|\s+\band\b\s+/i,
    )
    .map((food) => food.trim())
    .filter(
      (food) =>
        food.length >= 2,
    );
}

function foodIsSelected(
  currentValue: string,
  food: string,
) {
  const normalisedFood =
    normaliseFood(food);

  return parseFoodInput(
    currentValue,
  ).some(
    (item) =>
      normaliseFood(item) ===
      normalisedFood,
  );
}

function loadScheduleItems():
  ScheduleItem[] {
  try {
    const raw =
      localStorage.getItem(
        LS_DONE_KEY,
      );

    if (!raw) {
      return initialItems.map(
        (item) => ({
          ...item,
        }),
      );
    }

    const stored =
      JSON.parse(
        raw,
      ) as StoredDone;

    if (
      stored.date !== TODAY_DATE
    ) {
      return initialItems.map(
        (item) => ({
          ...item,
        }),
      );
    }

    const doneIds =
      new Set(stored.ids);

    return initialItems.map(
      (item) => ({
        ...item,
        done: doneIds.has(
          item.id,
        ),
      }),
    );
  } catch {
    return initialItems.map(
      (item) => ({
        ...item,
      }),
    );
  }
}

function saveScheduleItems(
  items: ScheduleItem[],
) {
  try {
    const stored: StoredDone = {
      date: TODAY_DATE,

      ids: items
        .filter(
          (item) => item.done,
        )
        .map(
          (item) => item.id,
        ),
    };

    localStorage.setItem(
      LS_DONE_KEY,
      JSON.stringify(stored),
    );
  } catch {
    // App remains usable if
    // browser storage is unavailable.
  }
}

function loadMealDetails():
  Record<string, MealDetail> {
  try {
    const raw =
      localStorage.getItem(
        LS_MEAL_DETAILS_KEY,
      );

    if (!raw) {
      return {};
    }

    const stored =
      JSON.parse(
        raw,
      ) as StoredMealDetails;

    if (
      stored.date !== TODAY_DATE
    ) {
      return {};
    }

    return stored.details ?? {};
  } catch {
    return {};
  }
}

function saveMealDetails(
  details: Record<
    string,
    MealDetail
  >,
) {
  try {
    const stored:
      StoredMealDetails = {
        date: TODAY_DATE,
        details,
      };

    localStorage.setItem(
      LS_MEAL_DETAILS_KEY,
      JSON.stringify(stored),
    );
  } catch {
    // App remains usable if
    // browser storage is unavailable.
  }
}

function loadFoodHistory():
  FoodHistory {
  try {
    const raw =
      localStorage.getItem(
        LS_FOOD_HISTORY_KEY,
      );

    return raw
      ? (JSON.parse(
          raw,
        ) as FoodHistory)
      : {};
  } catch {
    return {};
  }
}

function saveFoodHistory(
  history: FoodHistory,
) {
  try {
    localStorage.setItem(
      LS_FOOD_HISTORY_KEY,
      JSON.stringify(history),
    );
  } catch {
    // App remains usable if
    // browser storage is unavailable.
  }
}

export default function Schedule() {
  const [items, setItems] =
    useState<ScheduleItem[]>(
      loadScheduleItems,
    );

  const [
    mealDetails,
    setMealDetails,
  ] = useState<
    Record<string, MealDetail>
  >(loadMealDetails);

  const [
    foodHistory,
    setFoodHistory,
  ] = useState<FoodHistory>(
    loadFoodHistory,
  );

  useEffect(() => {
    saveScheduleItems(items);
  }, [items]);

  useEffect(() => {
    saveMealDetails(
      mealDetails,
    );
  }, [mealDetails]);

  useEffect(() => {
    saveFoodHistory(
      foodHistory,
    );
  }, [foodHistory]);

  const doneCount =
    items.filter(
      (item) => item.done,
    ).length;

  const progress =
    items.length > 0
      ? Math.round(
          (doneCount /
            items.length) *
            100,
        )
      : 0;

  function toggleDone(
    id: string,
  ) {
    setItems((previous) =>
      previous.map(
        (item) =>
          item.id === id
            ? {
                ...item,
                done:
                  !item.done,
              }
            : item,
      ),
    );
  }

  function updateMealDetail(
    id: string,
    field: keyof MealDetail,
    value: string,
  ) {
    setMealDetails(
      (previous) => ({
        ...previous,

        [id]: {
          food:
            previous[id]
              ?.food ?? '',

          notes:
            previous[id]
              ?.notes ?? '',

          [field]: value,
        },
      }),
    );
  }

  function toggleFoodChoice(
    itemId: string,
    food: string,
  ) {
    const current =
      mealDetails[itemId]
        ?.food ?? '';

    const currentFoods =
      parseFoodInput(
        current,
      );

    const selected =
      foodIsSelected(
        current,
        food,
      );

    const updatedFoods =
      selected
        ? currentFoods.filter(
            (item) =>
              normaliseFood(
                item,
              ) !==
              normaliseFood(
                food,
              ),
          )
        : [
            ...currentFoods,
            food,
          ];

    updateMealDetail(
      itemId,
      'food',
      updatedFoods.join(', '),
    );
  }

  function rememberFoods(
    mealKey: MealKey,
    value: string,
  ) {
    const enteredFoods =
      extractFoodsForHistory(
        value,
      );

    if (
      enteredFoods.length === 0
    ) {
      return;
    }

    const common =
      COMMON_FOODS[
        mealKey
      ].map(normaliseFood);

    const customFoods =
      enteredFoods.filter(
        (food) =>
          !common.includes(
            normaliseFood(
              food,
            ),
          ),
      );

    if (
      customFoods.length === 0
    ) {
      return;
    }

    setFoodHistory(
      (previous) => {
        const existing =
          previous[
            mealKey
          ] ?? [];

        const combined = [
          ...customFoods,
          ...existing,
        ];

        const unique =
          combined.filter(
            (
              food,
              index,
              array,
            ) =>
              array.findIndex(
                (candidate) =>
                  normaliseFood(
                    candidate,
                  ) ===
                  normaliseFood(
                    food,
                  ),
              ) === index,
          );

        return {
          ...previous,

          [mealKey]:
            unique.slice(
              0,
              8,
            ),
        };
      },
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* PAGE HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">
          My Day
        </h1>

        <p className="text-neutral-500 mt-1 text-base">
          {new Date().toLocaleDateString(
            'en-US',
            {
              weekday:
                'long',
              month:
                'long',
              day:
                'numeric',
            },
          )}
        </p>
      </div>

      {/* PROGRESS */}
      <section aria-label="Day progress">
        <div className="card p-4 flex items-center gap-4">
          <div className="flex-1">

            <div className="flex items-center justify-between mb-1.5 gap-3">

              <span className="text-sm font-semibold text-neutral-700">
                {doneCount} of{' '}
                {items.length}{' '}
                tasks complete
              </span>

              <span className="text-sm font-bold text-calm-700">
                {progress}%
              </span>
            </div>

            <div
              className="h-3 bg-neutral-200 rounded-pill overflow-hidden"
              role="progressbar"
              aria-valuenow={
                progress
              }
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${progress}% of today's tasks complete`}
            >
              <div
                className="h-full bg-calm-600 rounded-pill transition-all duration-500"
                style={{
                  width:
                    `${progress}%`,
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* SCHEDULE */}
      <section aria-label="Today's schedule">

        <h2 className="sr-only">
          Today's schedule
        </h2>

        <ol
          className="space-y-4 list-none p-0 m-0"
          role="list"
        >
          {items.map(
            (item) => {
              const isMeal =
                item.category ===
                'meal';

              const mealKey =
                getMealKey(
                  item,
                );

              const mealDetail =
                mealDetails[
                  item.id
                ] ?? {
                  food: '',
                  notes: '',
                };

              const commonFoods =
                COMMON_FOODS[
                  mealKey
                ];

              const usualFoods =
                foodHistory[
                  mealKey
                ] ?? [];

              return (
                <li
                  key={
                    item.id
                  }
                >
                  <article
                    className={`card card-hover p-4 transition-colors duration-200 ${
                      item.done
                        ? 'border-success-200 bg-success-50/30'
                        : ''
                    }`}
                    aria-label={`${formatTime(
                      item.time,
                    )}: ${
                      item.label
                    }${
                      item.done
                        ? ' — done'
                        : ' — not done'
                    }`}
                  >
                    <div className="flex items-start gap-4">

                      {/* TIME */}
                      <time
                        dateTime={
                          item.time
                        }
                        className="text-calm-700 font-semibold tabular-nums text-sm w-14 flex-shrink-0 pt-0.5"
                      >
                        {formatTime(
                          item.time,
                        )}
                      </time>

                      {/* DETAILS */}
                      <div className="flex-1 min-w-0">

                        <div className="flex items-center gap-2 flex-wrap">

                          <p
                            className={`font-semibold text-base leading-tight ${
                              item.done
                                ? 'text-success-700'
                                : 'text-neutral-800'
                            }`}
                          >
                            {
                              item.label
                            }
                          </p>

                          <span
                            className={`badge text-xs ${
                              categoryColour[
                                item
                                  .category
                              ]
                            }`}
                          >
                            {
                              categoryLabel[
                                item
                                  .category
                              ]
                            }
                          </span>

                          {item.done && (
                            <span className="badge bg-success-100 text-success-700 text-xs">
                              Done
                            </span>
                          )}
                        </div>

                        {item.description && (
                          <p className="text-sm text-neutral-500 mt-1">
                            Planned:{' '}
                            {
                              item.description
                            }
                          </p>
                        )}
                      </div>

                      {/* DONE BUTTON */}
                      <button
                        type="button"
                        onClick={() =>
                          toggleDone(
                            item.id,
                          )
                        }
                        className={`flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-full border-2 transition-colors duration-200 ${
                          item.done
                            ? 'border-success-500 bg-success-50'
                            : 'border-neutral-300 bg-white hover:bg-neutral-50'
                        }`}
                        aria-label={
                          item.done
                            ? `Mark "${item.label}" as not done`
                            : `Mark "${item.label}" as done`
                        }
                        aria-pressed={
                          item.done
                        }
                      >
                        {item.done ? (
                          <CheckCircle2
                            className="w-7 h-7 text-success-600"
                            aria-hidden="true"
                          />
                        ) : (
                          <Circle
                            className="w-7 h-7 text-neutral-500"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    </div>

                    {/* =====================================
                        MEAL ENTRY
                    ====================================== */}
                    {isMeal && (
                      <div className="mt-4 pt-4 border-t border-neutral-200 space-y-5">

                        <div className="flex items-center gap-2">

                          <Utensils
                            className="w-5 h-5 text-warm-600"
                            aria-hidden="true"
                          />

                          <h3 className="font-semibold text-neutral-800">
                            What did
                            I eat?
                          </h3>
                        </div>

                        {/* COMMON FOOD BUTTONS */}
                        <div>
                          <p
                            id={`common-foods-${item.id}`}
                            className="text-sm font-semibold text-neutral-700 mb-2"
                          >
                            Common
                            choices
                          </p>

                          <div
                            role="group"
                            aria-labelledby={`common-foods-${item.id}`}
                            className="flex flex-wrap gap-2"
                          >
                            {commonFoods.map(
                              (
                                food,
                              ) => {
                                const selected =
                                  foodIsSelected(
                                    mealDetail.food,
                                    food,
                                  );

                                return (
                                  <button
                                    key={
                                      food
                                    }
                                    type="button"
                                    onClick={() =>
                                      toggleFoodChoice(
                                        item.id,
                                        food,
                                      )
                                    }
                                    aria-pressed={
                                      selected
                                    }
                                    className={`inline-flex items-center gap-1.5 rounded-lg border-2 px-3 py-2 min-h-[2.75rem] text-sm font-medium transition-colors ${
                                      selected
                                        ? 'bg-warm-100 border-warm-600 text-warm-800'
                                        : 'bg-white border-neutral-300 text-neutral-700 hover:border-warm-400'
                                    }`}
                                  >
                                    {selected ? (
                                      <CheckCircle2
                                        className="w-4 h-4"
                                        aria-hidden="true"
                                      />
                                    ) : (
                                      <Plus
                                        className="w-4 h-4"
                                        aria-hidden="true"
                                      />
                                    )}

                                    {
                                      food
                                    }
                                  </button>
                                );
                              },
                            )}
                          </div>
                        </div>

                        {/* LEARNED / USUAL FOODS */}
                        {usualFoods.length >
                          0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">

                              <History
                                className="w-4 h-4 text-calm-600"
                                aria-hidden="true"
                              />

                              <p
                                id={`usual-foods-${item.id}`}
                                className="text-sm font-semibold text-neutral-700"
                              >
                                Your usual
                                foods
                              </p>
                            </div>

                            <div
                              role="group"
                              aria-labelledby={`usual-foods-${item.id}`}
                              className="flex flex-wrap gap-2"
                            >
                              {usualFoods.map(
                                (
                                  food,
                                ) => {
                                  const selected =
                                    foodIsSelected(
                                      mealDetail.food,
                                      food,
                                    );

                                  return (
                                    <button
                                      key={
                                        food
                                      }
                                      type="button"
                                      onClick={() =>
                                        toggleFoodChoice(
                                          item.id,
                                          food,
                                        )
                                      }
                                      aria-pressed={
                                        selected
                                      }
                                      className={`inline-flex items-center gap-1.5 rounded-lg border-2 px-3 py-2 min-h-[2.75rem] text-sm font-medium transition-colors ${
                                        selected
                                          ? 'bg-calm-100 border-calm-600 text-calm-800'
                                          : 'bg-white border-calm-200 text-calm-700 hover:border-calm-500'
                                      }`}
                                    >
                                      {selected ? (
                                        <CheckCircle2
                                          className="w-4 h-4"
                                          aria-hidden="true"
                                        />
                                      ) : (
                                        <Plus
                                          className="w-4 h-4"
                                          aria-hidden="true"
                                        />
                                      )}

                                      {
                                        food
                                      }
                                    </button>
                                  );
                                },
                              )}
                            </div>
                          </div>
                        )}

                        {/* FREE-TEXT ENTRY */}
                        <div>
                          <label
                            htmlFor={`food-${item.id}`}
                            className="block text-sm font-semibold text-neutral-700 mb-1.5"
                          >
                            Add or type
                            other food
                          </label>

                          <input
                            id={`food-${item.id}`}
                            type="text"
                            value={
                              mealDetail.food
                            }
                            onChange={(
                              event,
                            ) =>
                              updateMealDetail(
                                item.id,
                                'food',
                                event
                                  .target
                                  .value,
                              )
                            }
                            onBlur={(
                              event,
                            ) =>
                              rememberFoods(
                                mealKey,
                                event
                                  .target
                                  .value,
                              )
                            }
                            placeholder="Example: grits, banana, coffee"
                            className="w-full rounded-lg border-2 border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-800 focus:border-calm-600 focus:outline-none"
                          />

                          <p className="text-xs text-neutral-500 mt-1.5">
                            You can tap
                            choices above
                            and type your
                            own foods.
                            Foods you enter
                            are remembered
                            for future
                            suggestions.
                          </p>
                        </div>

                        {/* NOTES */}
                        <div>
                          <label
                            htmlFor={`meal-notes-${item.id}`}
                            className="block text-sm font-semibold text-neutral-700 mb-1.5"
                          >
                            Notes
                          </label>

                          <textarea
                            id={`meal-notes-${item.id}`}
                            rows={3}
                            value={
                              mealDetail.notes
                            }
                            onChange={(
                              event,
                            ) =>
                              updateMealDetail(
                                item.id,
                                'notes',
                                event
                                  .target
                                  .value,
                              )
                            }
                            placeholder="Example: Ate everything, small appetite, did not like the soup, felt hungry afterward."
                            className="w-full rounded-lg border-2 border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-800 focus:border-calm-600 focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-2 text-xs text-neutral-500">

                          <NotebookPen
                            className="w-4 h-4"
                            aria-hidden="true"
                          />

                          <span>
                            Today's meal
                            and notes save
                            automatically.
                            Your food
                            preferences are
                            remembered for
                            future meals.
                          </span>
                        </div>
                      </div>
                    )}
                  </article>
                </li>
              );
            },
          )}
        </ol>
      </section>

      {/* ALL DONE */}
      {doneCount ===
        items.length && (
        <div
          role="status"
          aria-live="polite"
          className="card text-center py-10 border-success-200 bg-success-50"
        >
          <CheckCircle2
            className="w-12 h-12 text-success-600 mx-auto mb-3"
            aria-hidden="true"
          />

          <p className="text-xl font-bold text-success-700">
            Wonderful job
            today!
          </p>

          <p className="text-neutral-600 mt-1">
            Every task is
            complete. Enjoy
            your evening.
          </p>
        </div>
      )}

      {/* CATEGORY LEGEND */}
      <section aria-label="Category legend">

        <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-2">
          Category key
        </h2>

        <div className="flex flex-wrap gap-2">
          {(
            Object.keys(
              categoryLabel,
            ) as ScheduleItem['category'][]
          ).map(
            (category) => (
              <span
                key={
                  category
                }
                className={`badge ${
                  categoryColour[
                    category
                  ]
                }`}
              >
                {
                  categoryLabel[
                    category
                  ]
                }
              </span>
            ),
          )}
        </div>
      </section>

      <div className="flex items-center gap-2 text-sm text-neutral-500">

        <Clock
          className="w-4 h-4"
          aria-hidden="true"
        />

        <span>
          Select the circle to
          mark a task complete.
          Meal entries save
          automatically.
        </span>
      </div>
    </div>
  );
}