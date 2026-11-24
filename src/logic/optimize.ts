import { EFFECT_KINDS, type Constants, type Food, type Ingredient, type Staff, type Trend } from '../types';
import {
  EPS,
  foodCoefOf,
  foodIngredientCost,
  INGREDIENT_TRAFFIC_DIV,
  priceMap,
  reduceCoefOf,
  revenueOf,
  scoreOf,
  staffBuffs,
  trafficOf,
  zeroBuffs,
  type Buffs,
  type SortBy,
} from './calc';
import { addTrend, trendBonus, zeroTrend, type TrendBonus } from './trends';

/** 소요 시간 경고 기준 (SPEC 6.3, 게임 데이터가 아니므로 코드 상수) */
export const SLOW_WARN_MS = 2000;

export interface OptimizeInput {
  foods: Food[];
  /** 식재료 가격 (순수익 계산용) */
  ingredients: Ingredient[];
  /** 정렬 기준 (기본: 매출) */
  sortBy?: SortBy;
  /** 보유 캐릭터. characters.json 순서여야 한다. */
  owned: Staff[];
  trend: Trend;
  popularity: number;
  constants: Constants;
  /** 필요한 결과(묶음) 개수 */
  k: number;
}

export interface ResultGroup {
  rank: number;
  /** 정렬 기준 값 (매출 또는 순수익) */
  score: number;
  /** foods.json 순서 */
  menu: Food[];
  menuIdx: number[];
  /** 대표 조합 */
  staff: Staff[];
  /** 같은 메뉴 + 같은 수익인 나머지 직원 조합 */
  alternatives: Staff[][];
}

export interface OptimizeStats {
  elapsedMs: number;
  ownedCount: number;
  foodCount: number;
  k: number;
  evaluatedMenus: number;
  totalMenus: number;
  evaluatedCombos: number;
}

export interface OptimizeOutput {
  groups: ResultGroup[];
  stats: OptimizeStats;
}

interface RawGroup {
  score: number;
  menuIdx: number[];
  staffIdx: number[];
  altIdx: number[][];
}

function* combinations(n: number, r: number): Generator<number[]> {
  if (r > n || r < 0) return;
  const idx = Array.from({ length: r }, (_, i) => i);
  while (true) {
    yield idx.slice();
    let i = r - 1;
    while (i >= 0 && idx[i] === n - r + i) i--;
    if (i < 0) return;
    idx[i]++;
    for (let j = i + 1; j < r; j++) idx[j] = idx[j - 1] + 1;
  }
}

/** 인덱스 배열 사전식 비교 */
export function compareIdx(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return a.length - b.length;
}

/** 수익 내림차순, 동점이면 메뉴 사전식 (SPEC 6.1) */
function compareGroups(a: RawGroup, b: RawGroup): number {
  if (Math.abs(a.score - b.score) >= EPS) return b.score - a.score;
  return compareIdx(a.menuIdx, b.menuIdx);
}

const KEYS = EFFECT_KINDS;

/** 남은 후보 중 값별로 독립적인 상위 r개 합 */
function topSums(vecs: Buffs[], from: number, r: number): Buffs {
  const out = zeroBuffs();
  if (r <= 0) return out;
  for (const key of KEYS) {
    const vals: number[] = [];
    for (let i = from; i < vecs.length; i++) vals.push(vecs[i][key]);
    vals.sort((x, y) => y - x);
    let s = 0;
    for (let i = 0; i < r && i < vals.length; i++) s += vals[i];
    out[key] = s;
  }
  return out;
}

function addBuffs(a: Buffs, b: Buffs): Buffs {
  const out = zeroBuffs();
  for (const key of KEYS) out[key] = a[key] + b[key];
  return out;
}

interface MenuValues {
  priceSum: number;
  trendSum: TrendBonus;
  /** Σ_A M(A)·가격(A) */
  costSum: number;
}

