import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Layers, Sparkles, Wand2 } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <section className="grid lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-6 animate-fade-in">
          <p className="inline-flex items-center gap-2 text-xs font-medium tracking-wide uppercase text-primary">
            <Sparkles className="w-4 h-4" />
            AI Social SaaS Platform
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
            Create social banner campaigns in minutes, not days.
          </h1>
          <p className="text-muted text-lg max-w-xl">
            Social Studio combines AI strategy, image generation, and canvas editing into one platform for growth teams
            and creators.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/auth?mode=register"
              className="px-5 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium"
            >
              Start Free
            </Link>
            <Link
              to="/pricing"
              className="px-5 py-3 rounded-xl border border-white/15 text-muted hover:text-white hover:border-white/30"
            >
              See Pricing
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-surface/70 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
              <Wand2 className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-white">Generate campaign plan</p>
                <p className="text-xs text-muted">Headlines, captions, hashtags, and CTA-ready concepts.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
              <Layers className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-white">Produce visual variations</p>
                <p className="text-xs text-muted">Create multiple banner versions per campaign instantly.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-white">Stay on brand</p>
                <p className="text-xs text-muted">Edit and refine visuals before publishing.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
