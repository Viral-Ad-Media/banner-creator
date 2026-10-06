import { dispatchWithRequestKey } from "./requestLifecycle";
import { apiFetch, HttpError } from "./apiClient";
import { supabase } from "./supabaseClient";
import { getOrCreateRequestKey, clearRequestKey } from "./draftStore";
// An interrupted dispatch keeps its key across navigation/reload. Repeating it never buys a second job.
export const generationPost = async <T>(
  path: string,
  payload: unknown,
): Promise<T> => {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) throw new HttpError(401, "Sign in before generating.");
  const body = JSON.stringify(payload);
  const hash = Array.from(
    new Uint8Array(
      await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(path + body),
      ),
    ),
  )
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const storageKey = `generation-request:${userId}:${hash}`;
  const key = await getOrCreateRequestKey(storageKey);
  return dispatchWithRequestKey(
    key,
    () =>
      apiFetch<T>(path, {
        method: "POST",
        headers: { "Idempotency-Key": key },
        body,
      }),
    (expected) => clearRequestKey(storageKey, expected),
    (error) =>
      error instanceof HttpError &&
      [400, 401, 402, 404, 413, 422, 501].includes(error.status),
  );
};
