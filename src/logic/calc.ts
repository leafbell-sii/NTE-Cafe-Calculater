import type { Condition, Constants, EffectKind, Food, SkillEffect, Staff, Trend } from '../types';
import { trendApplies } from './trends';

/** 부동소수 비교 오차 (SPEC 6.1) */
export const EPS = 1e-9;

/** 4종 버프의 합. 곱연산의 `1 +`는 계산식에서 붙인다. */
export interface Buffs {
  priceAdd: number;
  priceMul: number;
  trafficAdd: number;
  trafficMul: number;
}

export const zeroBuffs = (): Buffs => ({ priceAdd: 0, priceMul: 0, trafficAdd: 0, trafficMul: 0 });

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

/** 음식 하나의 기본값: 가격 + 트렌드 계수 */
export function foodBase(food: Food, trend: Trend, constants: Constants): number {
  return food.price + (trendApplies(trend, food) ? constants.trendBonus : 0);
}

/**
 * 최종 수익 (인수분해한 형태).
 * Σ(base_i + A)(1 + M) = (Σbase_i + n·A)(1 + M)
 */
export function revenueOf(
  baseSum: number,
  foodCount: number,
  b: Buffs,
  constants: Constants,
  popularity: number,
): number {
  const foodCoef = (baseSum + foodCount * b.priceAdd) * (1 + b.priceMul);
  const trafficCoef = ((constants.baseTraffic + b.trafficAdd) * (1 + b.trafficMul)) / 100;
  return foodCoef * trafficCoef * (1 + popularity);
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
  trend: number;
  priceAdd: number;
  subtotal: number;
  priceMul: number;
  coef: number;
}

export interface Receipt {
  baseTraffic: number;
  effects: EffectLine[];
  buffs: Buffs;
  traffic: number;
  trafficCoef: number;
  foods: FoodLine[];
  totalFoodCoef: number;
  popularity: number;
  popularityCoef: number;
  revenue: number;
}

export interface CalcInput {
  menu: Food[];
  staff: Staff[];
  trend: Trend;
  popularity: number;
  constants: Constants;
}

/** 수익 계산 + 단계별 영수증 */
export function calculate({ menu, staff, trend, popularity, constants }: CalcInput): Receipt {
  const effects: EffectLine[] = [];
  const buffs = zeroBuffs();
  for (const s of staff) {
    for (const effect of unlockedEffects(s)) {
      const met = conditionMet(effect.condition, menu);
      effects.push({ staff: s, effect, met });
      if (met) buffs[effect.kind] += effect.value;
    }
  }
  const traffic = (constants.baseTraffic + buffs.trafficAdd) * (1 + buffs.trafficMul);
  const trafficCoef = traffic / 100;
  const foods: FoodLine[] = menu.map((food) => {
    const t = trendApplies(trend, food) ? constants.trendBonus : 0;
    const subtotal = food.price + t + buffs.priceAdd;
    return {
      food,
      price: food.price,
      trend: t,
      priceAdd: buffs.priceAdd,
      subtotal,
      priceMul: buffs.priceMul,
      coef: subtotal * (1 + buffs.priceMul),
    };
  });
  const totalFoodCoef = foods.reduce((s, f) => s + f.coef, 0);
  const popularityCoef = 1 + popularity;
  return {
    baseTraffic: constants.baseTraffic,
    effects,
    buffs,
    traffic,
    trafficCoef,
    foods,
    totalFoodCoef,
    popularity,
    popularityCoef,
    revenue: totalFoodCoef * trafficCoef * popularityCoef,
  };
}

export const EFFECT_KIND_LABEL: Record<EffectKind, string> = {
  priceAdd: '판매가 +',
  priceMul: '판매가 ×',
  trafficAdd: '유동인구 +',
  trafficMul: '유동인구 ×',
};

export function conditionLabel(cond: Condition): string {
  switch (cond.type) {
    case 'tagCount':
      return `${cond.tag} ${cond.min}개 이상`;
    case 'sameTagCount':
      return `동일 태그 ${cond.min}개 이상`;
  }
}
