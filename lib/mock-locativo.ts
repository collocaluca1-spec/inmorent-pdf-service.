export type RiskLevel = 'bajo' | 'moderado' | 'alto' | 'sin_dato';

export interface BankRow {
  entidad: string;
  situacion: number;
  monto: number;
  diasAtraso: number;
  periodo: string;
}

export interface HistoricoRow {
  periodo: string;
  entidad: string;
  situacion: number;
  monto: number;
}

export interface PeriodoAgregado {
  periodo: string;
  montoTotal: number;
  maxSituacion: number;
}

export interface InformeLocativoData {
  documento: string;
  denominacion: string | null;
  tipo_persona: 'fisica' | 'empresa';
  fetchedAt: string;

  // Riesgo
  score: number;
  riskLevel: RiskLevel;
  riesgoLabel: string;
  color: 'emerald' | 'amber' | 'red' | 'slate';

  // BCRA
  bcraDisponible: boolean;
  situacionVigente: number | null;
  peorSituacion24m: number | null;
  deudaVigente: number;
  entidadPrincipal: string | null;
  tendencia6m: 'estable' | 'normalizada' | 'inestable';
  ultimoPeriodoActual: string | null;

  // Estado textual
  estado: string;
  mensaje: string;

  // Tablas
  actualRows: BankRow[];
  historicoRows: HistoricoRow[];
  periodosHistoricosAgregados: PeriodoAgregado[];
}

