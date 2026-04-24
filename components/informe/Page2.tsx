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

const ENTITY_PALETTE = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444',
  '#8b5cf6', '#14b8a6', '#f97316', '#ec4899',
];

const SIT_COLOR = (s: number) => s === 1 ? '#16a34a' : s <= 3 ? '#b45309' : '#dc2626';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '7.5pt', fontWeight: 700, color: '#0f1117',
      textTransform: 'uppercase', letterSpacing: '0.06em',
      marginBottom: '2mm',
    }}>
      {children}
    </div>
  );
}

function Rule() {
  return <div style={{ height: 0.5, background: '#dde1e9', margin: '3.5mm 0' }} />;
}

/* ── Continuación header ── */
function ContinuationHeader({ data }: { data: InformeLocativoData }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: '3mm', paddingBottom: '2mm',
      borderBottom: '0.5px solid #dde1e9',
    }}>
      <div style={{ fontSize: '7pt', color: '#8890a4' }}>
        Informe Comercial Locativo — continuación
      </div>
      <div style={{ fontSize: '7.5pt', fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace' }}>
        {data.documento}
        {data.denominacion && ` · ${data.denominacion}`}
      </div>
    </div>
  );
}

export default function Page2({ data }: { data: InformeLocativoData }) {
  const actualRows = data.actualRows;
  const historicoRows = data.historicoRows;
  const periodosAgregados = data.periodosHistoricosAgregados;

  /* ── Donut: por banco ── */
  const byBankMap: Record<string, number> = {};
  actualRows.forEach(r => { byBankMap[r.entidad] = (byBankMap[r.entidad] ?? 0) + r.monto; });
  const bankSlices: DonutSlice[] = Object.entries(byBankMap)
    .sort(([,a],[,b]) => b - a)
    .map(([label, value], i) => ({ label, value, color: ENTITY_PALETTE[i % ENTITY_PALETTE.length] }));

  /* ── Donut: por situación ── */
  const bySitMap: Record<string, { sit: number; value: number }> = {};
  actualRows.forEach(r => {
    const k = `Sit. ${r.situacion}`;
    if (!bySitMap[k]) bySitMap[k] = { sit: r.situacion, value: 0 };
    bySitMap[k].value += r.monto;
  });
  const sitSlices: DonutSlice[] = Object.entries(bySitMap)
    .map(([label, { sit, value }]) => ({ label, value, color: SIT_COLOR(sit) }));

  /* ── Bar chart: deuda total por período ── */
  const barData: BarDataPoint[] = periodosAgregados.slice(-24).map(p => ({
    label: p.periodo,
    value: p.montoTotal,
  }));

  /* ── Line chart: por entidad ── */
  const entidades = Array.from(new Set(historicoRows.map(r => r.entidad)));
  const periods = Array.from(new Set(historicoRows.map(r => r.periodo))).sort();
  const lineSeries: LineSeries[] = entidades.map((ent, i) => ({
    label: ent,
    color: ENTITY_PALETTE[i % ENTITY_PALETTE.length],
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

      {/* ── DISTRIBUCIÓN ACTUAL ── */}
      <SectionTitle>Distribución actual por banco y situación</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6mm', marginBottom: '3mm' }}>
        <div>
          <div style={{ fontSize: '6.5pt', color: '#8890a4', marginBottom: '2mm', fontWeight: 600 }}>Por entidad</div>
          {bankSlices.length > 0
            ? <DonutChart slices={bankSlices} size={90} />
            : <div style={{ fontSize: '7pt', color: '#8890a4' }}>Sin datos</div>
          }
        </div>
        <div>
          <div style={{ fontSize: '6.5pt', color: '#8890a4', marginBottom: '2mm', fontWeight: 600 }}>Por situación</div>
          {sitSlices.length > 0
            ? <DonutChart slices={sitSlices} size={90} />
            : <div style={{ fontSize: '7pt', color: '#8890a4' }}>Sin datos</div>
          }
        </div>
      </div>

      <Rule />

      {/* ── BARRAS: evolución total ── */}
      <SectionTitle>Evolución de deuda total — últimos 24 períodos</SectionTitle>
      {barData.length > 0
        ? <BarChart data={barData} color="#2563eb" width={550} height={110} />
        : <div style={{ fontSize: '7.5pt', color: '#8890a4', padding: '3mm 0' }}>Sin datos históricos.</div>
      }

      <Rule />

      {/* ── LÍNEA: por entidad ── */}
      <SectionTitle>Evolución por entidad</SectionTitle>
      {lineSeries.length > 0 && periods.length > 0
        ? <LineChart series={lineSeries} periods={periods.slice(-24)} width={550} height={110} />
        : <div style={{ fontSize: '7.5pt', color: '#8890a4', padding: '3mm 0' }}>Sin datos históricos.</div>
      }

      <Rule />

      {/* ── TABLA: entidades históricas ── */}
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
                <td>{e.entidad}</td>
                <td style={{ textAlign: 'right' }}>{money(e.montoTotal)}</td>
                <td style={{ textAlign: 'right' }}>{e.periodos}</td>
                <td style={{ textAlign: 'right', color: SIT_COLOR(e.maxSit), fontWeight: 700 }}>
                  {e.maxSit || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ fontSize: '7.5pt', color: '#8890a4' }}>Sin datos.</div>
      )}

      <Rule />

      {/* ── FUENTES Y ADVERTENCIAS ── */}
      <SectionTitle>Fuentes y advertencias</SectionTitle>
      <div style={{ fontSize: '6.5pt', color: '#5a6072', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '1.5mm' }}>
        <div><strong>Fuentes consultadas:</strong> BCRA Central de Deudores · Datos públicos disponibles al momento de la consulta.</div>
        <div>1. La información contenida en este informe es de carácter orientativo y debe ser validada antes de tomar cualquier decisión.</div>
        <div>2. Si una fuente pública no devuelve identificación suficiente, la coincidencia debe verificarse manualmente.</div>
        <div>3. El BCRA informa saldos y situación por entidad y período, pero no identifica el tipo de producto (tarjeta, préstamo, etc.).</div>
        <div>4. El indicador bancario es calculado internamente por InmoRent y no constituye una calificación crediticia oficial.</div>
      </div>

      {/* ── FOOTER ── */}
      <div className="page-footer" style={{ marginTop: 'auto' }}>
        <span>InmoRent · Informe Comercial Locativo</span>
        <span>Información orientativa — generada el {fmtDT(new Date().toISOString())}</span>
        <span>2 / 2</span>
      </div>
    </div>
  );
}