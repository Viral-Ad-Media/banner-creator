import { apiFetch, apiFetchBlob } from './apiClient';

export type VideoAspectRatio = '16:9' | '9:16';
export type VideoDurationSeconds = 4 | 5 | 6 | 8;
export type VideoModelPreset = 'fast' | 'quality';
export type VideoProvider = 'gemini' | 'openrouter';
export type VideoJobState = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';

export interface VideoGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  aspectRatio: VideoAspectRatio;
  durationSeconds: VideoDurationSeconds;
  modelPreset: VideoModelPreset;
  includeAudio: boolean;
  sourceImageDataUrl?: string;
  provider: VideoProvider;
}

export interface VideoGenerationJobStatus {
  operationName: string;
  status: VideoJobState;
  done: boolean;
  errorMessage?: string;
  mimeType?: string;
  modelId?: string;
  provider?: VideoProvider;
}

type VideoJobResponse = {
  job: VideoGenerationJobStatus;
};

const createVideoQueryString = (operationName: string, modelPreset?: VideoModelPreset, provider?: VideoProvider) => {
  const searchParams = new URLSearchParams({ operationName });
  if (modelPreset) {
    searchParams.set('modelPreset', modelPreset);
  }
  if (provider) {
    searchParams.set('provider', provider);
  }
  return searchParams.toString();
};

export const startVideoGeneration = async (request: VideoGenerationRequest) => {
  const response = await apiFetch<VideoJobResponse>('/generations/video', {
    method: 'POST',
    body: JSON.stringify(request),
  });

  return response.job;
};

export const getVideoGenerationStatus = async (
  operationName: string,
  modelPreset?: VideoModelPreset,
  provider?: VideoProvider
) => {
  const query = createVideoQueryString(operationName, modelPreset, provider);
  const response = await apiFetch<VideoJobResponse>(`/generations/video/status?${query}`);
  return response.job;
};

export const downloadGeneratedVideo = async (
  operationName: string,
  modelPreset?: VideoModelPreset,
  provider?: VideoProvider
) => {
  const query = createVideoQueryString(operationName, modelPreset, provider);
  return apiFetchBlob(`/generations/video/download?${query}`);
};
