import { describe, expect, it } from 'vitest';
import { loadGameData } from './data/load';
import { decodeCompact, encodeCompact, parseShareCode } from './share';

const loaded = loadGameData();
if (!loaded.ok) throw new Error(JSON.stringify(loaded.errors));
const data = loaded.data;
const { maxFoods, maxStaff, maxSkillLevel } = data.constants;
const ids = data.characters.map((c) => c.id);

const optimizeOnly = {
  mode: 'optimize',
  popularity: 0.015,
  trendId: 'tag:디저트',
  'optimize.sortBy': 'revenue',
  maneki: false,
  'optimize.owned': Object.fromEntries(ids.map((id, i) => [id, i % 3 !== 0])),
  'optimize.levels': Object.fromEntries(ids.map((id, i) => [id, (i % maxSkillLevel) + 1])),
  'manual.foodIds': Array(maxFoods).fill(''),
  'manual.staffIds': Array(maxStaff).fill(''),
  'manual.levels': Array(maxStaff).fill(maxSkillLevel),
};

describe('설정 공유 압축', () => {
  it('최적화 설정 왕복', () => {
    const code = encodeCompact(optimizeOnly, data)!;
    expect(code.length).toBeLessThan(40);
    expect(decodeCompact(code, data)).toEqual(optimizeOnly);
  });

  it('수동 모드 포함 왕복', () => {
    const s = {
      ...optimizeOnly,
      mode: 'manual',
      popularity: 0,
      trendId: 'none',
      'optimize.sortBy': 'net',
      maneki: true,
      'manual.foodIds': [data.foods[3].id, '', data.foods[0].id, '', ''],
      'manual.staffIds': [ids[1], '', ids[5], ...Array(maxStaff - 3).fill('')],
      'manual.levels': Array.from({ length: maxStaff }, (_, i) => (i % maxSkillLevel) + 1),
    };
    const code = encodeCompact(s, data)!;
    expect(code.length).toBeLessThan(60);
    expect(decodeCompact(code, data)).toEqual(s);
  });

  it('잘린 링크는 예외', () => {
    const code = encodeCompact(optimizeOnly, data)!;
    expect(() => decodeCompact(code.slice(0, 4), data)).toThrow();
  });

  it('입력 형태: URL, 해시, 코드만, 구 형식', () => {
    const code = encodeCompact(optimizeOnly, data)!;
    for (const t of [`https://x.app/#c=${code}`, `#c=${code}`, `c=${code}`, `  ${code}
`]) {
      expect(parseShareCode(t, data)).toEqual(optimizeOnly);
    }
    const legacy = btoa(JSON.stringify({ popularity: 0.5 })).replace(/=+$/, '');
    expect(parseShareCode(`https://x.app/#s=${legacy}`, data)).toEqual({ popularity: 0.5 });
    expect(parseShareCode('아무거나', data)).toBeUndefined();
    expect(parseShareCode('', data)).toBeUndefined();
  });
});
