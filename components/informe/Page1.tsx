import type { InformeLocativoData } from '@/lib/mock-locativo';
import ScoreGauge from './charts/ScoreGauge';

/* ── Formatters ── */
const money = (v: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v);

const fmtDT = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

const fmtPeriodo = (raw: string) =>
  /^\d{6}$/.test(raw) ? `${raw.slice(4, 6)}/${raw.slice(0, 4)}` : raw;

/* ── Risk accent color ── */
const RISK_COLOR: Record<string, string> = {
  emerald: '#16a34a',
  amber:   '#b45309',
  red:     '#dc2626',
  slate:   '#64748b',
};
const RISK_BG: Record<string, string> = {
  emerald: '#dcfce7',
  amber:   '#fef3c7',
  red:     '#fee2e2',
  slate:   '#f1f5f9',
};

/* ── Sit color ── */
const sitClass = (s: number) =>
  s === 1 ? 'sit-1' : s <= 3 ? 'sit-2' : 'sit-4';

/* ── Section header ── */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '7.5pt', fontWeight: 700, color: '#0f1117',
      textTransform: 'uppercase', letterSpacing: '0.06em',
      marginBottom: '2.5mm', marginTop: '0',
    }}>
      {children}
    </div>
  );
}

function Rule({ strong }: { strong?: boolean }) {
  return (
    <div style={{
      height: strong ? 1 : 0.5,
      background: strong ? '#b8bfcc' : '#dde1e9',
      margin: '3.5mm 0',
    }} />
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '5.5pt', fontWeight: 600, color: '#8890a4',
      textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.8mm',
    }}>
      {children}
    </div>
  );
}

function Value({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{ fontSize: '8pt', fontWeight: 600, color: color ?? '#0f1117' }}>
      {children}
    </div>
  );
}

