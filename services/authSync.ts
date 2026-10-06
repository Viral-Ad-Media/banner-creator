// Only the latest session may receive a profile result. Coalesce refresh events without losing them.
export const createAuthSync = <T>(callbacks: {
  load: () => Promise<T>;
  success: (value: T) => void;
  failure: (error: unknown) => void;
  settled: () => void;
}) => {
  let revision = 0;
  let queued = false;
  let running = false;
  let active = true;
  const refresh = async () => {
    if (!active) return;
    revision++;
    queued = true;
    if (running) return;
    running = true;
    try {
      while (queued && active) {
        queued = false;
        const attempt = revision;
        try {
          const result = await callbacks.load();
          if (active && attempt === revision) callbacks.success(result);
        } catch (error) {
          if (active && attempt === revision) callbacks.failure(error);
        }
      }
    } finally {
      running = false;
      if (active) callbacks.settled();
    }
  };
  const invalidate = () => {
    revision++;
    queued = false;
  };
  return {
    refresh,
    invalidate,
    dispose: () => {
      active = false;
      invalidate();
    },
  };
};
