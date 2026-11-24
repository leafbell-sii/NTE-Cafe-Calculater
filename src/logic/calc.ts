import type { Condition, Constants, EffectKind, Food, Ingredient, SkillEffect, Staff, Trend } from '../types';
import { trendBonus, type TrendBonus } from './trends';

/** 부동소수 비교 오차 (SPEC 6.1) */
export const EPS = 1e-9;

/** 효과 종류별 버프의 합. 곱연산의 `1 +`, 식재료 소모 감소의 `1 -`는 계산식에서 붙인다. */
export type Buffs = Record<EffectKind, number>;

export const zeroBuffs = (): Buffs => ({ priceAdd: 0, priceMul: 0, trafficAdd: 0, trafficMul: 0, ingredientReduce: 0 });

/** 최적화 정렬 기준: 매출 / 순수익(매출 − 식재료 비용) */
export const SORT_BYS = ['revenue', 'net'] as const;
export type SortBy = (typeof SORT_BYS)[number];

/** 식재료 소모량 계산의 유동인구 나눗수: 시간당 소모량 = 유동인구 / 10000 × M(A) × (1 − 감소량) */
export const INGREDIENT_TRAFFIC_DIV = 10000;

export const priceMap = (ingredients: Ingredient[]) => new Map(ingredients.map((i) => [i.name, i.price]));

/** 음식 1개분 재료 비용: Σ 소모 개수 × 개당 가격 */
export function foodIngredientCost(food: Food, prices: Map<string, number>): number {
  return food.ingredients.reduce((s, i) => s + i.count * (prices.get(i.name) ?? 0), 0);
}

/** 직원 외 기본 버프. 마네키네코는 유동인구 곱연산 버프에 합산된다. */
export function baseBuffs(maneki: boolean, constants: Constants): Buffs {
  return { ...zeroBuffs(), trafficMul: maneki ? constants.manekiTrafficMul : 0 };
}

/** 최종 유동인구 */
export function trafficOf(b: Buffs, constants: Constants): number {
  return (constants.baseTraffic + b.trafficAdd) * (1 + b.trafficMul);
}

/** 식재료 소모 배율 (1 − 감소량, 0 미만으로 내려가지 않음) */
export const reduceCoefOf = (reduce: number) => Math.max(0, 1 - reduce);

/** 시간당 식재료 비용 = 유동인구 / 10000 × (1 − 감소량) × Σ_A M(A)·가격(A) */
export function ingredientCostOf(traffic: number, reduce: number, costSum: number): number {
  return (traffic / INGREDIENT_TRAFFIC_DIV) * reduceCoefOf(reduce) * costSum;
}

/** 스킬 조건 판정. 진열된 메뉴 전체 기준, 모두 "이상" 판정. */
export function conditionMet(cond: Condition | undefined, menu: Food[]): boolean {
  if (!cond) return true;
  switch (cond.type) {
    case 'tagCount':
      return menu.filter((f) => f.tag === cond.tag).length >= cond.min;
    case 'sameTagCount': {
      const counts = new Map<string, number>();
      for (const f of menu) counts.set(f.tag, (counts.get(f.tag) ?? 0) + 1);
      return Math.max(0, ...counts.values()) >= cond.min;
    }
  }
}

/** 선택 레벨 이하에서 해금된 효과 (레벨 누적) */
export function unlockedEffects(staff: Staff): SkillEffect[] {
  return staff.character.effects.filter((e) => e.level <= staff.level);
}

/** 한 직원이 주어진 메뉴에서 주는 버프 */
export function staffBuffs(staff: Staff, menu: Food[]): Buffs {
  const b = zeroBuffs();
  for (const e of unlockedEffects(staff)) {
    if (conditionMet(e.condition, menu)) b[e.kind] += e.value;
  }
  return b;
}

/** 총 음식 계수 (인수분해한 형태). Σ[(price_i + A + tMul_i)(1 + M) + tAdd_i] = (Σprice_i + n·A + ΣtMul_i)(1 + M) + ΣtAdd_i */
export function foodCoefOf(priceSum: number, trend: TrendBonus, foodCount: number, b: Buffs): number {
  return (priceSum + foodCount * b.priceAdd + trend.mul) * (1 + b.priceMul) + trend.add;
}

/** 최종 수익. 트렌드 계수는 태그 트렌드면 판매가 곱연산을 받고, 그 외는 곱연산 뒤에 더한다. */
export function revenueOf(
  priceSum: number,
  trendSum: TrendBonus,
  foodCount: number,
  b: Buffs,
  constants: Constants,
  popularity: number,
): number {
  return foodCoefOf(priceSum, trendSum, foodCount, b) * (trafficOf(b, constants) / 100) * (1 + popularity);
}

/** 정렬 기준 값. costSum = 메뉴 전체 Σ_A M(A)·가격(A) */
export function scoreOf(
  sortBy: SortBy,
  priceSum: number,
  trendSum: TrendBonus,
  costSum: number,
  foodCount: number,
  b: Buffs,
  constants: Constants,
  popularity: number,
): number {
  const revenue = revenueOf(priceSum, trendSum, foodCount, b, constants, popularity);
  if (sortBy === 'revenue') return revenue;
  return revenue - ingredientCostOf(trafficOf(b, constants), b.ingredientReduce, costSum);
}

