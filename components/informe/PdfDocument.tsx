import type { InformeLocativoData } from '@/lib/mock-locativo';
import Page1 from './Page1';
import Page2 from './Page2';

interface Props {
  data: InformeLocativoData;
}

export default function PdfDocument({ data }: Props) {
  return (
    <main className="pdf-document">
      <Page1 data={data} />
      <Page2 data={data} />
    </main>
  );
}
