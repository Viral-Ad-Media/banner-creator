export interface OnboardingState {
  version: 1;
  hasSeenWelcome: boolean;
  hasCompletedTour: boolean;
}

const STORAGE_PREFIX = 'social-studio:onboarding';

const DEFAULT_STATE: OnboardingState = {
  version: 1,
  hasSeenWelcome: false,
  hasCompletedTour: false,
};

const getStorageKey = (userId: string) => `${STORAGE_PREFIX}:${userId}:v1`;

export const getOnboardingState = (userId: string): OnboardingState => {
  if (typeof window === 'undefined') {
    return DEFAULT_STATE;
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(userId));
    if (!raw) {
      return DEFAULT_STATE;
    }

    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    if (parsed.version !== 1) {
      return DEFAULT_STATE;
    }

    return { ...DEFAULT_STATE, ...parsed };
  } catch (error) {
    console.error('Failed to read onboarding state', error);
    return DEFAULT_STATE;
  }
};

const saveOnboardingState = (userId: string, state: OnboardingState) => {
  if (typeof window === 'undefined') {
    return state;
  }

  try {
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(state));
  } catch (error) {
    console.error('Failed to persist onboarding state', error);
  }

  return state;
};

export const markWelcomeSeen = (userId: string): OnboardingState =>
  saveOnboardingState(userId, { ...getOnboardingState(userId), hasSeenWelcome: true });

export const markTourCompleted = (userId: string): OnboardingState =>
  saveOnboardingState(userId, { ...getOnboardingState(userId), hasCompletedTour: true });

export const resetTour = (userId: string): OnboardingState =>
  saveOnboardingState(userId, { ...getOnboardingState(userId), hasCompletedTour: false });
