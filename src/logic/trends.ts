import { TAGS, type Constants, type Food, type GameData, type Trend } from '../types';

export const AVERAGE_TREND_ID = 'average';

export const NONE_TREND: Trend = { id: 'none', label: '없음', kind: 'none', match: { type: 'none' } };

/** SPEC 8.4 트렌드 선택지 생성 */
export function buildTrends(data: GameData): Trend[] {
  const list: Trend[] = [NONE_TREND];
  for (const tag of TAGS) list.push({ id: `tag:${tag}`, label: tag, kind: 'tag', match: { type: 'tag', tag } });
  for (const g of data.trends.ingredientGroups) {
    list.push({
      id: `group:${g.id}`,
      label: g.label,
      kind: 'group',
      match: { type: 'ingredientAny', ingredients: g.ingredients },
    });
  }
  const ingredients = [...new Set(data.foods.flatMap((f) => f.ingredients.map((i) => i.name)))].sort((a, b) => a.localeCompare(b, 'ko'));
  for (const ing of ingredients) {
    list.push({
      id: `ingredient:${ing}`,
      label: ing,
      kind: 'ingredient',
      match: { type: 'ingredientAny', ingredients: [ing] },
    });
  }
  // 범용: 공유 코드가 트렌드 인덱스를 쓰므로 항상 맨 뒤에 둔다.
  list.push({
    id: AVERAGE_TREND_ID,
    label: '전체 트렌드 평균 (범용)',
    kind: 'average',
    match: { type: 'average', trends: list.filter((t) => t.kind !== 'none') },
  });
  return list;
}

/** 트렌드 적용 여부 (한 음식에 최대 1회) */
export function trendApplies(trend: Trend, food: Food): boolean {
  const m = trend.match;
  switch (m.type) {
    case 'none':
      return false;
    case 'tag':
      return food.tag === m.tag;
    case 'ingredientAny':
      return food.ingredients.some((i) => m.ingredients.includes(i.name));
    case 'average':
      return m.trends.some((t) => trendApplies(t, food));
  }
}

/** 범용 트렌드에서 음식에 적용되는 하위 트렌드 수 (그 외 트렌드는 0/1) */
export function trendHits(trend: Trend, food: Food): number {
  const m = trend.match;
  if (m.type === 'average') return m.trends.filter((t) => trendApplies(t, food)).length;
  return trendApplies(trend, food) ? 1 : 0;
}

/** 트렌드 종류별 계수 (태그 트렌드 1.00, 그 외 0.75) */
export function trendCoef(trend: Trend, constants: Constants): number {
  return trend.kind === 'tag' ? constants.tagTrendBonus : constants.trendBonus;
}

/**
 * 트렌드 계수. 판매가 곱연산 버프의 적용 여부로 나눈다.
 * - mul: 판매가 곱연산 버프가 곱해지는 몫 (태그 트렌드, 인게임 확인)
 * - add: 곱연산 뒤에 더해지는 몫 (재료 트렌드 인게임 확인, 과일 트렌드는 미확인 → 재료와 동일 처리)
 */
export interface TrendBonus {
  mul: number;
  add: number;
}

export const zeroTrend = (): TrendBonus => ({ mul: 0, add: 0 });

export const addTrend = (a: TrendBonus, b: TrendBonus): TrendBonus => ({ mul: a.mul + b.mul, add: a.add + b.add });

/** 판매가 곱연산 버프가 트렌드 계수에도 적용되는 트렌드인지 */
export function trendIsMultiplied(trend: Trend): boolean {
  return trend.kind === 'tag';
}

/** 음식에 적용되는 트렌드 계수 (미적용 시 0) */
export function trendBonus(trend: Trend, food: Food, constants: Constants): TrendBonus {
  // 수익은 트렌드 계수(mul, add) 각각에 선형이므로, 평균 계수로 계산한 수익 = 전체 트렌드 수익의 평균
  const m = trend.match;
  if (m.type === 'average') {
    if (!m.trends.length) return zeroTrend();
    const sum = m.trends.reduce((s, t) => addTrend(s, trendBonus(t, food, constants)), zeroTrend());
    return { mul: sum.mul / m.trends.length, add: sum.add / m.trends.length };
  }
  if (!trendApplies(trend, food)) return zeroTrend();
  const coef = trendCoef(trend, constants);
  return trendIsMultiplied(trend) ? { mul: coef, add: 0 } : { mul: 0, add: coef };
}
