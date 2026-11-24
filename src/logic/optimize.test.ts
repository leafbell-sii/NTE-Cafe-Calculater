import { describe, expect, it } from 'vitest';
import { loadGameData, validateData } from '../data/load';
import type { GameData, Staff, Trend } from '../types';
import { calculate, EPS, foodCoefOf, zeroBuffs, type SortBy } from './calc';
import { compareIdx, optimize, swapLines } from './optimize';
import { buildTrends, NONE_TREND } from './trends';
import foods from '../data/foods.json';
import ingredients from '../data/ingredients.json';
import characters from '../data/characters.json';
import trends from '../data/trends.json';
import constants from '../data/constants.json';

const loaded = loadGameData();
if (!loaded.ok) throw new Error(JSON.stringify(loaded.errors));
const data: GameData = loaded.data;
const byId = (id: string) => data.characters.find((c) => c.id === id)!;
const food = (id: string) => data.foods.find((f) => f.id === id)!;
const trend = (id: string): Trend => buildTrends(data).find((t) => t.id === id)!;

describe('데이터 검증', () => {
  it('현재 데이터는 통과', () => {
    expect(loaded.ok).toBe(true);
  });
  it('오류를 파일/경로와 함께 보고', () => {
    const badFoods = structuredClone(foods) as any[];
    badFoods[1].id = badFoods[0].id;
    badFoods[2].tag = '간식';
    const badChars = structuredClone(characters) as any[];
    badChars[0].effects[0].level = 9;
    badChars[1].skillText.pop();
    const badTrends = { ingredientGroups: [{ id: 'x', label: 'x', ingredients: ['없는재료'] }] };
    const r = validateData({ foods: badFoods, ingredients, characters: badChars, trends: badTrends, constants });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    const paths = r.errors.map((e) => `${e.file}:${e.path}`);
    expect(paths).toContain('foods.json:[2].tag');
    // 스키마 실패 시 foods는 undefined → 중복/참조 검사는 건너뜀
    expect(paths).toContain('characters.json:[0].effects[0].level');
    expect(paths).toContain('characters.json:[1].skillText');
  });
  it('중복 id와 트렌드 재료 참조', () => {
    const badFoods = structuredClone(foods) as any[];
    badFoods[1].id = badFoods[0].id;
    const badTrends = { ingredientGroups: [{ id: 'x', label: 'x', ingredients: ['없는재료'] }] };
    const r = validateData({ foods: badFoods, ingredients, characters, trends: badTrends, constants });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    const paths = r.errors.map((e) => `${e.file}:${e.path}`);
    expect(paths).toContain('foods.json:[1].id');
    expect(paths).toContain('trends.json:ingredientGroups[0].ingredients[0]');
  });
  it('식재료 참조·개수·중복', () => {
    const badFoods = structuredClone(foods) as any[];
    badFoods[0].ingredients[0].name = '없는재료';
    badFoods[1].ingredients[1].count = 0;
    const badIngs = [...structuredClone(ingredients), { name: '밀가루', price: 1 }];
    const r = validateData({ foods: badFoods, ingredients: badIngs, characters, trends, constants });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    const paths = r.errors.map((e) => `${e.file}:${e.path}`);
    expect(paths).toContain('foods.json:[1].ingredients[1].count');
    expect(paths).toContain(`ingredients.json:[${ingredients.length}].name`);
    const r2 = validateData({ foods: (() => { const f = structuredClone(foods) as any[]; f[0].ingredients[0].name = '없는재료'; return f; })(), ingredients, characters, trends, constants });
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.errors.map((e) => `${e.file}:${e.path}`)).toContain('foods.json:[0].ingredients[0].name');
  });
});

