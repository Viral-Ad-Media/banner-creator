import React from 'react';
import { Clock3, Film, Layers3, Sparkles, Wand2 } from 'lucide-react';

const roadmapItems = [
  {
    title: 'Scene-to-video prompts',
    description: 'Turn campaign concepts into short-form motion prompts tuned for social placements.',
    icon: Wand2,
  },
  {
    title: 'Storyboard variations',
    description: 'Generate alternate cuts for hooks, CTAs, and aspect ratios from the same campaign brief.',
    icon: Layers3,
  },
  {
    title: 'Render queue and exports',
    description: 'Track pending video jobs and keep exports organized for delivery across channels.',
    icon: Film,
  },
];

export const VideoGeneratorPanel: React.FC = () => {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.22),_transparent_36%),linear-gradient(135deg,rgba(24,24,27,0.94),rgba(9,9,11,0.96))] p-8 shadow-2xl shadow-black/20">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-primary">
            <Clock3 className="h-3.5 w-3.5" />
            Coming Soon
          </span>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white">Video Generator</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75">
            We’ve added the section into the workspace shell now so the app has a stable home for motion workflows. The
            next build can plug in storyboard generation, short-form exports, and render queue management without another
            navigation refactor.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {roadmapItems.map((item) => {
          const Icon = item.icon;

          return (
            <article key={item.title} className="rounded-[28px] border border-white/10 bg-surface/70 p-6 shadow-xl shadow-black/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
            </article>
          );
        })}
      </div>

      <section className="rounded-[28px] border border-white/10 bg-surface/70 p-6 shadow-xl shadow-black/10">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-1 h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-semibold text-white">Ready for the next step</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              The sidebar entry is live now, so when we build the actual video workflow later we can focus on generation,
              review, and export instead of reworking the app shell again.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
