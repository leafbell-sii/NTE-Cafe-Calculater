import { useMemo, useState } from 'react';
import { loadGameData } from './data/load';
import type { GameData } from './types';
import { AVERAGE_TREND_ID, buildTrends, NONE_TREND } from './logic/trends';
import { CommonInputs } from './components/CommonInputs';
import { OptimizeMode } from './components/OptimizeMode';
import { ManualMode } from './components/ManualMode';
import { DataErrors } from './components/DataErrors';
import { BUG_REPORT_URL } from './config';
import { applyShareCode, buildShareUrl, copyText } from './share';
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
  const [maneki, setManeki] = usePersistentState('maneki', () => false, (v) => (typeof v === 'boolean' ? v : undefined));
  const [trendId, setTrendId] = usePersistentState('trendId', () => AVERAGE_TREND_ID, (v) =>
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
        <section className="panel settings" aria-label="설정">
          <h2>설정</h2>
          <CommonInputs
            trends={trends}
            trendId={trendId}
            onTrend={setTrendId}
            popularity={popularity}
            onPopularity={setPopularity}
            maneki={maneki}
            onManeki={setManeki}
            manekiTrafficMul={data.constants.manekiTrafficMul}
          />
        </section>

        {mode === 'optimize' ? (
          <OptimizeMode data={data} trend={trend} popularity={popularity} maneki={maneki} />
        ) : (
          <ManualMode data={data} trend={trend} popularity={popularity} maneki={maneki} />
        )}

        <aside className="panel etc" aria-label="기타">
          <h2>기타</h2>
          <ShareButton />
          <ShareCodeInput />
          {BUG_REPORT_URL && (
            <a className="chip-btn report-btn" href={BUG_REPORT_URL} target="_blank" rel="noopener noreferrer">
              🐞 버그 제보
            </a>
          )}
          <p className="etc-note">
            기본 유동인구 {data.constants.baseTraffic}P
            <br />
            트렌드 계수 +{data.constants.trendBonus} (태그 +{data.constants.tagTrendBonus.toFixed(2)})
          </p>
        </aside>
      </main>
    </div>
  );
}

function ShareCodeInput() {
  const [text, setText] = useState('');
  const [error, setError] = useState(false);
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (applyShareCode(text)) location.reload();
    else setError(true);
  };
  return (
    <form className="share-apply" onSubmit={onSubmit}>
      <input
        type="text"
        value={text}
        placeholder="공유 링크 또는 코드"
        aria-label="설정 공유 링크 또는 코드"
        aria-invalid={error}
        onChange={(e) => {
          setText(e.target.value);
          setError(false);
        }}
      />
      <button type="submit" className="chip-btn" disabled={!text.trim()}>
        {error ? '잘못된 코드' : '적용'}
      </button>
    </form>
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