/* ── Page 1 ── */
export default function Page1({ data }: { data: InformeLocativoData }) {
  const rc = RISK_COLOR[data.color] ?? RISK_COLOR.slate;
  const rbg = RISK_BG[data.color] ?? RISK_BG.slate;
  const tipo = data.tipo_persona === 'fisica' ? 'Persona física' : 'Empresa';

  return (
    <div className="page">

      {/* ── ENCABEZADO ── */}
      {/* Barra de acento */}
      <div style={{ height: 3, background: rc, borderRadius: 2, marginBottom: '4mm' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '6pt', fontWeight: 600, color: '#8890a4', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1mm' }}>
            Informe Comercial Locativo
          </div>
          <div style={{ fontSize: '18pt', fontWeight: 800, fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1 }}>
            {data.documento}
          </div>
          {data.denominacion && (
            <div style={{ fontSize: '9pt', fontWeight: 700, color: '#2d3142', marginTop: '1.5mm' }}>
              {data.denominacion}
            </div>
          )}
          <div style={{ fontSize: '7pt', color: '#8890a4', marginTop: '1mm' }}>
            {tipo} · Consulta: {fmtDT(data.fetchedAt)}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div style={{
            background: rbg, color: rc,
            border: `1px solid ${rc}40`,
            borderRadius: 100, padding: '3px 10px',
            fontSize: '7pt', fontWeight: 700,
          }}>
            {data.riesgoLabel}
          </div>
          <div style={{
            background: '#f2f4f7', color: '#5a6072',
            border: '1px solid #dde1e9',
            borderRadius: 100, padding: '3px 10px',
            fontSize: '6.5pt', fontWeight: 600,
          }}>
            {data.bcraDisponible ? 'BCRA disponible' : 'BCRA no disponible'}
          </div>
        </div>
      </div>

      <Rule strong />

      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0 }}>
        {[
          { label: 'Deuda vigente', value: money(data.deudaVigente), color: data.deudaVigente > 0 ? rc : undefined },
          { label: 'Situación vigente', value: data.situacionVigente ? `Sit. ${data.situacionVigente}` : '—', color: data.situacionVigente ? rc : undefined },
          { label: 'Peor sit. 24 meses', value: data.peorSituacion24m ? `Sit. ${data.peorSituacion24m}` : '—' },
          { label: 'Fecha consulta', value: fmtDate(data.fetchedAt) },
        ].map(({ label, value, color }, i) => (
          <div key={i} style={{
            paddingRight: '4mm',
            borderRight: i < 3 ? '0.5px solid #dde1e9' : undefined,
            paddingLeft: i > 0 ? '4mm' : undefined,
          }}>
            <Label>{label}</Label>
            <div style={{ fontSize: '11pt', fontWeight: 800, color: color ?? '#0f1117', lineHeight: 1.1 }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      <Rule />

      {/* ── PERFIL + GAUGE ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '6mm' }}>
        {/* Gauge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '2mm' }}>
          <ScoreGauge score={data.score} color={data.color} size={100} />
        </div>

        {/* Perfil */}
        <div>
          <SectionTitle>Perfil del consultado</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '3mm 5mm' }}>
            {[
              { label: 'Identificación', value: data.documento },
              { label: 'Tipo', value: tipo },
              { label: 'Estado BCRA', value: data.bcraDisponible ? 'Disponible' : 'Sin respuesta' },
              ...(data.denominacion ? [{ label: 'Denominación', value: data.denominacion }] : []),
              { label: 'Consulta', value: fmtDT(data.fetchedAt) },
            ].map(({ label, value }, i) => (
              <div key={i}>
                <Label>{label}</Label>
                <Value>{value}</Value>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Rule />

      {/* ── RESUMEN BCRA ── */}
      <SectionTitle>Resumen BCRA</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '3mm 5mm', marginBottom: '3mm' }}>
        {[
          { label: 'Situación vigente', value: data.situacionVigente ? `Situación ${data.situacionVigente}` : 'Sin registros', color: data.situacionVigente ? rc : undefined },
          { label: 'Peor situación 24m', value: data.peorSituacion24m ? `Situación ${data.peorSituacion24m}` : '—' },
          { label: 'Entidad principal', value: data.entidadPrincipal ?? '—' },
          { label: 'Período informado', value: data.ultimoPeriodoActual ? fmtPeriodo(data.ultimoPeriodoActual) : '—' },
          { label: 'Total deuda vigente', value: money(data.deudaVigente), color: data.deudaVigente > 0 ? rc : undefined },
          { label: 'Tendencia 6 meses', value: data.tendencia6m === 'estable' ? '✓ Estable' : data.tendencia6m === 'normalizada' ? '↗ Normalizada' : '↘ Inestable' },
        ].map(({ label, value, color }, i) => (
          <div key={i} style={{ background: '#f8f9fb', borderRadius: 4, padding: '2.5mm 3mm', border: '0.5px solid #dde1e9' }}>
            <Label>{label}</Label>
            <div style={{ fontSize: '9pt', fontWeight: 700, color: color ?? '#0f1117', lineHeight: 1.2, marginTop: '0.5mm' }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Alerta contextual */}
      {data.situacionVigente === 1 && (data.peorSituacion24m ?? 0) >= 4 && (
        <div style={{
          background: '#fef3c7', border: '0.5px solid #fde68a',
          borderRadius: 4, padding: '2.5mm 3mm',
          fontSize: '7pt', color: '#92400e', lineHeight: 1.5,
          marginBottom: '3mm',
        }}>
          ⚠ Actualmente figura en situación normal, pero registra antecedente histórico severo en los últimos 24 meses. Se recomienda revisión manual.
        </div>
      )}

      <Rule />

      {/* ── TABLA BANCARIA ── */}
      <SectionTitle>Último informe bancario</SectionTitle>
      {!data.bcraDisponible || !data.actualRows.length ? (
        <div style={{ fontSize: '7.5pt', color: '#8890a4', padding: '3mm 0' }}>
          No se encontraron registros en el período actual.
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Entidad</th>
              <th>Sit.</th>
              <th>Monto</th>
              <th>Días atraso</th>
            </tr>
          </thead>
          <tbody>
            {data.actualRows.map((row, i) => (
              <tr key={i}>
                <td>{row.entidad}</td>
                <td className={sitClass(row.situacion)}>{row.situacion}</td>
                <td style={{ textAlign: 'right' }}>{money(row.monto)}</td>
                <td>{row.diasAtraso || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ── FOOTER ── */}
      <div className="page-footer">
        <span>InmoRent · Informe Comercial Locativo</span>
        <span>Información orientativa — generada el {fmtDT(new Date().toISOString())}</span>
        <span>1 / 2</span>
      </div>
    </div>
  );
}