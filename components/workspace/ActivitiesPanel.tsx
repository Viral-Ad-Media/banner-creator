import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, Clock3, Image as ImageIcon, RefreshCcw, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { getGenerationActivity, type GenerationRecord, type UsageSummary } from '../../services/workspaceService';

const formatGenerationType = (value: GenerationRecord['type']) => {
  switch (value) {
    case 'BANNER_PLAN':
      return 'Banner Plan';
    case 'IMAGE_GENERATION':
      return 'Image Generation';
    case 'IMAGE_EDIT':
      return 'Image Edit';
    default:
      return value;
  }
};

const formatTimestamp = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

const getGenerationIcon = (type: GenerationRecord['type']) => {
  if (type === 'BANNER_PLAN') return Sparkles;
  if (type === 'IMAGE_EDIT') return Wand2;
  return ImageIcon;
};

export const ActivitiesPanel: React.FC = () => {
  const [generations, setGenerations] = useState<GenerationRecord[]>([]);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadActivity = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await getGenerationActivity();
      setGenerations(response.generations);
      setUsage(response.usage);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not load activity right now.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadActivity();
  }, []);

  const successCount = generations.filter((item) => item.status === 'SUCCESS').length;
  const failureCount = generations.filter((item) => item.status === 'FAILED').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <section className="rounded-3xl border border-white/10 bg-surface/70 p-5 shadow-xl shadow-black/10">
          <p className="text-xs uppercase tracking-[0.24em] text-muted">Credits Used</p>
          <div className="mt-4 flex items-end justify-between">
            <p className="text-3xl font-bold text-white">{usage?.usedCredits ?? 0}</p>
            <p className="text-sm text-muted">of {usage?.limit ?? 0}</p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-surface/70 p-5 shadow-xl shadow-black/10">
          <p className="text-xs uppercase tracking-[0.24em] text-muted">Credits Left</p>
          <div className="mt-4 flex items-end justify-between">
            <p className="text-3xl font-bold text-white">{usage?.remainingCredits ?? 0}</p>
            <p className="text-sm text-emerald-300">available now</p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-surface/70 p-5 shadow-xl shadow-black/10">
          <p className="text-xs uppercase tracking-[0.24em] text-muted">Recent Results</p>
          <div className="mt-4 flex items-end justify-between">
            <p className="text-3xl font-bold text-white">{successCount}</p>
            <p className="text-sm text-red-300">{failureCount} failed</p>
          </div>
        </section>
      </div>

      <section className="rounded-[28px] border border-white/10 bg-surface/70 p-6 shadow-2xl shadow-black/10">
        <div className="flex flex-col gap-4 border-b border-white/8 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
              <Activity className="h-5 w-5 text-primary" />
              Activity Feed
            </h2>
            <p className="mt-1 text-sm text-muted">Track recent plans, image renders, and edits from your workspace.</p>
          </div>

          <Button variant="secondary" onClick={() => void loadActivity()} isLoading={isLoading} className="sm:self-start">
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="flex min-h-[260px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="mt-3 text-sm text-muted">Loading recent activity...</p>
            </div>
          </div>
        ) : errorMessage ? (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/5 p-4 text-sm text-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          </div>
        ) : generations.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-black/20 p-10 text-center">
            <p className="text-lg font-medium text-white">No activity yet</p>
            <p className="mt-2 text-sm text-muted">Your banner runs and image edits will show up here once we start generating.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {generations.map((generation) => {
              const Icon = getGenerationIcon(generation.type);

              return (
                <article
                  key={generation.id}
                  className="rounded-2xl border border-white/8 bg-black/20 p-4 transition-colors hover:border-white/15"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white">
                          <Icon className="h-3.5 w-3.5 text-primary" />
                          {formatGenerationType(generation.type)}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            generation.status === 'SUCCESS'
                              ? 'bg-emerald-500/10 text-emerald-300'
                              : 'bg-red-500/10 text-red-300'
                          }`}
                        >
                          {generation.status}
                        </span>
                        {generation.aspect_ratio && (
                          <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-muted">
                            {generation.aspect_ratio}
                          </span>
                        )}
                      </div>

                      <p className="line-clamp-2 text-sm leading-6 text-white/90">{generation.prompt}</p>

                      {generation.error_message && (
                        <p className="rounded-xl border border-red-400/10 bg-red-500/5 px-3 py-2 text-xs text-red-200">
                          {generation.error_message}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted lg:shrink-0">
                      <Clock3 className="h-3.5 w-3.5" />
                      {formatTimestamp(generation.created_at)}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
