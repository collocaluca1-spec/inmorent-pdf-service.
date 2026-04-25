import type { BankRow, HistoricoRow, InformeLocativoData, PeriodoAgregado } from './mock-locativo';

type AnyRecord = Record<string, any>;

const toNumber = (value: any, fallback = 0) => {
  if (value === null || value === undefined || value === '') return fallback;
  const normalized = typeof value === 'string' ? value.replace(/\$/g, '').replace(/\./g, '').replace(',', '.').trim() : value;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : fallback;
};

const toStringOrNull = (value: any): string | null => {
  if (value === null || value === undefined || value === '') return null;
  return String(value);
};

const normalizePeriodo = (raw: any): string => {
  const value = String(raw || '').trim();
  if (/^\d{6}$/.test(value)) return `${value.slice(4, 6)}/${value.slice(0, 4)}`;
  return value;
};

const normalizeTipoPersona = (value: any): InformeLocativoData['tipo_persona'] => {
  const raw = String(value || '').toLowerCase();
  if (raw.includes('empresa') || raw.includes('juridica') || raw.includes('jurídica')) return 'empresa';
  return 'fisica';
};

const normalizeColor = (value: any, score: number): InformeLocativoData['color'] => {
  const raw = String(value || '').toLowerCase();
  if (raw === 'emerald' || raw.includes('verde') || raw.includes('bajo')) return 'emerald';
  if (raw === 'amber' || raw.includes('ambar') || raw.includes('ámbar') || raw.includes('revision') || raw.includes('revisión') || raw.includes('moderado')) return 'amber';
  if (raw === 'red' || raw.includes('rojo') || raw.includes('alto')) return 'red';
  if (score >= 80) return 'emerald';
  if (score >= 55) return 'amber';
  if (score > 0) return 'red';
  return 'slate';
};

const normalizeRiskLevel = (value: any, color: InformeLocativoData['color']): InformeLocativoData['riskLevel'] => {
  const raw = String(value || '').toLowerCase();
  if (raw === 'bajo' || raw.includes('bajo')) return 'bajo';
  if (raw === 'alto' || raw.includes('alto')) return 'alto';
  if (raw === 'sin_dato' || raw.includes('sin dato')) return 'sin_dato';
  if (color === 'emerald') return 'bajo';
  if (color === 'red') return 'alto';
  return 'moderado';
};

const normalizeTendencia = (value: any): InformeLocativoData['tendencia6m'] => {
  const raw = String(value || '').toLowerCase();
  if (raw.includes('inestable')) return 'inestable';
  if (raw.includes('normalizada')) return 'normalizada';
  return 'estable';
};

const normalizeActualRows = (rows: any[]): BankRow[] => {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => ({
    entidad: String(row.entidad || row.banco || row.nombreEntidad || 'Entidad'),
    situacion: toNumber(row.situacion, 0),
    monto: toNumber(row.monto, 0),
    diasAtraso: toNumber(row.diasAtraso ?? row.diasAtrasoPago, 0),
    periodo: normalizePeriodo(row.periodo),
  }));
};

const normalizeHistoricoRows = (rows: any[]): HistoricoRow[] => {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => ({
    periodo: normalizePeriodo(row.periodo),
    entidad: String(row.entidad || row.banco || row.nombreEntidad || 'Entidad'),
    situacion: toNumber(row.situacion, 0),
    monto: toNumber(row.monto, 0),
  }));
};

const aggregatePeriodos = (rows: HistoricoRow[]): PeriodoAgregado[] => {
  const map = new Map<string, PeriodoAgregado>();
  rows.forEach((row) => {
    const current = map.get(row.periodo) || { periodo: row.periodo, montoTotal: 0, maxSituacion: 0 };
    current.montoTotal += row.monto;
    current.maxSituacion = Math.max(current.maxSituacion, row.situacion || 0);
    map.set(row.periodo, current);
  });
  return Array.from(map.values()).sort((a, b) => a.periodo.localeCompare(b.periodo));
};

const deriveRiskLabel = (score: number, color: InformeLocativoData['color'], fallback?: string) => {
  if (fallback) return fallback;
  if (color === 'emerald') return 'Bajo riesgo';
  if (color === 'red') return 'Alto riesgo';
  if (score >= 55) return 'Revisión manual';
  return 'Sin dato bancario';
};

export function normalizeInformePayload(payload: AnyRecord): InformeLocativoData {
  const source = payload?.data || payload?.informe || payload || {};
  const bcraDisponible = source.bcraDisponible ?? source.bcra_disponible ?? (source.estado_bcra ? source.estado_bcra === 'Disponible' : true);
  const actualRows = normalizeActualRows(source.actualRows || source.current_rows || source.actual_rows || []);
  const historicoRows = normalizeHistoricoRows(source.historicoRows || source.historico_rows || source.historicalRows || []);
  const periodosHistoricosAgregados = Array.isArray(source.periodosHistoricosAgregados)
    ? source.periodosHistoricosAgregados.map((row: AnyRecord) => ({
        periodo: normalizePeriodo(row.periodo),
        montoTotal: toNumber(row.montoTotal ?? row.monto_total ?? row.value, 0),
        maxSituacion: toNumber(row.maxSituacion ?? row.max_situacion, 0),
      }))
    : aggregatePeriodos(historicoRows);

  const score = toNumber(source.score ?? source.indicador_bancario, 0);
  const color = normalizeColor(source.color ?? source.riesgo_label ?? source.riskLevel, score);
  const riskLevel = normalizeRiskLevel(source.riskLevel ?? source.riesgo_label, color);

  return {
    documento: String(source.documento || source.identificacion || source.cuit || source.cuil || ''),
    denominacion: toStringOrNull(source.denominacion || source.nombre || source.nombre_completo || source.razon_social),
    tipo_persona: normalizeTipoPersona(source.tipo_persona || source.tipoPersona),
    fetchedAt: String(source.fetchedAt || source.fecha_consulta || source.ultima_consulta || new Date().toISOString()),
    score,
    riskLevel,
    riesgoLabel: deriveRiskLabel(score, color, source.riesgoLabel || source.riesgo_label),
    color,
    bcraDisponible: Boolean(bcraDisponible),
    situacionVigente: source.situacionVigente !== undefined || source.situacion_vigente !== undefined ? toNumber(source.situacionVigente ?? source.situacion_vigente, 0) : null,
    peorSituacion24m: source.peorSituacion24m !== undefined || source.peor_situacion_24m !== undefined ? toNumber(source.peorSituacion24m ?? source.peor_situacion_24m, 0) : null,
    deudaVigente: toNumber(source.deudaVigente ?? source.total_deuda_vigente ?? source.deuda_vigente, 0),
    entidadPrincipal: toStringOrNull(source.entidadPrincipal || source.entidad_principal),
    tendencia6m: normalizeTendencia(source.tendencia6m || source.tendencia_6m),
    ultimoPeriodoActual: toStringOrNull(source.ultimoPeriodoActual || source.periodo_informado || source.ultimo_periodo_actual),
    estado: String(source.estado || source.estado_general || ''),
    mensaje: String(source.mensaje || source.alerta || source.mensaje_alerta || ''),
    actualRows,
    historicoRows,
    periodosHistoricosAgregados,
  };
}
