import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  Film,
  ImagePlus,
  Loader2,
  Plus,
  RefreshCcw,
  Sparkles,
  Trash2,
  Upload,
  Video,
  Volume2,
  Wand2,
  X,
} from 'lucide-react';
import {
  downloadGeneratedVideo,
  getVideoGenerationStatus,
  startVideoGeneration,
  type VideoAspectRatio,
  type VideoDurationSeconds,
  type VideoGenerationJobStatus,
  type VideoModelPreset,
  type VideoProvider,
} from '../../services/videoService';
import { optimizeAvatarImageDataUrl, type AvatarAsset } from '../../services/avatarLibrary';
import { Button } from '../ui/Button';
import { AvatarLibraryPicker } from './AvatarLibraryPicker';

const VIDEO_DURATION_OPTIONS_BY_PROVIDER: Record<VideoProvider, readonly [VideoDurationSeconds, ...VideoDurationSeconds[]]> = {
  gemini: [4, 6, 8],
  openrouter: [5, 8],
};
const VIDEO_PROVIDER_OPTIONS: Array<{ id: VideoProvider; label: string; description: string }> = [
  { id: 'gemini', label: 'Gemini', description: 'Direct Veo API' },
  { id: 'openrouter', label: 'OpenRouter', description: 'OpenRouter video API' },
];
const VIDEO_MODEL_OPTIONS = [
  { id: 'fast', label: 'Fast', description: 'Quicker preview renders' },
  { id: 'quality', label: 'Quality', description: 'Higher fidelity, slower jobs' },
] as const;
const WORKFLOW_OPTIONS = [
  { id: 'single', label: 'Single Clip' },
  { id: 'storyboard', label: 'Scene Reel' },
] as const;
const SOURCE_MODE_OPTIONS = [
  { id: 'text', label: 'Text', icon: Wand2 },
  { id: 'upload', label: 'Image', icon: ImagePlus },
  { id: 'avatar', label: 'Avatar', icon: Video },
] as const;
const CAMERA_MOTION_OPTIONS = [
  { id: 'cinematic', label: 'Cinematic', prompt: 'cinematic camera movement with a clean push-in and subtle parallax' },
  { id: 'dynamic', label: 'Dynamic', prompt: 'dynamic camera movement with purposeful motion and energetic reframing' },
  { id: 'locked', label: 'Locked', prompt: 'locked-off camera with polished subject movement and stable composition' },
  { id: 'handheld', label: 'Handheld', prompt: 'natural handheld motion with controlled shake and documentary realism' },
] as const;
const VISUAL_STYLE_OPTIONS = [
  { id: 'premium', label: 'Premium Ad', prompt: 'premium commercial lighting, polished product-ad finish, crisp detail' },
  { id: 'ugc', label: 'UGC', prompt: 'authentic social-first UGC style, natural light, approachable realism' },
  { id: 'editorial', label: 'Editorial', prompt: 'editorial cinematic color grade, refined composition, fashion-film texture' },
  { id: 'bright', label: 'Bright Social', prompt: 'bright social media look, high clarity, saturated but tasteful colors' },
] as const;
const SHOT_PACING_OPTIONS = [
  { id: 'smooth', label: 'Smooth', prompt: 'smooth pacing with readable visual beats and elegant transitions' },
  { id: 'snappy', label: 'Snappy', prompt: 'snappy pacing with quick visual payoff and strong opening movement' },
  { id: 'slow', label: 'Slow Burn', prompt: 'slow-burn pacing with atmospheric buildup and lingering detail shots' },
] as const;
const DEFAULT_SCENE_TITLES = ['Hook', 'Product', 'Proof', 'CTA'];
const DEFAULT_STORAGE_KEY = 'social-studio:video-generator:v2';
const MAX_STORED_JOBS = 24;
const MAX_SOURCE_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const VIDEO_POLL_INTERVAL_MS = 30000;

type VideoWorkflowMode = (typeof WORKFLOW_OPTIONS)[number]['id'];
type VideoSourceMode = (typeof SOURCE_MODE_OPTIONS)[number]['id'];
type CameraMotion = (typeof CAMERA_MOTION_OPTIONS)[number]['id'];
type VisualStyle = (typeof VISUAL_STYLE_OPTIONS)[number]['id'];
type ShotPacing = (typeof SHOT_PACING_OPTIONS)[number]['id'];

type VideoScene = {
  id: string;
  title: string;
  prompt: string;
  durationSeconds: VideoDurationSeconds;
};

type PersistedVideoJob = VideoGenerationJobStatus & {
  prompt: string;
  renderPrompt?: string;
  negativePrompt: string;
  aspectRatio: VideoAspectRatio;
  durationSeconds: VideoDurationSeconds;
  modelPreset: VideoModelPreset;
  provider: VideoProvider;
  includeAudio: boolean;
  workflowMode: VideoWorkflowMode;
  sourceMode: VideoSourceMode;
  sceneId?: string;
  sceneTitle?: string;
  sceneIndex?: number;
  sceneCount?: number;
  createdAt: string;
  updatedAt: string;
};

