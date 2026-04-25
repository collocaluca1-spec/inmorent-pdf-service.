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

/* ── Paleta de riesgo ── */
const RISK: Record<string, { fg: string; bg: string; border: string; bar: string }> = {
  emerald: { fg: '#166534', bg: '#dcfce7', border: '#bbf7d0', bar: '#16a34a' },
  amber:   { fg: '#92400e', bg: '#fef3c7', border: '#fde68a', bar: '#b45309' },
  red:     { fg: '#991b1b', bg: '#fee2e2', border: '#fecaca', bar: '#dc2626' },
  slate:   { fg: '#374151', bg: '#f1f5f9', border: '#e2e8f0', bar: '#64748b' },
};

const SIT_COLOR = (s: number) => s === 1 ? '#16a34a' : s <= 3 ? '#b45309' : '#dc2626';

/* ── Tokens ── */
const T = {
  ink900: '#1C1C1E',
  ink700: '#3A3A3C',
  ink500: '#6E6E73',
  ink400: '#8E8E93',
  ink300: '#C7C7CC',
  ink200: '#E7E4DE',
  ink100: '#F2F1ED',
  ink50:  '#F7F6F3',
  brand:  '#F36B21',
  white:  '#FFFFFF',
};

/* ── Primitivas de estilo ── */
const s = {
  labelXs: { fontSize: '5.5pt', fontWeight: 700, color: T.ink400, textTransform: 'uppercase' as const, letterSpacing: '0.08em' },
  sectionTitle: { fontSize: '7pt', fontWeight: 700, color: T.ink900, textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: '3mm' },
  rule: { height: 0.5, background: T.ink200, margin: '4mm 0' } as React.CSSProperties,
  ruleStrong: { height: 1, background: T.ink300, margin: '4mm 0' } as React.CSSProperties,
};

import React from 'react';

function Rule({ strong }: { strong?: boolean }) {
  return <div style={strong ? s.ruleStrong : s.rule} />;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={s.sectionTitle}>{children}</div>;
}

function DataCard({ label, value, color, sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div style={{
      background: T.ink50,
      border: `0.5px solid ${T.ink200}`,
      borderRadius: 6,
      padding: '3mm 3.5mm',
    }}>
      <div style={s.labelXs}>{label}</div>
      <div style={{ fontSize: '10pt', fontWeight: 800, color: color ?? T.ink900, marginTop: '1mm', lineHeight: 1.1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '5.5pt', color: T.ink400, marginTop: '0.8mm' }}>{sub}</div>}
    </div>
  );
}

