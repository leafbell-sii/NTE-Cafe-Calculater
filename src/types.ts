// SPEC 8.3 스키마
export const TAGS = ['메인 메뉴', '디저트', '음료'] as const;
export type Tag = (typeof TAGS)[number];

export interface Food {
  id: string;
  name: string;
  price: number;
  tag: Tag;
  ingredients: string[];
}

export const EFFECT_KINDS = ['priceAdd', 'priceMul', 'trafficAdd', 'trafficMul'] as const;
export type EffectKind = (typeof EFFECT_KINDS)[number];

export type Condition =
  | { type: 'tagCount'; tag: Tag; min: number }
  | { type: 'sameTagCount'; min: number };

export interface SkillEffect {
  level: number;
  kind: EffectKind;
  value: number;
  condition?: Condition;
}

export interface Character {
  id: string;
  name: string;
  skillName: string;
  effects: SkillEffect[];
  skillText: string[];
}

export interface IngredientGroup {
  id: string;
  label: string;
  ingredients: string[];
}

export interface TrendsData {
  ingredientGroups: IngredientGroup[];
}

export interface Constants {
  baseTraffic: number;
  trendBonus: number;
  maxFoods: number;
  maxStaff: number;
  maxSkillLevel: number;
}

export type TrendMatch =
  | { type: 'none' }
  | { type: 'tag'; tag: Tag }
  | { type: 'ingredientAny'; ingredients: string[] };

export type TrendKind = 'none' | 'tag' | 'group' | 'ingredient';

export interface Trend {
  id: string;
  label: string;
  kind: TrendKind;
  match: TrendMatch;
}

export interface GameData {
  foods: Food[];
  characters: Character[];
  trends: TrendsData;
  constants: Constants;
}

/** 배치된 직원: 캐릭터 + 선택 레벨 */
export interface Staff {
  character: Character;
  level: number;
}
