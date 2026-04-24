type RiskColor = 'emerald' | 'amber' | 'red' | 'slate';

const PALETTE: Record<RiskColor, { stroke: string; text: string; label: string }> = {
  emerald: { stroke: '#16a34a', text: '#166534', label: 'Bajo riesgo' },
  amber:   { stroke: '#b45309', text: '#92400e', label: 'Riesgo moderado' },
  red:     { stroke: '#dc2626', text: '#991b1b', label: 'Alto riesgo' },
  slate:   { stroke: '#64748b', text: '#475569', label: 'Sin dato' },
};

interface Props {
  score: number;
  color: RiskColor;
  size?: number;
}

export default function ScoreGauge({ score, color, size = 120 }: Props) {
  const p = PALETTE[color] ?? PALETTE.slate;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const safe = Math.max(0, Math.min(100, score));
  const offset = circ - (safe / 100) * circ;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} stroke="#e5e7eb" strokeWidth={stroke} fill="none" />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            stroke={p.stroke} strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: size * 0.25, fontWeight: 800, color: p.text, lineHeight: 1 }}>
            {safe}
          </span>
          <span style={{ fontSize: size * 0.08, color: '#8890a4', marginTop: 2 }}>/ 100</span>
        </div>
      </div>
      <span style={{ fontSize: '6.5pt', fontWeight: 700, color: p.text, textAlign: 'center' }}>
        {p.label}
      </span>
    </div>
  );
}