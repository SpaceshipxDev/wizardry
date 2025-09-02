import { getSheet } from '@/lib/db';
import PrintClient from './PrintClient';

export default async function PrintPage({ params }: { params: Promise<{ id: string; mode: string }> }) {
  const { id, mode: modeParam } = await params;
  const sheet = getSheet(id);
  if (!sheet) {
    return <div className="p-4">未找到</div>;
  }
  const mode = modeParam === 'outsourcing' ? 'outsourcing' : 'shipping';
  return <PrintClient sheet={sheet} mode={mode} />;
}
