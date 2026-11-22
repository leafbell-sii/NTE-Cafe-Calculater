import { useMemo, useState } from 'react';
import type { Food, GameData, Staff, Tag, Trend } from '../types';
import { calculate } from '../logic/calc';
import { swapLines } from '../logic/optimize';
import { trendApplies } from '../logic/trends';
import { fmt2 } from '../format';
import { ReceiptView } from './Receipt';
import { Portrait } from './Portrait';

interface Props {
  data: GameData;
  trend: Trend;
  popularity: number;
  menu: Food[];
  staff: Staff[];
  rank?: number;
  alternatives?: Staff[][];
  featured?: boolean;
  /** 처음엔 한 줄 요약으로 접어 둠 */
  collapsible?: boolean;
  /** 접힌 행에서 차이를 보여줄 기준(1위) 조합 */
  base?: { menu: Food[]; staff: Staff[]; revenue: number };
}

const diff = <T,>(a: T[], b: T[], key: (x: T) => string) => {
  const bk = new Set(b.map(key));
  return a.filter((x) => !bk.has(key(x)));
};

const TAG_CLASS: Record<Tag, string> = { '메인 메뉴': 'tag-main', 디저트: 'tag-dessert', 음료: 'tag-drink' };

export const staffLabel = (s: Staff) => `${s.character.name} Lv${s.level}`;

export function ResultCard({ data, trend, popularity, menu, staff, rank, alternatives = [], featured, collapsible, base }: Props) {
  const receipt = useMemo(
    () => calculate({ menu, staff, trend, popularity, constants: data.constants }),
    [menu, staff, trend, popularity, data],
  );
  const [showAlt, setShowAlt] = useState(false);
  const [open, setOpen] = useState(!collapsible);
  const order = useMemo(() => new Map(data.characters.map((c, i) => [c.id, i])), [data]);
  const lines = useMemo(
    () => (showAlt ? swapLines(staff, alternatives, order) : []),
    [showAlt, staff, alternatives, order],
  );

  const Tag = rank === undefined ? 'div' : 'li';

  if (!open) {
    return (
      <Tag className="card row">
        <button className="row-btn" aria-expanded={false} onClick={() => setOpen(true)}>
          {rank !== undefined && <span className="rank">{rank}위</span>}
          <span className="revenue-num">{fmt2(receipt.revenue)}</span>
          {base && <span className="row-delta">−{fmt2(base.revenue - receipt.revenue)}</span>}
          <span className="row-menu">{base ? <RowDiff menu={menu} staff={staff} base={base} /> : menu.map((f) => f.name).join(' · ')}</span>
          <span className="chev" aria-hidden>
            ▸
          </span>
        </button>
      </Tag>
    );
  }

  return (
    <Tag className={featured ? 'card featured' : 'card'}>
      <div className="card-top">
        {rank !== undefined && <span className="rank">{rank}위</span>}
        <div className="revenue">
          <span className="revenue-num">{fmt2(receipt.revenue)}</span>
          <span className="revenue-unit">폰즈/시간</span>
        </div>
        {collapsible && (
          <button className="collapse-btn" aria-expanded onClick={() => setOpen(false)} aria-label="접기">
            ▾
          </button>
        )}
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
        {staff.length === 0 ? (
          <ul className="chips">
            <li className="chip muted">없음</li>
          </ul>
        ) : (
          <ul className="avatars">
            {staff.map((s) => (
              <li key={s.character.id} className="avatar" title={staffLabel(s)}>
                <Portrait id={s.character.id} name={s.character.name} />
                <span className="avatar-name">{s.character.name}</span>
                <span className="avatar-lv">{s.level}</span>
              </li>
            ))}
          </ul>
        )}
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

/** 1위 대비 바뀐 메뉴·직원만 표시 */
function RowDiff({ menu, staff, base }: { menu: Food[]; staff: Staff[]; base: NonNullable<Props['base']> }) {
  const fid = (f: Food) => f.id;
  const sid = (s: Staff) => `${s.character.id}:${s.level}`;
  const items = [
    ...diff(base.menu, menu, fid).map((f) => ({ k: `m-${f.id}`, out: true, cls: TAG_CLASS[f.tag], text: f.name })),
    ...diff(menu, base.menu, fid).map((f) => ({ k: `m+${f.id}`, out: false, cls: TAG_CLASS[f.tag], text: f.name })),
    ...diff(base.staff, staff, sid).map((s) => ({ k: `s-${s.character.id}`, out: true, cls: '', text: staffLabel(s) })),
    ...diff(staff, base.staff, sid).map((s) => ({ k: `s+${s.character.id}`, out: false, cls: '', text: staffLabel(s) })),
  ];
  if (items.length === 0) return <>1위와 같은 구성</>;
  return (
    <>
      {items.map((d) => (
        <span key={d.k} className={`diff ${d.out ? 'out' : 'in'} ${d.cls}`}>
          {d.out ? '−' : '+'}
          {d.text}
        </span>
      ))}
    </>
  );
}
