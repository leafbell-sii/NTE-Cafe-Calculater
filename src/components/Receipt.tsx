import type { EffectKind } from '../types';
import { conditionLabel, type EffectLine, type Receipt } from '../logic/calc';
import { fmt, fmt2, pct } from '../format';

const isTraffic = (k: EffectKind) => k === 'trafficAdd' || k === 'trafficMul';
const isPrice = (k: EffectKind) => k === 'priceAdd' || k === 'priceMul';
const coef = (n: number) => n.toLocaleString('ko-KR', { maximumFractionDigits: 6 });

function effectValue(e: EffectLine) {
  const { kind, value } = e.effect;
  switch (kind) {
    case 'priceAdd':
      return `+${fmt(value)}폰즈`;
    case 'trafficAdd':
      return `+${fmt(value)}P`;
    case 'ingredientReduce':
      return `−${pct(value)}`;
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
  const price = r.effects.filter((e) => isPrice(e.effect.kind));
  const reduce = r.effects.filter((e) => e.effect.kind === 'ingredientReduce');
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
          {r.maneki > 0 && (
            <li className="r-row">
              <span>마네키네코</span>
              <span className="r-val">+{pct(r.maneki)}</span>
            </li>
          )}
          {(r.maneki === 0 || byKind(traffic, 'trafficMul').length > 0) && (
            <EffectRows lines={byKind(traffic, 'trafficMul')} />
          )}
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
                ({fmt(f.price)} + {fmt(f.priceAdd)}
                {f.trendMul > 0 && <b className="trend-mark"> + {fmt(f.trendMul)}</b>} = {fmt2(f.subtotal)}) × (1 + {pct(f.priceMul)})
                {f.trendAdd > 0 && <b className="trend-mark"> + {fmt(f.trendAdd)}</b>} = <b>{fmt2(f.coef)}</b>
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
        <h4>6. 최종 수익 (매출)</h4>
        <p>
          {fmt2(r.totalFoodCoef)} × {fmt2(r.trafficCoef)} ×{' '}
          {r.popularityCoef.toLocaleString('ko-KR', { maximumFractionDigits: 6 })} = <b>{fmt2(r.revenue)}</b> 폰즈
        </p>
      </section>

      <section>
        <h4>7. 식재료 소모</h4>
        <ul>
          <li className="r-sub">소모 감소</li>
          <EffectRows lines={reduce} />
          <li className="r-row total">
            <span>소모 배율 (1 − {pct(r.reduce)})</span>
            <span className="r-val">{coef(r.reduceCoef)}</span>
          </li>
          <li className="r-sub">
            시간당 소모량 = {fmt2(r.traffic)}P ÷ 10000 × 사용 개수 × {coef(r.reduceCoef)}
          </li>
          {r.ingredients.length === 0 && <li className="r-row muted">메뉴 없음</li>}
          {r.ingredients.map((l) => (
            <li key={l.name} className="r-row">
              <span>
                {l.name} <span className="cond">×{l.uses}</span>
              </span>
              <span className="r-val">
                {fmt2(l.perHour)}개 × {fmt(l.price)} = {fmt2(l.cost)}
              </span>
            </li>
          ))}
          <li className="r-row total">
            <span>시간당 식재료 비용</span>
            <span className="r-val">{fmt2(r.ingredientCost)}폰즈</span>
          </li>
        </ul>
      </section>

      <section className="r-final">
        <h4>8. 순수익</h4>
        <p>
          {fmt2(r.revenue)} − {fmt2(r.ingredientCost)} = <b>{fmt2(r.net)}</b> 폰즈
        </p>
      </section>
    </div>
  );
}
