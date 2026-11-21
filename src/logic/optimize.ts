import type { Constants, Food, Staff, Trend } from '../types';
import { EPS, foodBase, revenueOf, staffBuffs, type Buffs } from './calc';

/** 소요 시간 경고 기준 (SPEC 6.3, 게임 데이터가 아니므로 코드 상수) */
export const SLOW_WARN_MS = 2000;

export interface OptimizeInput {
  foods: Food[];
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
  revenue: number;
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
  revenue: number;
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
  if (Math.abs(a.revenue - b.revenue) >= EPS) return b.revenue - a.revenue;
  return compareIdx(a.menuIdx, b.menuIdx);
}

const KEYS: (keyof Buffs)[] = ['priceAdd', 'priceMul', 'trafficAdd', 'trafficMul'];

/** 남은 후보 중 값별로 독립적인 상위 r개 합 */
function topSums(vecs: Buffs[], from: number, r: number): Buffs {
  const out: Buffs = { priceAdd: 0, priceMul: 0, trafficAdd: 0, trafficMul: 0 };
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
  return {
    priceAdd: a.priceAdd + b.priceAdd,
    priceMul: a.priceMul + b.priceMul,
    trafficAdd: a.trafficAdd + b.trafficAdd,
    trafficMul: a.trafficMul + b.trafficMul,
  };
}

/** SPEC 6 최적화: 분기 한정으로 정확한 상위 K개 결과(묶음 기준)를 구한다. */
export function optimize(input: OptimizeInput): OptimizeOutput {
  const t0 = performance.now();
  const { foods, owned, trend, popularity, constants, k } = input;
  const menuSize = Math.min(constants.maxFoods, foods.length);
  const slots = Math.min(constants.maxStaff, owned.length);
  const bases = foods.map((f) => foodBase(f, trend, constants));

  // 1. 메뉴별 직원 버프 벡터와 상한
  interface MenuEntry {
    idx: number[];
    baseSum: number;
    vecs: Buffs[];
    bound: number;
  }
  const menus: MenuEntry[] = [];
  for (const idx of combinations(foods.length, menuSize)) {
    const menu = idx.map((i) => foods[i]);
    const baseSum = idx.reduce((s, i) => s + bases[i], 0);
    const vecs = owned.map((s) => staffBuffs(s, menu));
    const bound = revenueOf(baseSum, menuSize, topSums(vecs, 0, slots), constants, popularity);
    menus.push({ idx, baseSum, vecs, bound });
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
    const found: { idx: number[]; revenue: number }[] = [];
    const chosen: number[] = [];
    const n = m.vecs.length;
    const dfs = (i: number, cur: Buffs) => {
      const r = slots - chosen.length;
      if (r === 0) {
        evaluatedCombos++;
        const revenue = revenueOf(m.baseSum, menuSize, cur, constants, popularity);
        if (revenue >= threshold - EPS) found.push({ idx: chosen.slice(), revenue });
        return;
      }
      if (n - i < r) return;
      const ub = revenueOf(m.baseSum, menuSize, addBuffs(cur, topSums(m.vecs, i, r)), constants, popularity);
      if (ub < threshold - EPS) return;
      chosen.push(i);
      dfs(i + 1, addBuffs(cur, m.vecs[i]));
      chosen.pop();
      dfs(i + 1, cur);
    };
    dfs(0, { priceAdd: 0, priceMul: 0, trafficAdd: 0, trafficMul: 0 });
    if (!found.length) continue;

    // 같은 메뉴 + 같은 수익 묶기
    found.sort((a, b) => b.revenue - a.revenue);
    let start = 0;
    while (start < found.length) {
      let end = start + 1;
      while (end < found.length && Math.abs(found[start].revenue - found[end].revenue) < EPS) end++;
      const combos = found.slice(start, end).sort((a, b) => compareIdx(a.idx, b.idx));
      groups.push({
        revenue: combos[0].revenue,
        menuIdx: m.idx,
        staffIdx: combos[0].idx,
        altIdx: combos.slice(1).map((c) => c.idx),
      });
      start = end;
    }

    groups.sort(compareGroups);
    if (groups.length >= k && k > 0) {
      threshold = groups[k - 1].revenue;
      groups = groups.filter((g) => g.revenue >= threshold - EPS);
    }
  }

  // 공동 순위 (1, 1, 3)
  const result: ResultGroup[] = groups.map((g) => ({
    rank: 0,
    revenue: g.revenue,
    menu: g.menuIdx.map((i) => foods[i]),
    menuIdx: g.menuIdx,
    staff: g.staffIdx.map((i) => owned[i]),
    alternatives: g.altIdx.map((c) => c.map((i) => owned[i])),
  }));
  result.forEach((g, i) => {
    g.rank = i > 0 && Math.abs(result[i - 1].revenue - g.revenue) < EPS ? result[i - 1].rank : i + 1;
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