type PersistedVideoWorkspace = {
  version: 2;
  workflowMode: VideoWorkflowMode;
  sourceMode: VideoSourceMode;
  prompt: string;
  negativePrompt: string;
  aspectRatio: VideoAspectRatio;
  durationSeconds: VideoDurationSeconds;
  modelPreset: VideoModelPreset;
  provider?: VideoProvider;
  includeAudio: boolean;
  selectedAvatarId: string | null;
  uploadedSourceImageDataUrl: string | null;
  uploadedSourceImageName: string | null;
  cameraMotion: CameraMotion;
  visualStyle: VisualStyle;
  shotPacing: ShotPacing;
  scenes: VideoScene[];
  selectedOperationName: string | null;
  jobs: PersistedVideoJob[];
};

type RestoredVideoWorkspace = Partial<Omit<PersistedVideoWorkspace, 'version'>> & {
  version?: number;
};

interface VideoGeneratorPanelProps {
  draftStorageKey?: string;
}

const createSceneId = () =>
  typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const createBlankScene = (index: number, durationSeconds: VideoDurationSeconds): VideoScene => ({
  id: createSceneId(),
  title: DEFAULT_SCENE_TITLES[index - 1] ?? `Scene ${index}`,
  prompt: '',
  durationSeconds,
});

const createDefaultScenes = (durationSeconds: VideoDurationSeconds): VideoScene[] =>
  Array.from({ length: 3 }, (_, index) => createBlankScene(index + 1, durationSeconds));

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read the selected image.'));
    reader.readAsDataURL(file);
  });

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

const getProviderLabel = (provider: VideoProvider) => (provider === 'openrouter' ? 'OpenRouter' : 'Gemini Veo');

const getOptionPrompt = <T extends string>(options: readonly { id: T; prompt: string }[], selectedId: T) =>
  options.find((option) => option.id === selectedId)?.prompt ?? '';

const composeVideoPrompt = (params: {
  basePrompt: string;
  sourceMode: VideoSourceMode;
  cameraMotion: CameraMotion;
  visualStyle: VisualStyle;
  shotPacing: ShotPacing;
  sceneIndex?: number;
  sceneCount?: number;
}) => {
  const parts = [
    params.basePrompt.trim(),
    `Camera: ${getOptionPrompt(CAMERA_MOTION_OPTIONS, params.cameraMotion)}.`,
    `Style: ${getOptionPrompt(VISUAL_STYLE_OPTIONS, params.visualStyle)}.`,
    `Pacing: ${getOptionPrompt(SHOT_PACING_OPTIONS, params.shotPacing)}.`,
  ];

  if (params.sourceMode !== 'text') {
    parts.push('Use the supplied image as the starting frame and preserve the core subject identity, outfit, product details, and brand-safe composition.');
  }

  if (params.sceneIndex && params.sceneCount) {
    parts.push(`This is scene ${params.sceneIndex} of ${params.sceneCount}; make it self-contained but visually consistent with the rest of the reel.`);
  }

  parts.push('No burned-in captions, subtitles, watermarks, logos, malformed hands, distorted faces, or unreadable text.');

  return parts.join(' ');
};

const getCanvasSize = (aspectRatio: VideoAspectRatio) =>
  aspectRatio === '9:16' ? { width: 720, height: 1280 } : { width: 1280, height: 720 };

const drawVideoCover = (
  context: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  canvasWidth: number,
  canvasHeight: number
) => {
  const sourceWidth = video.videoWidth || canvasWidth;
  const sourceHeight = video.videoHeight || canvasHeight;
  const scale = Math.max(canvasWidth / sourceWidth, canvasHeight / sourceHeight);
  const sourceCropWidth = canvasWidth / scale;
  const sourceCropHeight = canvasHeight / scale;
  const sourceX = Math.max(0, (sourceWidth - sourceCropWidth) / 2);
  const sourceY = Math.max(0, (sourceHeight - sourceCropHeight) / 2);

  context.fillStyle = '#061016';
  context.fillRect(0, 0, canvasWidth, canvasHeight);
  context.drawImage(
    video,
    sourceX,
    sourceY,
    sourceCropWidth,
    sourceCropHeight,
    0,
    0,
    canvasWidth,
    canvasHeight
  );
};

const drawVideoSegment = (
  videoUrl: string,
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D
) =>
  new Promise<void>((resolve, reject) => {
    const video = document.createElement('video');
    let animationFrameId = 0;

    const cleanup = () => {
      window.cancelAnimationFrame(animationFrameId);
      video.pause();
      video.removeAttribute('src');
      video.load();
    };

    const drawFrame = () => {
      drawVideoCover(context, video, canvas.width, canvas.height);

      if (!video.ended && !video.paused) {
        animationFrameId = window.requestAnimationFrame(drawFrame);
      }
    };

    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.src = videoUrl;

    video.onloadedmetadata = () => {
      video.currentTime = 0;
      void video
        .play()
        .then(() => {
          drawFrame();
        })
        .catch((error) => {
          cleanup();
          reject(error instanceof Error ? error : new Error('Could not play one of the scene clips.'));
        });
    };

    video.onended = () => {
      drawVideoCover(context, video, canvas.width, canvas.height);
      cleanup();
      resolve();
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Could not decode one of the completed scene clips.'));
    };
  });

