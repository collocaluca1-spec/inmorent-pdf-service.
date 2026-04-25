export interface LineSeries {
  label: string;
  color: string;
  data: Record<string, number>;
}

interface Props {
  series: LineSeries[];
  periods: string[];
}

const fmtMoney = (value: number) => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1000)}k`;
  return `$${Math.round(value)}`;
};

export default function LineChart({ series, periods }: Props) {
  if (!series.length || !periods.length) return <div style={{ color: '#96969B', fontSize: '7pt' }}>Sin datos históricos.</div>;

  const width = 720;
  const height = 178;
  const padL = 46;
  const padR = 12;
  const padT = 14;
  const padB = 42;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;
  const allValues = series.flatMap((item) => periods.map((period) => item.data[period] || 0));
  const maxValue = Math.max(...allValues, 1);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((factor) => maxValue * factor);

  const x = (index: number) => padL + (index / Math.max(periods.length - 1, 1)) * chartW;
  const y = (value: number) => padT + chartH - (value / maxValue) * chartH;

  return (
    <div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {ticks.map((tick, index) => {
          const yTick = y(tick);
          return (
            <g key={index}>
              <line x1={padL} y1={yTick} x2={width - padR} y2={yTick} stroke="#E7E4DE" strokeWidth={1} />
              <text x={padL - 8} y={yTick + 4} textAnchor="end" fontSize={8} fill="#96969B" fontWeight={600}>
                {fmtMoney(tick)}
              </text>
            </g>
          );
        })}

        {periods.map((period, index) => {
          const showLabel = index % 3 === 0 || index === periods.length - 1;
          if (!showLabel) return null;
          const labelX = x(index);
          return (
            <text
              key={period}
              x={labelX}
              y={height - 13}
              fontSize={7.4}
              fill="#6E6E73"
              fontWeight={600}
              textAnchor="middle"
              transform={`rotate(-35 ${labelX} ${height - 13})`}
            >
              {period}
            </text>
          );
        })}

        {series.map((item) => {
          const points = periods.map((period, index) => `${x(index)},${y(item.data[period] || 0)}`).join(' ');
          return (
            <g key={item.label}>
              <polyline points={points} fill="none" stroke={item.color} strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round" />
              {periods.map((period, index) => (
                <circle key={`${item.label}-${period}`} cx={x(index)} cy={y(item.data[period] || 0)} r={2.4} fill="#fff" stroke={item.color} strokeWidth={1.5} />
              ))}
            </g>
          );
        })}
      </svg>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '5mm', marginTop: '1mm', flexWrap: 'wrap' }}>
        {series.map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '1.5mm' }}>
            <span style={{ width: 18, height: 3, background: item.color, borderRadius: 3 }} />
            <span style={{ fontSize: '7pt', color: '#6E6E73', fontWeight: 700 }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
