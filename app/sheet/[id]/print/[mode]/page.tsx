import { getSheet } from '@/lib/db';
import PrintClient from './PrintClient';

export default async function PrintPage({ params }: { params: { id: string; mode: string } }) {
  const sheet = getSheet(params.id);
  if (!sheet) {
    return <div className="p-4">Not found</div>;
  }
  const mode = params.mode === 'outsourcing' ? 'outsourcing' : 'shipping';
  return <PrintClient sheet={sheet} mode={mode} />;
}