// ---------------------------------------------------------------------------
// 영수증 (SPEC 7.3)
// ---------------------------------------------------------------------------

export interface EffectLine {
  staff: Staff;
  effect: SkillEffect;
  met: boolean;
}

export interface FoodLine {
  food: Food;
  price: number;
  priceAdd: number;
  /** 판매가 곱연산을 받는 트렌드 계수 (태그 트렌드) */
  trendMul: number;
  /** 가격 + 판매가 합연산 + trendMul */
  subtotal: number;
  priceMul: number;
  /** 판매가 곱연산 뒤에 더해지는 트렌드 계수 (과일·재료 트렌드) */
  trendAdd: number;
  coef: number;
}

export interface IngredientLine {
  name: string;
  price: number;
  /** M(A): 진열된 메뉴 전체에서 사용된 개수 */
  uses: number;
  /** 시간당 소모량 */
  perHour: number;
  /** 시간당 비용 */
  cost: number;
}

export interface Receipt {
  baseTraffic: number;
  /** 마네키네코 유동인구 곱연산 버프 (꺼져 있으면 0) */
  maneki: number;
  effects: EffectLine[];
  buffs: Buffs;
  traffic: number;
  trafficCoef: number;
  foods: FoodLine[];
  totalFoodCoef: number;
  popularity: number;
  popularityCoef: number;
  revenue: number;
  /** 식재료 소모 감소량 합 */
  reduce: number;
  /** 1 − 감소량 */
  reduceCoef: number;
  ingredients: IngredientLine[];
  ingredientCost: number;
  /** 매출 − 식재료 비용 */
  net: number;
}

export interface CalcInput {
  menu: Food[];
  /** 식재료 가격 (ingredients.json) */
  ingredients: Ingredient[];
  staff: Staff[];
  trend: Trend;
  popularity: number;
  /** 마네키네코 사용 여부 (기본: 꺼짐) */
  maneki?: boolean;
  constants: Constants;
}

/** 수익 계산 + 단계별 영수증 */
export function calculate({ menu, ingredients, staff, trend, popularity, maneki = false, constants }: CalcInput): Receipt {
  const effects: EffectLine[] = [];
  const buffs = baseBuffs(maneki, constants);
  for (const s of staff) {
    for (const effect of unlockedEffects(s)) {
      const met = conditionMet(effect.condition, menu);
      effects.push({ staff: s, effect, met });
      if (met) buffs[effect.kind] += effect.value;
    }
  }
  const traffic = trafficOf(buffs, constants);
  const trafficCoef = traffic / 100;
  const foods: FoodLine[] = menu.map((food) => {
    const t = trendBonus(trend, food, constants);
    const subtotal = food.price + buffs.priceAdd + t.mul;
    return {
      food,
      price: food.price,
      priceAdd: buffs.priceAdd,
      trendMul: t.mul,
      subtotal,
      priceMul: buffs.priceMul,
      trendAdd: t.add,
      coef: subtotal * (1 + buffs.priceMul) + t.add,
    };
  });
  const totalFoodCoef = foods.reduce((s, f) => s + f.coef, 0);
  const popularityCoef = 1 + popularity;
  const revenue = totalFoodCoef * trafficCoef * popularityCoef;

  // 식재료: M(A) = 메뉴 전체 소모 개수 합, ingredients.json 순서
  const uses = new Map<string, number>();
  for (const f of menu) for (const i of f.ingredients) uses.set(i.name, (uses.get(i.name) ?? 0) + i.count);
  const reduceCoef = reduceCoefOf(buffs.ingredientReduce);
  const ingLines: IngredientLine[] = ingredients
    .filter((i) => uses.has(i.name))
    .map((i) => {
      const m = uses.get(i.name)!;
      const perHour = (traffic / INGREDIENT_TRAFFIC_DIV) * m * reduceCoef;
      return { name: i.name, price: i.price, uses: m, perHour, cost: perHour * i.price };
    });
  const ingredientCost = ingLines.reduce((s, l) => s + l.cost, 0);
  return {
    baseTraffic: constants.baseTraffic,
    maneki: maneki ? constants.manekiTrafficMul : 0,
    effects,
    buffs,
    traffic,
    trafficCoef,
    foods,
    totalFoodCoef,
    popularity,
    popularityCoef,
    revenue,
    reduce: buffs.ingredientReduce,
    reduceCoef,
    ingredients: ingLines,
    ingredientCost,
    net: revenue - ingredientCost,
  };
}

export const EFFECT_KIND_LABEL: Record<EffectKind, string> = {
  priceAdd: '판매가 +',
  priceMul: '판매가 ×',
  trafficAdd: '유동인구 +',
  trafficMul: '유동인구 ×',
  ingredientReduce: '식재료 소모 −',
};

export function conditionLabel(cond: Condition): string {
  switch (cond.type) {
    case 'tagCount':
      return `${cond.tag} ${cond.min}개 이상`;
    case 'sameTagCount':
      return `동일 태그 ${cond.min}개 이상`;
  }
}
