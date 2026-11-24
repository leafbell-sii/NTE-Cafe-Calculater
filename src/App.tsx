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
import { THEME_LABEL, useTheme } from './theme';

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
          <CupIcon />
        </span>
        <h1>별미 카페 계산기</h1>
        <ThemeButton />
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
          <ManualMode
            data={data}
            trend={trend}
            popularity={popularity}
            maneki={maneki}
            onExit={() => setMode('optimize')}
          />
        )}

        <aside className="panel etc" aria-label="기타">
          <h2>기타</h2>
          <ShareButton />
          <ShareCodeInput />
          {BUG_REPORT_URL && (
            <a className="btn report-btn" href={BUG_REPORT_URL} target="_blank" rel="noopener noreferrer">
              🐞 버그 제보
            </a>
          )}
          <p className="etc-note">
            기본 유동인구 <b>{data.constants.baseTraffic}P</b>
            <br />
            트렌드 계수 <b>+{data.constants.trendBonus}</b> (태그 <b>+{data.constants.tagTrendBonus.toFixed(2)}</b>)
          </p>
          {/* SPEC 3.2: 수동 모드는 눈에 띄지 않는 작은 링크로만 진입 */}
          <button className="link-quiet" onClick={() => setMode(mode === 'optimize' ? 'manual' : 'optimize')}>
            {mode === 'optimize' ? '수동 계산 (테스트용)' : '최적화 모드로 돌아가기'}
          </button>
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
      <button type="submit" className="btn" disabled={!text.trim()}>
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
    <button className="btn" onClick={onClick} title="현재 설정이 담긴 링크를 복사합니다">
      🔗 {msg || '설정 공유 링크'}
    </button>
  );
}

function CupIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" x2="6" y1="2" y2="4" />
      <line x1="10" x2="10" y1="2" y2="4" />
      <line x1="14" x2="14" y1="2" y2="4" />
    </svg>
  );
}

function ThemeButton() {
  const { pref, theme, cycle } = useTheme();
  return (
    <button className="theme-btn" onClick={cycle} title="테마 바꾸기 (시스템 → 다크 → 라이트)" aria-label={`테마: ${THEME_LABEL[pref]}`}>
      <span aria-hidden>{theme === 'dark' ? '☾' : '☀'}</span>
      {THEME_LABEL[pref]}
    </button>
  );
}
