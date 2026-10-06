// Storage cleanup is best effort after dispatch: never turn paid success into a failure.
export const dispatchWithRequestKey = async <T>(
  key: string,
  dispatch: () => Promise<T>,
  clear: (key: string) => Promise<void>,
  definitiveFailure: (error: unknown) => boolean,
): Promise<T> => {
  const cleanup = async () => {
    try {
      await clear(key);
    } catch (error) {
      console.warn("Request key retained because local cleanup failed.", error);
    }
  };
  try {
    const result = await dispatch();
    await cleanup();
    return result;
  } catch (error) {
    if (definitiveFailure(error)) await cleanup();
    throw error;
  }
};
