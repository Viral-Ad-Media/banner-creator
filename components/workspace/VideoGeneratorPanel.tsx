import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Download,
  Film,
  Loader2,
  RefreshCcw,
  Sparkles,
  Video,
  Volume2,
  Wand2,
} from 'lucide-react';
import {
  downloadGeneratedVideo,
  getVideoGenerationStatus,
  startVideoGeneration,
  type VideoAspectRatio,
  type VideoDurationSeconds,
  type VideoGenerationJobStatus,
  type VideoModelPreset,
} from '../../services/videoService';
import type { AvatarAsset } from '../../services/avatarLibrary';
import { Button } from '../ui/Button';
import { AvatarLibraryPicker } from './AvatarLibraryPicker';

const VIDEO_DURATION_OPTIONS = [4, 6, 8] as const;
const VIDEO_MODEL_OPTIONS = [
  { id: 'fast', label: 'Fast', description: 'Quicker preview renders' },
  { id: 'quality', label: 'Quality', description: 'Higher fidelity, slower jobs' },
] as const;
const DEFAULT_STORAGE_KEY = 'social-studio:video-generator:v1';
const DEFAULT_AVATAR_STORAGE_KEY = 'social-studio:avatars:v1';
const MAX_STORED_JOBS = 8;
const VIDEO_POLL_INTERVAL_MS = 10000;

type PersistedVideoJob = VideoGenerationJobStatus & {
  prompt: string;
  negativePrompt: string;
  aspectRatio: VideoAspectRatio;
  durationSeconds: VideoDurationSeconds;
  modelPreset: VideoModelPreset;
  includeAudio: boolean;
  createdAt: string;
  updatedAt: string;
};

type PersistedVideoWorkspace = {
  version: 1;
  prompt: string;
  negativePrompt: string;
  aspectRatio: VideoAspectRatio;
  durationSeconds: VideoDurationSeconds;
  modelPreset: VideoModelPreset;
  includeAudio: boolean;
  selectedAvatarId: string | null;
  selectedOperationName: string | null;
  jobs: PersistedVideoJob[];
};

interface VideoGeneratorPanelProps {
  draftStorageKey?: string;
  avatarStorageKey?: string;
}

const formatTimestamp = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

const getStatusTone = (status: PersistedVideoJob['status']) => {
  switch (status) {
    case 'SUCCEEDED':
      return 'bg-emerald-500/10 text-emerald-300';
    case 'FAILED':
      return 'bg-red-500/10 text-red-300';
    default:
      return 'bg-amber-500/10 text-amber-200';
  }
};

const getVideoAspectRatioClass = (aspectRatio: VideoAspectRatio) =>
  aspectRatio === '9:16' ? 'aspect-[9/16] max-h-[620px]' : 'aspect-video';

