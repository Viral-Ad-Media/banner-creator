import { apiFetch } from './apiClient';

export interface AvatarAsset {
  id: string;
  name: string;
  imageDataUrl: string;
  source: 'upload' | 'generated';
  prompt?: string;
  createdAt: string;
}

const MAX_AVATAR_STORAGE_BYTES = 350 * 1024;
const MAX_AVATAR_DIMENSION_PX = 1024;
const MIN_AVATAR_DIMENSION_PX = 320;
const AVATAR_QUALITY_STEPS = [0.9, 0.82, 0.74, 0.66] as const;

type AvatarLibraryResponse = {
  avatars: AvatarAsset[];
};

type AvatarResponse = {
  avatar: AvatarAsset;
};

const getDataUrlByteSize = (imageDataUrl: string) => {
  const [, base64Data = ''] = imageDataUrl.split(',', 2);
  return Math.ceil((base64Data.length * 3) / 4);
};

const getScaledDimensions = (width: number, height: number, maxDimension: number) => {
  if (Math.max(width, height) <= maxDimension) {
    return { width, height };
  }

  const scale = maxDimension / Math.max(width, height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};

const loadImageElement = (imageDataUrl: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not process the avatar image.'));
    image.src = imageDataUrl;
  });

export const listAvatarLibrary = async (): Promise<AvatarAsset[]> => {
  const response = await apiFetch<AvatarLibraryResponse>('/avatars');
  return response.avatars;
};

export const createAvatar = async (params: {
  name: string;
  imageDataUrl: string;
  source: AvatarAsset['source'];
  prompt?: string;
}): Promise<AvatarAsset> => {
  const response = await apiFetch<AvatarResponse>('/avatars', {
    method: 'POST',
    body: JSON.stringify(params),
  });

  return response.avatar;
};

export const deleteAvatar = async (avatarId: string): Promise<void> => {
  await apiFetch(`/avatars/${avatarId}`, {
    method: 'DELETE',
  });
};

export const optimizeAvatarImageDataUrl = async (imageDataUrl: string): Promise<string> => {
  if (typeof document === 'undefined' || !imageDataUrl.startsWith('data:image/')) {
    return imageDataUrl;
  }

  if (getDataUrlByteSize(imageDataUrl) <= MAX_AVATAR_STORAGE_BYTES) {
    return imageDataUrl;
  }

  const image = await loadImageElement(imageDataUrl);
  const naturalWidth = image.naturalWidth || image.width;
  const naturalHeight = image.naturalHeight || image.height;

  if (!naturalWidth || !naturalHeight) {
    return imageDataUrl;
  }

  let bestCandidate = imageDataUrl;
  let maxDimension = Math.min(Math.max(naturalWidth, naturalHeight), MAX_AVATAR_DIMENSION_PX);

  while (true) {
    const { width, height } = getScaledDimensions(naturalWidth, naturalHeight, maxDimension);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      return bestCandidate;
    }

    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    for (const quality of AVATAR_QUALITY_STEPS) {
      const candidate = canvas.toDataURL('image/webp', quality);

      if (getDataUrlByteSize(candidate) < getDataUrlByteSize(bestCandidate)) {
        bestCandidate = candidate;
      }

      if (getDataUrlByteSize(candidate) <= MAX_AVATAR_STORAGE_BYTES) {
        return candidate;
      }
    }

    if (maxDimension <= MIN_AVATAR_DIMENSION_PX) {
      return bestCandidate;
    }

    const nextDimension = Math.max(MIN_AVATAR_DIMENSION_PX, Math.floor(maxDimension * 0.82));
    if (nextDimension === maxDimension) {
      return bestCandidate;
    }

    maxDimension = nextDimension;
  }
};