export default function Page1({ data }: { data: InformeLocativoData }) {
  const risk = RISK[data.color] ?? RISK.slate;
  const tipo = data.tipo_persona === 'fisica' ? 'Persona física' : 'Empresa';

  return (
    <div className="page">

      {/* ══ HEADER ══ */}
      {/* Barra de marca */}
      <div style={{ height: 3.5, background: T.brand, borderRadius: 2, marginBottom: '5mm' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5mm' }}>
        <div>
          {/* Logo text */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2.5mm' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.brand }} />
            <span style={{ fontSize: '6pt', fontWeight: 700, color: T.brand, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              InmoRent
            </span>
            <span style={{ fontSize: '6pt', color: T.ink400, marginLeft: 2 }}>·</span>
            <span style={{ fontSize: '6pt', color: T.ink400, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Informe Comercial Locativo
            </span>
          </div>

          {/* Identificación principal */}
          <div style={{ fontSize: '20pt', fontWeight: 800, color: T.ink900, lineHeight: 1, letterSpacing: '-0.01em' }}>
            {data.documento}
          </div>
          {data.denominacion && (
            <div style={{ fontSize: '9.5pt', fontWeight: 600, color: T.ink700, marginTop: '1.5mm' }}>
              {data.denominacion}
            </div>
          )}
          <div style={{ fontSize: '6.5pt', color: T.ink400, marginTop: '1mm' }}>
            {tipo} · Consultado el {fmtDT(data.fetchedAt)}
          </div>
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
          <div style={{
            background: risk.bg, color: risk.fg,
            border: `1px solid ${risk.border}`,
            borderRadius: 100, padding: '3.5px 10px',
            fontSize: '7pt', fontWeight: 700, letterSpacing: '0.02em',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: risk.bar }} />
            {data.riesgoLabel}
          </div>
          <div style={{
            background: data.bcraDisponible ? T.ink50 : T.ink100,
            color: data.bcraDisponible ? T.ink700 : T.ink400,
            border: `1px solid ${T.ink200}`,
            borderRadius: 100, padding: '3px 10px',
            fontSize: '6.5pt', fontWeight: 600,
          }}>
            {data.bcraDisponible ? '✓ BCRA disponible' : '— BCRA no disponible'}
          </div>
        </div>
      </div>

      <Rule strong />

      {/* ══ KPIs ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '3mm', marginBottom: '5mm' }}>
        <DataCard
          label="Deuda vigente"
          value={money(data.deudaVigente)}
          color={data.deudaVigente > 0 ? risk.bar : T.ink900}
          sub="período actual"
        />
        <DataCard
          label="Situación vigente"
          value={data.situacionVigente ? `Sit. ${data.situacionVigente}` : '—'}
          color={data.situacionVigente ? SIT_COLOR(data.situacionVigente) : T.ink400}
          sub="período actual"
        />
        <DataCard
          label="Peor sit. 24 meses"
          value={data.peorSituacion24m ? `Sit. ${data.peorSituacion24m}` : '—'}
          sub="histórico"
        />
        <DataCard
          label="Fecha consulta"
          value={fmtDate(data.fetchedAt)}
          sub={fmtDT(data.fetchedAt).split(',')[1]?.trim()}
        />
      </div>

      <Rule />

      {/* ══ PERFIL + GAUGE ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '115px 1fr', gap: '7mm', marginBottom: '5mm' }}>
        {/* Gauge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <ScoreGauge score={data.score} color={data.color} size={108} />
          <div style={{ fontSize: '6pt', fontWeight: 700, color: risk.bar, marginTop: '2mm', textAlign: 'center' }}>
            {data.riesgoLabel}
          </div>
        </div>

        {/* Perfil del consultado */}
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
                <div style={s.labelXs}>{label}</div>
                <div style={{ fontSize: '7.5pt', fontWeight: 600, color: T.ink900, marginTop: '0.8mm' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Rule />

      {/* ══ RESUMEN BCRA ══ */}
      <SectionTitle>Resumen BCRA</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '3mm', marginBottom: '4mm' }}>
        {[
          { label: 'Situación vigente', value: data.situacionVigente ? `Situación ${data.situacionVigente}` : 'Sin registros', color: data.situacionVigente ? SIT_COLOR(data.situacionVigente) : T.ink400 },
          { label: 'Peor situación 24m', value: data.peorSituacion24m ? `Situación ${data.peorSituacion24m}` : '—' },
          { label: 'Entidad principal', value: data.entidadPrincipal ?? '—' },
          { label: 'Período informado', value: data.ultimoPeriodoActual ? fmtPeriodo(data.ultimoPeriodoActual) : '—' },
          { label: 'Total deuda vigente', value: money(data.deudaVigente), color: data.deudaVigente > 0 ? risk.bar : T.ink900 },
          { label: 'Tendencia 6 meses', value: data.tendencia6m === 'estable' ? '✓ Estable' : data.tendencia6m === 'normalizada' ? '↗ Normalizada' : '↘ Inestable' },
        ].map(({ label, value, color }, i) => (
          <DataCard key={i} label={label} value={value} color={color} />
        ))}
      </div>

      {/* Alerta contextual */}
      {data.situacionVigente === 1 && (data.peorSituacion24m ?? 0) >= 4 && (
        <div style={{
          background: '#fef3c7', border: '0.5px solid #fde68a',
          borderRadius: 6, padding: '3mm 4mm',
          fontSize: '7pt', color: '#92400e', lineHeight: 1.6,
          display: 'flex', gap: '6px', alignItems: 'flex-start',
          marginBottom: '4mm',
        }}>
          <span style={{ marginTop: '0.5mm' }}>⚠</span>
          <span>Actualmente figura en situación normal, pero registra antecedente histórico severo en los últimos 24 meses. Se recomienda revisión manual antes de tomar una decisión.</span>
        </div>
      )}

      <Rule />

      {/* ══ TABLA BANCARIA ══ */}
      <SectionTitle>Último informe bancario</SectionTitle>
      {!data.bcraDisponible || !data.actualRows.length ? (
        <div style={{ fontSize: '7.5pt', color: T.ink400, padding: '3mm 0', fontStyle: 'italic' }}>
          No se encontraron registros en el período actual.
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Entidad</th>
              <th>Sit.</th>
              <th style={{ textAlign: 'right' }}>Monto</th>
              <th style={{ textAlign: 'right' }}>Días atraso</th>
            </tr>
          </thead>
          <tbody>
            {data.actualRows.map((row, i) => (
              <tr key={i}>
                <td>{row.entidad}</td>
                <td style={{ color: SIT_COLOR(row.situacion), fontWeight: 700 }}>{row.situacion}</td>
                <td style={{ textAlign: 'right' }}>{money(row.monto)}</td>
                <td style={{ textAlign: 'right', color: row.diasAtraso > 0 ? '#b45309' : T.ink500 }}>
                  {row.diasAtraso || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ══ FOOTER ══ */}
      <div className="page-footer">
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: T.brand, fontWeight: 700 }}>InmoRent</span>
          <span>· Informe Comercial Locativo</span>
        </span>
        <span>Información orientativa · {fmtDT(new Date().toISOString())}</span>
        <span>1 / 2</span>
      </div>
    </div>
  );
}
