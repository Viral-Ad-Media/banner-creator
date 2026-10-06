import { generationPost } from "./generationRequest";
import { optimizeAvatarImageDataUrl } from "./avatarLibrary";

export type AspectRatio = "1:1" | "16:9" | "9:16" | "3:4" | "4:5";
export type TextGenerationProvider = "gemini" | "openrouter";

export interface BannerRequest {
  userPrompt: string;
  aspectRatio: AspectRatio;
  bannerCount?: number;
  hasBackgroundImage?: boolean;
  hasAssetImage?: boolean;
  textProvider?: TextGenerationProvider;
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

export const generateBannerPlan = async (
  request: BannerRequest,
): Promise<BannerPlan> => {
  const response = await generationPost<PlanResponse>(
    "/generations/plan",
    request,
  );

  return response.data;
};

export const generateImage = async (
  prompt: string,
  aspectRatio: AspectRatio,
  referenceImages: string[] = [],
  projectId?: string,
): Promise<string> => {
  const response = await generationPost<ImageResponse>("/generations/image", {
    prompt,
    aspectRatio,
    referenceImages: await Promise.all(
      referenceImages.slice(0, 2).map(optimizeAvatarImageDataUrl),
    ),
    projectId,
  });

  return response.data;
};

export const editImageWithGemini = async (
  base64Image: string,
  prompt: string,
): Promise<string> => {
  const response = await generationPost<ImageResponse>("/generations/edit", {
    base64Image: await optimizeAvatarImageDataUrl(base64Image),
    prompt,
  });

  return response.data;
};
