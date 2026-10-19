import { test } from "node:test";
import assert from "node:assert/strict";
import { createAuthSync } from "../services/authSync";
import { dispatchWithRequestKey } from "../services/requestLifecycle";
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

test("sign-out invalidates an in-flight profile response", async () => {
  const request = deferred<string>();
  const updates: string[] = [];
  const sync = createAuthSync({
    load: () => request.promise,
    success: (value) => updates.push(value),
    failure: () => assert.fail(),
    settled: () => {},
  });
  const loading = sync.refresh();
  sync.invalidate();
  request.resolve("old-account");
  await loading;
  assert.deepEqual(updates, []);
});

test("a session change during profile loading refreshes the latest account", async () => {
  const request = deferred<string>();
  const updates: string[] = [];
  let calls = 0;
  const sync = createAuthSync({
    load: () =>
      ++calls === 1 ? request.promise : Promise.resolve("new-account"),
    success: (value) => updates.push(value),
    failure: () => assert.fail(),
    settled: () => {},
  });
  const loading = sync.refresh();
  await sync.refresh();
  request.resolve("old-account");
  await loading;
  assert.equal(calls, 2);
  assert.deepEqual(updates, ["new-account"]);
});

test("unmount ignores both pending success and future refreshes", async () => {
  const request = deferred<string>();
  let calls = 0;
  const sync = createAuthSync({
    load: () => {
      calls++;
      return request.promise;
    },
    success: () => assert.fail(),
    failure: () => assert.fail(),
    settled: () => assert.fail(),
  });
  const loading = sync.refresh();
  sync.dispose();
  request.resolve("old-account");
  await loading;
  await sync.refresh();
  assert.equal(calls, 1);
});

test("local request-key cleanup failure never discards a successful generation", async () => {
  const warn = console.warn;
  console.warn = () => {};
  try {
    const output = await dispatchWithRequestKey(
      "key",
      async () => ({ data: "paid-output" }),
      async () => {
        throw new Error("Quota exceeded");
      },
      () => false,
    );
    assert.deepEqual(output, { data: "paid-output" });
  } finally {
    console.warn = warn;
  }
});

test("unknown dispatch keeps its key and definitive failure preserves the original error", async () => {
  const error = new Error("Rejected");
  let clears = 0;
  const warn = console.warn;
  console.warn = () => {};
  try {
    await assert.rejects(
      dispatchWithRequestKey(
        "key",
        async () => {
          throw error;
        },
        async () => {
          clears++;
        },
        () => false,
      ),
      (candidate) => candidate === error,
    );
    assert.equal(clears, 0);
    await assert.rejects(
      dispatchWithRequestKey(
        "key",
        async () => {
          throw error;
        },
        async () => {
          clears++;
          throw new Error("Storage blocked");
        },
        () => true,
      ),
      (candidate) => candidate === error,
    );
    assert.equal(clears, 1);
  } finally {
    console.warn = warn;
  }
});
