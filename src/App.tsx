import { useMemo, useState } from 'react';
import { loadGameData } from './data/load';
import type { GameData } from './types';
import { buildTrends, NONE_TREND } from './logic/trends';
import { CommonInputs } from './components/CommonInputs';
import { OptimizeMode } from './components/OptimizeMode';
import { ManualMode } from './components/ManualMode';
import { DataErrors } from './components/DataErrors';
import { BUG_REPORT_URL } from './config';
import { buildShareUrl, copyText } from './share';
import { nonNegNumber, oneOf, usePersistentState } from './persist';

const loaded = loadGameData();

export default function App() {
  if (!loaded.ok) return <DataErrors errors={loaded.errors} />;
  return <Calculator data={loaded.data} />;
}

const MODES = ['optimize', 'manual'] as const;
type Mode = (typeof MODES)[number];

function Calculator({ data }: { data: GameData }) {
  const trends = useMemo(() => buildTrends(data), [data]);
  const [mode, setMode] = usePersistentState<Mode>('mode', () => 'optimize', oneOf(MODES));
  const [popularity, setPopularity] = usePersistentState('popularity', () => 0, nonNegNumber);
  const [trendId, setTrendId] = usePersistentState('trendId', () => NONE_TREND.id, (v) =>
    trends.some((t) => t.id === v) ? (v as string) : undefined,
  );
  const trend = trends.find((t) => t.id === trendId) ?? NONE_TREND;

  return (
    <div className="app">
      <header className="header">
        <span className="logo" aria-hidden>
          ☕
        </span>
        <h1>별미 카페 계산기</h1>
        <CommonInputs
          trends={trends}
          trendId={trendId}
          onTrend={setTrendId}
          popularity={popularity}
          onPopularity={setPopularity}
        />
        <div className="mode-toggle" role="group" aria-label="모드">
          <button aria-pressed={mode === 'optimize'} onClick={() => setMode('optimize')}>
            최적화
          </button>
          <button aria-pressed={mode === 'manual'} onClick={() => setMode('manual')}>
            수동
          </button>
        </div>
      </header>

      <main className="layout">
        {mode === 'optimize' ? (
          <OptimizeMode data={data} trend={trend} popularity={popularity} />
        ) : (
          <ManualMode data={data} trend={trend} popularity={popularity} />
        )}
      </main>

      <footer className="footer">
        <span>
          기본 유동인구 {data.constants.baseTraffic}P · 트렌드 계수 +{data.constants.trendBonus} (태그 +{data.constants.tagTrendBonus.toFixed(2)})
        </span>
        <div className="footer-actions">
          <ShareButton />
          {BUG_REPORT_URL && (
            <a className="chip-btn report-btn" href={BUG_REPORT_URL} target="_blank" rel="noopener noreferrer">
              🐞 버그 제보
            </a>
          )}
        </div>
      </footer>
    </div>
  );
}

function ShareButton() {
  const [msg, setMsg] = useState('');
  const onClick = async () => {
    const url = buildShareUrl();
    if (await copyText(url)) setMsg('복사됨!');
    else {
      // 클립보드 권한이 없으면 직접 복사하도록 표시
      window.prompt('아래 링크를 복사하세요', url);
      setMsg('');
    }
    setTimeout(() => setMsg(''), 1500);
  };
  return (
    <button className="chip-btn" onClick={onClick} title="현재 설정이 담긴 링크를 복사합니다">
      🔗 {msg || '설정 공유 링크'}
    </button>
  );
}
