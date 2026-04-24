import { MOCK_LOCATIVO } from '@/lib/mock-locativo';
import InformeLocativoTemplate from '@/components/informe/InformeLocativoTemplate';

export const metadata = {
  title: 'Informe Locativo — Demo · InmoRent',
};

export default function LocativoDemoPage() {
  return <InformeLocativoTemplate data={MOCK_LOCATIVO} />;
}