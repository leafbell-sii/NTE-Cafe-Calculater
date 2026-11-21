interface Props {
  max: number;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  label: string;
}

export function LevelSelect({ max, value, onChange, disabled, label }: Props) {
  return (
    <select
      className="level-select"
      value={value}
      disabled={disabled}
      aria-label={label}
      onChange={(e) => onChange(Number(e.target.value))}
    >
      {Array.from({ length: max }, (_, i) => i + 1).map((lv) => (
        <option key={lv} value={lv}>
          Lv{lv}
        </option>
      ))}
    </select>
  );
}