export const VideoGeneratorPanel: React.FC<VideoGeneratorPanelProps> = ({
  draftStorageKey = DEFAULT_STORAGE_KEY,
  avatarStorageKey = DEFAULT_AVATAR_STORAGE_KEY,
}) => {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
  const [durationSeconds, setDurationSeconds] = useState<VideoDurationSeconds>(4);
  const [modelPreset, setModelPreset] = useState<VideoModelPreset>('fast');
  const [includeAudio, setIncludeAudio] = useState(false);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarAsset | null>(null);
  const [jobs, setJobs] = useState<PersistedVideoJob[]>([]);
  const [selectedOperationName, setSelectedOperationName] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingPreviewFor, setLoadingPreviewFor] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDraftReady, setIsDraftReady] = useState(false);
  const previewUrlsRef = useRef<Record<string, string>>({});

  const upsertJob = useCallback((nextJob: PersistedVideoJob) => {
    setJobs((prev) => {
      const filtered = prev.filter((job) => job.operationName !== nextJob.operationName);
      return [nextJob, ...filtered].slice(0, MAX_STORED_JOBS);
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsDraftReady(true);
      return;
    }

    try {
      const rawDraft = window.localStorage.getItem(draftStorageKey);
      if (!rawDraft) {
        setIsDraftReady(true);
        return;
      }

      const draft = JSON.parse(rawDraft) as PersistedVideoWorkspace;
      if (draft.version !== 1) {
        window.localStorage.removeItem(draftStorageKey);
        setIsDraftReady(true);
        return;
      }

      setPrompt(draft.prompt ?? '');
      setNegativePrompt(draft.negativePrompt ?? '');
      setAspectRatio(draft.aspectRatio ?? '16:9');
      setDurationSeconds(draft.durationSeconds ?? 4);
      setModelPreset(draft.modelPreset ?? 'fast');
      setIncludeAudio(draft.includeAudio ?? false);
      setSelectedAvatarId(draft.selectedAvatarId ?? null);
      setJobs(draft.jobs ?? []);
      setSelectedOperationName(draft.selectedOperationName ?? draft.jobs?.[0]?.operationName ?? null);

      if ((draft.jobs?.length ?? 0) > 0) {
        setStatusMessage({ type: 'success', text: 'Restored your recent video jobs.' });
      }
    } catch (error) {
      console.error('Failed to restore video workspace', error);
      window.localStorage.removeItem(draftStorageKey);
    } finally {
      setIsDraftReady(true);
    }
  }, [draftStorageKey]);

  useEffect(() => {
    if (!isDraftReady || typeof window === 'undefined') {
      return;
    }

    const hasContent =
      prompt.trim().length > 0 ||
      negativePrompt.trim().length > 0 ||
      jobs.length > 0 ||
      !!selectedAvatarId ||
      includeAudio ||
      aspectRatio !== '16:9' ||
      durationSeconds !== 4 ||
      modelPreset !== 'fast';

    if (!hasContent) {
      window.localStorage.removeItem(draftStorageKey);
      return;
    }

    const draft: PersistedVideoWorkspace = {
      version: 1,
      prompt,
      negativePrompt,
      aspectRatio,
      durationSeconds,
      modelPreset,
      includeAudio,
      selectedAvatarId,
      selectedOperationName,
      jobs,
    };

    window.localStorage.setItem(draftStorageKey, JSON.stringify(draft));
  }, [
    aspectRatio,
    draftStorageKey,
    durationSeconds,
    includeAudio,
    isDraftReady,
    jobs,
    modelPreset,
    negativePrompt,
    prompt,
    selectedAvatarId,
    selectedOperationName,
  ]);

  useEffect(() => {
    return () => {
      for (const url of Object.values(previewUrlsRef.current) as string[]) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.operationName === selectedOperationName) ?? jobs[0] ?? null,
    [jobs, selectedOperationName]
  );

  const loadPreview = useCallback(async (job: PersistedVideoJob) => {
    if (previewUrlsRef.current[job.operationName]) {
      return;
    }

    setLoadingPreviewFor(job.operationName);
    try {
      const blob = await downloadGeneratedVideo(job.operationName, job.modelPreset);
      const objectUrl = URL.createObjectURL(blob);
      previewUrlsRef.current[job.operationName] = objectUrl;
      setPreviewUrls((prev) => ({ ...prev, [job.operationName]: objectUrl }));
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not load the generated video preview.',
      });
    } finally {
      setLoadingPreviewFor((current) => (current === job.operationName ? null : current));
    }
  }, []);

  const refreshJob = useCallback(
    async (job: PersistedVideoJob) => {
      try {
        const nextStatus = await getVideoGenerationStatus(job.operationName, job.modelPreset);
        const updatedJob: PersistedVideoJob = {
          ...job,
          ...nextStatus,
          updatedAt: new Date().toISOString(),
        };

        upsertJob(updatedJob);

        if (updatedJob.status === 'SUCCEEDED' && selectedOperationName === updatedJob.operationName) {
          void loadPreview(updatedJob);
        }
      } catch (error) {
        upsertJob({
          ...job,
          status: 'FAILED',
          done: true,
          errorMessage: error instanceof Error ? error.message : 'Could not refresh video status.',
          updatedAt: new Date().toISOString(),
        });
      }
    },
    [loadPreview, selectedOperationName, upsertJob]
  );

  useEffect(() => {
    const pendingJobs = jobs.filter((job) => job.status === 'PENDING' || job.status === 'RUNNING');
    if (pendingJobs.length === 0) {
      return;
    }

    void Promise.allSettled(pendingJobs.map((job) => refreshJob(job)));

    const intervalId = window.setInterval(() => {
      void Promise.allSettled(
        pendingJobs.map((job) =>
          refreshJob(job)
        )
      );
    }, VIDEO_POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [jobs, refreshJob]);

  useEffect(() => {
    if (!selectedJob || selectedJob.status !== 'SUCCEEDED') {
      return;
    }

    if (previewUrls[selectedJob.operationName] || loadingPreviewFor === selectedJob.operationName) {
      return;
    }

    void loadPreview(selectedJob);
  }, [loadPreview, loadingPreviewFor, previewUrls, selectedJob]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedPrompt = prompt.trim();
    if (trimmedPrompt.length < 10) {
      setStatusMessage({ type: 'error', text: 'Describe the scene in a little more detail so Veo has enough context.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const job = await startVideoGeneration({
        prompt: trimmedPrompt,
        negativePrompt: negativePrompt.trim() || undefined,
        aspectRatio,
        durationSeconds,
        modelPreset,
        includeAudio,
        sourceImageDataUrl: selectedAvatar?.imageDataUrl,
      });

      const nextJob: PersistedVideoJob = {
        ...job,
        prompt: trimmedPrompt,
        negativePrompt: negativePrompt.trim(),
        aspectRatio,
        durationSeconds,
        modelPreset,
        includeAudio,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      upsertJob(nextJob);
      setSelectedOperationName(nextJob.operationName);
      setStatusMessage({
        type: 'success',
        text: 'Video job queued. We’ll keep checking until Veo finishes it.',
      });
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not start video generation.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async (job: PersistedVideoJob) => {
    try {
      const blob = await downloadGeneratedVideo(job.operationName, job.modelPreset);
      const url = URL.createObjectURL(blob);
      const extension = (blob.type.split('/')[1] || 'mp4').replace(/[^a-z0-9]/gi, '');
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `social-studio-video-${Date.now()}.${extension || 'mp4'}`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not download video.',
      });
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      <section className="surface-card rounded-[32px] p-6">
        <div className="border-b border-white/8 pb-5">
          <span className="section-kicker">
            <Film className="h-5 w-5 text-primary" />
            Video Generator
          </span>
          <p className="mt-4 text-sm leading-7 text-[#c0d1de]">
            Generate short Veo clips from a text prompt. Jobs usually take a bit longer than images, so this panel keeps
            polling until the result is ready.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">Video Prompt</label>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              className="h-40 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-muted focus:border-primary/50 focus:ring-1 focus:ring-primary"
              placeholder="A kinetic ad for a luxury coffee brand, slow camera push-in, steam in the air, premium product close-up, cinematic lighting..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">Negative Prompt</label>
            <textarea
              value={negativePrompt}
              onChange={(event) => setNegativePrompt(event.target.value)}
              className="h-24 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-muted focus:border-primary/50 focus:ring-1 focus:ring-primary"
              placeholder="Optional. Example: shaky camera, text overlays, extra hands, distorted faces..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">Aspect Ratio</label>
              <div className="grid grid-cols-2 gap-2">
                {(['16:9', '9:16'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                      aspectRatio === ratio
                        ? 'border-primary bg-primary/15 text-primary'
                        : 'border-white/10 bg-black/20 text-muted hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">Duration</label>
              <div className="grid grid-cols-3 gap-2">
                {VIDEO_DURATION_OPTIONS.map((seconds) => (
                  <button
                    key={seconds}
                    type="button"
                    onClick={() => setDurationSeconds(seconds)}
                    className={`rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                      durationSeconds === seconds
                        ? 'border-primary bg-primary/15 text-primary'
                        : 'border-white/10 bg-black/20 text-muted hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {seconds}s
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">Render Mode</label>
            <div className="grid gap-2">
              {VIDEO_MODEL_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setModelPreset(option.id)}
                  className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                    modelPreset === option.id
                      ? 'border-primary bg-primary/10'
                      : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${modelPreset === option.id ? 'text-white' : 'text-white/85'}`}>
                      {option.label}
                    </span>
                    {modelPreset === option.id && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="mt-1 text-xs text-muted">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Volume2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Generate audio</p>
                <p className="text-xs text-muted">Include soundtrack and synced audio when the model supports it.</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={includeAudio}
              onChange={(event) => setIncludeAudio(event.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-black/20 text-primary focus:ring-primary"
            />
          </label>

          <AvatarLibraryPicker
            storageKey={avatarStorageKey}
            selectedAvatarId={selectedAvatarId}
            onSelectedAvatarIdChange={setSelectedAvatarId}
            onSelectedAvatarChange={setSelectedAvatar}
            title="Avatar For Video"
            description="Select a saved avatar from Avatar Studio to switch this into image-to-video using the avatar as the starting frame."
            mode="select"
          />

          {selectedAvatar && (
            <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 text-xs leading-6 text-white/80">
              Image-to-video enabled with <span className="font-medium text-white">{selectedAvatar.name}</span>. The selected
              avatar will be used as the source frame for this render.
            </div>
          )}

          <Button type="submit" isLoading={isSubmitting} className="w-full py-4">
            <Wand2 className="h-4 w-4" />
            Generate Video
          </Button>

          <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 text-xs leading-6 text-white/75">
            <p className="font-medium text-white">Operational note</p>
            <p className="mt-1">
              Veo jobs can take from several seconds to a few minutes. The app keeps checking the operation in the
              background, and completed videos are restorable from this browser for later preview/download.
            </p>
          </div>

          {statusMessage && (
            <p className={`text-sm ${statusMessage.type === 'error' ? 'text-red-300' : 'text-emerald-300'}`}>
              {statusMessage.text}
            </p>
          )}
        </form>
      </section>

      <div className="space-y-6">
        <section className="surface-card rounded-[32px] p-6">
          <div className="flex flex-col gap-4 border-b border-white/8 pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">Preview</h3>
              <p className="mt-1 text-sm text-muted">
                {selectedJob
                  ? `Selected job created ${formatTimestamp(selectedJob.createdAt)}`
                  : 'Start a render to see the generated clip here.'}
              </p>
            </div>

            {selectedJob && (
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusTone(selectedJob.status)}`}>
                  {selectedJob.status}
                </span>
                <Button
                  variant="secondary"
                  onClick={() => void refreshJob(selectedJob)}
                  disabled={selectedJob.status === 'SUCCEEDED' && !!previewUrls[selectedJob.operationName]}
                >
                  <RefreshCcw className="h-4 w-4" />
                  Refresh
                </Button>
                {selectedJob.status === 'SUCCEEDED' && (
                  <Button variant="secondary" onClick={() => void handleDownload(selectedJob)}>
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="mt-6">
            {!selectedJob ? (
              <div className="flex min-h-[420px] items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-black/20 p-8 text-center">
                <div>
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
                    <Video className="h-8 w-8 text-muted" />
                  </div>
                  <p className="mt-5 text-lg font-medium text-white">No video jobs yet</p>
                  <p className="mt-2 text-sm text-muted">Generate a clip from the left panel and we’ll keep its status here.</p>
                </div>
              </div>
            ) : selectedJob.status === 'FAILED' ? (
              <div className="rounded-[28px] border border-red-400/20 bg-red-500/5 p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-red-300" />
                  <div>
                    <p className="text-lg font-medium text-white">Generation failed</p>
                    <p className="mt-2 text-sm leading-6 text-red-200">
                      {selectedJob.errorMessage || 'Veo was unable to complete this request.'}
                    </p>
                  </div>
                </div>
              </div>
            ) : selectedJob.status !== 'SUCCEEDED' ? (
              <div className="flex min-h-[420px] items-center justify-center rounded-[28px] border border-white/10 bg-black/20 p-8 text-center">
                <div>
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                  <p className="mt-5 text-lg font-medium text-white">Video is rendering</p>
                  <p className="mt-2 text-sm text-muted">
                    Veo is still working on this clip. We’ll keep polling automatically every few seconds.
                  </p>
                </div>
              </div>
            ) : loadingPreviewFor === selectedJob.operationName || !previewUrls[selectedJob.operationName] ? (
              <div className="flex min-h-[420px] items-center justify-center rounded-[28px] border border-white/10 bg-black/20 p-8 text-center">
                <div>
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Sparkles className="h-8 w-8 animate-pulse" />
                  </div>
                  <p className="mt-5 text-lg font-medium text-white">Loading preview</p>
                  <p className="mt-2 text-sm text-muted">Downloading the generated clip so it can play inside the workspace.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`overflow-hidden rounded-[28px] border border-white/10 bg-black/30 ${getVideoAspectRatioClass(selectedJob.aspectRatio)}`}>
                  <video
                    key={selectedJob.operationName}
                    controls
                    playsInline
                    className="h-full w-full object-cover"
                    src={previewUrls[selectedJob.operationName]}
                  />
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white">{selectedJob.aspectRatio}</span>
                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white">{selectedJob.durationSeconds}s</span>
                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white">
                      {selectedJob.modelPreset === 'fast' ? 'Fast render' : 'Quality render'}
                    </span>
                    {selectedJob.includeAudio && (
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">Audio enabled</span>
                    )}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/85">{selectedJob.prompt}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="surface-card rounded-[32px] p-6">
          <div className="flex items-center justify-between border-b border-white/8 pb-5">
            <div>
              <h3 className="text-xl font-semibold text-white">Recent Jobs</h3>
              <p className="mt-1 text-sm text-muted">Stored in this browser so you can come back after refreshes.</p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted">
              {jobs.length} saved
            </span>
          </div>

          {jobs.length === 0 ? (
            <div className="mt-6 rounded-[28px] border border-dashed border-white/10 bg-black/20 p-8 text-center">
              <p className="text-white">No saved video jobs yet.</p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {jobs.map((job) => (
                <button
                  key={job.operationName}
                  type="button"
                  onClick={() => setSelectedOperationName(job.operationName)}
                  className={`w-full rounded-[24px] border p-4 text-left transition-all ${
                    selectedJob?.operationName === job.operationName
                      ? 'border-primary/25 bg-primary/10'
                      : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusTone(job.status)}`}>
                          {job.status}
                        </span>
                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-muted">{job.aspectRatio}</span>
                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-muted">{job.durationSeconds}s</span>
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/90">{job.prompt}</p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted lg:shrink-0">
                      <Clock3 className="h-3.5 w-3.5" />
                      {formatTimestamp(job.updatedAt)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
