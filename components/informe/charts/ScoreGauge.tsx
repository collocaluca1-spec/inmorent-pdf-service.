type RiskColor = 'emerald' | 'amber' | 'red' | 'slate';

const PALETTE: Record<RiskColor, { accent: string; text: string; label: string; bg: string }> = {
  emerald: { accent: '#16A34A', text: '#087443', label: 'Bajo riesgo', bg: '#E9F8EF' },
  amber: { accent: '#F36B21', text: '#B85A10', label: 'Revisión manual', bg: '#FFF1E8' },
  red: { accent: '#DC2626', text: '#A52420', label: 'Alto riesgo', bg: '#FFF1F1' },
  slate: { accent: '#64748B', text: '#475569', label: 'Sin dato bancario', bg: '#F2F4F7' },
};

interface Props { score: number; color: RiskColor; size?: number; }

export default function ScoreGauge({ score, color, size = 130 }: Props) {
  const safeScore = Math.max(0, Math.min(100, score || 0));
  const palette = PALETTE[color] || PALETTE.slate;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeScore / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3mm' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="#ECE6DE" strokeWidth={stroke} fill="none" />
          <circle cx={size / 2} cy={size / 2} r={radius} stroke={palette.accent} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: size * 0.3, fontWeight: 880, color: palette.text, lineHeight: 1 }}>{safeScore}</span>
          <span style={{ fontSize: size * 0.08, color: '#9A948D', fontWeight: 700 }}>/ 100</span>
        </div>
      </div>
      <div style={{ color: palette.text, background: palette.bg, border: `1px solid ${palette.accent}33`, borderRadius: 999, padding: '4px 10px', fontSize: '7.2pt', fontWeight: 850 }}>{palette.label}</div>
    </div>
  );
}
