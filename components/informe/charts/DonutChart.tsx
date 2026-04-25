export interface DonutSlice { label: string; value: number; color: string; }
interface Props { slices: DonutSlice[]; }
function formatPct(value: number, total: number) { return total ? `${((value / total) * 100).toFixed(1)}%` : '—'; }
export default function DonutChart({ slices }: Props) {
  const total = slices.reduce((acc, s) => acc + s.value, 0);
  const size = 124, stroke = 18, radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '124px 1fr', alignItems: 'center', gap: '6mm', minHeight: '39mm' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#F0ECE6" strokeWidth={stroke} />
        {slices.map((slice, i) => {
          const length = total ? (slice.value / total) * circumference : 0;
          const element = <circle key={`${slice.label}-${i}`} cx={size/2} cy={size/2} r={radius} fill="none" stroke={slice.color} strokeWidth={stroke} strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-offset} transform={`rotate(-90 ${size/2} ${size/2})`} />;
          offset += length;
          return element;
        })}
        <circle cx={size/2} cy={size/2} r={radius - stroke / 2} fill="#fff" />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.4mm' }}>
        {slices.length ? slices.map((slice, i) => (
          <div key={`${slice.label}-${i}`} style={{ display: 'grid', gridTemplateColumns: '10px 1fr auto', alignItems: 'center', gap: '2mm' }}>
            <span style={{ width: 8, height: 8, borderRadius: 3, background: slice.color }} />
            <span style={{ fontSize: '7.1pt', color: '#2F2F34', fontWeight: 760, lineHeight: 1.15 }}>{slice.label}</span>
            <span style={{ fontSize: '7pt', color: '#6E6E73', fontWeight: 850 }}>{formatPct(slice.value, total)}</span>
          </div>
        )) : <span style={{ fontSize: '7pt', color: '#9A948D' }}>Sin datos</span>}
      </div>
    </div>
  );
}
