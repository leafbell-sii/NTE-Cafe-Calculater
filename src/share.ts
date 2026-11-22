import { PREFIX } from './persist';

// 설정 공유: 저장된 입력값 전체를 URL 해시(#s=...)에 담는다.
// 받은 쪽은 앱 시작 전에 localStorage에 덮어쓰고, 값 검증은 평소 복원 경로(sanitize)가 맡는다.
const PARAM = 's';

const toB64Url = (s: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(s)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const fromB64Url = (s: string) => {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(b, (c) => c.charCodeAt(0)));
};

/** 현재 저장된 설정으로 공유 URL 생성 */
export function buildShareUrl(): string {
  const state: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)!;
    if (!k.startsWith(PREFIX)) continue;
    try {
      state[k.slice(PREFIX.length)] = JSON.parse(localStorage.getItem(k)!);
    } catch {
      // 깨진 값은 제외
    }
  }
  const url = new URL(location.href);
  url.hash = `${PARAM}=${toB64Url(JSON.stringify(state))}`;
  return url.toString();
}

/** 앱 렌더 전에 호출: URL에 공유 설정이 있으면 적용하고 해시를 지운다 */
export function applySharedState() {
  const m = location.hash.match(new RegExp(`[#&]${PARAM}=([A-Za-z0-9_-]+)`));
  if (!m) return;
  try {
    const state = JSON.parse(fromB64Url(m[1]));
    if (typeof state === 'object' && state !== null && !Array.isArray(state)) {
      for (const [k, v] of Object.entries(state)) localStorage.setItem(PREFIX + k, JSON.stringify(v));
    }
  } catch {
    // 잘못된 링크는 무시
  }
  history.replaceState(null, '', location.pathname + location.search);
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
