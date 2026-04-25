import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import PdfDocument from '@/components/informe/PdfDocument';
import { normalizeInformePayload } from '@/lib/normalize-informe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function buildHtml(req: NextRequest, rawPayload: unknown) {
  const data = normalizeInformePayload((rawPayload || {}) as Record<string, any>);
  const markup = renderToStaticMarkup(React.createElement(PdfDocument, { data }));
  const css = await readFile(join(process.cwd(), 'app/globals.css'), 'utf8');
  const origin = process.env.PDF_PUBLIC_ORIGIN || new URL(req.url).origin;

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <base href="${escapeHtml(origin)}" />
  <title>Informe locativo ${escapeHtml(data.documento || '')}</title>
  <style>${css}</style>
  <style>
    html, body { background: #fff !important; }
    .preview-shell { padding: 0 !important; }
    .page { margin: 0 !important; box-shadow: none !important; }
    .page + .page { margin-top: 0 !important; }
  </style>
</head>
<body>${markup}</body>
</html>`;
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

  const payload = (body as any)?.data || (body as any)?.informe || body;
  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ ok: false, error: 'Payload inválido' }, { status: 400 });
  }

  let browser: Awaited<ReturnType<typeof launchBrowser>> | null = null;

  try {
    const html = await buildHtml(req, payload);
    browser = await launchBrowser();
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.emulateMediaType('print');

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: false,
      preferCSSPageSize: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    });

    const normalized = normalizeInformePayload(payload as Record<string, any>);
    const fileName = `informe-locativo-${normalized.documento || 'inmorent'}.pdf`;

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: 'No se pudo generar el PDF', detail: error?.message || 'unknown error' },
      { status: 500 }
    );
  } finally {
    if (browser) await browser.close().catch(() => null);
  }
}
