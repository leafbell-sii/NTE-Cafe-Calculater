import { useEffect, useState } from 'react';

// 화면 모드(모바일/컴퓨터). 테마와 같이 공유 링크에 담기지 않도록 입력값 접두사(PREFIX) 밖의 키에 저장한다.
// index.html의 인라인 스크립트가 첫 렌더 전에 같은 규칙으로 data-view와 viewport를 먼저 적용한다(깜빡임 방지).
export const VIEW_KEY = 'nte-cafe:view';

/** 자동 모드에서 컴퓨터 화면이 되는 최소 폭 */
export const WIDE_QUERY = '(min-width: 900px)';
/** 컴퓨터 화면 강제 시 viewport 폭 (휴대폰에서 PC 화면을 축소해 보여줌) */
export const DESKTOP_VIEWPORT = 'width=1200';
export const DEVICE_VIEWPORT = 'width=device-width, initial-scale=1.0';

export const VIEW_PREFS = ['auto', 'mobile', 'desktop'] as const;
export type ViewPref = (typeof VIEW_PREFS)[number];
export type View = 'mobile' | 'desktop';

export const VIEW_LABEL: Record<View, string> = { mobile: '모바일', desktop: '컴퓨터' };

export const parseViewPref = (v: unknown): ViewPref => (VIEW_PREFS.includes(v as ViewPref) ? (v as ViewPref) : 'auto');

export const resolveView = (p: ViewPref, wide: boolean): View => (p === 'auto' ? (wide ? 'desktop' : 'mobile') : p);

/** 지금 화면의 반대로 전환. 전환 결과가 자동 판정과 같으면 강제하지 않고 자동으로 돌아간다. */
export function toggleViewPref(current: View, wide: boolean): ViewPref {
  const target: View = current === 'desktop' ? 'mobile' : 'desktop';
  return target === resolveView('auto', wide) ? 'auto' : target;
}

export const viewportOf = (p: ViewPref) => (p === 'desktop' ? DESKTOP_VIEWPORT : DEVICE_VIEWPORT);

function readPref(): ViewPref {
  try {
    return parseViewPref(localStorage.getItem(VIEW_KEY));
  } catch {
    return 'auto';
  }
}

export function useView() {
  const [pref, setPref] = useState<ViewPref>(readPref);
  const [wide, setWide] = useState(() => matchMedia(WIDE_QUERY).matches);

  useEffect(() => {
    const mq = matchMedia(WIDE_QUERY);
    const on = (e: MediaQueryListEvent) => setWide(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const view = resolveView(pref, wide);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.view = view;
    root.dataset.viewPref = pref;
    document.querySelector('meta[name="viewport"]')?.setAttribute('content', viewportOf(pref));
    try {
      if (pref === 'auto') localStorage.removeItem(VIEW_KEY);
      else localStorage.setItem(VIEW_KEY, pref);
    } catch {
      // 저장 불가는 무시
    }
  }, [pref, view]);

  return { pref, view, toggle: () => setPref(toggleViewPref(view, wide)) };
}