describe('트렌드', () => {
  it('선택지: 없음 / 태그 3 / 묶음 / 재료(중복 제거)', () => {
    const list = buildTrends(data);
    const names = new Set(data.foods.flatMap((f) => f.ingredients.map((i) => i.name)));
    expect(list.length).toBe(1 + 3 + trends.ingredientGroups.length + names.size + 1);
    expect(list[list.length - 1].id).toBe('average');
    expect(list.map((t) => t.id)).toContain('group:fruit');
    expect(list.map((t) => t.id)).toContain('ingredient:사과');
  });
  it('과일 트렌드는 한 음식에 1회', () => {
    const r = calculate({
      menu: [food('hot-orange-coffee')],
      staff: [],
      trend: trend('group:fruit'),
      popularity: 0,
      constants: data.constants, ingredients: data.ingredients,
    });
    expect(r.foods[0].trendAdd).toBe(0.75);
    expect(r.foods[0].trendMul).toBe(0);
  });
  it('태그 트렌드 계수는 1.00', () => {
    const r = calculate({
      menu: [food('iced-mocha')],
      staff: [],
      trend: trend('tag:음료'),
      popularity: 0,
      constants: data.constants, ingredients: data.ingredients,
    });
    expect(r.foods[0].trendMul).toBe(1.0);
    expect(r.foods[0].trendAdd).toBe(0);
  });
  it('태그 트렌드 계수는 판매가 곱연산을 받고, 과일 트렌드는 받지 않는다', () => {
    const menu = [food('hot-orange-coffee')];
    const priceMul = 0.1;
    const constants = data.constants;
    const staff: Staff[] = [];
    const base = (t: Trend) => calculate({ menu, staff, trend: t, popularity: 0, constants, ingredients: data.ingredients });
    // 버프 없이 곱연산만 직접 확인: coef = (price + A + tMul)(1 + M) + tAdd
    const tag = base(trend('tag:음료')).foods[0];
    const fruit = base(trend('group:fruit')).foods[0];
    const price = menu[0].price;
    expect(tag.coef).toBeCloseTo(price + 1.0, 10);
    expect(fruit.coef).toBeCloseTo(price + 0.75, 10);
    // 곱연산 버프가 있을 때의 계산식 (revenueOf 인수분해 형태와 영수증 일치)
    const b = { ...zeroBuffs(), priceMul };
    expect(foodCoefOf(price, { mul: 1.0, add: 0 }, 1, b)).toBeCloseTo((price + 1.0) * 1.1, 10);
    expect(foodCoefOf(price, { mul: 0, add: 0.75 }, 1, b)).toBeCloseTo(price * 1.1 + 0.75, 10);
  });
  it('범용(평균) 트렌드 수익 = 전체 트렌드 수익의 평균', () => {
    const all = buildTrends(data);
    const avg = trend('average');
    const subs = all.filter((t) => t.kind !== 'none' && t.kind !== 'average');
    const menu = ['hot-orange-coffee', 'tiramisu', 'iced-mocha', 'apple-pie', 'ham-cheese-croissant'].map(food);
    const staff: Staff[] = data.characters.slice(0, 10).map((c) => ({ character: c, level: 5 }));
    for (const sortBy of ['revenue', 'net'] as const) {
      const calc = (t: Trend) => {
        const r = calculate({ menu, staff, trend: t, popularity: 0.02, constants: data.constants, ingredients: data.ingredients });
        return sortBy === 'net' ? r.net : r.revenue;
      };
      const mean = subs.reduce((s, t) => s + calc(t), 0) / subs.length;
      expect(calc(avg)).toBeCloseTo(mean, 9);
    }
  });
});

