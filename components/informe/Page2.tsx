import type { InformeLocativoData } from '@/lib/mock-locativo';
import DonutChart, { type DonutSlice } from './charts/DonutChart';
import BarChart, { type BarDataPoint } from './charts/BarChart';
import LineChart, { type LineSeries } from './charts/LineChart';

const money = (v: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v);

const fmtDT = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

/* ── Paleta coherente con InmoRent ── */
const PALETTE = [
  '#F36B21', '#C4541A', '#F59E0B', '#10b981',
  '#6366f1', '#14b8a6', '#ec4899', '#8b5cf6',
];

const T = {
  ink900: '#1C1C1E', ink700: '#3A3A3C', ink500: '#6E6E73',
  ink400: '#8E8E93', ink200: '#E7E4DE', ink100: '#F2F1ED', ink50: '#F7F6F3',
  brand: '#F36B21', white: '#FFFFFF',
};

const SIT_COLOR = (s: number) => s === 1 ? '#16a34a' : s <= 3 ? '#b45309' : '#dc2626';

const s = {
  labelXs: { fontSize: '5.5pt', fontWeight: 700, color: T.ink400, textTransform: 'uppercase' as const, letterSpacing: '0.08em' },
  sectionTitle: { fontSize: '7pt', fontWeight: 700, color: T.ink900, textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: '3mm' },
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={s.sectionTitle}>{children}</div>;
}
function Rule() {
  return <div style={{ height: 0.5, background: T.ink200, margin: '4mm 0' }} />;
}

