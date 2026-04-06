export default function Pagination({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (nextPage: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="text-xs text-slate-500">
        Página <span className="font-medium text-slate-700">{page}</span> de{' '}
        <span className="font-medium text-slate-700">{totalPages}</span> — {total} registros
      </div>
      <div className="flex gap-2">
        <button
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-700 disabled:opacity-50"
          disabled={!canPrev}
          onClick={() => onChange(page - 1)}
        >
          Anterior
        </button>
        <button
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-700 disabled:opacity-50"
          disabled={!canNext}
          onClick={() => onChange(page + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

