import { useMemo, useState } from 'react';
import { loadGameData } from './data/load';
import type { GameData } from './types';
import { buildTrends, NONE_TREND } from './logic/trends';
import { CommonInputs } from './components/CommonInputs';
import { OptimizeMode } from './components/OptimizeMode';
import { ManualMode } from './components/ManualMode';
import { DataErrors } from './components/DataErrors';

const loaded = loadGameData();

export default function App() {
  if (!loaded.ok) return <DataErrors errors={loaded.errors} />;
  return <Calculator data={loaded.data} />;
}

type Mode = 'optimize' | 'manual';

function Calculator({ data }: { data: GameData }) {
  const trends = useMemo(() => buildTrends(data), [data]);
  const [mode, setMode] = useState<Mode>('optimize');
  const [popularity, setPopularity] = useState(0);
  const [trendId, setTrendId] = useState(NONE_TREND.id);
  const trend = trends.find((t) => t.id === trendId) ?? NONE_TREND;

  const common = (
    <CommonInputs
      trends={trends}
      trendId={trendId}
      onTrend={setTrendId}
      popularity={popularity}
      onPopularity={setPopularity}
    />
  );

  return (
    <div className="app">
      <header className="header">
        <span className="logo" aria-hidden>
          ☕
        </span>
        <div>
          <h1>별미 카페 계산기</h1>
          <p className="subtitle">
            {mode === 'optimize' ? '보유 캐릭터로 시간당 수익이 가장 높은 메뉴·직원 조합 찾기' : '수동 계산 · 테스트용'}
          </p>
        </div>
      </header>

      <main className="layout">
        {mode === 'optimize' ? (
          <OptimizeMode data={data} trend={trend} popularity={popularity} common={common} />
        ) : (
          <ManualMode data={data} trend={trend} popularity={popularity} common={common} />
        )}
      </main>

      <footer className="footer">
        <span>
          기본 유동인구 {data.constants.baseTraffic}P · 트렌드 계수 +{data.constants.trendBonus} (태그 +{data.constants.tagTrendBonus.toFixed(2)})
        </span>
        <button className="link-quiet" onClick={() => setMode(mode === 'optimize' ? 'manual' : 'optimize')}>
          {mode === 'optimize' ? '수동 계산' : '최적화로 돌아가기'}
        </button>
      </footer>
    </div>
  );
}
