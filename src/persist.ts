import { useEffect, useState } from 'react';

// SPEC 2: 입력값을 localStorage에 자동 저장하고 다시 들어오면 복원한다.
export const PREFIX = 'nte-cafe:v1:';

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

/**
 * localStorage에 자동 저장되는 state.
 * `sanitize`는 저장값을 검사·보정해 돌려준다. 쓸 수 없으면 `undefined` → 초기값 사용.
 * (데이터 JSON이 바뀌어 없어진 id 등을 걸러내기 위함)
 */
export function usePersistentState<T>(
  key: string,
  initial: () => T,
  sanitize: (saved: unknown) => T | undefined,
) {
  const [value, setValue] = useState<T>(() => {
    const saved = read(key);
    return (saved === undefined ? undefined : sanitize(saved)) ?? initial();
  });

  useEffect(() => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // 저장 불가(사생활 보호 모드, 용량 초과 등)는 무시
    }
  }, [key, value]);

  return [value, setValue] as const;
}

// ---- sanitize 도우미 ----

export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export const oneOf =
  <T extends string>(allowed: readonly T[]) =>
  (v: unknown) =>
    allowed.includes(v as T) ? (v as T) : undefined;

export const nonNegNumber = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : undefined);

export const isLevel = (max: number) => (v: unknown): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= max;

/** id → 값 맵: 현재 id만 남기고, 빠진 id는 기본값으로 채움 */
export const idMap =
  <V,>(ids: string[], ok: (v: unknown) => v is V, fallback: V) =>
  (saved: unknown): Record<string, V> | undefined => {
    if (!isRecord(saved)) return undefined;
    return Object.fromEntries(ids.map((id) => [id, ok(saved[id]) ? (saved[id] as V) : fallback]));
  };

/** 고정 길이 슬롯 배열: 길이를 맞추고 잘못된 칸은 기본값으로 */
export const slots =
  <V,>(length: number, ok: (v: unknown, i: number, arr: unknown[]) => boolean, fallback: V) =>
  (saved: unknown): V[] | undefined => {
    if (!Array.isArray(saved)) return undefined;
    return Array.from({ length }, (_, i) => (ok(saved[i], i, saved) ? (saved[i] as V) : fallback));
  };
