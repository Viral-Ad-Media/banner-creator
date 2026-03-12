import { apiFetch } from './apiClient';

export type AspectRatio = '1:1' | '16:9' | '9:16' | '3:4' | '4:5';

export interface BannerRequest {
  userPrompt: string;
  aspectRatio: AspectRatio;
  hasBackgroundImage?: boolean;
  hasAssetImage?: boolean;
  projectId?: string;
}

export interface BannerPlan {
  main_banner: {
    headline: string;
    subheadline: string;
    image_prompt: string;
    description: string;
    cta: string;
  };
  additional_banners: {
    title: string;
    subtitle: string;
    image_prompt: string;
    description: string;
    cta: string;
  }[];
  seo: {
    caption: string;
    hashtags: string[];
    keywords: string[];
  };
}

type PlanResponse = {
  data: BannerPlan;
};

type ImageResponse = {
  data: string;
};

export const generateBannerPlan = async (request: BannerRequest): Promise<BannerPlan> => {
  const response = await apiFetch<PlanResponse>('/generations/plan', {
    method: 'POST',
    body: JSON.stringify(request),
  });

  return response.data;
};

export const generateImage = async (
  prompt: string,
  aspectRatio: AspectRatio,
  referenceImages: string[] = []
): Promise<string> => {
  const response = await apiFetch<ImageResponse>('/generations/image', {
    method: 'POST',
    body: JSON.stringify({ prompt, aspectRatio, referenceImages }),
  });

  return response.data;
};

export const editImageWithGemini = async (base64Image: string, prompt: string): Promise<string> => {
  const response = await apiFetch<ImageResponse>('/generations/edit', {
    method: 'POST',
    body: JSON.stringify({ base64Image, prompt }),
  });

  return response.data;
};
