export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface Props {
  slices: DonutSlice[];
  size?: number;
}

const money = (v: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v);

function slicePath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startAngle));
  const y1 = cy + r * Math.sin(toRad(startAngle));
  const x2 = cx + r * Math.cos(toRad(endAngle));
  const y2 = cy + r * Math.sin(toRad(endAngle));
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

export default function DonutChart({ slices, size = 100 }: Props) {
  const total = slices.reduce((a, s) => a + s.value, 0);
  const cx = size / 2, cy = size / 2;
  const outerR = size * 0.46;
  const innerR = size * 0.28;
  let current = -90;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <svg width={size} height={size} style={{ overflow: 'visible' }}>
        {slices.map((s, i) => {
          const sweep = (s.value / total) * 360;
          const end = current + sweep;
          const path = slicePath(cx, cy, outerR, current, end);
          const el = (
            <g key={i}>
              <path d={path} fill={s.color} />
            </g>
          );
          current = end;
          return el;
        })}
        {/* hole */}
        <circle cx={cx} cy={cy} r={innerR} fill="white" />
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: '6pt', color: '#5a6072', flex: 1 }}>{s.label}</span>
            <span style={{ fontSize: '6pt', fontWeight: 600, color: '#0f1117' }}>
              {total > 0 ? `${((s.value / total) * 100).toFixed(1)}%` : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}