export interface BarDataPoint { label: string; value: number; }
interface Props { data: BarDataPoint[]; color?: string; }
const fmtMoney = (value: number) => value >= 1_000_000 ? `$${(value / 1_000_000).toFixed(1)}M` : value >= 1_000 ? `$${Math.round(value / 1000)}k` : `$${Math.round(value)}`;
export default function BarChart({ data, color = '#F36B21' }: Props) {
  if (!data.length) return <div style={{ color: '#9A948D', fontSize: '7pt' }}>Sin datos históricos.</div>;
  const width = 760, height = 184, padL = 48, padR = 10, padT = 14, padB = 42;
  const chartW = width - padL - padR, chartH = height - padT - padB;
  const maxValue = Math.max(...data.map((p) => p.value), 1);
  const ticks = [0, .25, .5, .75, 1].map((f) => maxValue * f);
  const band = chartW / data.length, barW = Math.max(7, band * .62);
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {ticks.map((tick, i) => { const y = padT + chartH - (tick / maxValue) * chartH; return <g key={i}><line x1={padL} y1={y} x2={width-padR} y2={y} stroke="#E7E1D8" strokeWidth={1}/><text x={padL-8} y={y+4} textAnchor="end" fontSize={8} fill="#9A948D" fontWeight={700}>{fmtMoney(tick)}</text></g>; })}
      {data.map((point, i) => {
        const h = Math.max(2, (point.value / maxValue) * chartH), x = padL + i * band + (band - barW) / 2, y = padT + chartH - h;
        const showLabel = i % 2 === 0 || i === data.length - 1;
        return <g key={`${point.label}-${i}`}><rect x={x} y={y} width={barW} height={h} rx={4} fill={color}/>{showLabel && <text x={x+barW/2} y={height-13} fontSize={7.3} fill="#6E6E73" fontWeight={700} textAnchor="middle" transform={`rotate(-35 ${x+barW/2} ${height-13})`}>{point.label}</text>}</g>;
      })}
    </svg>
  );
}
