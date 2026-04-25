import type { InformeLocativoData } from '@/lib/mock-locativo';
import DonutChart, { type DonutSlice } from './charts/DonutChart';
import BarChart, { type BarDataPoint } from './charts/BarChart';
import LineChart, { type LineSeries } from './charts/LineChart';

const money = (value: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value || 0);

const fmtDT = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const ENTITY_COLORS = ['#F36B21', '#5C64E8', '#21A66B', '#D88A12', '#D94A3A', '#8A63D2'];
const situacionColor = (sit: number) => (sit === 1 ? '#21A66B' : sit <= 3 ? '#D88A12' : '#D94A3A');

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: '3mm' }}>
      <div className="section-title" style={{ marginBottom: subtitle ? '1mm' : 0 }}>{title}</div>
      {subtitle && <div style={{ fontSize: '7pt', color: 'var(--muted)', fontWeight: 500 }}>{subtitle}</div>}
    </div>
  );
}

export default function Page2({ data }: { data: InformeLocativoData }) {
  const actualRows = data.actualRows;
  const historicoRows = data.historicoRows;

  const byBankMap: Record<string, number> = {};
  actualRows.forEach((row) => {
    byBankMap[row.entidad] = (byBankMap[row.entidad] || 0) + row.monto;
  });

  const bankSlices: DonutSlice[] = Object.entries(byBankMap)
    .sort(([, a], [, b]) => b - a)
    .map(([label, value], index) => ({
      label,
      value,
      color: ENTITY_COLORS[index % ENTITY_COLORS.length],
    }));

  const bySituacionMap: Record<string, { situacion: number; value: number }> = {};
  actualRows.forEach((row) => {
    const label = `Sit. ${row.situacion}`;
    if (!bySituacionMap[label]) bySituacionMap[label] = { situacion: row.situacion, value: 0 };
    bySituacionMap[label].value += row.monto;
  });

  const situacionSlices: DonutSlice[] = Object.entries(bySituacionMap).map(([label, item]) => ({
    label,
    value: item.value,
    color: situacionColor(item.situacion),
  }));

  const barData: BarDataPoint[] = data.periodosHistoricosAgregados.slice(-24).map((row) => ({
    label: row.periodo,
    value: row.montoTotal,
  }));

  const entidades = Array.from(new Set(historicoRows.map((row) => row.entidad))).filter(Boolean);
  const periods = Array.from(new Set(historicoRows.map((row) => row.periodo))).sort();

  const lineSeries: LineSeries[] = entidades.map((entidad, index) => ({
    label: entidad,
    color: ENTITY_COLORS[index % ENTITY_COLORS.length],
    data: Object.fromEntries(
      historicoRows
        .filter((row) => row.entidad === entidad)
        .map((row) => [row.periodo, row.monto])
    ),
  }));

  const entidadesHistoricas = entidades
    .map((entidad) => {
      const rows = historicoRows.filter((row) => row.entidad === entidad);
      return {
        entidad,
        montoTotal: rows.reduce((acc, row) => acc + row.monto, 0),
        periodos: rows.length,
        maxSituacion: Math.max(0, ...rows.map((row) => row.situacion || 0)),
      };
    })
    .sort((a, b) => b.montoTotal - a.montoTotal);

  return (
    <section className="page">
      <header className="page-continue-header">
        <div className="continue-brand">
          <div className="logo-box">
            <img src="/inmorent-logo.png" alt="InmoRent" />
          </div>
          <div>
            <div className="continue-title">InmoRent</div>
            <div className="continue-sub">Análisis histórico BCRA</div>
          </div>
        </div>
        <div className="continue-id">
          {data.documento}
          {data.denominacion ? ` · ${data.denominacion}` : ''}
        </div>
      </header>

      <SectionHeader title="Distribución actual" subtitle="Composición del último período informado por BCRA." />
      <div className="chart-grid-two">
        <div className="chart-card">
          <h3 className="chart-title">Último informe por banco</h3>
          <DonutChart slices={bankSlices} />
        </div>
        <div className="chart-card">
          <h3 className="chart-title">Último informe por situación</h3>
          <DonutChart slices={situacionSlices} />
        </div>
      </div>

      <div className="chart-card-wide">
        <h3 className="chart-title">Últimos 24 meses — deuda total</h3>
        <BarChart data={barData} color="#F36B21" />
      </div>

      <div className="chart-card-wide">
        <h3 className="chart-title">Últimos 24 meses por entidad</h3>
        <LineChart series={lineSeries} periods={periods.slice(-24)} />
      </div>

      <section style={{ marginBottom: '5mm' }}>
        <div className="section-title">Entidades con exposición histórica</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Entidad</th>
              <th style={{ textAlign: 'right' }}>Monto total hist.</th>
              <th style={{ textAlign: 'right' }}>Períodos</th>
              <th style={{ textAlign: 'right' }}>Sit. máx.</th>
            </tr>
          </thead>
          <tbody>
            {entidadesHistoricas.map((row) => (
              <tr key={row.entidad}>
                <td>{row.entidad}</td>
                <td style={{ textAlign: 'right' }}>{money(row.montoTotal)}</td>
                <td style={{ textAlign: 'right' }}>{row.periodos}</td>
                <td style={{ textAlign: 'right', color: situacionColor(row.maxSituacion), fontWeight: 800 }}>
                  {row.maxSituacion || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="sources">
        <div className="section-title" style={{ marginBottom: '2mm' }}>Fuentes y advertencias</div>
        <p><strong>Fuentes consultadas:</strong> BCRA Central de Deudores · Datos públicos disponibles al momento de la consulta.</p>
        <p>1. La información contenida en este informe es de carácter orientativo y debe ser validada antes de tomar cualquier decisión.</p>
        <p>2. Si una fuente pública no devuelve identificación suficiente, la coincidencia debe verificarse manualmente.</p>
        <p>3. El BCRA informa saldos y situación por entidad y período, pero no identifica el tipo de producto.</p>
        <p>4. El indicador bancario es calculado internamente por InmoRent y no constituye una calificación crediticia oficial.</p>
      </section>

      <footer className="page-footer">
        <span>InmoRent · Informe Comercial Locativo</span>
        <span>Información orientativa · {fmtDT(data.fetchedAt)}</span>
        <span>2 / 2</span>
      </footer>
    </section>
  );
}