/**
 * 상한: 실제 버프는 키별로 lo 이상 hi 이하.
 * - 매출은 모든 버프에 단조 증가 → hi로 계산.
 * - 순수익 = 유동인구/100 × [음식계수·(1+인기도) − (1−감소량)·costSum/100]
 *   괄호 안은 판매가·감소량에 단조 증가 → hi로 상한. 유동인구는 괄호 부호에 따라 hi/lo 중 큰 쪽.
 */
function boundOf(
  sortBy: SortBy,
  m: MenuValues,
  n: number,
  lo: Buffs,
  hi: Buffs,
  constants: Constants,
  popularity: number,
): number {
  if (sortBy === 'revenue') return revenueOf(m.priceSum, m.trendSum, n, hi, constants, popularity);
  const foodCoef = foodCoefOf(m.priceSum, m.trendSum, n, hi);
  const bracket =
    foodCoef * (1 + popularity) - (reduceCoefOf(hi.ingredientReduce) * m.costSum * 100) / INGREDIENT_TRAFFIC_DIV;
  return (Math.max(trafficOf(hi, constants) * bracket, trafficOf(lo, constants) * bracket)) / 100;
}

/** SPEC 6 최적화: 분기 한정으로 정확한 상위 K개 결과(묶음 기준)를 구한다. */
export function optimize(input: OptimizeInput): OptimizeOutput {
  const t0 = performance.now();
  const { foods, ingredients, sortBy = 'revenue', owned, trend, popularity, constants, k } = input;
  const menuSize = Math.min(constants.maxFoods, foods.length);
  const slots = Math.min(constants.maxStaff, owned.length);
  const trendBonuses = foods.map((f) => trendBonus(trend, f, constants));
  const prices = priceMap(ingredients);
  const foodCosts = foods.map((f) => foodIngredientCost(f, prices));
  const score = (m: MenuValues, b: Buffs) =>
    scoreOf(sortBy, m.priceSum, m.trendSum, m.costSum, menuSize, b, constants, popularity);
  const bound = (m: MenuValues, lo: Buffs, hi: Buffs) => boundOf(sortBy, m, menuSize, lo, hi, constants, popularity);

  // 1. 메뉴별 직원 버프 벡터와 상한
  interface MenuEntry extends MenuValues {
    idx: number[];
    vecs: Buffs[];
    bound: number;
  }
  const menus: MenuEntry[] = [];
  for (const idx of combinations(foods.length, menuSize)) {
    const menu = idx.map((i) => foods[i]);
    const priceSum = idx.reduce((s, i) => s + foods[i].price, 0);
    const trendSum = idx.reduce((s, i) => addTrend(s, trendBonuses[i]), zeroTrend());
    const costSum = idx.reduce((s, i) => s + foodCosts[i], 0);
    const vecs = owned.map((s) => staffBuffs(s, menu));
    const values = { priceSum, trendSum, costSum };
    menus.push({ idx, ...values, vecs, bound: bound(values, zeroBuffs(), topSums(vecs, 0, slots)) });
  }
  menus.sort((a, b) => b.bound - a.bound || compareIdx(a.idx, b.idx));

  let groups: RawGroup[] = [];
  let threshold = -Infinity;
  let evaluatedMenus = 0;
  let evaluatedCombos = 0;

  for (const m of menus) {
    if (m.bound < threshold - EPS) break; // 2. 이후 메뉴 모두 건너뜀
    evaluatedMenus++;

    // 3. 직원 조합 탐색 (넣기/빼기 DFS + 상한 가지치기)
    const found: { idx: number[]; score: number }[] = [];
    const chosen: number[] = [];
    const n = m.vecs.length;
    const dfs = (i: number, cur: Buffs) => {
      const r = slots - chosen.length;
      if (r === 0) {
        evaluatedCombos++;
        const s = score(m, cur);
        if (s >= threshold - EPS) found.push({ idx: chosen.slice(), score: s });
        return;
      }
      if (n - i < r) return;
      const ub = bound(m, cur, addBuffs(cur, topSums(m.vecs, i, r)));
      if (ub < threshold - EPS) return;
      chosen.push(i);
      dfs(i + 1, addBuffs(cur, m.vecs[i]));
      chosen.pop();
      dfs(i + 1, cur);
    };
    dfs(0, zeroBuffs());
    if (!found.length) continue;

    // 같은 메뉴 + 같은 수익 묶기
    found.sort((a, b) => b.score - a.score);
    let start = 0;
    while (start < found.length) {
      let end = start + 1;
      while (end < found.length && Math.abs(found[start].score - found[end].score) < EPS) end++;
      const combos = found.slice(start, end).sort((a, b) => compareIdx(a.idx, b.idx));
      groups.push({
        score: combos[0].score,
        menuIdx: m.idx,
        staffIdx: combos[0].idx,
        altIdx: combos.slice(1).map((c) => c.idx),
      });
      start = end;
    }

    groups.sort(compareGroups);
    if (groups.length >= k && k > 0) {
      threshold = groups[k - 1].score;
      groups = groups.filter((g) => g.score >= threshold - EPS);
    }
  }

  // 공동 순위 (1, 1, 3)
  const result: ResultGroup[] = groups.map((g) => ({
    rank: 0,
    score: g.score,
    menu: g.menuIdx.map((i) => foods[i]),
    menuIdx: g.menuIdx,
    staff: g.staffIdx.map((i) => owned[i]),
    alternatives: g.altIdx.map((c) => c.map((i) => owned[i])),
  }));
  result.forEach((g, i) => {
    g.rank = i > 0 && Math.abs(result[i - 1].score - g.score) < EPS ? result[i - 1].rank : i + 1;
  });

  const elapsedMs = performance.now() - t0;
  const stats: OptimizeStats = {
    elapsedMs,
    ownedCount: owned.length,
    foodCount: foods.length,
    k,
    evaluatedMenus,
    totalMenus: menus.length,
    evaluatedCombos,
  };
  if (elapsedMs >= SLOW_WARN_MS) {
    console.warn(
      `[최적화] ${elapsedMs.toFixed(0)}ms · 보유 캐릭터 ${stats.ownedCount}명 · 음식 ${stats.foodCount}개 · K=${k} · ` +
        `메뉴 ${evaluatedMenus}/${menus.length} · 직원 조합 ${evaluatedCombos}`,
    );
  }
  return { groups: result, stats };
}

