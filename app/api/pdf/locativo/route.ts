import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { MOCK_LOCATIVO, type InformeLocativoData, type BankRow, type HistoricoRow } from '@/lib/mock-locativo';
import { normalizeInformePayload } from '@/lib/normalize-informe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type ChartSlice = { label: string; value: number; color: string };
type Point = { x: number; y: number };

const BRAND = '#F36B21';
const BRAND_DARK = '#D84E13';
const INK = '#1C1C1E';
const MUTED = '#6E6E73';
const BORDER = '#E7E4DE';
const WARM = '#F7F6F3';
const GREEN = '#22A366';
const AMBER = '#D99513';
const RED = '#C93A32';
const BLUE = '#5B5CE2';
const PURPLE = '#7C5CF5';
const PALETTE = [BRAND, BLUE, GREEN, AMBER, PURPLE, '#4E7DD8', '#2E7D74'];

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateOnly(value: string): string {
  return new Date(value).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatPeriod(value: string | null): string {
  const raw = String(value || '');
  if (/^\d{6}$/.test(raw)) return `${raw.slice(4, 6)}/${raw.slice(0, 4)}`;
  return raw || '-';
}

function riskColor(data: InformeLocativoData): string {
  if (data.color === 'emerald' || data.riskLevel === 'bajo') return GREEN;
  if (data.color === 'red' || data.riskLevel === 'alto') return RED;
  if (data.color === 'slate' || data.riskLevel === 'sin_dato') return MUTED;
  return AMBER;
}

function compactBankName(name: string | null | undefined): string {
  const raw = String(name || '').trim();
  return raw
    .replace(/BANCO DE /gi, 'BANCO ')
    .replace(/ Y BUENOS AIRES S\.A\./gi, '')
    .replace(/ ARGENTINA S\.A\./gi, '')
    .replace(/ S\.A\./gi, '')
    .trim();
}

function aggregateCurrentByBank(rows: BankRow[]): ChartSlice[] {
  const map = new Map<string, number>();
  rows.forEach((row) => map.set(compactBankName(row.entidad), (map.get(compactBankName(row.entidad)) || 0) + (row.monto || 0)));
  return Array.from(map.entries()).filter(([, value]) => value > 0).map(([label, value], idx) => ({ label, value, color: PALETTE[idx % PALETTE.length] }));
}

function aggregateCurrentBySituation(rows: BankRow[]): ChartSlice[] {
  const map = new Map<string, number>();
  rows.forEach((row) => {
    const label = `Sit. ${row.situacion || '-'}`;
    map.set(label, (map.get(label) || 0) + (row.monto || 0));
  });
  return Array.from(map.entries()).filter(([, value]) => value > 0).map(([label, value]) => {
    const n = Number(label.replace(/\D/g, ''));
    const color = n <= 1 ? GREEN : n <= 3 ? AMBER : RED;
    return { label, value, color };
  });
}

function aggregateHistoricalByEntity(rows: HistoricoRow[]): { entidad: string; montoTotal: number; periodos: number; maxSituacion: number }[] {
  const map = new Map<string, { entidad: string; montoTotal: number; periodos: Set<string>; maxSituacion: number }>();
  rows.forEach((row) => {
    const key = compactBankName(row.entidad);
    const current = map.get(key) || { entidad: key, montoTotal: 0, periodos: new Set<string>(), maxSituacion: 0 };
    current.montoTotal += row.monto || 0;
    current.periodos.add(row.periodo);
    current.maxSituacion = Math.max(current.maxSituacion, row.situacion || 0);
    map.set(key, current);
  });
  return Array.from(map.values()).map((row) => ({
    entidad: row.entidad,
    montoTotal: row.montoTotal,
    periodos: row.periodos.size,
    maxSituacion: row.maxSituacion,
  }));
}

function donutSvg(slices: ChartSlice[], size = 142, stroke = 28): string {
  const total = slices.reduce((sum, s) => sum + s.value, 0) || 1;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const circles = slices.map((slice) => {
    const portion = slice.value / total;
    const dash = portion * circumference;
    const currentOffset = offset;
    offset += dash;
    return `<circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke="${slice.color}" stroke-width="${stroke}" stroke-dasharray="${dash} ${circumference - dash}" stroke-dashoffset="${-currentOffset}" transform="rotate(-90 ${size / 2} ${size / 2})" />`;
  }).join('');
  return `<svg class="donut-svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke="#EFECE7" stroke-width="${stroke}" />
    ${circles}
  </svg>`;
}

function scoreGauge(data: InformeLocativoData): string {
  const score = Math.max(0, Math.min(100, data.score || 0));
  const color = riskColor(data);
  const size = 138;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;
  return `<div class="score-box">
    <div class="section-label center">Indicador bancario</div>
    <div class="score-wrap">
      <svg class="score-svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke="#ECE8E0" stroke-width="${stroke}" />
        <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${dash} ${circumference - dash}" transform="rotate(-210 ${size / 2} ${size / 2})" />
      </svg>
      <div class="score-center"><strong>${score}</strong><span>/100</span></div>
    </div>
    <div class="score-label" style="color:${color}">${escapeHtml(data.riesgoLabel)}</div>
  </div>`;
}

function barChart(data: InformeLocativoData): string {
  const rows = data.periodosHistoricosAgregados || [];
  const max = Math.max(...rows.map((r) => r.montoTotal || 0), 1);
  const width = 700;
  const height = 190;
  const padL = 52;
  const padR = 10;
  const padT = 18;
  const padB = 38;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const barW = Math.max(6, innerW / Math.max(rows.length, 1) - 5);
  const bars = rows.map((r, i) => {
    const x = padL + i * (innerW / Math.max(rows.length, 1)) + 2;
    const h = ((r.montoTotal || 0) / max) * innerH;
    const y = padT + innerH - h;
    const label = rows.length > 15 && i % 2 !== 0 ? '' : r.periodo;
    return `<rect x="${x}" y="${y}" width="${barW}" height="${Math.max(h, 2)}" rx="4" fill="${BRAND}" />
      ${label ? `<text x="${x}" y="${height - 12}" transform="rotate(-38 ${x} ${height - 12})" font-size="8" fill="#8C8780">${escapeHtml(label)}</text>` : ''}`;
  }).join('');
  const grid = [0, 0.33, 0.66, 1].map((p) => {
    const y = padT + innerH - p * innerH;
    const value = max * p;
    return `<line x1="${padL}" y1="${y}" x2="${width - padR}" y2="${y}" stroke="#EEEAE4" stroke-dasharray="4 4" />
      <text x="8" y="${y + 4}" font-size="9" fill="#8C8780">${value >= 1000000 ? `$${(value / 1000000).toFixed(1)}M` : `$${Math.round(value / 1000)}k`}</text>`;
  }).join('');
  return `<svg width="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">${grid}${bars}</svg>`;
}

function lineChart(data: InformeLocativoData): string {
  const rows = data.historicoRows || [];
  const entities = Array.from(new Set(rows.map((r) => compactBankName(r.entidad))));
  const periods = Array.from(new Set(rows.map((r) => r.periodo)));
  const width = 700;
  const height = 190;
  const padL = 52;
  const padR = 14;
  const padT = 18;
  const padB = 38;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const max = Math.max(...rows.map((r) => r.monto || 0), 1);
  const pointFor = (period: string, value: number): Point => {
    const idx = periods.indexOf(period);
    const x = padL + (idx / Math.max(periods.length - 1, 1)) * innerW;
    const y = padT + innerH - (value / max) * innerH;
    return { x, y };
  };
  const grid = [0, 0.33, 0.66, 1].map((p) => {
    const y = padT + innerH - p * innerH;
    const value = max * p;
    return `<line x1="${padL}" y1="${y}" x2="${width - padR}" y2="${y}" stroke="#EEEAE4" stroke-dasharray="4 4" />
      <text x="8" y="${y + 4}" font-size="9" fill="#8C8780">${value >= 1000000 ? `$${(value / 1000000).toFixed(1)}M` : `$${Math.round(value / 1000)}k`}</text>`;
  }).join('');
  const labels = periods.filter((_, i) => periods.length <= 12 || i % 2 === 0).map((period) => {
    const p = pointFor(period, 0);
    return `<text x="${p.x}" y="${height - 16}" transform="rotate(-34 ${p.x} ${height - 16})" font-size="8" fill="#8C8780">${escapeHtml(period)}</text>`;
  }).join('');
  const lines = entities.map((entity, eidx) => {
    const color = eidx === 0 ? BRAND : PALETTE[(eidx + 1) % PALETTE.length];
    const points = periods.map((period) => {
      const row = rows.find((r) => compactBankName(r.entidad) === entity && r.periodo === period);
      return pointFor(period, row?.monto || 0);
    });
    const path = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const dots = points.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="2" fill="#fff" stroke="${color}" stroke-width="1.6" />`).join('');
    return `<path d="${path}" fill="none" stroke="${color}" stroke-width="2.6" />${dots}`;
  }).join('');
  const legend = entities.map((entity, idx) => `<span><i style="background:${idx === 0 ? BRAND : PALETTE[(idx + 1) % PALETTE.length]}"></i>${escapeHtml(entity)}</span>`).join('');
  return `<div>${`<svg width="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">${grid}${lines}${labels}</svg>`}<div class="chart-legend">${legend}</div></div>`;
}

function tableRows(rows: BankRow[]): string {
  if (!rows.length) return `<tr><td colspan="4" class="empty">Sin datos vigentes disponibles.</td></tr>`;
  return rows.map((row) => `<tr>
    <td>${escapeHtml(row.entidad)}</td>
    <td>${escapeHtml(row.situacion || '-')}</td>
    <td>${formatMoney(row.monto)}</td>
    <td>${row.diasAtraso ? escapeHtml(row.diasAtraso) : '—'}</td>
  </tr>`).join('');
}

async function logoDataUri(): Promise<string> {
  try {
    const file = await readFile(join(process.cwd(), 'public/inmorent-logo.png'));
    return `data:image/png;base64,${file.toString('base64')}`;
  } catch {
    return '';
  }
}

function distributionBlock(title: string, slices: ChartSlice[]): string {
  const total = slices.reduce((s, v) => s + v.value, 0) || 1;
  const legend = slices.map((s) => `<div class="legend-row"><span><i style="background:${s.color}"></i>${escapeHtml(s.label)}</span><strong>${((s.value / total) * 100).toFixed(1)}%</strong></div>`).join('');
  return `<div class="mini-card"><h4>${escapeHtml(title)}</h4><div class="donut-row">${donutSvg(slices.length ? slices : [{ label: 'Sin datos', value: 1, color: '#DDD7CE' }])}<div class="legend-list">${legend}</div></div></div>`;
}

function historicalEntitiesTable(data: InformeLocativoData): string {
  const rows = aggregateHistoricalByEntity(data.historicoRows);
  if (!rows.length) return '';
  return `<section class="section"><h3>Entidades con exposición histórica</h3><table><thead><tr><th>Entidad</th><th>Monto total hist.</th><th>Períodos</th><th>Sit. máx.</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${escapeHtml(r.entidad)}</td><td>${formatMoney(r.montoTotal)}</td><td>${r.periodos}</td><td class="sit">${r.maxSituacion || '-'}</td></tr>`).join('')}</tbody></table></section>`;
}

async function buildHtml(data: InformeLocativoData): Promise<string> {
  const logo = await logoDataUri();
  const color = riskColor(data);
  const bankSlices = aggregateCurrentByBank(data.actualRows);
  const situationSlices = aggregateCurrentBySituation(data.actualRows);
  const generatedAt = formatDateTime(data.fetchedAt || new Date().toISOString());
  const nombre = data.denominacion || 'Sin denominación';
  const css = `
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #fff; color: ${INK}; font-family: Inter, Arial, sans-serif; }
    .pdf-page { width: 210mm; min-height: 297mm; padding: 13mm 14mm 11mm; page-break-after: always; position: relative; background: #fff; }
    .pdf-page:last-child { page-break-after: auto; }
    .top-line { height: 5px; background: linear-gradient(90deg, ${BRAND}, #FF9B4F); border-radius: 999px; margin-bottom: 13px; }
    .brand-head { display: grid; grid-template-columns: 1fr auto; gap: 16px; align-items: start; border-bottom: 1px solid ${BORDER}; padding-bottom: 13px; }
    .brand { display: flex; gap: 11px; align-items: center; margin-bottom: 11px; }
    .brand img { width: 34px; height: 34px; border-radius: 9px; background: ${INK}; object-fit: contain; }
    .brand strong { display:block; font-size: 16px; letter-spacing: -0.02em; }
    .brand span { display:block; color: ${MUTED}; font-size: 10px; margin-top: 1px; }
    .doc-title { color: ${MUTED}; font-weight: 800; text-transform: uppercase; letter-spacing: .13em; font-size: 9px; }
    .name { font-size: 24px; line-height: 1.05; font-weight: 850; letter-spacing: -0.04em; margin-top: 5px; }
    .idline { color: ${MUTED}; font-size: 10.5px; margin-top: 5px; }
    .badge-stack { display:flex; flex-direction:column; gap: 7px; min-width: 150px; }
    .badge { border: 1px solid ${BORDER}; border-radius: 999px; padding: 6px 12px; font-size: 11px; font-weight: 800; text-align:center; white-space:nowrap; background:#fff; }
    .badge.risk { border-color: ${color}55; color: ${color}; background: ${color}12; }
    .badge.bcra { color: #2E4057; background: #F4F7FA; }
    .kpis { display:grid; grid-template-columns: repeat(4,1fr); border: 1px solid ${BORDER}; border-radius: 14px; overflow:hidden; margin: 13px 0; }
    .kpi { padding: 11px 12px; border-right: 1px solid ${BORDER}; min-height: 66px; }
    .kpi:last-child { border-right: 0; }
    .label { color: ${MUTED}; text-transform:uppercase; letter-spacing:.10em; font-size: 8.5px; font-weight:800; }
    .value { font-size: 22px; font-weight: 850; line-height: 1.15; margin-top: 5px; letter-spacing:-.03em; }
    .sub { font-size: 9.5px; color:${MUTED}; margin-top: 2px; }
    .page1-grid { display:grid; grid-template-columns: 48mm 1fr; gap: 12px; align-items: stretch; }
    .panel { border: 1px solid ${BORDER}; border-radius: 15px; padding: 12px; background:#fff; }
    .score-box { height: 100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap: 6px; }
    .section-label { color:#918C84; font-size:8.5px; text-transform:uppercase; letter-spacing:.12em; font-weight:850; margin-bottom:8px; }
    .section-label.center { text-align:center; }
    .score-wrap { position:relative; width:138px; height:138px; }
    .score-svg { display:block; }
    .score-center { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
    .score-center strong { font-size:32px; color:${color}; line-height:1; }
    .score-center span { color:${MUTED}; font-size:10px; margin-top:2px; }
    .score-label { font-size:12px; font-weight:850; margin-top:3px; }
    .info-grid { display:grid; grid-template-columns: repeat(3, 1fr); gap: 10px 14px; }
    .field small { display:block; color:${MUTED}; font-size:9px; margin-bottom:3px; }
    .field b { font-size:12px; line-height:1.2; }
    .summary { display:grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 10px; }
    .summary-card { background:${WARM}; border-radius: 10px; padding: 8px 9px; min-height: 48px; }
    .summary-card small { display:block; color:${MUTED}; font-size:8.5px; text-transform:uppercase; letter-spacing:.08em; font-weight:800; }
    .summary-card b { display:block; margin-top:4px; font-size:12px; line-height:1.12; }
    .alert { border:1px solid #F5C65D; background:#FFF9E8; color:#7C4F08; border-radius:12px; padding:9px 11px; font-size:10.5px; line-height:1.45; margin: 12px 0; }
    .section { margin-top: 12px; }
    h3 { font-size:10.5px; text-transform:uppercase; letter-spacing:.11em; margin:0 0 8px; color:${MUTED}; }
    table { width:100%; border-collapse: separate; border-spacing:0; border:1px solid ${BORDER}; border-radius:12px; overflow:hidden; font-size:10.2px; }
    thead th { background:${WARM}; color:#544E47; text-align:left; padding:8px 9px; font-weight:850; }
    tbody td { padding:8px 9px; border-top:1px solid ${BORDER}; }
    .page-head { display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid ${BORDER}; padding-bottom:12px; margin-bottom:13px; }
    .mini-brand { display:flex; gap:8px; align-items:center; }
    .mini-brand img { width:30px; height:30px; border-radius:8px; background:${INK}; }
    .mini-brand strong { display:block; font-size:13px; }
    .mini-brand span { display:block; color:${MUTED}; font-size:9px; }
    .dist-grid { display:grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom:12px; }
    .mini-card, .chart-card { border:1px solid ${BORDER}; border-radius:16px; background:#fff; padding:13px; }
    .mini-card h4, .chart-card h4 { margin:0 0 10px; font-size:10px; text-transform:uppercase; letter-spacing:.1em; color:#706A62; }
    .donut-row { display:flex; align-items:center; gap:14px; }
    .legend-list { flex:1; }
    .legend-row { display:flex; align-items:center; justify-content:space-between; gap:10px; font-size:10.5px; margin: 7px 0; }
    .legend-row span { display:flex; align-items:center; gap:7px; font-weight:750; }
    .legend-row i, .chart-legend i { width:9px; height:9px; border-radius:99px; display:inline-block; }
    .chart-card { margin-top:12px; }
    .chart-card.large { padding: 14px 15px; }
    .chart-legend { display:flex; gap:16px; justify-content:center; font-size:9.5px; color:${MUTED}; margin-top:3px; flex-wrap:wrap; }
    .chart-legend span { display:flex; align-items:center; gap:5px; }
    .sources { margin-top:12px; border:1px solid ${BORDER}; border-radius:14px; background:#fff; padding:11px 13px; font-size:9.5px; line-height:1.48; }
    .sources b { color:${INK}; }
    .sources ol { margin:6px 0 0 18px; padding:0; }
    .footer { position:absolute; left:14mm; right:14mm; bottom:7mm; display:flex; justify-content:space-between; border-top:1px solid ${BORDER}; padding-top:6px; color:#9B968F; font-size:8.5px; }
    .empty { text-align:center; color:${MUTED}; }
    .analysis-page { padding-top: 10mm; padding-bottom: 9mm; }
    .analysis-page .page-head { padding-bottom: 9px; margin-bottom: 9px; }
    .analysis-page .dist-grid { gap: 10px; margin-bottom: 8px; }
    .analysis-page .mini-card, .analysis-page .chart-card { padding: 10px 12px; border-radius: 14px; }
    .analysis-page .mini-card h4, .analysis-page .chart-card h4 { margin-bottom: 6px; font-size: 9.5px; }
    .analysis-page .donut-row { gap: 10px; }
    .analysis-page .donut-svg { width: 116px; height: 116px; }
    .analysis-page .legend-row { margin: 5px 0; font-size: 9.8px; }
    .analysis-page .chart-card { margin-top: 8px; }
    .analysis-page .chart-card.large { padding: 10px 12px; }
    .analysis-page .chart-legend { margin-top: 1px; font-size: 8.8px; }
    .analysis-page .section { margin-top: 8px; }
    .analysis-page table { font-size: 9.4px; }
    .analysis-page thead th { padding: 6px 8px; }
    .analysis-page tbody td { padding: 6px 8px; }
    .analysis-page .sources { margin-top: 8px; padding: 8px 10px; font-size: 8.7px; line-height: 1.34; border-radius: 12px; }
    .analysis-page .sources h3 { margin-bottom: 5px; }
    .analysis-page .sources p { margin: 0; }
    .analysis-page .sources ol { margin: 4px 0 0 16px; }
  `;

  return `<!doctype html><html lang="es"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Informe locativo ${escapeHtml(data.documento)}</title><style>${css}</style></head><body>
    <section class="pdf-page">
      <div class="top-line"></div>
      <header class="brand-head">
        <div>
          <div class="brand">${logo ? `<img src="${logo}" alt="InmoRent" />` : ''}<div><strong>InmoRent</strong><span>Informe comercial locativo</span></div></div>
          <div class="doc-title">Informe locativo</div>
          <div class="name">${escapeHtml(nombre)}</div>
          <div class="idline">${escapeHtml(data.documento)} · ${data.tipo_persona === 'empresa' ? 'Empresa' : 'Persona física'} · Consultado el ${escapeHtml(generatedAt)}</div>
        </div>
        <div class="badge-stack"><div class="badge risk">● ${escapeHtml(data.riesgoLabel)}</div><div class="badge bcra">✓ ${data.bcraDisponible ? 'BCRA disponible' : 'BCRA no disponible'}</div></div>
      </header>
      <div class="kpis">
        <div class="kpi"><div class="label">Deuda vigente</div><div class="value" style="color:${color}">${formatMoney(data.deudaVigente)}</div><div class="sub">período actual</div></div>
        <div class="kpi"><div class="label">Situación vigente</div><div class="value" style="color:${color}">Sit. ${escapeHtml(data.situacionVigente ?? '-')}</div><div class="sub">período actual</div></div>
        <div class="kpi"><div class="label">Peor sit. 24 meses</div><div class="value">Sit. ${escapeHtml(data.peorSituacion24m ?? '-')}</div><div class="sub">histórico</div></div>
        <div class="kpi"><div class="label">Última consulta</div><div class="value">${escapeHtml(formatDateOnly(data.fetchedAt))}</div><div class="sub">${escapeHtml(generatedAt.split(',')[1]?.trim() || '')}</div></div>
      </div>
      <div class="page1-grid">
        <div class="panel">${scoreGauge(data)}</div>
        <div class="panel">
          <h3>Perfil del consultado</h3>
          <div class="info-grid">
            <div class="field"><small>Identificación</small><b>${escapeHtml(data.documento)}</b></div>
            <div class="field"><small>Tipo</small><b>${data.tipo_persona === 'empresa' ? 'Empresa' : 'Persona física'}</b></div>
            <div class="field"><small>Estado BCRA</small><b>${data.bcraDisponible ? 'Disponible' : 'Sin respuesta'}</b></div>
            <div class="field"><small>Denominación</small><b>${escapeHtml(nombre)}</b></div>
            <div class="field"><small>Consulta</small><b>${escapeHtml(generatedAt)}</b></div>
          </div>
          <div class="section" style="margin-top:13px"><h3>Resumen BCRA</h3><div class="summary">
            <div class="summary-card"><small>Situación vigente</small><b style="color:${color}">Situación ${escapeHtml(data.situacionVigente ?? '-')}</b></div>
            <div class="summary-card"><small>Peor situación 24m</small><b>Situación ${escapeHtml(data.peorSituacion24m ?? '-')}</b></div>
            <div class="summary-card"><small>Entidad principal</small><b>${escapeHtml(compactBankName(data.entidadPrincipal))}</b></div>
            <div class="summary-card"><small>Período informado</small><b>${escapeHtml(formatPeriod(data.ultimoPeriodoActual))}</b></div>
            <div class="summary-card"><small>Total deuda vigente</small><b style="color:${color}">${formatMoney(data.deudaVigente)}</b></div>
            <div class="summary-card"><small>Tendencia 6 meses</small><b>${data.tendencia6m === 'estable' ? '✓ Estable' : data.tendencia6m === 'normalizada' ? '↗ Normalizada' : 'Inestable'}</b></div>
          </div></div>
        </div>
      </div>
      ${data.mensaje ? `<div class="alert">${escapeHtml(data.mensaje)}</div>` : ''}
      <section class="section"><h3>Último informe bancario</h3><table><thead><tr><th>Entidad</th><th>Situación</th><th>Monto</th><th>Días atraso</th></tr></thead><tbody>${tableRows(data.actualRows)}</tbody></table></section>
      <div class="footer"><span>InmoRent · Informe Comercial Locativo</span><span>Información orientativa · ${escapeHtml(generatedAt)}</span><span>1 / 2</span></div>
    </section>
    <section class="pdf-page analysis-page">
      <header class="page-head"><div class="mini-brand">${logo ? `<img src="${logo}" alt="InmoRent" />` : ''}<div><strong>InmoRent</strong><span>Análisis histórico BCRA</span></div></div><strong>${escapeHtml(data.documento)} · ${escapeHtml(nombre)}</strong></header>
      <h3>Distribución actual</h3>
      <div class="dist-grid">${distributionBlock('Último informe por banco', bankSlices)}${distributionBlock('Último informe por situación', situationSlices)}</div>
      <div class="chart-card large"><h4>Últimos 24 meses — deuda total</h4>${barChart(data)}</div>
      <div class="chart-card large"><h4>Últimos 24 meses por entidad</h4>${lineChart(data)}</div>
      ${historicalEntitiesTable(data)}
      <div class="sources"><h3>Fuentes y advertencias</h3><p><b>Fuentes consultadas:</b> BCRA Central de Deudores · Datos públicos disponibles al momento de la consulta.</p><ol><li>La información contenida en este informe es de carácter orientativo y debe ser validada antes de tomar cualquier decisión.</li><li>Si una fuente pública no devuelve identificación suficiente, la coincidencia debe verificarse manualmente.</li><li>El BCRA informa saldos y situación por entidad y período, pero no identifica el tipo de producto.</li><li>El indicador bancario es calculado internamente por InmoRent y no constituye una calificación crediticia oficial.</li></ol></div>
      <div class="footer"><span>InmoRent · Informe Comercial Locativo</span><span>Información orientativa — generada el ${escapeHtml(generatedAt)}</span><span>2 / 2</span></div>
    </section>
  </body></html>`;
}

async function launchBrowser() {
  return puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  });
}

async function createPdf(data: InformeLocativoData): Promise<Blob> {
  let browser: Awaited<ReturnType<typeof launchBrowser>> | null = null;
  try {
    const html = await buildHtml(data);
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.emulateMediaType('print');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: false,
      preferCSSPageSize: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    });
    return new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' });
  } finally {
    if (browser) await browser.close().catch(() => null);
  }
}

export async function GET() {
  try {
    const pdf = await createPdf(MOCK_LOCATIVO);
    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="informe-locativo-demo.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json({ ok: false, error: 'No se pudo generar el PDF demo', detail: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const expectedSecret = process.env.PDF_API_SECRET;
  const receivedSecret = req.headers.get('X-InmoRent-PDF-Secret');
  if (expectedSecret && receivedSecret !== expectedSecret) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Payload inválido' }, { status: 400 });
  }

  const payload = (body as { data?: unknown; informe?: unknown })?.data || (body as { informe?: unknown })?.informe || body;
  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ ok: false, error: 'Payload inválido' }, { status: 400 });
  }

  try {
    const data = normalizeInformePayload(payload as Record<string, unknown>);
    const pdf = await createPdf(data);
    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="informe-locativo-${escapeHtml(data.documento || 'inmorent')}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json({ ok: false, error: 'No se pudo generar el PDF', detail: message }, { status: 500 });
  }
}
