import { TAGS, type Constants, type Food, type GameData, type Trend } from '../types';

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
  const ingredients = [...new Set(data.foods.flatMap((f) => f.ingredients))].sort((a, b) => a.localeCompare(b, 'ko'));
  for (const ing of ingredients) {
    list.push({
      id: `ingredient:${ing}`,
      label: ing,
      kind: 'ingredient',
      match: { type: 'ingredientAny', ingredients: [ing] },
    });
  }
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
      return food.ingredients.some((i) => m.ingredients.includes(i));
  }
}

/** 트렌드 종류별 계수 (태그 트렌드 1.00, 그 외 0.75) */
export function trendCoef(trend: Trend, constants: Constants): number {
  return trend.kind === 'tag' ? constants.tagTrendBonus : constants.trendBonus;
}

/** 음식에 적용되는 트렌드 계수 (미적용 시 0) */
export function trendBonus(trend: Trend, food: Food, constants: Constants): number {
  return trendApplies(trend, food) ? trendCoef(trend, constants) : 0;
}
