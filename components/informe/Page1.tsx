import type { ReactNode } from 'react';
import type { InformeLocativoData } from '@/lib/mock-locativo';
import ScoreGauge from './charts/ScoreGauge';

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

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

const fmtPeriodo = (raw: string | null) => {
  if (!raw) return '—';
  return /^\d{6}$/.test(raw) ? `${raw.slice(4, 6)}/${raw.slice(0, 4)}` : raw;
};

const riskClass = (color: InformeLocativoData['color']) => {
  if (color === 'emerald') return 'badge-emerald';
  if (color === 'amber') return 'badge-amber';
  if (color === 'red') return 'badge-red';
  return 'badge-slate';
};

const riskValueClass = (color: InformeLocativoData['color']) => {
  if (color === 'emerald') return 'value-green';
  if (color === 'amber') return 'value-brand';
  if (color === 'red') return 'value-red';
  return '';
};

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="field-label">{label}</div>
      <div className="field-value">{value}</div>
    </div>
  );
}

function SummaryCard({ label, value, accent }: { label: string; value: ReactNode; accent?: boolean }) {
  return (
    <div className="summary-card">
      <div className="field-label">{label}</div>
      <div className={`field-value ${accent ? 'value-brand' : ''}`}>{value}</div>
    </div>
  );
}

export default function Page1({ data }: { data: InformeLocativoData }) {
  const tipo = data.tipo_persona === 'fisica' ? 'Persona física' : 'Empresa';
  const risk = riskClass(data.color);
  const valueRisk = riskValueClass(data.color);

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <div className="brand-row">
            <div className="logo-box">
              <img src="/inmorent-logo.png" alt="InmoRent" />
            </div>
            <div>
              <div className="brand-title">InmoRent</div>
              <div className="brand-subtitle">Informe locativo</div>
            </div>
          </div>

          <h1 className="subject-name">{data.denominacion || 'Sin denominación'}</h1>
          <div className="subject-meta">
            <span className="subject-doc">{data.documento}</span>
            <span>·</span>
            <span>{tipo}</span>
            <span>·</span>
            <span>Consultado el {fmtDT(data.fetchedAt)}</span>
          </div>
        </div>

        <div className="header-actions">
          <span className={`badge ${risk}`}>{data.riesgoLabel}</span>
          <span className="badge badge-slate">{data.bcraDisponible ? 'BCRA disponible' : 'BCRA no disponible'}</span>
        </div>
      </header>

      <div className="kpi-strip">
        <div className="kpi-cell">
          <div className="label">Deuda vigente</div>
          <div className={`value ${valueRisk}`}>{money(data.deudaVigente)}</div>
          <div className="value-small">período actual</div>
        </div>
        <div className="kpi-cell">
          <div className="label">Situación vigente</div>
          <div className={`value ${valueRisk}`}>{data.situacionVigente ? `Sit. ${data.situacionVigente}` : '—'}</div>
          <div className="value-small">período actual</div>
        </div>
        <div className="kpi-cell">
          <div className="label">Peor situación 24m</div>
          <div className="value">{data.peorSituacion24m ? `Sit. ${data.peorSituacion24m}` : '—'}</div>
          <div className="value-small">histórico</div>
        </div>
        <div className="kpi-cell">
          <div className="label">Última consulta</div>
          <div className="value">{fmtDate(data.fetchedAt)}</div>
          <div className="value-small">{fmtDT(data.fetchedAt).split(',')[1]?.trim()}</div>
        </div>
      </div>

      <div className="main-grid">
        <div className="panel score-panel">
          <div className="section-title">Indicador bancario</div>
          <ScoreGauge score={data.score} color={data.color} size={122} />
        </div>

        <div className="panel info-panel">
          <div className="section-title">Perfil del consultado</div>
          <div className="profile-grid">
            <Field label="Identificación" value={data.documento} />
            <Field label="Tipo" value={tipo} />
            <Field label="Estado BCRA" value={data.bcraDisponible ? 'Disponible' : 'Sin respuesta'} />
            <Field label="Denominación" value={data.denominacion || '—'} />
            <Field label="Consulta" value={fmtDT(data.fetchedAt)} />
          </div>

          <div className="section-title">Resumen BCRA</div>
          <div className="summary-grid">
            <SummaryCard label="Situación vigente" value={data.situacionVigente ? `Situación ${data.situacionVigente}` : '—'} accent />
            <SummaryCard label="Peor situación 24m" value={data.peorSituacion24m ? `Situación ${data.peorSituacion24m}` : '—'} />
            <SummaryCard label="Entidad principal" value={data.entidadPrincipal || '—'} />
            <SummaryCard label="Período informado" value={fmtPeriodo(data.ultimoPeriodoActual)} />
            <SummaryCard label="Total deuda vigente" value={money(data.deudaVigente)} accent />
            <SummaryCard
              label="Tendencia 6 meses"
              value={data.tendencia6m === 'estable' ? '✓ Estable' : data.tendencia6m === 'normalizada' ? '↗ Normalizada' : '↘ Inestable'}
            />
          </div>
        </div>
      </div>

      {data.situacionVigente === 1 && (data.peorSituacion24m ?? 0) >= 4 && (
        <div className="alert">
          Actualmente figura en situación normal, pero registra un antecedente histórico severo dentro de los últimos 24 meses. Se recomienda revisión manual antes de tomar una decisión.
        </div>
      )}

      <section className="table-section">
        <div className="section-title">Último informe bancario</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Entidad</th>
              <th>Situación</th>
              <th>Monto</th>
              <th>Días atraso</th>
            </tr>
          </thead>
          <tbody>
            {data.actualRows.map((row, index) => (
              <tr key={`${row.entidad}-${index}`}>
                <td>{row.entidad}</td>
                <td>{row.situacion}</td>
                <td>{money(row.monto)}</td>
                <td>{row.diasAtraso || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer className="page-footer">
        <span>InmoRent · Informe Comercial Locativo</span>
        <span>Información orientativa · {fmtDT(data.fetchedAt)}</span>
        <span>1 / 2</span>
      </footer>
    </section>
  );
}
