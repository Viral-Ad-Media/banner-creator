import { test } from "node:test";
import assert from "node:assert/strict";
import { packDraft, unpackDraft } from "../services/draftStore";
import {
  wrapText,
  getCanvasDimensions,
  deleteLayers,
} from "../services/canvasRenderer";
test("drafts deduplicate images and preserve editable document data", () => {
  const image = "data:image/png;base64,AAAA";
  const value = {
    background: image,
    images: { main: image },
    layers: [{ content: image }],
    prompt: "test",
  };
  const packed = packDraft(value);
  assert.equal(packed.assets.length, 1);
  assert.deepEqual(unpackDraft(packed), value);
});
test("text export wraps words and preserves explicit newlines", () => {
  assert.deepEqual(
    wrapText("one two\nthree", 7, (s) => s.length),
    ["one two", "three"],
  );
  assert.deepEqual(
    wrapText("longword", 4, (s) => s.length),
    ["long", "word"],
  );
});
test("layout and export share exact document sizes for every aspect ratio", () => {
  assert.deepEqual(getCanvasDimensions("1:1"), { width: 800, height: 800 });
  assert.deepEqual(getCanvasDimensions("4:5"), { width: 640, height: 800 });
  assert.deepEqual(getCanvasDimensions("9:16"), { width: 450, height: 800 });
});
test("deleting an explicit layer does not delete the previously selected layer", () => {
  const elements = [{ id: "a" }, { id: "b" }] as any;
  assert.deepEqual(deleteLayers(elements, ["b"]), [{ id: "a" }]);
});

test("simultaneous retries share a persistent request key", async () => {
  const { indexedDB } = await import("fake-indexeddb");
  Object.assign(globalThis, { indexedDB });
  const { getOrCreateRequestKey, removeDraft } =
    await import("../services/draftStore.ts");
  const keys = await Promise.all(
    Array.from({ length: 8 }, () => getOrCreateRequestKey("same-request")),
  );
  assert.equal(new Set(keys).size, 1);
  assert.equal(await getOrCreateRequestKey("same-request"), keys[0]);
  await removeDraft("same-request");
  assert.notEqual(await getOrCreateRequestKey("same-request"), keys[0]);
});

test("reels select one latest attempt per scene in storyboard order", async () => {
  const { latestSceneJobs } = await import("../services/videoStoryboard");
  const jobs = [
    {
      workflowMode: "storyboard",
      sceneId: "b",
      createdAt: "2026-10-01",
      status: "SUCCEEDED",
    },
    {
      workflowMode: "storyboard",
      sceneId: "a",
      createdAt: "2026-10-01",
      status: "SUCCEEDED",
    },
    {
      workflowMode: "storyboard",
      sceneId: "a",
      createdAt: "2026-10-02",
      status: "RUNNING",
    },
    {
      workflowMode: "storyboard",
      sceneId: "removed",
      createdAt: "2026-10-03",
      status: "SUCCEEDED",
    },
  ];
  const selected = latestSceneJobs(jobs, ["a", "b"]);
  assert.deepEqual(selected, [jobs[2], jobs[0]]);
  assert.equal(selected.filter((job) => job.status === "SUCCEEDED").length, 1);
});
