import { useMemo, useState } from 'react';
import type { Food, GameData, Staff, Tag, Trend } from '../types';
import { calculate } from '../logic/calc';
import { swapLines } from '../logic/optimize';
import { trendApplies } from '../logic/trends';
import { fmt2 } from '../format';
import { ReceiptView } from './Receipt';

interface Props {
  data: GameData;
  trend: Trend;
  popularity: number;
  menu: Food[];
  staff: Staff[];
  rank?: number;
  alternatives?: Staff[][];
  featured?: boolean;
}

const TAG_CLASS: Record<Tag, string> = { '메인 메뉴': 'tag-main', 디저트: 'tag-dessert', 음료: 'tag-drink' };

export const staffLabel = (s: Staff) => `${s.character.name} Lv${s.level}`;

export function ResultCard({ data, trend, popularity, menu, staff, rank, alternatives = [], featured }: Props) {
  const receipt = useMemo(
    () => calculate({ menu, staff, trend, popularity, constants: data.constants }),
    [menu, staff, trend, popularity, data],
  );
  const [showAlt, setShowAlt] = useState(false);
  const order = useMemo(() => new Map(data.characters.map((c, i) => [c.id, i])), [data]);
  const lines = useMemo(
    () => (showAlt ? swapLines(staff, alternatives, order) : []),
    [showAlt, staff, alternatives, order],
  );

  const Tag = rank === undefined ? 'div' : 'li';

  return (
    <Tag className={featured ? 'card featured' : 'card'}>
      <div className="card-top">
        {rank !== undefined && <span className="rank">{rank}위</span>}
        <div className="revenue">
          <span className="revenue-num">{fmt2(receipt.revenue)}</span>
          <span className="revenue-unit">폰즈/시간</span>
        </div>
      </div>

      <div className="card-section">
        <h3>메뉴</h3>
        <ul className="chips">
          {menu.length === 0 && <li className="chip muted">없음</li>}
          {menu.map((f) => (
            <li key={f.id} className={`chip food ${TAG_CLASS[f.tag]}`}>
              <span className="chip-name">{f.name}</span>
              <span className="chip-sub">
                {f.tag} · {f.price}
                {trendApplies(trend, f) && <b className="trend-mark"> ★트렌드</b>}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card-section">
        <h3>직원 {staff.length > 0 && <span className="count">{staff.length}명</span>}</h3>
        <ul className="chips">
          {staff.length === 0 && <li className="chip muted">없음</li>}
          {staff.map((s) => (
            <li key={s.character.id} className="chip staff">
              {s.character.name} <span className="lv">Lv{s.level}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card-actions">
        {alternatives.length > 0 && (
          <button className="toggle" aria-expanded={showAlt} onClick={() => setShowAlt(!showAlt)}>
            대체 가능 직원 ({alternatives.length})
          </button>
        )}
      </div>
      {showAlt && (
        <ul className="swap-lines">
          {lines.map((l) => (
            <li key={l.out.map((s) => s.character.id).join(',')}>
              <span className="swap-out">({l.out.map(staffLabel).join(', ')})</span>
              <span className="arrow"> → </span>
              {l.ins.map((g, i) => (
                <span key={i} className="swap-in">
                  {i > 0 && ', '}({g.map(staffLabel).join(', ')})
                </span>
              ))}
            </li>
          ))}
        </ul>
      )}

      <details className="receipt-wrap">
        <summary>영수증</summary>
        <ReceiptView receipt={receipt} />
      </details>
    </Tag>
  );
}
