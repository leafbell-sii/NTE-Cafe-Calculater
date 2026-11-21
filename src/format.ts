// SPEC 7.4: 표시할 때만 소수점 둘째 자리까지 반올림

const num = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 });
const fixed2 = new Intl.NumberFormat('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmt = (n: number) => num.format(n);
export const fmt2 = (n: number) => fixed2.format(n);
export const pct = (n: number) => `${num.format(n * 100)}%`;
