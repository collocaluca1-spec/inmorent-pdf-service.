export interface LineSeries {
  label: string;
  color: string;
  data: Record<string, number>; // periodo -> value
}

interface Props {
  series: LineSeries[];
  periods: string[];
  width?: number;
  height?: number;
}

const fmtMoney = (v: number): string => {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
};

export default function LineChart({ series, periods, width = 550, height = 110 }: Props) {
  if (!periods.length || !series.length) return null;

  const padL = 36, padR = 8, padT = 8, padB = 30;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const allValues = series.flatMap(s => periods.map(p => s.data[p] ?? 0));
  const maxVal = Math.max(...allValues, 1);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => maxVal * f);

  const xPos = (i: number) => padL + (i / Math.max(periods.length - 1, 1)) * chartW;
  const yPos = (v: number) => padT + chartH - (v / maxVal) * chartH;

  return (
    <div>
      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        {/* Grid */}
        {ticks.map((t, i) => {
          const y = yPos(t);
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="#dde1e9" strokeWidth={0.5} />
              <text x={padL - 3} y={y + 3} textAnchor="end" fontSize={5} fill="#8890a4">
                {fmtMoney(t)}
              </text>
            </g>
          );
        })}

        {/* Baseline */}
        <line x1={padL} y1={padT + chartH} x2={padL + chartW} y2={padT + chartH} stroke="#b8bfcc" strokeWidth={0.8} />

        {/* X labels — mostrar cada 3 para no saturar */}
        {periods.map((p, i) => {
          if (i % 3 !== 0 && i !== periods.length - 1) return null;
          return (
            <text
              key={i}
              x={xPos(i)}
              y={padT + chartH + 10}
              textAnchor="middle"
              fontSize={5}
              fill="#8890a4"
              transform={`rotate(-30, ${xPos(i)}, ${padT + chartH + 10})`}
            >
              {p}
            </text>
          );
        })}

        {/* Series */}
        {series.map((s, si) => {
          const pts = periods.map((p, i) => `${xPos(i)},${yPos(s.data[p] ?? 0)}`).join(' ');
          return (
            <g key={si}>
              <polyline points={pts} fill="none" stroke={s.color} strokeWidth={1.5} strokeLinejoin="round" />
              {periods.map((p, i) => (
                <circle key={i} cx={xPos(i)} cy={yPos(s.data[p] ?? 0)} r={2} fill={s.color} />
              ))}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
        {series.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 14, height: 2, background: s.color, display: 'inline-block', borderRadius: 1 }} />
            <span style={{ fontSize: '6pt', color: '#5a6072' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}