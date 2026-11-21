import { useState } from 'react';
import type { Trend, TrendKind } from '../types';

interface Props {
  trends: Trend[];
  trendId: string;
  onTrend: (id: string) => void;
  popularity: number;
  onPopularity: (v: number) => void;
}

const exact = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 6 });

const GROUP_LABEL: Record<Exclude<TrendKind, 'none'>, string> = {
  tag: '태그',
  group: '묶음',
  ingredient: '재료',
};

export function CommonInputs({ trends, trendId, onTrend, popularity, onPopularity }: Props) {
  const [text, setText] = useState(popularity ? String(popularity) : '');

  const onText = (raw: string) => {
    // 음수 차단: 숫자와 소수점만 허용
    const cleaned = raw.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    setText(cleaned);
    const v = Number(cleaned);
    onPopularity(cleaned === '' || cleaned === '.' || !Number.isFinite(v) ? 0 : v);
  };

  const none = trends.filter((t) => t.kind === 'none');
  const kinds = ['tag', 'group', 'ingredient'] as const;

  return (
    <section className="common-inputs">
      <label className="field">
        <span className="field-label">인기도 계수</span>
        <input
          type="text"
          inputMode="decimal"
          placeholder="0"
          value={text}
          onChange={(e) => onText(e.target.value)}
          aria-describedby="pop-help"
        />
        <span id="pop-help" className="field-help">
          게임 표기 그대로 (예: 0.015) · 최종 ×{exact.format(1 + popularity)}
        </span>
      </label>

      <label className="field">
        <span className="field-label">트렌드</span>
        <select value={trendId} onChange={(e) => onTrend(e.target.value)}>
          {none.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
          {kinds.map((k) => (
            <optgroup key={k} label={GROUP_LABEL[k]}>
              {trends
                .filter((t) => t.kind === k)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </label>
    </section>
  );
}