const getRecorderMimeType = () => {
  if (typeof MediaRecorder === 'undefined') {
    return '';
  }

  return (
    ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((mimeType) =>
      MediaRecorder.isTypeSupported(mimeType)
    ) ?? ''
  );
};

const createMergedVideoBlob = async (params: {
  videoUrls: string[];
  aspectRatio: VideoAspectRatio;
  onProgress: (message: string) => void;
}) => {
  if (typeof MediaRecorder === 'undefined') {
    throw new Error('This browser cannot export merged reels. Try a Chromium-based browser for reel export.');
  }

  const canvas = document.createElement('canvas');
  const size = getCanvasSize(params.aspectRatio);
  canvas.width = size.width;
  canvas.height = size.height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not prepare the browser video canvas.');
  }

  if (typeof canvas.captureStream !== 'function') {
    throw new Error('This browser does not support canvas video recording.');
  }

  const stream = canvas.captureStream(30);
  const chunks: BlobPart[] = [];
  const mimeType = getRecorderMimeType();
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const recording = new Promise<Blob>((resolve, reject) => {
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    recorder.onerror = () => reject(new Error('Browser video recording failed during reel export.'));
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: recorder.mimeType || 'video/webm' }));
    };
  });

  recorder.start(500);

  try {
    for (const [index, videoUrl] of params.videoUrls.entries()) {
      params.onProgress(`Merging scene ${index + 1} of ${params.videoUrls.length}`);
      await drawVideoSegment(videoUrl, canvas, context);
    }

    recorder.stop();
    const blob = await recording;
    stream.getTracks().forEach((track) => track.stop());
    return blob;
  } catch (error) {
    if (recorder.state !== 'inactive') {
      recorder.stop();
    }
    stream.getTracks().forEach((track) => track.stop());
    throw error;
  }
};

