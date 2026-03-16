import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Film, History, Layers, Sparkles, Wand2 } from 'lucide-react';

export const HomePage: React.FC = () => {
  const highlights = [
    ['Campaigns', 'Multi-asset planning'],
    ['Avatars', 'Reusable visual subjects'],
    ['Video', 'Prompt and image-to-video'],
    ['Activity', 'History and credit visibility'],
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pb-28 lg:pt-20">
      <section className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.05fr)_480px]">
        <div className="animate-fade-in space-y-7">
          <span className="section-kicker">
            <Sparkles className="h-4 w-4" />
            AI Creative Workspace
          </span>

          <div className="space-y-5">
            <h1 className="text-balance max-w-3xl text-5xl font-semibold leading-[1.02] text-white sm:text-6xl lg:text-[4.5rem]">
              Build campaign-ready social creative with one sleek workspace.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[#c2d2df]">
              Social Studio blends banner planning, avatar-guided image generation, editing, video workflows, and activity
              tracking into a focused operating system for fast-moving marketing teams.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/auth?mode=register"
              className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#83efe0_0%,#48d9c8_42%,#168d87_100%)] px-6 py-3.5 text-sm font-semibold text-[#04161a] shadow-[0_24px_45px_-24px_rgba(64,214,195,0.95)] transition-transform hover:-translate-y-0.5"
            >
              Start Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-6 py-3.5 text-sm font-semibold text-white/90 transition-colors hover:border-white/20 hover:bg-white/10"
            >
              Explore Pricing
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {highlights.map(([label, description]) => (
              <div key={label} className="surface-card rounded-[24px] px-4 py-4">
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="mt-1 text-sm text-muted">{description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card-strong relative overflow-hidden rounded-[34px] p-6 sm:p-7">
          <div className="absolute inset-x-10 top-0 h-24 rounded-full bg-primary/18 blur-3xl" />
          <div className="relative space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary/90">Live Workspace</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">From brief to publish-ready creative</h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-[#d8e4ee]">
                Modern stack
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">Campaign Board</p>
                    <p className="mt-1 text-sm leading-6 text-muted">One brief becomes a headline set, caption, hashtags, and multiple banner variations.</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-primary/12 text-primary">
                    <Wand2 className="h-5 w-5" />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-primary/10 text-primary">
                    <Layers className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-base font-semibold text-white">Visual Variations</p>
                  <p className="mt-2 text-sm leading-6 text-muted">Generate multiple banner concepts in the same run and keep them editable.</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-[#ffb166]/12 text-[#ffd2a3]">
                    <Film className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-base font-semibold text-white">Motion Ready</p>
                  <p className="mt-2 text-sm leading-6 text-muted">Turn selected avatars and image frames into short branded video concepts.</p>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <p className="text-sm font-semibold text-white">Brand-safe finishing layer</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Clean history, credit visibility, and in-app editing keep the workflow tight instead of spreading decisions across tools.
                </p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                <div className="flex items-center gap-3">
                  <History className="h-5 w-5 text-primary" />
                  <p className="text-sm font-semibold text-white">History and settings included</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Keep an eye on recent runs, usage, and profile setup directly inside the workspace instead of juggling separate tools.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
