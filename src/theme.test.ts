import { describe, expect, it } from 'vitest';
import { nextPref, parsePref, resolveTheme } from './theme';

describe('테마', () => {
  it('시스템 → 다크 → 라이트 → 시스템 순환', () => {
    expect(nextPref('system')).toBe('dark');
    expect(nextPref('dark')).toBe('light');
    expect(nextPref('light')).toBe('system');
  });
  it('시스템은 OS 설정을 따름', () => {
    expect(resolveTheme('system', true)).toBe('light');
    expect(resolveTheme('system', false)).toBe('dark');
    expect(resolveTheme('dark', true)).toBe('dark');
    expect(resolveTheme('light', false)).toBe('light');
  });
  it('알 수 없는 저장값은 시스템', () => {
    expect(parsePref('light')).toBe('light');
    expect(parsePref(null)).toBe('system');
    expect(parsePref('blue')).toBe('system');
  });
});
