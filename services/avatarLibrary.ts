export interface AvatarAsset {
  id: string;
  name: string;
  imageDataUrl: string;
  source: 'upload' | 'generated';
  prompt?: string;
  createdAt: string;
}

type AvatarLibraryPayload = {
  version: 1;
  avatars: AvatarAsset[];
};

const MAX_AVATARS = 12;

const createEmptyLibrary = (): AvatarLibraryPayload => ({
  version: 1,
  avatars: [],
});

export const loadAvatarLibrary = (storageKey: string): AvatarAsset[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue) as AvatarLibraryPayload;
    if (parsed.version !== 1 || !Array.isArray(parsed.avatars)) {
      window.localStorage.removeItem(storageKey);
      return [];
    }

    return parsed.avatars;
  } catch (error) {
    console.error('Failed to load avatar library', error);
    window.localStorage.removeItem(storageKey);
    return [];
  }
};

export const saveAvatarLibrary = (storageKey: string, avatars: AvatarAsset[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  const payload: AvatarLibraryPayload = {
    version: 1,
    avatars: avatars.slice(0, MAX_AVATARS),
  };

  window.localStorage.setItem(storageKey, JSON.stringify(payload));
};

export const createAvatarAsset = (params: {
  name: string;
  imageDataUrl: string;
  source: AvatarAsset['source'];
  prompt?: string;
}): AvatarAsset => ({
  id:
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  name: params.name,
  imageDataUrl: params.imageDataUrl,
  source: params.source,
  prompt: params.prompt,
  createdAt: new Date().toISOString(),
});
