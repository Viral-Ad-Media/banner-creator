// IndexedDB stores each binary data URL once per draft. No synchronous JSON serialization on edits.
type PackedDraft = { version: 1; value: unknown; assets: string[] };
const queues = new Map<string, Promise<void>>();
const openDb = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("social-studio-drafts", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("drafts");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
export const packDraft = (value: unknown): PackedDraft => {
  const assets: string[] = [];
  const indices = new Map<string, number>();
  const pack = (item: any): any => {
    if (typeof item === "string" && item.startsWith("data:image/")) {
      let id = indices.get(item);
      if (id === undefined) {
        id = assets.length;
        indices.set(item, id);
        assets.push(item);
      }
      return { __imageAsset: id };
    }
    if (Array.isArray(item)) return item.map(pack);
    if (item && typeof item === "object")
      return Object.fromEntries(
        Object.entries(item).map(([k, v]) => [k, pack(v)]),
      );
    return item;
  };
  return { version: 1, value: pack(value), assets };
};
export const unpackDraft = (packed: PackedDraft): any => {
  const unpack = (item: any): any => {
    if (
      item &&
      typeof item === "object" &&
      typeof item.__imageAsset === "number" &&
      Object.keys(item).length === 1
    )
      return packed.assets[item.__imageAsset];
    if (Array.isArray(item)) return item.map(unpack);
    if (item && typeof item === "object")
      return Object.fromEntries(
        Object.entries(item).map(([k, v]) => [k, unpack(v)]),
      );
    return item;
  };
  return unpack(packed.value);
};
export const setDraft = (key: string, value: unknown): Promise<void> => {
  const operation = (queues.get(key) ?? Promise.resolve())
    .catch(() => {})
    .then(async () => {
      const db = await openDb();
      try {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction("drafts", "readwrite");
          tx.objectStore("drafts").put(packDraft(value), key);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
          tx.onabort = () => reject(tx.error);
        });
      } finally {
        db.close();
      }
    });
  queues.set(key, operation);
  void operation
    .finally(() => {
      if (queues.get(key) === operation) queues.delete(key);
    })
    .catch(() => {});
  return operation;
};
export const getDraft = async <T = any>(key: string): Promise<T | null> => {
  await queues.get(key)?.catch(() => {});
  const db = await openDb();
  let record: PackedDraft | undefined;
  try {
    record = await new Promise((resolve, reject) => {
      const r = db.transaction("drafts").objectStore("drafts").get(key);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  } finally {
    db.close();
  }
  if (record) return unpackDraft(record);
  const legacy = localStorage.getItem(key);
  if (!legacy) return null;
  const value = JSON.parse(legacy);
  await setDraft(key, value);
  localStorage.removeItem(key);
  return value;
};
export const removeDraft = (key: string) => setDraft(key, null);

// One read/write transaction chooses a request key, including across tabs.
export const getOrCreateRequestKey = async (key: string): Promise<string> => {
  const db = await openDb();
  try {
    return await new Promise<string>((resolve, reject) => {
      const tx = db.transaction("drafts", "readwrite");
      const store = tx.objectStore("drafts");
      let result: string;
      const request = store.get(key);
      request.onsuccess = () => {
        const previous = request.result ? unpackDraft(request.result) : null;
        result = typeof previous === "string" ? previous : crypto.randomUUID();
        if (typeof previous !== "string") store.put(packDraft(result), key);
      };
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
};

// Late completion of an earlier attempt must not delete a newer attempt's key.
export const clearRequestKey = async (
  storageKey: string,
  expected: string,
): Promise<void> => {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("drafts", "readwrite");
      const store = tx.objectStore("drafts");
      const request = store.get(storageKey);
      request.onsuccess = () => {
        if (request.result && unpackDraft(request.result) === expected)
          store.delete(storageKey);
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
};