function ContinuationHeader({ data }: { data: InformeLocativoData }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: '4mm', paddingBottom: '3mm',
      borderBottom: `0.5px solid ${T.ink200}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: T.brand }} />
        <span style={{ fontSize: '6pt', fontWeight: 700, color: T.brand, letterSpacing: '0.1em', textTransform: 'uppercase' }}>InmoRent</span>
        <span style={{ fontSize: '6pt', color: T.ink400 }}>· Informe Comercial Locativo — continuación</span>
      </div>
      <div style={{ fontSize: '7.5pt', fontWeight: 700, color: T.ink700, letterSpacing: '0.01em' }}>
        {data.documento}
        {data.denominacion && ` · ${data.denominacion}`}
      </div>
    </div>
  );
}

import React from 'react';

export default function Page2({ data }: { data: InformeLocativoData }) {
  const { actualRows, historicoRows, periodosHistoricosAgregados } = data;

  /* ── Donut: por banco ── */
  const byBankMap: Record<string, number> = {};
  actualRows.forEach(r => { byBankMap[r.entidad] = (byBankMap[r.entidad] ?? 0) + r.monto; });
  const bankSlices: DonutSlice[] = Object.entries(byBankMap)
    .sort(([, a], [, b]) => b - a)
    .map(([label, value], i) => ({ label, value, color: PALETTE[i % PALETTE.length] }));

  /* ── Donut: por situación ── */
  const bySitMap: Record<string, { sit: number; value: number }> = {};
  actualRows.forEach(r => {
    const k = `Sit. ${r.situacion}`;
    if (!bySitMap[k]) bySitMap[k] = { sit: r.situacion, value: 0 };
    bySitMap[k].value += r.monto;
  });
  const sitSlices: DonutSlice[] = Object.entries(bySitMap)
    .map(([label, { sit, value }]) => ({ label, value, color: SIT_COLOR(sit) }));

  /* ── Bar chart ── */
  const barData: BarDataPoint[] = periodosHistoricosAgregados.slice(-24).map(p => ({
    label: p.periodo,
    value: p.montoTotal,
  }));

  /* ── Line chart ── */
  const entidades = Array.from(new Set(historicoRows.map(r => r.entidad)));
  const periods = Array.from(new Set(historicoRows.map(r => r.periodo))).sort();
  const lineSeries: LineSeries[] = entidades.map((ent, i) => ({
    label: ent,
    color: PALETTE[i % PALETTE.length],
    data: Object.fromEntries(
      historicoRows.filter(r => r.entidad === ent).map(r => [r.periodo, r.monto])
    ),
  }));

  /* ── Tabla: entidades históricas ── */
  const entHistorico = entidades.map(ent => {
    const rows = historicoRows.filter(r => r.entidad === ent);
    return {
      entidad: ent,
      montoTotal: rows.reduce((a, r) => a + r.monto, 0),
      periodos: rows.length,
      maxSit: Math.max(...rows.map(r => r.situacion)),
    };
  }).sort((a, b) => b.montoTotal - a.montoTotal);

  return (
    <div className="page">
      <ContinuationHeader data={data} />

      {/* ══ DISTRIBUCIÓN ACTUAL ══ */}
      <SectionTitle>Distribución actual por banco y situación</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6mm', marginBottom: '4mm' }}>
        <div>
          <div style={{ ...s.labelXs, marginBottom: '2.5mm' }}>Por entidad</div>
          {bankSlices.length > 0
            ? <DonutChart slices={bankSlices} size={96} />
            : <div style={{ fontSize: '7pt', color: T.ink400, fontStyle: 'italic' }}>Sin datos</div>
          }
        </div>
        <div>
          <div style={{ ...s.labelXs, marginBottom: '2.5mm' }}>Por situación</div>
          {sitSlices.length > 0
            ? <DonutChart slices={sitSlices} size={96} />
            : <div style={{ fontSize: '7pt', color: T.ink400, fontStyle: 'italic' }}>Sin datos</div>
          }
        </div>
      </div>

      <Rule />

      {/* ══ BARRAS ══ */}
      <SectionTitle>Evolución de deuda total — últimos 24 períodos</SectionTitle>
      {barData.length > 0
        ? <BarChart data={barData} color={T.brand} width={550} height={110} />
        : <div style={{ fontSize: '7.5pt', color: T.ink400, padding: '3mm 0', fontStyle: 'italic' }}>Sin datos históricos.</div>
      }

      <Rule />

      {/* ══ LÍNEA ══ */}
      <SectionTitle>Evolución por entidad</SectionTitle>
      {lineSeries.length > 0 && periods.length > 0
        ? <LineChart series={lineSeries} periods={periods.slice(-24)} width={550} height={110} />
        : <div style={{ fontSize: '7.5pt', color: T.ink400, padding: '3mm 0', fontStyle: 'italic' }}>Sin datos históricos.</div>
      }

      <Rule />

      {/* ══ TABLA HISTORIAL ══ */}
      <SectionTitle>Entidades con exposición histórica</SectionTitle>
      {entHistorico.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>Entidad</th>
              <th style={{ textAlign: 'right' }}>Monto total hist.</th>
              <th style={{ textAlign: 'right' }}>Períodos</th>
              <th style={{ textAlign: 'right' }}>Sit. max.</th>
            </tr>
          </thead>
          <tbody>
            {entHistorico.map((e, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 500 }}>{e.entidad}</td>
                <td style={{ textAlign: 'right' }}>{money(e.montoTotal)}</td>
                <td style={{ textAlign: 'right', color: T.ink500 }}>{e.periodos}</td>
                <td style={{ textAlign: 'right', color: SIT_COLOR(e.maxSit), fontWeight: 700 }}>
                  {e.maxSit || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ fontSize: '7.5pt', color: T.ink400, fontStyle: 'italic' }}>Sin datos.</div>
      )}

      <Rule />

      {/* ══ FUENTES ══ */}
      <SectionTitle>Fuentes y advertencias</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5mm', fontSize: '6.5pt', color: T.ink500, lineHeight: 1.6 }}>
        <div><strong style={{ color: T.ink700 }}>Fuentes consultadas:</strong> BCRA Central de Deudores · Datos públicos disponibles al momento de la consulta.</div>
        {[
          'La información contenida en este informe es de carácter orientativo y debe ser validada antes de tomar cualquier decisión.',
          'Si una fuente pública no devuelve identificación suficiente, la coincidencia debe verificarse manualmente.',
          'El BCRA informa saldos y situación por entidad y período, pero no identifica el tipo de producto (tarjeta, préstamo, etc.).',
          'El indicador bancario es calculado internamente por InmoRent y no constituye una calificación crediticia oficial.',
        ].map((w, i) => (
          <div key={i} style={{ display: 'flex', gap: 5 }}>
            <span style={{ color: T.ink300, flexShrink: 0 }}>{i + 1}.</span>
            <span>{w}</span>
          </div>
        ))}
      </div>

      {/* ══ FOOTER ══ */}
      <div className="page-footer">
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: T.brand, fontWeight: 700 }}>InmoRent</span>
          <span>· Informe Comercial Locativo</span>
        </span>
        <span>Información orientativa · {fmtDT(new Date().toISOString())}</span>
        <span>2 / 2</span>
      </div>
    </div>
  );
}
