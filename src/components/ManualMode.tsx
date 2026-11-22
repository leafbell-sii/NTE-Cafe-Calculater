import { useMemo, useState } from 'react';
import type { GameData, Staff, Trend } from '../types';
import { ResultCard } from './ResultCard';
import { LevelSelect } from './LevelSelect';
import { Portrait } from './Portrait';

interface Props {
  data: GameData;
  trend: Trend;
  popularity: number;
}

export function ManualMode({ data, trend, popularity }: Props) {
  const { maxFoods, maxStaff, maxSkillLevel } = data.constants;
  const [foodIds, setFoodIds] = useState<string[]>(() => Array(maxFoods).fill(''));
  const [staffIds, setStaffIds] = useState<string[]>(() => Array(maxStaff).fill(''));
  const [levels, setLevels] = useState<number[]>(() => Array(maxStaff).fill(maxSkillLevel));

  const menu = useMemo(
    () => foodIds.filter(Boolean).map((id) => data.foods.find((f) => f.id === id)!),
    [foodIds, data],
  );
  const staff: Staff[] = useMemo(
    () =>
      staffIds
        .map((id, i) => ({ id, level: levels[i] }))
        .filter((s) => s.id)
        .map((s) => ({ character: data.characters.find((c) => c.id === s.id)!, level: s.level })),
    [staffIds, levels, data],
  );

  const setAt = <T,>(arr: T[], i: number, v: T) => arr.map((x, j) => (j === i ? v : x));

  return (
    <>
      <aside className="panel inputs">
        <section>
          <div className="section-head">
            <h2>메뉴</h2>
            <span className="count">
              {menu.length}/{maxFoods}
            </span>
          </div>
          <ul className="slot-list">
            {foodIds.map((id, i) => (
              <li key={i}>
                <span className="slot-no">{i + 1}</span>
                <select
                  value={id}
                  aria-label={`메뉴 ${i + 1}`}
                  onChange={(e) => setFoodIds(setAt(foodIds, i, e.target.value))}
                >
                  <option value="">— 비움 —</option>
                  {data.foods.map((f) => (
                    <option key={f.id} value={f.id} disabled={f.id !== id && foodIds.includes(f.id)}>
                      {f.name} ({f.tag} · {f.price})
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <div className="section-head">
            <h2>직원</h2>
            <span className="count">
              {staff.length}/{maxStaff}
            </span>
          </div>
          <ul className="char-grid staff-grid">
            {staffIds.map((id, i) => {
              const c = id ? data.characters.find((x) => x.id === id) : undefined;
              return (
                <li key={i} className={c ? 'tile on' : 'tile'}>
                  <div className="tile-check">
                    <Portrait id={id || undefined} name={c ? c.name : '+'} />
                    <span className="tile-name">{c ? c.name : `직원 ${i + 1}`}</span>
                    <select
                      className="tile-picker"
                      value={id}
                      aria-label={`직원 ${i + 1}`}
                      onChange={(e) => setStaffIds(setAt(staffIds, i, e.target.value))}
                    >
                      <option value="">— 비움 —</option>
                      {data.characters.map((ch) => (
                        <option key={ch.id} value={ch.id} disabled={ch.id !== id && staffIds.includes(ch.id)}>
                          {ch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <LevelSelect
                    className="tile-lv"
                    max={maxSkillLevel}
                    value={levels[i]}
                    disabled={!id}
                    onChange={(v) => setLevels(setAt(levels, i, v))}
                    label={`직원 ${i + 1} 레벨`}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      </aside>

      <section className="results">
        <div className="results-head">
          <h2>계산 결과</h2>
        </div>
        <ResultCard data={data} trend={trend} popularity={popularity} menu={menu} staff={staff} featured />
      </section>
    </>
  );
}
