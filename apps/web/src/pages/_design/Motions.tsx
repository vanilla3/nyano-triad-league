import React from "react";

type VfxTier = "off" | "low" | "medium" | "high";

function useVfxPreview(initial: VfxTier) {
  React.useEffect(() => {
    const root = document.documentElement;
    const prev = (root.dataset.vfx as VfxTier | undefined) ?? "high";
    root.dataset.vfx = initial;
    return () => {
      root.dataset.vfx = prev;
    };
  }, [initial]);
}

function Section(props: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="card motion-card">
      <div className="card-hd">
        <h2 className="text-base font-semibold text-slate-900">{props.title}</h2>
        <p className="mt-1 text-xs text-slate-500">{props.subtitle}</p>
      </div>
      <div className="card-bd">{props.children}</div>
    </section>
  );
}

export function MotionsDesignPage() {
  const [vfx, setVfx] = React.useState<VfxTier>("high");
  const [popSeed, setPopSeed] = React.useState(0);
  const [impactSeed, setImpactSeed] = React.useState(0);
  const [placeSeed, setPlaceSeed] = React.useState(0);
  const [flipSeed, setFlipSeed] = React.useState(0);

  useVfxPreview(vfx);

  return (
    <div className="container-page grid gap-4">
      <header className="card motion-card">
        <div className="card-hd">
          <h1 className="text-lg font-semibold text-slate-900">Motion Language v1 Showcase</h1>
          <p className="mt-1 text-xs text-slate-500">
            WO-011 validation page. Try hover/click and switch VFX tiers.
          </p>
        </div>
        <div className="card-bd grid gap-3">
          <div className="flex flex-wrap gap-2">
            {(["off", "low", "medium", "high"] as const).map((tier) => (
              <button
                key={tier}
                type="button"
                className={["btn motion-press motion-hover-lift", vfx === tier ? "btn-primary" : ""].join(" ")}
                onClick={() => setVfx(tier)}
              >
                data-vfx={tier}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-600">
            Current: <span className="font-mono">{vfx}</span>
          </p>
        </div>
      </header>

      <Section title="MOT-01 / 02" subtitle="Press feedback + hover lift on primary controls">
        <div className="flex flex-wrap gap-3">
          <button type="button" className="btn btn-primary motion-press motion-hover-lift">
            Press me
          </button>
          <button type="button" className="btn motion-press motion-hover-lift">
            Secondary
          </button>
        </div>
      </Section>

      <Section title="MOT-03" subtitle="Magnet hover for selectable board-like targets">
        <div className="grid max-w-sm grid-cols-3 gap-2">
          {Array.from({ length: 6 }, (_, index) => (
            <button
              key={index}
              type="button"
              className="motion-cell motion-cell--interactive motion-magnet rounded-xl border border-sky-200 bg-sky-50 px-3 py-5 text-xs text-sky-700"
            >
              Cell {index + 1}
            </button>
          ))}
        </div>
      </Section>

      <Section title="MOT-04 / 06" subtitle="Pop-in and slide-in for modal and panel entries">
        <div className="flex flex-wrap items-start gap-3">
          <button type="button" className="btn motion-press" onClick={() => setPopSeed((v) => v + 1)}>
            Replay pop
          </button>
          <button type="button" className="btn motion-press" onClick={() => setImpactSeed((v) => v + 1)}>
            Replay slide
          </button>
          <div key={`pop-${popSeed}`} className="motion-pop-in rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
            Pop-in panel
          </div>
          <div key={`slide-${impactSeed}`} className="motion-slide-in rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
            Slide-in panel
          </div>
        </div>
      </Section>

      <Section title="MOT-07 / 08 / 09" subtitle="Place, flip, impact burst for meaningful board events">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn motion-press" onClick={() => setPlaceSeed((v) => v + 1)}>
            Replay place
          </button>
          <button type="button" className="btn motion-press" onClick={() => setFlipSeed((v) => v + 1)}>
            Replay flip + impact
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          <div key={`place-${placeSeed}`} className="motion-place rounded-xl border border-amber-300 bg-amber-50 px-4 py-6 text-sm text-amber-800">
            MOT-07 Place
          </div>
          <div key={`flip-${flipSeed}`} className="motion-flip motion-impact rounded-xl border border-violet-300 bg-violet-50 px-4 py-6 text-sm text-violet-800">
            MOT-08/09 Flip Impact
          </div>
        </div>
      </Section>

      <Section title="MOT-11 / 12" subtitle="Shimmer + idle alive for ambient UI (subtle only)">
        <div className="grid max-w-xl gap-3 sm:grid-cols-2">
          <div className="motion-shimmer rounded-xl border border-cyan-200 bg-gradient-to-r from-cyan-100 via-white to-cyan-100 px-4 py-5 text-sm text-cyan-900">
            MOT-11 Shimmer
          </div>
          <div className="motion-idle rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-sm text-emerald-900">
            MOT-12 Idle Alive
          </div>
        </div>
      </Section>

      <Section title="MOT-05 / Modal+Toast" subtitle="Exit/overlay primitives used in modal and toast surfaces">
        <div className="flex flex-wrap items-start gap-3">
          <div className="motion-backdrop rounded-xl border border-slate-200 bg-slate-900/5 px-4 py-3 text-sm text-slate-700">
            Backdrop fade
          </div>
          <div className="motion-modal rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            Modal pop
          </div>
          <div className="toast motion-pop-in toast-info">
            <div className="toast-title">Toast preview</div>
            <div className="toast-desc">Uses motion tokenized pop-in and hover lift.</div>
          </div>
        </div>
      </Section>
    </div>
  );
}

export default MotionsDesignPage;
