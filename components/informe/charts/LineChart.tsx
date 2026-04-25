export interface LineSeries { label: string; color: string; data: Record<string, number>; }
interface Props { series: LineSeries[]; periods: string[]; }
const fmtMoney = (value: number) => value >= 1_000_000 ? `$${(value / 1_000_000).toFixed(1)}M` : value >= 1_000 ? `$${Math.round(value / 1000)}k` : `$${Math.round(value)}`;
export default function LineChart({ series, periods }: Props) {
  if (!series.length || !periods.length) return <div style={{ color: '#9A948D', fontSize: '7pt' }}>Sin datos históricos.</div>;
  const width = 760, height = 184, padL = 48, padR = 10, padT = 14, padB = 42;
  const chartW = width - padL - padR, chartH = height - padT - padB;
  const allValues = series.flatMap((item) => periods.map((period) => item.data[period] || 0));
  const maxValue = Math.max(...allValues, 1);
  const ticks = [0, .25, .5, .75, 1].map((f) => maxValue * f);
  const x = (i: number) => padL + (i / Math.max(periods.length - 1, 1)) * chartW;
  const y = (v: number) => padT + chartH - (v / maxValue) * chartH;
  return (
    <div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {ticks.map((tick, i) => { const yy = y(tick); return <g key={i}><line x1={padL} y1={yy} x2={width-padR} y2={yy} stroke="#E7E1D8" strokeWidth={1}/><text x={padL-8} y={yy+4} textAnchor="end" fontSize={8} fill="#9A948D" fontWeight={700}>{fmtMoney(tick)}</text></g>; })}
        {periods.map((period, i) => { const show = i % 3 === 0 || i === periods.length - 1; if (!show) return null; const lx = x(i); return <text key={period} x={lx} y={height-13} fontSize={7.3} fill="#6E6E73" fontWeight={700} textAnchor="middle" transform={`rotate(-35 ${lx} ${height-13})`}>{period}</text>; })}
        {series.map((item) => {
          const pts = periods.map((period, i) => `${x(i)},${y(item.data[period] || 0)}`).join(' ');
          return <g key={item.label}><polyline points={pts} fill="none" stroke={item.color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />{periods.map((period, i) => <circle key={`${item.label}-${period}`} cx={x(i)} cy={y(item.data[period] || 0)} r={2.4} fill="#fff" stroke={item.color} strokeWidth={1.6}/>)}</g>;
        })}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '5mm', marginTop: '1mm', flexWrap: 'wrap' }}>
        {series.map((item) => <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '1.5mm' }}><span style={{ width: 20, height: 3, background: item.color, borderRadius: 3 }} /><span style={{ fontSize: '7pt', color: '#6E6E73', fontWeight: 760 }}>{item.label}</span></div>)}
      </div>
    </div>
  );
}
