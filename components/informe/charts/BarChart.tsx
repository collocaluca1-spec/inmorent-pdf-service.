export interface BarDataPoint {
  label: string;
  value: number;
}

interface Props {
  data: BarDataPoint[];
  color?: string;
}

const fmtMoney = (value: number) => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1000)}k`;
  return `$${Math.round(value)}`;
};

export default function BarChart({ data, color = '#F36B21' }: Props) {
  if (!data.length) return <div style={{ color: '#96969B', fontSize: '7pt' }}>Sin datos históricos.</div>;

  const width = 720;
  const height = 178;
  const padL = 46;
  const padR = 12;
  const padT = 14;
  const padB = 42;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;
  const maxValue = Math.max(...data.map((point) => point.value), 1);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((factor) => maxValue * factor);
  const band = chartW / data.length;
  const barW = Math.max(6, band * 0.58);

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {ticks.map((tick, index) => {
        const y = padT + chartH - (tick / maxValue) * chartH;
        return (
          <g key={index}>
            <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="#E7E4DE" strokeWidth={1} />
            <text x={padL - 8} y={y + 4} textAnchor="end" fontSize={8} fill="#96969B" fontWeight={600}>
              {fmtMoney(tick)}
            </text>
          </g>
        );
      })}

      {data.map((point, index) => {
        const h = Math.max(2, (point.value / maxValue) * chartH);
        const x = padL + index * band + (band - barW) / 2;
        const y = padT + chartH - h;
        const showLabel = index % 2 === 0 || index === data.length - 1;
        return (
          <g key={`${point.label}-${index}`}>
            <rect x={x} y={y} width={barW} height={h} rx={4} fill={color} />
            {showLabel && (
              <text
                x={x + barW / 2}
                y={height - 13}
                fontSize={7.4}
                fill="#6E6E73"
                fontWeight={600}
                textAnchor="middle"
                transform={`rotate(-35 ${x + barW / 2} ${height - 13})`}
              >
                {point.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
