"use client";

export const STAGES: string[] = [
  '待生产',
  '分析',
  '编程',
  '操机',
  '手工',
  '表面处理',
  '检验',
  '已出货',
];

export default function StageDots({
  currentStage,
  stages = STAGES,
  size = 6,
  title,
}: {
  currentStage?: string | null;
  stages?: string[];
  size?: number; // dot diameter in px
  title?: string;
}) {
  const idx = currentStage ? stages.indexOf(currentStage) : -1;
  const d = Math.max(2, Math.min(12, Math.round(size)));
  return (
    <div className="flex items-center gap-1.5" aria-label={title || '进度'}>
      {stages.map((s, i) => (
        <span
          key={s}
          className={`${i <= idx ? 'bg-zinc-900' : 'bg-zinc-300'} rounded-full`}
          style={{ width: d, height: d }}
          title={s}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