export const VideoGeneratorPanel: React.FC<VideoGeneratorPanelProps> = ({
  draftStorageKey = DEFAULT_STORAGE_KEY,
}) => {
  const [workflowMode, setWorkflowMode] = useState<VideoWorkflowMode>('single');
  const [sourceMode, setSourceMode] = useState<VideoSourceMode>('text');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
  const [durationSeconds, setDurationSeconds] = useState<VideoDurationSeconds>(4);
  const [modelPreset, setModelPreset] = useState<VideoModelPreset>('fast');
  const [provider, setProvider] = useState<VideoProvider>('gemini');
  const [includeAudio, setIncludeAudio] = useState(false);
  const [cameraMotion, setCameraMotion] = useState<CameraMotion>('cinematic');
  const [visualStyle, setVisualStyle] = useState<VisualStyle>('premium');
  const [shotPacing, setShotPacing] = useState<ShotPacing>('smooth');
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarAsset | null>(null);
  const [uploadedSourceImageDataUrl, setUploadedSourceImageDataUrl] = useState<string | null>(null);
  const [uploadedSourceImageName, setUploadedSourceImageName] = useState<string | null>(null);
  const [scenes, setScenes] = useState<VideoScene[]>(() => createDefaultScenes(4));
  const [jobs, setJobs] = useState<PersistedVideoJob[]>([]);
  const [selectedOperationName, setSelectedOperationName] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeProgress, setMergeProgress] = useState<string | null>(null);
  const [loadingPreviewFor, setLoadingPreviewFor] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDraftReady, setIsDraftReady] = useState(false);
  const sourceImageInputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef<Record<string, string>>({});
  const durationOptions = useMemo(() => VIDEO_DURATION_OPTIONS_BY_PROVIDER[provider], [provider]);
  const activeProviderLabel = getProviderLabel(provider);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.operationName === selectedOperationName) ?? jobs[0] ?? null,
    [jobs, selectedOperationName]
  );
  const validScenes = useMemo(
    () => scenes.filter((scene) => scene.prompt.trim().length >= 10),
    [scenes]
  );
  const currentSceneJobs = useMemo(() => {
    const sceneOrder = new Map<string, number>(scenes.map((scene, index) => [scene.id, index]));

    return jobs
      .filter((job) => job.workflowMode === 'storyboard' && job.sceneId && sceneOrder.has(job.sceneId))
      .sort((a, b) => (sceneOrder.get(a.sceneId ?? '') ?? 0) - (sceneOrder.get(b.sceneId ?? '') ?? 0));
  }, [jobs, scenes]);
  const completedSceneJobs = useMemo(
    () => currentSceneJobs.filter((job) => job.status === 'SUCCEEDED'),
    [currentSceneJobs]
  );
  const sourceLabel = useMemo(() => {
    if (sourceMode === 'avatar') {
      return selectedAvatar ? selectedAvatar.name : 'No avatar selected';
    }

    if (sourceMode === 'upload') {
      return uploadedSourceImageName ?? 'No image uploaded';
    }

    return 'Text prompt only';
  }, [selectedAvatar, sourceMode, uploadedSourceImageName]);

  const upsertJob = useCallback((nextJob: PersistedVideoJob) => {
    setJobs((prev) => {
      const existingIndex = prev.findIndex((job) => job.operationName === nextJob.operationName);

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = nextJob;
        return updated;
      }

      return [nextJob, ...prev].slice(0, MAX_STORED_JOBS);
    });
  }, []);

  const getActiveSourceImageDataUrl = useCallback(() => {
    if (sourceMode === 'avatar') {
      return selectedAvatar?.imageDataUrl;
    }

    if (sourceMode === 'upload') {
      return uploadedSourceImageDataUrl ?? undefined;
    }

    return undefined;
  }, [selectedAvatar, sourceMode, uploadedSourceImageDataUrl]);

  const validateSource = useCallback(() => {
    if (sourceMode === 'avatar' && !selectedAvatar) {
      setStatusMessage({ type: 'error', text: 'Select an avatar or switch the source to text before rendering.' });
      return false;
    }

    if (sourceMode === 'upload' && !uploadedSourceImageDataUrl) {
      setStatusMessage({ type: 'error', text: 'Upload a source image or switch the source to text before rendering.' });
      return false;
    }

    return true;
  }, [selectedAvatar, sourceMode, uploadedSourceImageDataUrl]);

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

      const draft = JSON.parse(rawDraft) as RestoredVideoWorkspace;
      if (draft.version !== 1 && draft.version !== 2) {
        window.localStorage.removeItem(draftStorageKey);
        setIsDraftReady(true);
        return;
      }

      setWorkflowMode(draft.workflowMode ?? 'single');
      setSourceMode(draft.sourceMode ?? ((draft.selectedAvatarId ?? null) ? 'avatar' : 'text'));
      setPrompt(draft.prompt ?? '');
      setNegativePrompt(draft.negativePrompt ?? '');
      setAspectRatio(draft.aspectRatio ?? '16:9');
      setDurationSeconds(draft.durationSeconds ?? 4);
      setModelPreset(draft.modelPreset ?? 'fast');
      setProvider(draft.provider ?? 'gemini');
      setIncludeAudio(draft.includeAudio ?? false);
      setSelectedAvatarId(draft.selectedAvatarId ?? null);
      setUploadedSourceImageDataUrl(draft.uploadedSourceImageDataUrl ?? null);
      setUploadedSourceImageName(draft.uploadedSourceImageName ?? null);
      setCameraMotion(draft.cameraMotion ?? 'cinematic');
      setVisualStyle(draft.visualStyle ?? 'premium');
      setShotPacing(draft.shotPacing ?? 'smooth');
      setScenes(draft.scenes?.length ? draft.scenes : createDefaultScenes(draft.durationSeconds ?? 4));
      const restoredJobs = (draft.jobs ?? []).map((job) => ({
        ...job,
        provider: job.provider ?? 'gemini',
        workflowMode: job.workflowMode ?? 'single',
        sourceMode: job.sourceMode ?? 'text',
      }));
      setJobs(restoredJobs);
      setSelectedOperationName(draft.selectedOperationName ?? restoredJobs[0]?.operationName ?? null);

      if (restoredJobs.length > 0) {
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

    const hasSceneContent = scenes.some((scene) => scene.prompt.trim().length > 0 || scene.title.trim().length > 0);
    const hasContent =
      prompt.trim().length > 0 ||
      negativePrompt.trim().length > 0 ||
      jobs.length > 0 ||
      !!selectedAvatarId ||
      !!uploadedSourceImageDataUrl ||
      includeAudio ||
      workflowMode !== 'single' ||
      sourceMode !== 'text' ||
      aspectRatio !== '16:9' ||
      durationSeconds !== 4 ||
      modelPreset !== 'fast' ||
      provider !== 'gemini' ||
      cameraMotion !== 'cinematic' ||
      visualStyle !== 'premium' ||
      shotPacing !== 'smooth' ||
      hasSceneContent;

    if (!hasContent) {
      window.localStorage.removeItem(draftStorageKey);
      return;
    }

    const draft: PersistedVideoWorkspace = {
      version: 2,
      workflowMode,
      sourceMode,
      prompt,
      negativePrompt,
      aspectRatio,
      durationSeconds,
      modelPreset,
      provider,
      includeAudio,
      selectedAvatarId,
      uploadedSourceImageDataUrl,
      uploadedSourceImageName,
      cameraMotion,
      visualStyle,
      shotPacing,
      scenes,
      selectedOperationName,
      jobs,
    };

    window.localStorage.setItem(draftStorageKey, JSON.stringify(draft));
  }, [
    aspectRatio,
    cameraMotion,
    draftStorageKey,
    durationSeconds,
    includeAudio,
    isDraftReady,
    jobs,
    modelPreset,
    negativePrompt,
    prompt,
    provider,
    scenes,
    selectedAvatarId,
    selectedOperationName,
    shotPacing,
    sourceMode,
    uploadedSourceImageDataUrl,
    uploadedSourceImageName,
    visualStyle,
    workflowMode,
  ]);

  useEffect(() => {
    if (!durationOptions.includes(durationSeconds)) {
      setDurationSeconds(durationOptions[0]);
    }

    setScenes((prev) =>
      prev.map((scene) =>
        durationOptions.includes(scene.durationSeconds)
          ? scene
          : {
              ...scene,
              durationSeconds: durationOptions[0],
            }
      )
    );
  }, [durationOptions, durationSeconds]);

  useEffect(() => {
    return () => {
      for (const url of Object.values(previewUrlsRef.current) as string[]) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  const ensurePreviewUrl = useCallback(async (job: PersistedVideoJob) => {
    if (previewUrlsRef.current[job.operationName]) {
      return previewUrlsRef.current[job.operationName];
    }

    const blob = await downloadGeneratedVideo(job.operationName, job.modelPreset, job.provider);
    const objectUrl = URL.createObjectURL(blob);
    previewUrlsRef.current[job.operationName] = objectUrl;
    setPreviewUrls((prev) => ({ ...prev, [job.operationName]: objectUrl }));
    return objectUrl;
  }, []);

  const loadPreview = useCallback(
    async (job: PersistedVideoJob) => {
      if (previewUrlsRef.current[job.operationName]) {
        return;
      }

      setLoadingPreviewFor(job.operationName);
      try {
        await ensurePreviewUrl(job);
      } catch (error) {
        setStatusMessage({
          type: 'error',
          text: error instanceof Error ? error.message : 'Could not load the generated video preview.',
        });
      } finally {
        setLoadingPreviewFor((current) => (current === job.operationName ? null : current));
      }
    },
    [ensurePreviewUrl]
  );

  const refreshJob = useCallback(
    async (job: PersistedVideoJob) => {
      try {
        const nextStatus = await getVideoGenerationStatus(job.operationName, job.modelPreset, job.provider);
        const updatedJob: PersistedVideoJob = {
          ...job,
          ...nextStatus,
          provider: nextStatus.provider ?? job.provider,
          updatedAt: new Date().toISOString(),
        };

        upsertJob(updatedJob);

        if (updatedJob.status === 'SUCCEEDED' && selectedOperationName === updatedJob.operationName) {
          void loadPreview(updatedJob);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not refresh video status.';
        setStatusMessage({ type: 'error', text: message });
        upsertJob({
          ...job,
          errorMessage: message,
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

    const intervalId = window.setInterval(() => {
      void Promise.allSettled(pendingJobs.map((job) => refreshJob(job)));
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

  const handleSourceUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setStatusMessage({ type: 'error', text: 'Choose an image file for image-to-video.' });
      return;
    }

    if (file.size > MAX_SOURCE_UPLOAD_SIZE_BYTES) {
      setStatusMessage({ type: 'error', text: 'Source image is too large. Use a file under 10MB.' });
      return;
    }

    try {
      const imageDataUrl = await readFileAsDataUrl(file);
      const optimizedImageDataUrl = await optimizeAvatarImageDataUrl(imageDataUrl);
      setUploadedSourceImageDataUrl(optimizedImageDataUrl);
      setUploadedSourceImageName(file.name.replace(/\.[^.]+$/, '') || 'Uploaded source');
      setSourceMode('upload');
      setStatusMessage({ type: 'success', text: 'Source image ready for image-to-video.' });
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not prepare the selected image.',
      });
    }
  };

  const updateScene = (sceneId: string, updates: Partial<VideoScene>) => {
    setScenes((prev) => prev.map((scene) => (scene.id === sceneId ? { ...scene, ...updates } : scene)));
  };

  const addScene = () => {
    setScenes((prev) => [...prev, createBlankScene(prev.length + 1, durationOptions[0])]);
  };

  const duplicateScene = (scene: VideoScene) => {
    setScenes((prev) => {
      const sourceIndex = prev.findIndex((item) => item.id === scene.id);
      const nextScene: VideoScene = {
        ...scene,
        id: createSceneId(),
        title: `${scene.title || 'Scene'} Copy`,
      };

      if (sourceIndex < 0) {
        return [...prev, nextScene];
      }

      return [...prev.slice(0, sourceIndex + 1), nextScene, ...prev.slice(sourceIndex + 1)];
    });
  };

  const removeScene = (sceneId: string) => {
    setScenes((prev) => (prev.length <= 1 ? prev : prev.filter((scene) => scene.id !== sceneId)));
  };

  const buildScenesFromPrompt = () => {
    const trimmedPrompt = prompt.trim();
    if (trimmedPrompt.length < 10) {
      setStatusMessage({ type: 'error', text: 'Add a stronger master prompt before building scenes.' });
      return;
    }

    const beats = [
      {
        title: 'Hook',
        instruction: 'Open with the strongest visual hook, immediate motion, and clear product or subject presence.',
      },
      {
        title: 'Detail',
        instruction: 'Move into a close detail shot that makes the product, person, or benefit feel tangible.',
      },
      {
        title: 'Payoff',
        instruction: 'End with a memorable hero shot that resolves the idea and leaves a polished campaign finish.',
      },
    ];

    setWorkflowMode('storyboard');
    setScenes(
      beats.map((beat, index) => ({
        id: createSceneId(),
        title: beat.title,
        prompt: `${trimmedPrompt}. ${beat.instruction}`,
        durationSeconds: durationOptions[Math.min(index, durationOptions.length - 1)],
      }))
    );
    setStatusMessage({ type: 'success', text: 'Built a three-scene reel from the master prompt.' });
  };

  const queueSingleClip = async () => {
    const trimmedPrompt = prompt.trim();
    if (trimmedPrompt.length < 10) {
      setStatusMessage({ type: 'error', text: `Describe the scene in a little more detail so ${activeProviderLabel} has enough context.` });
      return;
    }

    if (!validateSource()) {
      return;
    }

    const renderPrompt = composeVideoPrompt({
      basePrompt: trimmedPrompt,
      sourceMode,
      cameraMotion,
      visualStyle,
      shotPacing,
    });

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const job = await startVideoGeneration({
        prompt: renderPrompt,
        negativePrompt: negativePrompt.trim() || undefined,
        aspectRatio,
        durationSeconds,
        modelPreset,
        provider,
        includeAudio,
        sourceImageDataUrl: getActiveSourceImageDataUrl(),
      });

      const nextJob: PersistedVideoJob = {
        ...job,
        prompt: trimmedPrompt,
        renderPrompt,
        negativePrompt: negativePrompt.trim(),
        aspectRatio,
        durationSeconds,
        modelPreset,
        provider: job.provider ?? provider,
        includeAudio,
        workflowMode: 'single',
        sourceMode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      upsertJob(nextJob);
      setSelectedOperationName(nextJob.operationName);
      setStatusMessage({
        type: 'success',
        text: `Video job queued. We will keep checking until ${activeProviderLabel} finishes it.`,
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

  const queueSceneReel = async () => {
    if (!validateSource()) {
      return;
    }

    if (validScenes.length < 2) {
      setStatusMessage({ type: 'error', text: 'Add at least two scenes with full prompts before queueing a reel.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const queuedJobs = await Promise.allSettled(
        validScenes.map(async (scene, index) => {
          const trimmedPrompt = scene.prompt.trim();
          const renderPrompt = composeVideoPrompt({
            basePrompt: trimmedPrompt,
            sourceMode,
            cameraMotion,
            visualStyle,
            shotPacing,
            sceneIndex: index + 1,
            sceneCount: validScenes.length,
          });
          const job = await startVideoGeneration({
            prompt: renderPrompt,
            negativePrompt: negativePrompt.trim() || undefined,
            aspectRatio,
            durationSeconds: scene.durationSeconds,
            modelPreset,
            provider,
            includeAudio,
            sourceImageDataUrl: getActiveSourceImageDataUrl(),
          });

          return {
            ...job,
            prompt: trimmedPrompt,
            renderPrompt,
            negativePrompt: negativePrompt.trim(),
            aspectRatio,
            durationSeconds: scene.durationSeconds,
            modelPreset,
            provider: job.provider ?? provider,
            includeAudio,
            workflowMode: 'storyboard' as const,
            sourceMode,
            sceneId: scene.id,
            sceneTitle: scene.title.trim() || `Scene ${index + 1}`,
            sceneIndex: index + 1,
            sceneCount: validScenes.length,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } satisfies PersistedVideoJob;
        })
      );
      const successfulJobs = queuedJobs
        .filter((result): result is PromiseFulfilledResult<PersistedVideoJob> => result.status === 'fulfilled')
        .map((result) => result.value);
      const failedCount = queuedJobs.length - successfulJobs.length;

      if (successfulJobs.length > 0) {
        setJobs((prev) => {
          const queuedOperationNames = new Set(successfulJobs.map((job) => job.operationName));
          return [...successfulJobs, ...prev.filter((job) => !queuedOperationNames.has(job.operationName))].slice(0, MAX_STORED_JOBS);
        });
        setSelectedOperationName(successfulJobs[0].operationName);
      }

      if (failedCount > 0) {
        setStatusMessage({
          type: successfulJobs.length > 0 ? 'success' : 'error',
          text:
            successfulJobs.length > 0
              ? `${successfulJobs.length} scenes queued; ${failedCount} could not start.`
              : 'Could not start the scene reel.',
        });
        return;
      }

      setStatusMessage({
        type: 'success',
        text: `${successfulJobs.length} scenes queued. Completed scenes can be exported into one reel.`,
      });
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not start the scene reel.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (workflowMode === 'storyboard') {
      await queueSceneReel();
      return;
    }

    await queueSingleClip();
  };

  const handleDownload = async (job: PersistedVideoJob) => {
    try {
      const blob = await downloadGeneratedVideo(job.operationName, job.modelPreset, job.provider);
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

  const handleExportReel = async () => {
    if (completedSceneJobs.length < 2) {
      setStatusMessage({ type: 'error', text: 'At least two completed scenes are needed before exporting a reel.' });
      return;
    }

    setIsMerging(true);
    setMergeProgress('Preparing completed scenes');
    setStatusMessage(null);

    try {
      const videoUrls: string[] = [];
      for (const [index, job] of completedSceneJobs.entries()) {
        setMergeProgress(`Loading scene ${index + 1} of ${completedSceneJobs.length}`);
        videoUrls.push(await ensurePreviewUrl(job));
      }

      const blob = await createMergedVideoBlob({
        videoUrls,
        aspectRatio,
        onProgress: setMergeProgress,
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `social-studio-reel-${Date.now()}.webm`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      setStatusMessage({ type: 'success', text: 'Scene reel exported as a WebM video.' });
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not export the completed scene reel.',
      });
    } finally {
      setIsMerging(false);
      setMergeProgress(null);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
      <section className="surface-card rounded-[32px] p-6">
        <div className="border-b border-white/8 pb-5">
          <span className="section-kicker">
            <Film className="h-5 w-5 text-primary" />
            Video Director
          </span>
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/20 p-1">
            {WORKFLOW_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setWorkflowMode(option.id)}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
                  workflowMode === option.id ? 'bg-primary text-[#04161a]' : 'text-muted hover:bg-white/5 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">Source</label>
            <div className="grid grid-cols-3 gap-2">
              {SOURCE_MODE_OPTIONS.map((option) => {
                const Icon = option.icon;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSourceMode(option.id)}
                    className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-semibold transition-all ${
                      sourceMode === option.id
                        ? 'border-primary bg-primary/10 text-white'
                        : 'border-white/10 bg-black/20 text-muted hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {sourceMode === 'upload' && (
            <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
              <input ref={sourceImageInputRef} type="file" accept="image/*" onChange={handleSourceUpload} className="hidden" />
              {uploadedSourceImageDataUrl ? (
                <div className="space-y-3">
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    <img src={uploadedSourceImageDataUrl} alt={uploadedSourceImageName ?? 'Uploaded source'} className="aspect-video w-full object-cover" />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-medium text-white">{uploadedSourceImageName}</p>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => sourceImageInputRef.current?.click()}>
                        <Upload className="h-4 w-4" />
                        Replace
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setUploadedSourceImageDataUrl(null);
                          setUploadedSourceImageName(null);
                          setSourceMode('text');
                        }}
                      >
                        <X className="h-4 w-4" />
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Button type="button" variant="secondary" onClick={() => sourceImageInputRef.current?.click()} className="w-full">
                  <Upload className="h-4 w-4" />
                  Upload Source Image
                </Button>
              )}
            </div>
          )}

          {sourceMode === 'avatar' && (
            <AvatarLibraryPicker
              selectedAvatarId={selectedAvatarId}
              onSelectedAvatarIdChange={setSelectedAvatarId}
              onSelectedAvatarChange={setSelectedAvatar}
              title="Avatar Source"
              mode="select"
            />
          )}

          <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 text-xs leading-6 text-white/80">
            Active source: <span className="font-medium text-white">{sourceLabel}</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
              {workflowMode === 'storyboard' ? 'Master Brief' : 'Video Prompt'}
            </label>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              className="h-36 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-muted focus:border-primary/50 focus:ring-1 focus:ring-primary"
              placeholder="A kinetic ad for a luxury coffee brand, slow camera push-in, steam in the air, premium product close-up, cinematic lighting..."
            />
            {workflowMode === 'storyboard' && (
              <Button type="button" variant="secondary" size="sm" onClick={buildScenesFromPrompt} className="w-full">
                <Sparkles className="h-4 w-4" />
                Build Scenes From Brief
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Motion</label>
              <select
                value={cameraMotion}
                onChange={(event) => setCameraMotion(event.target.value as CameraMotion)}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none focus:border-primary/50"
              >
                {CAMERA_MOTION_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Style</label>
              <select
                value={visualStyle}
                onChange={(event) => setVisualStyle(event.target.value as VisualStyle)}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none focus:border-primary/50"
              >
                {VISUAL_STYLE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Pace</label>
              <select
                value={shotPacing}
                onChange={(event) => setShotPacing(event.target.value as ShotPacing)}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none focus:border-primary/50"
              >
                {SHOT_PACING_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">Negative Prompt</label>
            <textarea
              value={negativePrompt}
              onChange={(event) => setNegativePrompt(event.target.value)}
              className="h-20 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-muted focus:border-primary/50 focus:ring-1 focus:ring-primary"
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
                {durationOptions.map((seconds) => (
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
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">Provider</label>
            <div className="grid grid-cols-2 gap-2">
              {VIDEO_PROVIDER_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setProvider(option.id)}
                  className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                    provider === option.id
                      ? 'border-primary bg-primary/10'
                      : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${provider === option.id ? 'text-white' : 'text-white/85'}`}>
                      {option.label}
                    </span>
                    {provider === option.id && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="mt-1 text-xs text-muted">{option.description}</p>
                </button>
              ))}
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
                <p className="text-xs text-muted">Enabled when the selected model supports audio.</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={includeAudio}
              onChange={(event) => setIncludeAudio(event.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-black/20 text-primary focus:ring-primary"
            />
          </label>

          {workflowMode === 'storyboard' && (
            <div className="space-y-3 rounded-[28px] border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">Scenes</h3>
                  <p className="mt-1 text-xs text-muted">
                    {validScenes.length}/{scenes.length} ready, {validScenes.reduce((total, scene) => total + scene.durationSeconds, 0)}s target
                  </p>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={addScene}>
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>

              <div className="space-y-3">
                {scenes.map((scene, index) => (
                  <div key={scene.id} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1 space-y-3">
                        <input
                          value={scene.title}
                          onChange={(event) => updateScene(scene.id, { title: event.target.value })}
                          className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm font-medium text-white outline-none focus:border-primary/50"
                          placeholder={`Scene ${index + 1}`}
                        />
                        <textarea
                          value={scene.prompt}
                          onChange={(event) => updateScene(scene.id, { prompt: event.target.value })}
                          className="h-28 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-muted focus:border-primary/50"
                          placeholder="Describe the visual beat, action, camera movement, and subject..."
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          {durationOptions.map((seconds) => (
                            <button
                              key={seconds}
                              type="button"
                              onClick={() => updateScene(scene.id, { durationSeconds: seconds })}
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                scene.durationSeconds === seconds
                                  ? 'border-primary bg-primary/15 text-primary'
                                  : 'border-white/10 bg-black/20 text-muted hover:text-white'
                              }`}
                            >
                              {seconds}s
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => duplicateScene(scene)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-muted hover:text-white"
                          aria-label="Duplicate scene"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeScene(scene.id)}
                          disabled={scenes.length <= 1}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-muted hover:text-red-300 disabled:opacity-40"
                          aria-label="Remove scene"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button type="submit" isLoading={isSubmitting} className="w-full py-4">
            <Wand2 className="h-4 w-4" />
            {workflowMode === 'storyboard' ? 'Queue Scene Reel' : 'Generate Video'}
          </Button>

          {statusMessage && (
            <p className={`text-sm ${statusMessage.type === 'error' ? 'text-red-300' : 'text-emerald-300'}`}>
              {statusMessage.text}
            </p>
          )}
        </form>
      </section>

      <div className="space-y-6">
        {workflowMode === 'storyboard' && (
          <section className="surface-card rounded-[32px] p-6">
            <div className="flex flex-col gap-4 border-b border-white/8 pb-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">Scene Reel</h3>
                <p className="mt-1 text-sm text-muted">
                  {completedSceneJobs.length}/{Math.max(validScenes.length, currentSceneJobs.length)} scenes complete
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleExportReel()}
                isLoading={isMerging}
                disabled={completedSceneJobs.length < 2}
              >
                <Download className="h-4 w-4" />
                Export Reel
              </Button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {scenes.map((scene, index) => {
                const sceneJob = currentSceneJobs.find((job) => job.sceneId === scene.id);

                return (
                  <button
                    key={scene.id}
                    type="button"
                    onClick={() => sceneJob && setSelectedOperationName(sceneJob.operationName)}
                    className={`rounded-[22px] border p-4 text-left transition-all ${
                      sceneJob && selectedJob?.operationName === sceneJob.operationName
                        ? 'border-primary/30 bg-primary/10'
                        : 'border-white/10 bg-black/20 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Scene {index + 1}</span>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${sceneJob ? getStatusTone(sceneJob.status) : 'bg-white/5 text-muted'}`}>
                        {sceneJob?.status ?? 'Draft'}
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-1 text-sm font-medium text-white">{scene.title || `Scene ${index + 1}`}</p>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">{scene.prompt || 'No prompt yet.'}</p>
                  </button>
                );
              })}
            </div>

            {mergeProgress && <p className="mt-4 text-sm text-primary">{mergeProgress}</p>}
          </section>
        )}

        <section className="surface-card rounded-[32px] p-6">
          <div className="flex flex-col gap-4 border-b border-white/8 pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">Preview</h3>
              <p className="mt-1 text-sm text-muted">
                {selectedJob
                  ? `${selectedJob.sceneTitle ? `${selectedJob.sceneTitle} - ` : ''}${formatTimestamp(selectedJob.createdAt)}`
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
                  <p className="mt-2 text-sm text-muted">Queued clips and completed scenes will appear here.</p>
                </div>
              </div>
            ) : selectedJob.status === 'FAILED' ? (
              <div className="rounded-[28px] border border-red-400/20 bg-red-500/5 p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-red-300" />
                  <div>
                    <p className="text-lg font-medium text-white">Generation failed</p>
                    <p className="mt-2 text-sm leading-6 text-red-200">
                      {selectedJob.errorMessage || `${getProviderLabel(selectedJob.provider)} was unable to complete this request.`}
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
                    {getProviderLabel(selectedJob.provider)} is still working on this clip.
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
                    {selectedJob.workflowMode === 'storyboard' && selectedJob.sceneIndex && (
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                        Scene {selectedJob.sceneIndex}/{selectedJob.sceneCount}
                      </span>
                    )}
                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white">{selectedJob.aspectRatio}</span>
                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white">{selectedJob.durationSeconds}s</span>
                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white">
                      {selectedJob.modelPreset === 'fast' ? 'Fast render' : 'Quality render'}
                    </span>
                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white">
                      {selectedJob.provider === 'openrouter' ? 'OpenRouter' : 'Gemini'}
                    </span>
                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white">
                      {selectedJob.sourceMode === 'text' ? 'Text-to-video' : 'Image-to-video'}
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
              <p className="mt-1 text-sm text-muted">Stored in this browser for preview and download.</p>
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
                        {job.workflowMode === 'storyboard' && job.sceneIndex && (
                          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] text-primary">Scene {job.sceneIndex}</span>
                        )}
                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-muted">{job.aspectRatio}</span>
                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-muted">{job.durationSeconds}s</span>
                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-muted">
                          {job.provider === 'openrouter' ? 'OpenRouter' : 'Gemini'}
                        </span>
                        <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-muted">
                          {job.sourceMode === 'text' ? 'Text' : 'Image'}
                        </span>
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/90">{job.sceneTitle ? `${job.sceneTitle}: ${job.prompt}` : job.prompt}</p>
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
