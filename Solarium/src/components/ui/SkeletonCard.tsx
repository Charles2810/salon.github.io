export default function SkeletonCard() {
  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-100 animate-pulse">
      <div className="h-12 w-12 bg-slate-200 rounded-full mb-4" />
      <div className="h-6 bg-slate-200 rounded w-3/4 mb-3" />
      <div className="h-4 bg-slate-200 rounded w-full mb-2" />
      <div className="h-4 bg-slate-200 rounded w-5/6 mb-6" />
      <div className="h-8 bg-slate-200 rounded w-1/3" />
    </div>
  );
}
