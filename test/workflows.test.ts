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

test("late completion cannot clear a newer generation request key", async () => {
  const { indexedDB } = await import("fake-indexeddb");
  Object.assign(globalThis, { indexedDB });
  const { getOrCreateRequestKey, clearRequestKey, setDraft } =
    await import("../services/draftStore");
  const old = await getOrCreateRequestKey("late-cleanup");
  await clearRequestKey("late-cleanup", old);
  const fresh = await getOrCreateRequestKey("late-cleanup");
  await clearRequestKey("late-cleanup", old);
  assert.equal(await getOrCreateRequestKey("late-cleanup"), fresh);
  await setDraft("bad-key", { invalid: true });
  const repaired = await getOrCreateRequestKey("bad-key");
  assert.equal(await getOrCreateRequestKey("bad-key"), repaired);
});

test("canvas export honors background opacity and loads the selected italic font", async () => {
  const { renderCanvasDocument } = await import("../services/canvasRenderer");
  const originalDocument = Object.getOwnPropertyDescriptor(
    globalThis,
    "document",
  );
  const fonts: string[] = [];
  const fills: number[] = [];
  const text: string[] = [];
  const stack: number[] = [];
  const ctx: any = {
    globalAlpha: 1,
    save() {
      stack.push(this.globalAlpha);
    },
    restore() {
      this.globalAlpha = stack.pop();
    },
    fillRect() {
      fills.push(this.globalAlpha);
    },
    translate() {},
    rotate() {},
    scale() {},
    measureText(value: string) {
      return { width: value.length * 8 };
    },
    fillText(value: string) {
      text.push(value);
    },
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ctx,
    toDataURL: () => "data:image/png;base64,export",
  };
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      createElement: () => canvas,
      fonts: {
        load: async (value: string) => {
          fonts.push(value);
        },
        ready: Promise.resolve(),
      },
    },
  });
  try {
    await renderCanvasDocument(
      "1:1",
      [
        {
          type: "text",
          content: "Exported headline",
          x: 20,
          y: 20,
          width: 200,
          height: 60,
          rotation: 0,
          style: {
            zIndex: 1,
            fontFamily: "Inter",
            fontSize: 20,
            fontStyle: "italic",
            fontWeight: "bold",
          },
        } as any,
      ],
      { type: "color", value: "#000000", opacity: 0.25 },
    );
    assert.deepEqual(fills, [1, 0.25]);
    assert.equal(fonts[0], 'italic bold 20px "Inter"');
    assert.deepEqual(text, ["Exported headline"]);
  } finally {
    if (originalDocument)
      Object.defineProperty(globalThis, "document", originalDocument);
    else delete (globalThis as any).document;
  }
});