describe('계산', () => {
  it('기본 계산식', () => {
    // 음식 2개, 민트 Lv5(+0.3), 백장 Lv1(+18P), 우미츠키 Lv5 (음료 2개: +0.12, 유동인구 +2.5%)
    const menu = [food('iced-mocha'), food('golden-amber')];
    const staff: Staff[] = [
      { character: byId('mint'), level: 5 },
      { character: byId('baekjang'), level: 1 },
      { character: byId('umitsuki'), level: 5 },
    ];
    const r = calculate({ menu, staff, trend: trend('tag:음료'), popularity: 0.015, constants: data.constants, ingredients: data.ingredients });
    const A = 0.12 + 0.18 + 0.12;
    const foodCoef = 10.6 + 1.0 + A + (12.2 + 1.0 + A);
    const traffic = (2400 + 18) * (1 + 0.025);
    expect(r.revenue).toBeCloseTo(foodCoef * (traffic / 100) * 1.015, 10);
  });
  it('마네키네코는 유동인구 곱연산 버프에 합산', () => {
    const menu = [food('iced-mocha'), food('golden-amber')];
    const staff: Staff[] = [{ character: byId('umitsuki'), level: 5 }]; // 음료 2개: 유동인구 +2.5%
    const calc = (maneki: boolean) =>
      calculate({ menu, staff, trend: NONE_TREND, popularity: 0, maneki, constants: data.constants, ingredients: data.ingredients });
    const on = calc(true);
    expect(on.maneki).toBe(0.01);
    expect(on.buffs.trafficMul).toBeCloseTo(0.035, 12);
    expect(on.traffic).toBeCloseTo(2400 * (1 + 0.025 + 0.01), 10);
    expect(calc(false).traffic).toBeCloseTo(2400 * 1.025, 10);
  });
  it('신쿠 Lv1 + Lv3 조건이 같아도 각각 적용', () => {
    const menu = [food('iced-mocha'), food('golden-amber'), food('ganache-chocolate-latte')];
    const r = calculate({
      menu,
      staff: [{ character: byId('shinku'), level: 3 }],
      trend: NONE_TREND,
      popularity: 0,
      constants: data.constants, ingredients: data.ingredients,
    });
    expect(r.buffs.priceAdd).toBeCloseTo(0.6, 12);
  });
  it('재료 트렌드 계수는 판매가 곱연산 뒤에 더한다 (인게임 티라미수 19.87)', () => {
    // 라크리모사·나나리 제외 전원 Lv5, 커피 원두 트렌드 1등 조합
    const menu = ['hot-orange-coffee', 'crispy-coconut-cookie-macchiato', 'snowy-matcha-latte', 'tiramisu', 'caramel-choco-crepe'].map(food);
    const staff: Staff[] = ['sakiri', 'baekjang', 'daffodil', 'edgar', 'shinku', 'rinko', 'akane-rin', 'umitsuki', 'haniel', 'iroi'].map(
      (id) => ({ character: byId(id), level: 5 }),
    );
    const r = calculate({ menu, staff, trend: trend('ingredient:커피 원두'), popularity: 0, constants: data.constants, ingredients: data.ingredients });
    const tira = r.foods.find((f) => f.food.id === 'tiramisu')!;
    expect(tira.coef).toBeCloseTo((17 + 1.56) * 1.03 + 0.75, 10);
    expect(tira.coef.toFixed(2)).toBe('19.87');
  });
  it('조건 미충족 효과는 met=false로 남는다', () => {
    const r = calculate({
      menu: [food('apple-pie')],
      staff: [{ character: byId('lacrimosa'), level: 5 }],
      trend: NONE_TREND,
      popularity: 0,
      constants: data.constants, ingredients: data.ingredients,
    });
    expect(r.effects.filter((e) => e.effect.kind !== 'ingredientReduce').map((e) => e.met)).toEqual([true, false]);
  });
  it('식재료 소모량과 비용', () => {
    // 애플파이(밀가루 0.02, 사과 0.02) + 티라미수(밀가루 0.03, 푸카 쿠키 0.02, 치즈 덩이 0.01, 커피 원두 0.01)
    // 사키리 Lv5(감소 2%) + 우미츠키 Lv5(감소 1%), 백장 Lv1(+18P)
    const r = calculate({
      menu: [food('apple-pie'), food('tiramisu')],
      staff: [
        { character: byId('sakiri'), level: 5 },
        { character: byId('umitsuki'), level: 5 },
        { character: byId('baekjang'), level: 1 },
      ],
      trend: NONE_TREND,
      popularity: 0.1,
      constants: data.constants, ingredients: data.ingredients,
    });
    expect(r.reduce).toBeCloseTo(0.03, 12);
    const t = 2418 / 100;
    const flour = r.ingredients.find((l) => l.name === '밀가루')!;
    expect(flour.uses).toBeCloseTo(0.05, 12);
    expect(flour.perHour).toBeCloseTo(t * 0.05 * 0.97, 12);
    // 개념 변경 전(유동인구/10000 × 정수 개수)과 같은 값
    expect(flour.perHour).toBeCloseTo((2418 / 10000) * 5 * 0.97, 12);
    const costSum = 0.05 * 24 + 0.02 * 28 + 0.02 * 72 + 0.01 * 44 + 0.01 * 24;
    expect(r.ingredientCost).toBeCloseTo(t * 0.97 * costSum, 10);
    expect(r.net).toBeCloseTo(r.revenue - r.ingredientCost, 10);
  });
});

