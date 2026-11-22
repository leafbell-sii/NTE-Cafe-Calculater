import { PREFIX } from './persist';
import { loadGameData } from './data/load';
import { buildTrends } from './logic/trends';
import type { GameData } from './types';

// 설정 공유: 저장된 입력값을 URL 해시에 담는다.
// 받은 쪽은 앱 시작 전에 localStorage에 덮어쓰고, 값 검증은 평소 복원 경로(sanitize)가 맡는다.
//
// #c=  압축 형식 (기본). id 문자열 대신 데이터 JSON의 순서(인덱스)를 바이트로 담는다.
//      [버전][플래그][트렌드][캐릭터별 보유·레벨 4비트…][수동 모드(있을 때만)][인기도 문자열]
//      ※ 데이터 JSON의 항목 순서가 바뀌면 그 전에 만든 링크는 다른 설정으로 열릴 수 있다.
// #s=  구 형식 (localStorage JSON 전체). 읽기만 지원.
const COMPACT = 'c';
const LEGACY = 's';
const VERSION = 1;
const FLAG_MANUAL_MODE = 1;
const FLAG_MANUAL_DATA = 2;

// ---- base64url ----

const bytesToB64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const b64UrlToBytes = (s: string) =>
  Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

// ---- 저장값 읽기/쓰기 (키 → 값) ----

type Stored = Record<string, unknown>;

function readStored(): Stored {
  const state: Stored = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)!;
    if (!k.startsWith(PREFIX)) continue;
    try {
      state[k.slice(PREFIX.length)] = JSON.parse(localStorage.getItem(k)!);
    } catch {
      // 깨진 값은 제외
    }
  }
  return state;
}

// ---- 압축 형식 ----

const asRecord = (v: unknown) => (typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Stored) : {});
const asArray = (v: unknown) => (Array.isArray(v) ? (v as unknown[]) : []);

/** 압축할 수 없는 데이터 크기면 undefined (→ 구 형식 사용) */
export function encodeCompact(s: Stored, data: GameData): string | undefined {
  const { characters, foods, constants } = data;
  const { maxFoods, maxStaff, maxSkillLevel } = constants;
  const trends = buildTrends(data);
  if (maxSkillLevel > 7 || foods.length > 254 || characters.length > 254 || trends.length > 255) return undefined;

  const level = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= maxSkillLevel ? v : maxSkillLevel);
  const index1 = (ids: string[], v: unknown) => ids.indexOf(v as string) + 1; // 0 = 빈 칸 / 없음
  const nibbles = (vals: number[]) =>
    Array.from({ length: Math.ceil(vals.length / 2) }, (_, i) => (vals[2 * i] << 4) | (vals[2 * i + 1] ?? 0));

  const owned = asRecord(s['optimize.owned']);
  const levels = asRecord(s['optimize.levels']);
  const foodIds = asArray(s['manual.foodIds']);
  const staffIds = asArray(s['manual.staffIds']);
  const mLevels = asArray(s['manual.levels']);
  const foodIdx = Array.from({ length: maxFoods }, (_, i) => index1(foods.map((f) => f.id), foodIds[i]));
  const staffIdx = Array.from({ length: maxStaff }, (_, i) => index1(characters.map((c) => c.id), staffIds[i]));
  const hasManual = foodIdx.some(Boolean) || staffIdx.some(Boolean);

  const bytes = [
    VERSION,
    (s.mode === 'manual' ? FLAG_MANUAL_MODE : 0) | (hasManual ? FLAG_MANUAL_DATA : 0),
    Math.max(0, trends.findIndex((t) => t.id === s.trendId)),
    ...nibbles(characters.map((c) => (owned[c.id] === false ? 0 : 8) | level(levels[c.id]))),
  ];
  if (hasManual) {
    bytes.push(...foodIdx, ...staffIdx, ...nibbles(Array.from({ length: maxStaff }, (_, i) => level(mLevels[i]))));
  }
  const pop = typeof s.popularity === 'number' && s.popularity > 0 ? String(s.popularity) : '';
  for (const ch of pop) bytes.push(ch.charCodeAt(0));
  return bytesToB64Url(Uint8Array.from(bytes));
}

export function decodeCompact(code: string, data: GameData): Stored | undefined {
  const b = b64UrlToBytes(code);
  if (b[0] !== VERSION) return undefined;
  const { characters, foods, constants } = data;
  const { maxFoods, maxStaff } = constants;
  const trends = buildTrends(data);

  let p = 1;
  const take = (n: number) => {
    const out = Array.from(b.subarray(p, p + n));
    if (out.length < n) throw new Error('짧은 링크');
    p += n;
    return out;
  };
  const unNibbles = (n: number) => take(Math.ceil(n / 2)).flatMap((x) => [x >> 4, x & 15]).slice(0, n);

  const [flags, trendIdx] = take(2);
  const charNib = unNibbles(characters.length);
  const out: Stored = {
    mode: flags & FLAG_MANUAL_MODE ? 'manual' : 'optimize',
    trendId: trends[trendIdx]?.id,
    'optimize.owned': Object.fromEntries(characters.map((c, i) => [c.id, (charNib[i] & 8) !== 0])),
    'optimize.levels': Object.fromEntries(characters.map((c, i) => [c.id, charNib[i] & 7])),
    'manual.foodIds': Array(maxFoods).fill(''),
    'manual.staffIds': Array(maxStaff).fill(''),
    'manual.levels': Array(maxStaff).fill(constants.maxSkillLevel),
  };
  if (flags & FLAG_MANUAL_DATA) {
    out['manual.foodIds'] = take(maxFoods).map((x) => foods[x - 1]?.id ?? '');
    out['manual.staffIds'] = take(maxStaff).map((x) => characters[x - 1]?.id ?? '');
    out['manual.levels'] = unNibbles(maxStaff);
  }
  const pop = Number(String.fromCharCode(...b.subarray(p)));
  out.popularity = Number.isFinite(pop) ? pop : 0;
  return out;
}

// ---- 공개 API ----

/** 현재 저장된 설정으로 공유 URL 생성 */
export function buildShareUrl(): string {
  const stored = readStored();
  const loaded = loadGameData();
  const compact = loaded.ok ? encodeCompact(stored, loaded.data) : undefined;
  const url = new URL(location.href);
  url.hash = compact
    ? `${COMPACT}=${compact}`
    : `${LEGACY}=${bytesToB64Url(new TextEncoder().encode(JSON.stringify(stored)))}`;
  return url.toString();
}

/** 앱 렌더 전에 호출: URL에 공유 설정이 있으면 적용하고 해시를 지운다 */
export function applySharedState() {
  const m = location.hash.match(/[#&]([cs])=([A-Za-z0-9_-]+)/);
  if (!m) return;
  try {
    let state: Stored | undefined;
    if (m[1] === COMPACT) {
      const loaded = loadGameData();
      state = loaded.ok ? decodeCompact(m[2], loaded.data) : undefined;
    } else {
      const parsed: unknown = JSON.parse(new TextDecoder().decode(b64UrlToBytes(m[2])));
      state = asRecord(parsed);
    }
    if (state) {
      for (const [k, v] of Object.entries(state)) {
        if (v !== undefined) localStorage.setItem(PREFIX + k, JSON.stringify(v));
      }
    }
  } catch {
    // 잘못된 링크는 무시
  }
  history.replaceState(null, '', location.pathname + location.search);
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
