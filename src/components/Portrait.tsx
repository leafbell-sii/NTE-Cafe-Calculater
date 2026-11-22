// 초상화는 scripts/make_portraits.py 로 원본에서 잘라 생성한다.
const urls = import.meta.glob<string>('../assets/portraits/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});
const byId = new Map(
  Object.entries(urls).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1, -'.webp'.length), url]),
);

interface Props {
  id?: string;
  name?: string;
  className?: string;
}

export function Portrait({ id, name, className }: Props) {
  const src = id ? byId.get(id) : undefined;
  const cls = `portrait${className ? ` ${className}` : ''}`;
  if (!src) {
    return (
      <span className={`${cls} empty`} aria-hidden="true">
        {name?.[0] ?? ''}
      </span>
    );
  }
  return <img className={cls} src={src} alt="" width={40} height={48} loading="lazy" decoding="async" />;
}
