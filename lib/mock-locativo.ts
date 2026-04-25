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
  score: number;
  riskLevel: RiskLevel;
  riesgoLabel: string;
  color: 'emerald' | 'amber' | 'red' | 'slate';
  bcraDisponible: boolean;
  situacionVigente: number | null;
  peorSituacion24m: number | null;
  deudaVigente: number;
  entidadPrincipal: string | null;
  tendencia6m: 'estable' | 'normalizada' | 'inestable';
  ultimoPeriodoActual: string | null;
  estado: string;
  mensaje: string;
  actualRows: BankRow[];
  historicoRows: HistoricoRow[];
  periodosHistoricosAgregados: PeriodoAgregado[];
}

const periods = [
  '03/2024', '04/2024', '05/2024', '06/2024', '07/2024', '08/2024',
  '09/2024', '10/2024', '11/2024', '12/2024', '01/2025', '02/2025',
  '03/2025', '04/2025', '05/2025', '06/2025', '07/2025', '08/2025',
  '09/2025', '10/2025', '11/2025', '12/2025', '01/2026', '02/2026',
];

const amounts = [
  2380, 2100, 1760, 1450, 2120, 2480, 1980, 1120, 1820, 2110, 2120, 2850,
  2810, 2700, 2000, 2110, 2760, 3180, 3220, 5330, 3200, 2440, 2700, 4168,
];

const situations = periods.map((_, i) => (i === 18 ? 5 : 1));

export const MOCK_LOCATIVO: InformeLocativoData = {
  documento: '27217877550',
  denominacion: 'CARABELLI MARIA JOSE',
  tipo_persona: 'fisica',
  fetchedAt: '2026-04-24T07:55:00.000Z',
  score: 65,
  riskLevel: 'moderado',
  riesgoLabel: 'Revisión manual',
  color: 'amber',
  bcraDisponible: true,
  situacionVigente: 1,
  peorSituacion24m: 5,
  deudaVigente: 4168,
  entidadPrincipal: 'BANCO SANTANDER ARGENTINA S.A.',
  tendencia6m: 'normalizada',
  ultimoPeriodoActual: '202602',
  estado: 'Situación vigente 1 - Normal',
  mensaje:
    'Actualmente figura en situación normal, pero registra un antecedente histórico severo en los últimos 24 meses. Requiere revisión manual.',
  actualRows: [
    { entidad: 'BANCO SANTANDER ARGENTINA S.A.', situacion: 1, monto: 4168, diasAtraso: 0, periodo: '02/2026' },
  ],
  historicoRows: periods.map((periodo, i) => ({
    periodo,
    entidad: 'BANCO SANTANDER ARGENTINA S.A.',
    situacion: situations[i],
    monto: amounts[i],
  })),
  periodosHistoricosAgregados: periods.map((periodo, i) => ({
    periodo,
    montoTotal: amounts[i],
    maxSituacion: situations[i],
  })),
};
