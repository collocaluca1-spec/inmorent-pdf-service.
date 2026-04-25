'use client';

import type { InformeLocativoData } from '@/lib/mock-locativo';
import Page1 from './Page1';
import Page2 from './Page2';

interface Props {
  data: InformeLocativoData;
}

export default function InformeLocativoTemplate({ data }: Props) {
  return (
    <div className="preview-shell">
      <div className="preview-toolbar no-print">
        <h1>InmoRent · PDF Service</h1>
        <button className="print-btn" onClick={() => window.print()}>
          Imprimir / Guardar PDF
        </button>
      </div>
      <Page1 data={data} />
      <Page2 data={data} />
    </div>
  );
}
