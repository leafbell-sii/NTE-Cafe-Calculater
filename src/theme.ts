import { useEffect, useState } from 'react';

// 화면 테마. 공유 링크에 담기지 않도록 입력값 접두사(PREFIX) 밖의 키에 저장한다.
// index.html의 인라인 스크립트가 첫 렌더 전에 같은 규칙으로 data-theme을 먼저 적용한다(깜빡임 방지).
export const THEME_KEY = 'nte-cafe:theme';

export const THEME_PREFS = ['system', 'dark', 'light'] as const;
export type ThemePref = (typeof THEME_PREFS)[number];
export type Theme = 'dark' | 'light';

export const THEME_LABEL: Record<ThemePref, string> = { system: '시스템', dark: '다크', light: '라이트' };

export const parsePref = (v: unknown): ThemePref =>
  THEME_PREFS.includes(v as ThemePref) ? (v as ThemePref) : 'system';

/** 시스템 → 다크 → 라이트 → 시스템 */
export const nextPref = (p: ThemePref): ThemePref => THEME_PREFS[(THEME_PREFS.indexOf(p) + 1) % THEME_PREFS.length];

export const resolveTheme = (p: ThemePref, systemLight: boolean): Theme =>
  p === 'system' ? (systemLight ? 'light' : 'dark') : p;

function readPref(): ThemePref {
  try {
    return parsePref(localStorage.getItem(THEME_KEY));
  } catch {
    return 'system';
  }
}

export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(readPref);
  const [systemLight, setSystemLight] = useState(() => matchMedia('(prefers-color-scheme: light)').matches);

  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: light)');
    const on = (e: MediaQueryListEvent) => setSystemLight(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = resolveTheme(pref, systemLight);
    try {
      if (pref === 'system') localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, pref);
    } catch {
      // 저장 불가는 무시
    }
  }, [pref, systemLight]);

  return { pref, theme: resolveTheme(pref, systemLight), cycle: () => setPref(nextPref) };
}
