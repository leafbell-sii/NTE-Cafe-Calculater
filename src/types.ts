// SPEC 8.3 스키마
export const TAGS = ['메인 메뉴', '디저트', '음료'] as const;
export type Tag = (typeof TAGS)[number];

/** 음식 1개에 들어가는 재료와 소모 개수 */
export interface FoodIngredient {
  name: string;
  count: number;
}

export interface Food {
  id: string;
  name: string;
  price: number;
  tag: Tag;
  ingredients: FoodIngredient[];
}

/** ingredients.json: 식재료와 개당 가격(폰즈) */
export interface Ingredient {
  name: string;
  price: number;
}

export const EFFECT_KINDS = ['priceAdd', 'priceMul', 'trafficAdd', 'trafficMul', 'ingredientReduce'] as const;
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
  tagTrendBonus: number;
  /** 마네키네코: 유동인구 곱연산 버프 (다른 곱연산 버프와 합산) */
  manekiTrafficMul: number;
  maxFoods: number;
  maxStaff: number;
  maxSkillLevel: number;
}

export type TrendMatch =
  | { type: 'none' }
  | { type: 'tag'; tag: Tag }
  | { type: 'ingredientAny'; ingredients: string[] }
  /** 범용: 하위 트렌드 계수의 평균 (SPEC 8.4) */
  | { type: 'average'; trends: Trend[] };

export type TrendKind = 'none' | 'tag' | 'group' | 'ingredient' | 'average';

export interface Trend {
  id: string;
  label: string;
  kind: TrendKind;
  match: TrendMatch;
}

export interface GameData {
  foods: Food[];
  ingredients: Ingredient[];
  characters: Character[];
  trends: TrendsData;
  constants: Constants;
}

/** 배치된 직원: 캐릭터 + 선택 레벨 */
export interface Staff {
  character: Character;
  level: number;
}
