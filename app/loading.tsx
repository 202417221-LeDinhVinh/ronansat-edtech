export default function AppLoading() {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-paper-bg px-6 py-12 text-ink-fg">
      <section className="w-full max-w-md rounded-3xl border-2 border-ink-fg bg-surface-white px-8 py-10 text-center brutal-shadow">
        <div className="inline-flex rounded-full border-2 border-ink-fg bg-primary px-4 py-1 text-xs font-bold uppercase tracking-[0.18em]">
          Ronan SAT
        </div>
        <h1 className="mt-5 font-display text-3xl font-black uppercase tracking-tight">
          Loading
        </h1>
        <div className="mx-auto mt-5 h-2 w-40 overflow-hidden rounded-full border-2 border-ink-fg bg-paper-bg">
          <div className="h-full w-1/2 animate-pulse bg-primary" />
        </div>
      </section>
    </div>
  );
}