// ---------------------------------------------------------------------------
// 대체 가능 직원 (SPEC 7.2)
// ---------------------------------------------------------------------------

export interface SwapLine {
  out: Staff[];
  /** 들어오는 직원 묶음들 (각 묶음이 하나의 대체 케이스) */
  ins: Staff[][];
}

export function swapLines(rep: Staff[], alternatives: Staff[][], order: Map<string, number>): SwapLine[] {
  const pos = (s: Staff) => order.get(s.character.id) ?? 0;
  const byOrder = (a: Staff, b: Staff) => pos(a) - pos(b);
  const ids = (list: Staff[]) => list.map(pos);
  const repIds = new Set(rep.map((s) => s.character.id));
  const lines = new Map<string, SwapLine>();
  for (const alt of alternatives) {
    const altIds = new Set(alt.map((s) => s.character.id));
    const out = rep.filter((s) => !altIds.has(s.character.id)).sort(byOrder);
    const inn = alt.filter((s) => !repIds.has(s.character.id)).sort(byOrder);
    const key = out.map((s) => s.character.id).join(',');
    const line = lines.get(key) ?? { out, ins: [] };
    line.ins.push(inn);
    lines.set(key, line);
  }
  const list = [...lines.values()];
  for (const l of list) l.ins.sort((a, b) => compareIdx(ids(a), ids(b)));
  list.sort((a, b) => a.out.length - b.out.length || compareIdx(ids(a.out), ids(b.out)));
  return list;
}
