import { useState } from 'react';
import type { Trend, TrendKind } from '../types';

interface Props {
  trends: Trend[];
  trendId: string;
  onTrend: (id: string) => void;
  popularity: number;
  onPopularity: (v: number) => void;
  maneki: boolean;
  onManeki: (v: boolean) => void;
  /** 마네키네코 유동인구 곱연산 버프 */
  manekiTrafficMul: number;
}

const exact = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 6 });

const GROUP_LABEL: Record<Exclude<TrendKind, 'none' | 'average'>, string> = {
  tag: '태그',
  group: '묶음',
  ingredient: '재료',
};

export function CommonInputs({ trends, trendId, onTrend, popularity, onPopularity, maneki, onManeki, manekiTrafficMul }: Props) {
  const [text, setText] = useState(popularity ? String(popularity) : '');

  const onText = (raw: string) => {
    // 음수 차단: 숫자와 소수점만 허용
    const cleaned = raw.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    setText(cleaned);
    const v = Number(cleaned);
    onPopularity(cleaned === '' || cleaned === '.' || !Number.isFinite(v) ? 0 : v);
  };

  const top = trends.filter((t) => t.kind === 'none' || t.kind === 'average');
  const kinds = ['tag', 'group', 'ingredient'] as const;

  return (
    <div className="common-inputs">
      <label className="field">
        <span className="field-head">
          <span className="field-label">인기도</span>
          <span className="field-help num">×{exact.format(1 + popularity)}</span>
        </span>
        <input
          type="text"
          inputMode="decimal"
          className="num"
          placeholder="0"
          value={text}
          onChange={(e) => onText(e.target.value)}
          title="게임 표기 그대로 (예: 0.015)"
        />
      </label>

      <label className="field">
        <span className="field-head">
          <span className="field-label">트렌드</span>
        </span>
        <select value={trendId} onChange={(e) => onTrend(e.target.value)}>
          {top.map((t) => (
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

      <label className="check-row" title="유동인구 곱연산 버프에 합산됩니다">
        <input type="checkbox" checked={maneki} onChange={(e) => onManeki(e.target.checked)} />
        <span className="field-label">마네키네코</span>
        <span className="field-help">유동인구 +{exact.format(manekiTrafficMul * 100)}%</span>
      </label>
    </div>
  );
}