// ---------------------------------------------------------------------------
// 브루트포스 대조
// ---------------------------------------------------------------------------

function* combos<T>(arr: T[], r: number, start = 0, acc: T[] = []): Generator<T[]> {
  if (acc.length === r) {
    yield acc.slice();
    return;
  }
  for (let i = start; i <= arr.length - (r - acc.length); i++) {
    acc.push(arr[i]);
    yield* combos(arr, r, i + 1, acc);
    acc.pop();
  }
}

interface BruteGroup {
  revenue: number;
  menuIdx: number[];
  combos: number[][];
}

function brute(owned: Staff[], t: Trend, popularity: number, foodsSubset = data.foods, sortBy: SortBy = 'revenue', maneki = false): BruteGroup[] {
  const fi = foodsSubset.map((_, i) => i);
  const si = owned.map((_, i) => i);
  const menuSize = Math.min(5, foodsSubset.length);
  const slots = Math.min(10, owned.length);
  const groups: BruteGroup[] = [];
  for (const m of combos(fi, menuSize)) {
    const menu = m.map((i) => foodsSubset[i]);
    const rows = [...combos(si, slots)].map((c) => ({
      c,
      revenue: (() => {
        const r = calculate({ menu, staff: c.map((i) => owned[i]), trend: t, popularity, maneki, constants: data.constants, ingredients: data.ingredients });
        return sortBy === 'net' ? r.net : r.revenue;
      })(),
    }));
    rows.sort((a, b) => b.revenue - a.revenue);
    let s = 0;
    while (s < rows.length) {
      let e = s + 1;
      while (e < rows.length && Math.abs(rows[s].revenue - rows[e].revenue) < EPS) e++;
      const cs = rows.slice(s, e).map((r) => r.c).sort(compareIdx);
      groups.push({ revenue: rows[s].revenue, menuIdx: m, combos: cs });
      s = e;
    }
  }
  groups.sort((a, b) =>
    Math.abs(a.revenue - b.revenue) >= EPS ? b.revenue - a.revenue : compareIdx(a.menuIdx, b.menuIdx),
  );
  return groups;
}

function check(owned: Staff[], t: Trend, popularity: number, k: number, foodsSubset = data.foods, sortBy: SortBy = 'revenue', maneki = false) {
  const expected = brute(owned, t, popularity, foodsSubset, sortBy, maneki);
  const { groups } = optimize({ foods: foodsSubset, owned, trend: t, popularity, maneki, constants: data.constants, ingredients: data.ingredients, k, sortBy });
  expect(groups.length).toBeGreaterThanOrEqual(Math.min(k, expected.length));
  // 반환된 결과는 브루트포스 상위와 일치 (동점 포함)
  groups.forEach((g, i) => {
    const e = expected[i];
    expect(g.score).toBeCloseTo(e.revenue, 8);
    expect(g.menuIdx).toEqual(e.menuIdx);
    const ownedIdx = (s: Staff) => owned.indexOf(s);
    expect(g.staff.map(ownedIdx)).toEqual(e.combos[0]);
    expect(g.alternatives.map((a) => a.map(ownedIdx))).toEqual(e.combos.slice(1));
  });
  // K번째와 동점인 결과는 모두 포함
  if (expected.length > k) {
    const kth = expected[k - 1].revenue;
    const tied = expected.filter((e) => e.revenue >= kth - EPS).length;
    expect(groups.length).toBe(tied);
  }
  return groups;
}

