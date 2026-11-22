import { useMemo, useState } from 'react';
import type { GameData, Staff, Trend } from '../types';
import { optimize } from '../logic/optimize';
import { ResultCard } from './ResultCard';
import { LevelSelect } from './LevelSelect';
import { Portrait } from './Portrait';

interface Props {
  data: GameData;
  trend: Trend;
  popularity: number;
}

const INITIAL = 5;
const STEP = 10;

export function OptimizeMode({ data, trend, popularity }: Props) {
  const max = data.constants.maxSkillLevel;
  const [owned, setOwned] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(data.characters.map((c) => [c.id, true])),
  );
  const [levels, setLevels] = useState<Record<string, number>>(() =>
    Object.fromEntries(data.characters.map((c) => [c.id, max])),
  );
  const [shown, setShown] = useState(INITIAL);

  const staff: Staff[] = useMemo(
    () => data.characters.filter((c) => owned[c.id]).map((c) => ({ character: c, level: levels[c.id] })),
    [data, owned, levels],
  );

  // 입력이 바뀌면 처음 5개로 되돌림
  const inputKey = `${trend.id}|${popularity}|${staff.map((s) => `${s.character.id}:${s.level}`).join(',')}`;
  const [lastKey, setLastKey] = useState(inputKey);
  if (lastKey !== inputKey) {
    setLastKey(inputKey);
    setShown(INITIAL);
  }

  // 표시 개수 + 다음 「더 보기」 분량 (SPEC 6.2)
  const k = shown + STEP;
  const { groups, stats } = useMemo(
    () => optimize({ foods: data.foods, owned: staff, trend, popularity, constants: data.constants, k }),
    [data, staff, trend, popularity, k],
  );
  const visible = groups.slice(0, shown);
  const ownedCount = staff.length;

  const setAll = (v: boolean) => setOwned(Object.fromEntries(data.characters.map((c) => [c.id, v])));

  return (
    <>
      <aside className="panel inputs">
        <section>
          <div className="section-head">
            <h2>
              보유 캐릭터{' '}
              <span className="count">
                {ownedCount}/{data.characters.length}
              </span>
            </h2>
            <div className="row-actions">
              <button className="chip-btn" onClick={() => setAll(true)}>
                전체 선택
              </button>
              <button className="chip-btn" onClick={() => setAll(false)}>
                전체 해제
              </button>
            </div>
          </div>
          <ul className="char-grid">
            {data.characters.map((c) => {
              const on = !!owned[c.id];
              return (
                <li key={c.id} className={on ? 'tile on' : 'tile'}>
                  <label className="tile-check" title={[c.skillName, ...c.skillText].join('\n')}>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={on}
                      onChange={(e) => setOwned({ ...owned, [c.id]: e.target.checked })}
                    />
                    <Portrait id={c.id} name={c.name} />
                    <span className="tile-name">{c.name}</span>
                  </label>
                  <LevelSelect
                    className="tile-lv"
                    max={max}
                    value={levels[c.id]}
                    disabled={!on}
                    onChange={(v) => setLevels({ ...levels, [c.id]: v })}
                    label={`${c.name} 레벨`}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      </aside>

      <section className="results" aria-live="polite">
        <div className="results-head">
          <h2>추천 조합</h2>
          <span className="meta">
            {ownedCount > data.constants.maxStaff
              ? `${ownedCount}명 중 ${data.constants.maxStaff}명 선택`
              : `보유 ${ownedCount}명 전원 배치`}{' '}
            · {stats.elapsedMs.toFixed(0)}ms
          </span>
        </div>
        {visible.length === 0 ? (
          <p className="empty">결과가 없습니다.</p>
        ) : (
          <ol className="result-list">
            {visible.map((g, i) => (
              <ResultCard
                key={`${g.menuIdx.join('-')}|${g.revenue}`}
                data={data}
                trend={trend}
                popularity={popularity}
                rank={g.rank}
                menu={g.menu}
                staff={g.staff}
                alternatives={g.alternatives}
                featured={i === 0}
                collapsible={i > 0}
                base={i > 0 ? groups[0] : undefined}
              />
            ))}
          </ol>
        )}
        {groups.length > shown && (
          <button className="more-btn" onClick={() => setShown(shown + STEP)}>
            더 보기 (+{Math.min(STEP, groups.length - shown)})
          </button>
        )}
      </section>
    </>
  );
}
