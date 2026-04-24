export interface BarDataPoint {
  label: string;
  value: number;
}

interface Props {
  data: BarDataPoint[];
  color?: string;
  width?: number;
  height?: number;
}

const fmtMoney = (v: number): string => {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v}`;
};

export default function BarChart({ data, color = '#2563eb', width = 550, height = 110 }: Props) {
  if (!data.length) return null;

  const padL = 36, padR = 8, padT = 8, padB = 30;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const barW = Math.max(4, (chartW / data.length) * 0.6);
  const gap = chartW / data.length;

  // Y axis ticks
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => maxVal * f);

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      {/* Grid lines */}
      {ticks.map((t, i) => {
        const y = padT + chartH - (t / maxVal) * chartH;
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

      {/* Bars */}
      {data.map((d, i) => {
        const bH = Math.max(1, (d.value / maxVal) * chartH);
        const x = padL + i * gap + (gap - barW) / 2;
        const y = padT + chartH - bH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bH} fill={color} rx={2} />
            <text
              x={x + barW / 2}
              y={padT + chartH + 10}
              textAnchor="middle"
              fontSize={5}
              fill="#8890a4"
              transform={`rotate(-40, ${x + barW / 2}, ${padT + chartH + 10})`}
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}