describe('최적화 = 브루트포스', () => {
  // 브루트포스 비용을 줄이기 위해 음식 일부로 검증
  const foodsSmall = data.foods.filter((_, i) => i % 2 === 0 || i > 13); // 13개

  it('보유 12명 (10명 선택) · 음료 트렌드', () => {
    const owned = data.characters.slice(0, 12).map((c, i) => ({ character: c, level: (i % 5) + 1 }));
    check(owned, trend('tag:음료'), 0.015, 20, foodsSmall);
  });
  it('보유 12명 · 전원 Lv5 · 트렌드 없음 (동점 다수)', () => {
    const owned = data.characters.slice(0, 12).map((c) => ({ character: c, level: 5 }));
    const groups = check(owned, NONE_TREND, 0, 15, foodsSmall);
    expect(groups.some((g) => g.alternatives.length > 0)).toBe(true);
  });
  it('보유 5명 (전원 배치) · 전체 음식', () => {
    const owned = ['sakiri', 'nanari', 'shinku', 'umitsuki', 'lacrimosa'].map((id) => ({
      character: byId(id),
      level: 5,
    }));
    check(owned, trend('group:fruit'), 0.1, 25);
  });
  it('순수익 정렬 · 보유 12명 (10명 선택, 레벨 섞음)', () => {
    const owned = data.characters.slice(0, 12).map((c, i) => ({ character: c, level: ((i * 3) % 5) + 1 }));
    check(owned, trend('tag:디저트'), 0.05, 20, foodsSmall, 'net');
  });
  it('순수익 정렬 · 보유 5명 · 전체 음식', () => {
    const owned = ['sakiri', 'baekjang', 'shinku', 'umitsuki', 'mint'].map((id) => ({ character: byId(id), level: 5 }));
    check(owned, NONE_TREND, 0, 25, data.foods, 'net');
  });
  it('범용(평균) 트렌드 · 보유 12명 · 매출/순수익', () => {
    const owned = data.characters.slice(0, 12).map((c, i) => ({ character: c, level: ((i * 2) % 5) + 1 }));
    check(owned, trend('average'), 0.03, 20, foodsSmall);
    check(owned, trend('average'), 0.03, 20, foodsSmall, 'net');
  });
  it('마네키네코 · 보유 12명 · 매출/순수익', () => {
    const owned = data.characters.slice(0, 12).map((c, i) => ({ character: c, level: ((i * 4) % 5) + 1 }));
    check(owned, trend('tag:음료'), 0.02, 20, foodsSmall, 'revenue', true);
    check(owned, trend('tag:음료'), 0.02, 20, foodsSmall, 'net', true);
  });
  it('보유 0명', () => {
    check([], trend('tag:디저트'), 0, 5, foodsSmall);
  });
  it('공동 순위는 1, 1, 3 형식', () => {
    const owned = data.characters.map((c) => ({ character: c, level: 5 }));
    const { groups } = optimize({
      foods: data.foods,
      owned,
      trend: NONE_TREND,
      popularity: 0,
      constants: data.constants, ingredients: data.ingredients,
      k: 30,
    });
    groups.forEach((g, i) => {
      if (i === 0) expect(g.rank).toBe(1);
      else if (Math.abs(groups[i - 1].score - g.score) < EPS) expect(g.rank).toBe(groups[i - 1].rank);
      else expect(g.rank).toBe(i + 1);
    });
  });
});

describe('대체 가능 직원', () => {
  it('빠지는 직원 기준으로 묶고 정렬', () => {
    const order = new Map(data.characters.map((c, i) => [c.id, i]));
    const s = (id: string): Staff => ({ character: byId(id), level: 5 });
    const rep = [s('sakiri'), s('baekjang'), s('daffodil')];
    const lines = swapLines(
      rep,
      [
        [s('sakiri'), s('skia'), s('edgar')],
        [s('sakiri'), s('daffodil'), s('edgar')],
        [s('sakiri'), s('daffodil'), s('skia')],
      ],
      order,
    );
    expect(lines.map((l) => [l.out.map((x) => x.character.id), l.ins.map((g) => g.map((x) => x.character.id))])).toEqual(
      [
        [['baekjang'], [['skia'], ['edgar']]],
        [['baekjang', 'daffodil'], [['skia', 'edgar']]],
      ],
    );
  });
});
