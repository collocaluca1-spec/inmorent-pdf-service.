type RiskColor = 'emerald' | 'amber' | 'red' | 'slate';

const PALETTE: Record<RiskColor, { accent: string; text: string; label: string; bg: string }> = {
  emerald: { accent: '#21A66B', text: '#0C7A4B', label: 'Bajo riesgo', bg: '#EAF8F0' },
  amber: { accent: '#F36B21', text: '#B85A10', label: 'Revisión manual', bg: '#FFF1E8' },
  red: { accent: '#D94A3A', text: '#A73328', label: 'Alto riesgo', bg: '#FDECEA' },
  slate: { accent: '#6E6E73', text: '#4B5563', label: 'Sin dato bancario', bg: '#F2F4F7' },
};

interface Props {
  score: number;
  color: RiskColor;
  size?: number;
}

export default function ScoreGauge({ score, color, size = 122 }: Props) {
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
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E7E4DE"
            strokeWidth={stroke}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={palette.accent}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: size * 0.28, fontWeight: 800, color: palette.text, lineHeight: 1 }}>{safeScore}</span>
          <span style={{ fontSize: size * 0.085, color: '#96969B', fontWeight: 600 }}>/ 100</span>
        </div>
      </div>
      <div style={{ color: palette.text, background: palette.bg, borderRadius: 999, padding: '4px 10px', fontSize: '7.2pt', fontWeight: 800 }}>
        {palette.label}
      </div>
    </div>
  );
}
