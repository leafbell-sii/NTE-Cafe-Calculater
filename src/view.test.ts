import { describe, expect, it } from 'vitest';
import { DESKTOP_VIEWPORT, DEVICE_VIEWPORT, parseViewPref, resolveView, toggleViewPref, viewportOf } from './view';

describe('화면 모드', () => {
  it('자동은 화면 폭을 따름', () => {
    expect(resolveView('auto', true)).toBe('desktop');
    expect(resolveView('auto', false)).toBe('mobile');
    expect(resolveView('mobile', true)).toBe('mobile');
    expect(resolveView('desktop', false)).toBe('desktop');
  });
  it('넓은 화면: 자동(컴퓨터) → 모바일 강제 → 자동', () => {
    expect(toggleViewPref('desktop', true)).toBe('mobile');
    expect(toggleViewPref('mobile', true)).toBe('auto');
  });
  it('좁은 화면: 자동(모바일) → 컴퓨터 강제 → 자동', () => {
    expect(toggleViewPref('mobile', false)).toBe('desktop');
    expect(toggleViewPref('desktop', false)).toBe('auto');
  });
  it('컴퓨터 강제일 때만 viewport 폭 고정', () => {
    expect(viewportOf('desktop')).toBe(DESKTOP_VIEWPORT);
    expect(viewportOf('mobile')).toBe(DEVICE_VIEWPORT);
    expect(viewportOf('auto')).toBe(DEVICE_VIEWPORT);
  });
  it('알 수 없는 저장값은 자동', () => {
    expect(parseViewPref('desktop')).toBe('desktop');
    expect(parseViewPref(null)).toBe('auto');
    expect(parseViewPref('tablet')).toBe('auto');
  });
});
