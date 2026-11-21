import type { EffectKind } from '../types';
import { conditionLabel, type EffectLine, type Receipt } from '../logic/calc';
import { fmt, fmt2, pct } from '../format';

const isTraffic = (k: EffectKind) => k === 'trafficAdd' || k === 'trafficMul';

function effectValue(e: EffectLine) {
  const { kind, value } = e.effect;
  switch (kind) {
    case 'priceAdd':
      return `+${fmt(value)}폰즈`;
    case 'trafficAdd':
      return `+${fmt(value)}P`;
    default:
      return `+${pct(value)}`;
  }
}

function EffectRows({ lines }: { lines: EffectLine[] }) {
  if (!lines.length) return <li className="r-row muted">해당 효과 없음</li>;
  return (
    <>
      {lines.map((e, i) => (
        <li key={i} className={e.met ? 'r-row' : 'r-row unmet'}>
          <span>
            {e.staff.character.name} <span className="lv">Lv{e.effect.level}</span>
            {e.effect.condition && (
              <span className="cond">
                {' '}
                [{conditionLabel(e.effect.condition)} {e.met ? '✓' : '✗ 미충족'}]
              </span>
            )}
          </span>
          <span className="r-val">{effectValue(e)}</span>
        </li>
      ))}
    </>
  );
}

export function ReceiptView({ receipt: r }: { receipt: Receipt }) {
  const traffic = r.effects.filter((e) => isTraffic(e.effect.kind));
  const price = r.effects.filter((e) => !isTraffic(e.effect.kind));
  const byKind = (lines: EffectLine[], k: EffectKind) => lines.filter((e) => e.effect.kind === k);

  return (
    <div className="receipt">
      <section>
        <h4>1. 유동인구</h4>
        <ul>
          <li className="r-row">
            <span>기본 유동인구</span>
            <span className="r-val">{fmt(r.baseTraffic)}P</span>
          </li>
          <li className="r-sub">합연산 (P)</li>
          <EffectRows lines={byKind(traffic, 'trafficAdd')} />
          <li className="r-sub">곱연산 (%)</li>
          <EffectRows lines={byKind(traffic, 'trafficMul')} />
          <li className="r-row total">
            <span>
              ({fmt(r.baseTraffic)} + {fmt(r.buffs.trafficAdd)}) × (1 + {pct(r.buffs.trafficMul)})
            </span>
            <span className="r-val">{fmt2(r.traffic)}P</span>
          </li>
          <li className="r-row total">
            <span>유동인구 계수 (÷100)</span>
            <span className="r-val">{fmt2(r.trafficCoef)}</span>
          </li>
        </ul>
      </section>

      <section>
        <h4>2. 판매가 버프</h4>
        <ul>
          <li className="r-sub">합연산 (폰즈, 음식마다)</li>
          <EffectRows lines={byKind(price, 'priceAdd')} />
          <li className="r-sub">곱연산 (%)</li>
          <EffectRows lines={byKind(price, 'priceMul')} />
          <li className="r-row total">
            <span>합계</span>
            <span className="r-val">
              +{fmt(r.buffs.priceAdd)}폰즈 · +{pct(r.buffs.priceMul)}
            </span>
          </li>
        </ul>
      </section>

      <section>
        <h4>3. 음식별 계수</h4>
        <ul>
          {r.foods.length === 0 && <li className="r-row muted">메뉴 없음</li>}
          {r.foods.map((f) => (
            <li key={f.food.id} className="r-food">
              <span className="r-food-name">{f.food.name}</span>
              <span className="r-food-calc">
                ({fmt(f.price)}
                {f.trend > 0 && <b className="trend-mark"> + {fmt(f.trend)}</b>} + {fmt(f.priceAdd)} ={' '}
                {fmt2(f.subtotal)}) × (1 + {pct(f.priceMul)}) = <b>{fmt2(f.coef)}</b>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <ul>
          <li className="r-row total">
            <span>4. 총 음식 계수</span>
            <span className="r-val">{fmt2(r.totalFoodCoef)}</span>
          </li>
          <li className="r-row total">
            <span>5. 최종 인기도 계수 (1 + {fmt(r.popularity)})</span>
            <span className="r-val">{r.popularityCoef.toLocaleString('ko-KR', { maximumFractionDigits: 6 })}</span>
          </li>
        </ul>
      </section>

      <section className="r-final">
        <h4>6. 최종 수익</h4>
        <p>
          {fmt2(r.totalFoodCoef)} × {fmt2(r.trafficCoef)} ×{' '}
          {r.popularityCoef.toLocaleString('ko-KR', { maximumFractionDigits: 6 })} = <b>{fmt2(r.revenue)}</b> 폰즈
        </p>
      </section>
    </div>
  );
}
