import { z } from 'zod';
import foodsJson from './foods.json';
import charactersJson from './characters.json';
import trendsJson from './trends.json';
import constantsJson from './constants.json';
import { EFFECT_KINDS, TAGS, type GameData } from '../types';

const nonNeg = z.number().min(0, '0 이상이어야 합니다');
const tagSchema = z.enum(TAGS);

const foodSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  price: nonNeg,
  tag: tagSchema,
  ingredients: z.array(z.string().min(1)),
});

const conditionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('tagCount'), tag: tagSchema, min: nonNeg }),
  z.object({ type: z.literal('sameTagCount'), min: nonNeg }),
]);

const effectSchema = z.object({
  level: z.number().int(),
  kind: z.enum(EFFECT_KINDS),
  value: nonNeg,
  condition: conditionSchema.optional(),
});

const characterSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  skillName: z.string(),
  effects: z.array(effectSchema),
  skillText: z.array(z.string()),
});

const trendsSchema = z.object({
  ingredientGroups: z.array(
    z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      ingredients: z.array(z.string().min(1)),
    }),
  ),
});

const constantsSchema = z.object({
  baseTraffic: nonNeg,
  trendBonus: nonNeg,
  tagTrendBonus: nonNeg,
  maxFoods: z.number().int().min(1),
  maxStaff: z.number().int().min(1),
  maxSkillLevel: z.number().int().min(1),
});

export interface DataError {
  file: string;
  path: string;
  message: string;
}

export type LoadResult = { ok: true; data: GameData } | { ok: false; errors: DataError[] };

function fmtPath(path: PropertyKey[]): string {
  return path.reduce<string>((acc, p) => {
    if (typeof p === 'number') return `${acc}[${p}]`;
    return acc ? `${acc}.${String(p)}` : String(p);
  }, '');
}

function parse<T>(file: string, schema: z.ZodType<T>, raw: unknown, errors: DataError[]): T | undefined {
  const r = schema.safeParse(raw);
  if (r.success) return r.data;
  for (const issue of r.error.issues) {
    errors.push({ file, path: fmtPath(issue.path) || '(루트)', message: issue.message });
  }
  return undefined;
}

function checkUnique(file: string, items: { id: string }[], prefix: string, errors: DataError[]) {
  const seen = new Map<string, number>();
  items.forEach((it, i) => {
    const prev = seen.get(it.id);
    if (prev !== undefined) {
      errors.push({ file, path: `${prefix}[${i}].id`, message: `id "${it.id}"가 ${prefix}[${prev}]와 중복됩니다` });
    } else seen.set(it.id, i);
  });
}

/** SPEC 8.5 데이터 검증. 원본 JSON을 인자로 받아 테스트에서도 쓸 수 있게 한다. */
export function validateData(raw: {
  foods: unknown;
  characters: unknown;
  trends: unknown;
  constants: unknown;
}): LoadResult {
  const errors: DataError[] = [];
  const foods = parse('foods.json', z.array(foodSchema), raw.foods, errors);
  const characters = parse('characters.json', z.array(characterSchema), raw.characters, errors);
  const trends = parse('trends.json', trendsSchema, raw.trends, errors);
  const constants = parse('constants.json', constantsSchema, raw.constants, errors);

  if (foods) checkUnique('foods.json', foods, '', errors);
  if (characters) checkUnique('characters.json', characters, '', errors);
  if (trends) checkUnique('trends.json', trends.ingredientGroups, 'ingredientGroups', errors);

  if (characters && constants) {
    const max = constants.maxSkillLevel;
    characters.forEach((c, ci) => {
      c.effects.forEach((e, ei) => {
        if (e.level < 1 || e.level > max) {
          errors.push({
            file: 'characters.json',
            path: `[${ci}].effects[${ei}].level`,
            message: `레벨은 1~${max} 사이여야 합니다 (현재 ${e.level}, ${c.name})`,
          });
        }
      });
      if (c.skillText.length !== max) {
        errors.push({
          file: 'characters.json',
          path: `[${ci}].skillText`,
          message: `길이가 ${max}이어야 합니다 (현재 ${c.skillText.length}, ${c.name})`,
        });
      }
    });
  }

  if (foods && trends) {
    const all = new Set(foods.flatMap((f) => f.ingredients));
    trends.ingredientGroups.forEach((g, gi) => {
      g.ingredients.forEach((ing, ii) => {
        if (!all.has(ing)) {
          errors.push({
            file: 'trends.json',
            path: `ingredientGroups[${gi}].ingredients[${ii}]`,
            message: `재료 "${ing}"가 foods.json에 없습니다`,
          });
        }
      });
    });
  }

  if (errors.length || !foods || !characters || !trends || !constants) return { ok: false, errors };
  return { ok: true, data: { foods, characters, trends, constants } };
}

export function loadGameData(): LoadResult {
  return validateData({
    foods: foodsJson,
    characters: charactersJson,
    trends: trendsJson,
    constants: constantsJson,
  });
}