export const MOCK_LOCATIVO: InformeLocativoData = {
  documento: '20354678901',
  denominacion: 'GARCIA MARTIN ALEJANDRO',
  tipo_persona: 'fisica',
  fetchedAt: '2026-04-24T14:32:00.000Z',

  score: 82,
  riskLevel: 'bajo',
  riesgoLabel: 'Bajo riesgo',
  color: 'emerald',

  bcraDisponible: true,
  situacionVigente: 1,
  peorSituacion24m: 2,
  deudaVigente: 1850000,
  entidadPrincipal: 'BANCO NACION ARGENTINA',
  tendencia6m: 'estable',
  ultimoPeriodoActual: '202603',

  estado: 'Situación vigente 1 - Normal',
  mensaje:
    'Se mantiene en situación normal con leve antecedente histórico. Perfil aceptable para locación.',

  actualRows: [
    { entidad: 'BANCO NACION ARGENTINA', situacion: 1, monto: 1200000, diasAtraso: 0, periodo: '03/2026' },
    { entidad: 'BANCO GALICIA', situacion: 1, monto: 650000, diasAtraso: 0, periodo: '03/2026' },
  ],

  historicoRows: [
    { periodo: '04/2024', entidad: 'BANCO NACION ARGENTINA', situacion: 1, monto: 900000 },
    { periodo: '04/2024', entidad: 'BANCO GALICIA', situacion: 2, monto: 480000 },
    { periodo: '05/2024', entidad: 'BANCO NACION ARGENTINA', situacion: 1, monto: 920000 },
    { periodo: '05/2024', entidad: 'BANCO GALICIA', situacion: 2, monto: 500000 },
    { periodo: '06/2024', entidad: 'BANCO NACION ARGENTINA', situacion: 1, monto: 950000 },
    { periodo: '06/2024', entidad: 'BANCO GALICIA', situacion: 1, monto: 510000 },
    { periodo: '07/2024', entidad: 'BANCO NACION ARGENTINA', situacion: 1, monto: 970000 },
    { periodo: '07/2024', entidad: 'BANCO GALICIA', situacion: 1, monto: 530000 },
    { periodo: '08/2024', entidad: 'BANCO NACION ARGENTINA', situacion: 1, monto: 1000000 },
    { periodo: '08/2024', entidad: 'BANCO GALICIA', situacion: 1, monto: 560000 },
    { periodo: '09/2024', entidad: 'BANCO NACION ARGENTINA', situacion: 1, monto: 1050000 },
    { periodo: '09/2024', entidad: 'BANCO GALICIA', situacion: 1, monto: 580000 },
    { periodo: '10/2024', entidad: 'BANCO NACION ARGENTINA', situacion: 1, monto: 1080000 },
    { periodo: '10/2024', entidad: 'BANCO GALICIA', situacion: 1, monto: 600000 },
    { periodo: '11/2024', entidad: 'BANCO NACION ARGENTINA', situacion: 1, monto: 1100000 },
    { periodo: '11/2024', entidad: 'BANCO GALICIA', situacion: 1, monto: 610000 },
    { periodo: '12/2024', entidad: 'BANCO NACION ARGENTINA', situacion: 1, monto: 1120000 },
    { periodo: '12/2024', entidad: 'BANCO GALICIA', situacion: 1, monto: 620000 },
    { periodo: '01/2025', entidad: 'BANCO NACION ARGENTINA', situacion: 1, monto: 1150000 },
    { periodo: '01/2025', entidad: 'BANCO GALICIA', situacion: 1, monto: 630000 },
    { periodo: '02/2025', entidad: 'BANCO NACION ARGENTINA', situacion: 1, monto: 1180000 },
    { periodo: '02/2025', entidad: 'BANCO GALICIA', situacion: 1, monto: 640000 },
    { periodo: '03/2025', entidad: 'BANCO NACION ARGENTINA', situacion: 1, monto: 1200000 },
    { periodo: '03/2025', entidad: 'BANCO GALICIA', situacion: 1, monto: 650000 },
    { periodo: '04/2025', entidad: 'BANCO NACION ARGENTINA', situacion: 1, monto: 1220000 },
    { periodo: '04/2025', entidad: 'BANCO GALICIA', situacion: 1, monto: 650000 },
    { periodo: '05/2025', entidad: 'BANCO NACION ARGENTINA', situacion: 1, monto: 1230000 },
    { periodo: '05/2025', entidad: 'BANCO GALICIA', situacion: 1, monto: 650000 },
    { periodo: '06/2025', entidad: 'BANCO NACION ARGENTINA', situacion: 1, monto: 1240000 },
    { periodo: '06/2025', entidad: 'BANCO GALICIA', situacion: 1, monto: 650000 },
    { periodo: '07/2025', entidad: 'BANCO NACION ARGENTINA', situacion: 1, monto: 1250000 },
    { periodo: '07/2025', entidad: 'BANCO GALICIA', situacion: 1, monto: 650000 },
    { periodo: '08/2025', entidad: 'BANCO NACION ARGENTINA', situacion: 1, monto: 1260000 },
    { periodo: '08/2025', entidad: 'BANCO GALICIA', situacion: 1, monto: 650000 },
    { periodo: '09/2025', entidad: 'BANCO NACION ARGENTINA', situacion: 1, monto: 1270000 },
    { periodo: '09/2025', entidad: 'BANCO GALICIA', situacion: 1, monto: 650000 },
    { periodo: '10/2025', entidad: 'BANCO NACION ARGENTINA', situacion: 1, monto: 1280000 },
    { periodo: '10/2025', entidad: 'BANCO GALICIA', situacion: 1, monto: 650000 },
    { periodo: '11/2025', entidad: 'BANCO NACION ARGENTINA', situacion: 1, monto: 1290000 },
    { periodo: '11/2025', entidad: 'BANCO GALICIA', situacion: 1, monto: 650000 },
    { periodo: '12/2025', entidad: 'BANCO NACION ARGENTINA', situacion: 1, monto: 1300000 },
    { periodo: '12/2025', entidad: 'BANCO GALICIA', situacion: 1, monto: 650000 },
    { periodo: '01/2026', entidad: 'BANCO NACION ARGENTINA', situacion: 1, monto: 1180000 },
    { periodo: '01/2026', entidad: 'BANCO GALICIA', situacion: 1, monto: 650000 },
    { periodo: '02/2026', entidad: 'BANCO NACION ARGENTINA', situacion: 1, monto: 1200000 },
    { periodo: '02/2026', entidad: 'BANCO GALICIA', situacion: 1, monto: 650000 },
    { periodo: '03/2026', entidad: 'BANCO NACION ARGENTINA', situacion: 1, monto: 1200000 },
    { periodo: '03/2026', entidad: 'BANCO GALICIA', situacion: 1, monto: 650000 },
  ],

  periodosHistoricosAgregados: [
    { periodo: '04/2024', montoTotal: 1380000, maxSituacion: 2 },
    { periodo: '05/2024', montoTotal: 1420000, maxSituacion: 2 },
    { periodo: '06/2024', montoTotal: 1460000, maxSituacion: 1 },
    { periodo: '07/2024', montoTotal: 1500000, maxSituacion: 1 },
    { periodo: '08/2024', montoTotal: 1560000, maxSituacion: 1 },
    { periodo: '09/2024', montoTotal: 1630000, maxSituacion: 1 },
    { periodo: '10/2024', montoTotal: 1680000, maxSituacion: 1 },
    { periodo: '11/2024', montoTotal: 1710000, maxSituacion: 1 },
    { periodo: '12/2024', montoTotal: 1740000, maxSituacion: 1 },
    { periodo: '01/2025', montoTotal: 1780000, maxSituacion: 1 },
    { periodo: '02/2025', montoTotal: 1820000, maxSituacion: 1 },
    { periodo: '03/2025', montoTotal: 1850000, maxSituacion: 1 },
    { periodo: '04/2025', montoTotal: 1870000, maxSituacion: 1 },
    { periodo: '05/2025', montoTotal: 1880000, maxSituacion: 1 },
    { periodo: '06/2025', montoTotal: 1890000, maxSituacion: 1 },
    { periodo: '07/2025', montoTotal: 1900000, maxSituacion: 1 },
    { periodo: '08/2025', montoTotal: 1910000, maxSituacion: 1 },
    { periodo: '09/2025', montoTotal: 1920000, maxSituacion: 1 },
    { periodo: '10/2025', montoTotal: 1930000, maxSituacion: 1 },
    { periodo: '11/2025', montoTotal: 1940000, maxSituacion: 1 },
    { periodo: '12/2025', montoTotal: 1950000, maxSituacion: 1 },
    { periodo: '01/2026', montoTotal: 1830000, maxSituacion: 1 },
    { periodo: '02/2026', montoTotal: 1850000, maxSituacion: 1 },
    { periodo: '03/2026', montoTotal: 1850000, maxSituacion: 1 },
  ],
};