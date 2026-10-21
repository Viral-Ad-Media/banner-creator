import { ProjectToolbar } from "./workspace/ProjectToolbar";
import { getDraft, setDraft, removeDraft } from "../services/draftStore";
import { renderCanvasDocument } from "../services/canvasRenderer";
import { optimizeAvatarImageDataUrl } from "../services/avatarLibrary";

import React, { useEffect, useRef, useState } from "react";
import {
  generateBannerPlan,
  generateImage,
  BannerPlan,
  AspectRatio,
  TextGenerationProvider,
} from "../services/geminiService";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { NativeSelect, NativeSelectOption } from "./ui/native-select";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import { Spinner } from "./ui/spinner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Download,
  Image as ImageIcon,
  Upload,
  X,
  Copy,
  RefreshCcw,
} from "lucide-react";
import { CanvasEditor, CanvasElement, BackgroundState } from "./CanvasEditor";
import { AvatarLibraryPicker } from "./workspace/AvatarLibraryPicker";
import { Hint } from "./ui/hint";
import type { AvatarAsset } from "../services/avatarLibrary";

const BANNER_COUNT_OPTIONS = [1, 2, 3, 4, 5, 6] as const;
type BannerCount = (typeof BANNER_COUNT_OPTIONS)[number];
const DEFAULT_BANNER_COUNT: BannerCount = 3;
const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const PLANNER_MODEL_OPTIONS: Array<{
  id: TextGenerationProvider;
  label: string;
}> = [
  { id: "gemini", label: "Gemini (default planner model)" },
  { id: "openrouter", label: "OpenRouter (server-configured model)" },
];

interface CopyGeneratorProps {
  draftStorageKey?: string;
}

type PersistedWorkspaceDraft = {
  version: 1;
  userPrompt: string;
  backgroundImage: string | null;
  assetImage: string | null;
  selectedAvatarId?: string | null;
  aspectRatio: AspectRatio;
  bannerCount?: BannerCount;
  textProvider?: TextGenerationProvider;
  plan: BannerPlan | null;
  generatedImages: Record<string, string>;
  rawBackgrounds: Record<string, string>;
  savedLayers: Record<string, CanvasElement[]>;
  editorBackgrounds: Record<string, BackgroundState>;
  generationErrors: Record<string, string>;
};

// Planner output may or may not include the leading "#"; never print "##tag".
const formatHashtags = (tags: string[]) =>
  tags
    .map((tag) => tag.trim().replace(/^#+/, ""))
    .filter(Boolean)
    .map((tag) => `#${tag}`)
    .join(" ");

const FORMAT_OPTIONS: Array<{ id: AspectRatio; label: string; w: number; h: number }> = [
  { id: "1:1", label: "Square", w: 1, h: 1 },
  { id: "4:5", label: "Portrait", w: 4, h: 5 },
  { id: "9:16", label: "Story", w: 9, h: 16 },
  { id: "16:9", label: "Landscape", w: 16, h: 9 },
];

const aspectClass = (ratio: AspectRatio) =>
  ratio === "9:16"
    ? "aspect-[9/16]"
    : ratio === "16:9"
      ? "aspect-video"
      : ratio === "4:5"
        ? "aspect-[4/5]"
        : ratio === "3:4"
          ? "aspect-[3/4]"
          : "aspect-square";

/** A small outline drawn at the format's real proportions. */
const RatioGlyph: React.FC<{ w: number; h: number }> = ({ w, h }) => {
  const scale = 16 / Math.max(w, h);
  return (
    <span
      aria-hidden="true"
      className="block rounded-[2px] border-[1.5px] border-current"
      style={{ width: w * scale, height: h * scale }}
    />
  );
};

const AssetSlot: React.FC<{
  label: string;
  image: string | null;
  fit: "cover" | "contain";
  icon: React.ReactNode;
  onPick: () => void;
  onClear: () => void;
}> = ({ label, image, fit, icon, onPick, onClear }) => (
  <div className="relative">
    <button
      type="button"
      onClick={onPick}
      aria-label={image ? `Change ${label.toLowerCase()}` : `Add ${label.toLowerCase()}`}
      className={cn(
        "pressable group flex aspect-video w-full flex-col items-center justify-center gap-1.5 overflow-hidden rounded-lg border text-xs text-muted-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        image ? "border-border" : "border-dashed border-input hover:bg-accent hover:text-foreground",
      )}
    >
      {image ? (
        <>
          <img src={image} alt="" className={cn("size-full", fit === "cover" ? "object-cover" : "object-contain")} />
          <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-xs font-medium text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
            Change
          </span>
        </>
      ) : (
        <>
          {icon}
          {label}
        </>
      )}
    </button>
    {image && (
      <button
        type="button"
        onClick={onClear}
        aria-label={`Remove ${label.toLowerCase()}`}
        className="pressable absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-md bg-black/60 text-white hover:bg-destructive"
      >
        <X className="size-3.5" />
      </button>
    )}
  </div>
);

const DEFAULT_DRAFT_STORAGE_KEY = "social-studio:banner-workspace-draft:v1";

export const CopyGenerator: React.FC<CopyGeneratorProps> = ({
  draftStorageKey = DEFAULT_DRAFT_STORAGE_KEY,
}) => {
  // --- Input State ---
  const [userPrompt, setUserPrompt] = useState("");
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [assetImage, setAssetImage] = useState<string | null>(null);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarAsset | null>(
    null,
  );

  // --- Config State ---
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [bannerCount, setBannerCount] =
    useState<BannerCount>(DEFAULT_BANNER_COUNT);
  const [textProvider, setTextProvider] =
    useState<TextGenerationProvider>("gemini");

  // --- Process State ---
  const [projectId, setProjectId] = useState<string | undefined>();
  const [isPlanning, setIsPlanning] = useState(false);
  const [plan, setPlan] = useState<BannerPlan | null>(null);

  // --- Output State ---
  // generatedImages: The image to SHOW in the grid (might be edited)
  const [generatedImages, setGeneratedImages] = useState<
    Record<string, string>
  >({});
  // rawBackgrounds: The clean background (AI or Upload) to use in Editor if no custom state exists
  const [rawBackgrounds, setRawBackgrounds] = useState<Record<string, string>>(
    {},
  );
  // savedLayers: Stores the text/elements so re-editing preserves state
  const [savedLayers, setSavedLayers] = useState<
    Record<string, CanvasElement[]>
  >({});
  // editorBackgrounds: Stores the specific background state (color, gradient, or image) from the editor
  const [editorBackgrounds, setEditorBackgrounds] = useState<
    Record<string, BackgroundState>
  >({});

  const [generatingStatus, setGeneratingStatus] = useState<
    Record<string, boolean>
  >({});
  const [generationErrors, setGenerationErrors] = useState<
    Record<string, string>
  >({});

  // --- Editor State ---
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeEditorId, setActiveEditorId] = useState<string | null>(null);
  const [editorData, setEditorData] = useState<{
    background: string;
    elements: CanvasElement[];
    backgroundState?: BackgroundState;
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isDraftReady, setIsDraftReady] = useState(false);
  const [draftRetry, setDraftRetry] = useState(0);
  const [draftRestoreFailed, setDraftRestoreFailed] = useState(false);
  const pendingDraftSave = useRef<(() => void) | null>(null);
  useEffect(
    () => () => {
      pendingDraftSave.current?.();
    },
    [draftStorageKey],
  );

  // Refs
  const bgInputRef = useRef<HTMLInputElement>(null);
  const assetInputRef = useRef<HTMLInputElement>(null);
  const generationRunRef = useRef(0);

  useEffect(() => {
    return () => {
      generationRunRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      setIsDraftReady(true);
      return;
    }

    let cancelled = false;
    setIsDraftReady(false);
    setDraftRestoreFailed(false);
    const restore = async () => {
      try {
        const rawDraft = await getDraft(draftStorageKey);
        if (cancelled) return;
        if (!rawDraft) {
          setIsDraftReady(true);
          return;
        }

        const draft = rawDraft as PersistedWorkspaceDraft;
        if (draft.version !== 1) {
          throw new Error("Unsupported saved draft version.");
        }

        setUserPrompt(draft.userPrompt ?? "");
        setBackgroundImage(draft.backgroundImage ?? null);
        setAssetImage(draft.assetImage ?? null);
        setSelectedAvatarId(draft.selectedAvatarId ?? null);
        setAspectRatio(draft.aspectRatio ?? "1:1");
        setBannerCount(draft.bannerCount ?? DEFAULT_BANNER_COUNT);
        setTextProvider(draft.textProvider ?? "gemini");
        setPlan(draft.plan ?? null);
        setGeneratedImages(draft.generatedImages ?? {});
        setRawBackgrounds(draft.rawBackgrounds ?? {});
        setSavedLayers(draft.savedLayers ?? {});
        setEditorBackgrounds(draft.editorBackgrounds ?? {});
        setGenerationErrors(draft.generationErrors ?? {});

        const hasSavedContent =
          !!draft.userPrompt ||
          !!draft.plan ||
          Object.keys(draft.generatedImages ?? {}).length > 0 ||
          !!draft.backgroundImage ||
          !!draft.assetImage ||
          !!draft.selectedAvatarId;

        if (hasSavedContent) {
          setStatusMessage({
            type: "success",
            text: "Restored your last banner workspace.",
          });
        }
      } catch (error) {
        console.error("Failed to restore banner workspace draft", error);
        if (!cancelled) {
          setDraftRestoreFailed(true);
          setStatusMessage({
            type: "error",
            text: "Draft recovery failed. Stored data was preserved; new edits will not autosave until recovery succeeds.",
          });
        }
        return;
      }
      if (!cancelled) setIsDraftReady(true);
    };
    void restore();
    return () => {
      cancelled = true;
    };
  }, [draftStorageKey, draftRetry]);

  useEffect(() => {
    if (!isDraftReady || typeof window === "undefined") {
      return;
    }

    const hasWorkspaceContent =
      userPrompt.trim().length > 0 ||
      !!backgroundImage ||
      !!assetImage ||
      !!selectedAvatarId ||
      textProvider !== "gemini" ||
      !!plan ||
      Object.keys(generatedImages).length > 0 ||
      Object.keys(rawBackgrounds).length > 0 ||
      Object.keys(savedLayers).length > 0 ||
      Object.keys(editorBackgrounds).length > 0 ||
      Object.keys(generationErrors).length > 0;

    if (!hasWorkspaceContent) {
      pendingDraftSave.current = null;
      void removeDraft(draftStorageKey).catch(console.error);
      return;
    }

    const draft: PersistedWorkspaceDraft = {
      version: 1,
      userPrompt,
      backgroundImage,
      assetImage,
      selectedAvatarId,
      aspectRatio,
      bannerCount,
      textProvider,
      plan,
      generatedImages,
      rawBackgrounds,
      savedLayers,
      editorBackgrounds,
      generationErrors,
    };

    let flushed = false;
    const persist = () => {
      if (flushed) return;
      flushed = true;
      void setDraft(draftStorageKey, draft).catch(() =>
        setStatusMessage({
          type: "error",
          text: "Workspace draft could not be saved. Free browser storage and retry.",
        }),
      );
    };
    pendingDraftSave.current = persist;
    const timer = window.setTimeout(persist, 500);
    return () => {
      window.clearTimeout(timer);
    };
  }, [
    aspectRatio,
    bannerCount,
    assetImage,
    backgroundImage,
    selectedAvatarId,
    textProvider,
    draftStorageKey,
    editorBackgrounds,
    generatedImages,
    generationErrors,
    isDraftReady,
    plan,
    rawBackgrounds,
    savedLayers,
    userPrompt,
  ]);

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string | null) => void,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatusMessage({ type: "error", text: "Please upload an image file." });
      return;
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      setStatusMessage({
        type: "error",
        text: "Image too large. Use a file under 10MB.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      void optimizeAvatarImageDataUrl(reader.result as string)
        .then(setter)
        .catch((error) =>
          setStatusMessage({ type: "error", text: String(error) }),
        );
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPrompt = userPrompt.trim();
    if (!trimmedPrompt) return;

    const runId = generationRunRef.current + 1;
    generationRunRef.current = runId;
    setStatusMessage(null);

    setIsPlanning(true);
    setPlan(null);
    setGeneratedImages({});
    setRawBackgrounds({});
    setSavedLayers({});
    setEditorBackgrounds({});
    setGeneratingStatus({});
    setGenerationErrors({});

    try {
      const data = await generateBannerPlan({
        userPrompt: trimmedPrompt,
        aspectRatio: aspectRatio,
        bannerCount,
        hasBackgroundImage: !!backgroundImage,
        hasAssetImage: !!assetImage,
        textProvider,
        projectId,
      });
      if (runId !== generationRunRef.current) return;

      setPlan(data);
      setIsPlanning(false);

      const referenceImages: string[] = [];
      if (selectedAvatar) referenceImages.push(selectedAvatar.imageDataUrl);
      if (backgroundImage) referenceImages.push(backgroundImage);
      if (assetImage) referenceImages.push(assetImage);

      // --- LOGIC: Background Handling ---
      // If user provided a background, we use it directly for all banners to ensure consistency.
      if (backgroundImage) {
        const nextGeneratedImages: Record<string, string> = {
          main: backgroundImage,
        };
        const nextRawBackgrounds: Record<string, string> = {
          main: backgroundImage,
        };
        data.additional_banners.forEach((_, idx) => {
          const key = `slide-${idx}`;
          nextGeneratedImages[key] = backgroundImage;
          nextRawBackgrounds[key] = backgroundImage;
        });
        setGeneratedImages(nextGeneratedImages);
        setRawBackgrounds(nextRawBackgrounds);
      } else {
        // Otherwise, generate new backgrounds using AI
        if (data.main_banner.image_prompt) {
          triggerImageGeneration(
            "main",
            data.main_banner.image_prompt,
            aspectRatio,
            referenceImages,
            runId,
          );
        }

        data.additional_banners.forEach((slide, idx) => {
          if (slide.image_prompt) {
            triggerImageGeneration(
              `slide-${idx}`,
              slide.image_prompt,
              aspectRatio,
              referenceImages,
              runId,
            );
          }
        });
      }
    } catch (error) {
      if (runId !== generationRunRef.current) return;
      console.error(error);
      setStatusMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to generate banner plan. Please try again.",
      });
      setIsPlanning(false);
    }
  };

  const triggerImageGeneration = async (
    id: string,
    prompt: string,
    ratio: AspectRatio,
    refImages: string[],
    runId = generationRunRef.current,
  ) => {
    setGeneratingStatus((prev) => ({ ...prev, [id]: true }));
    setGenerationErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    try {
      const imageUrl = await generateImage(prompt, ratio, refImages, projectId);
      if (runId !== generationRunRef.current) return;
      setGeneratedImages((prev) => ({ ...prev, [id]: imageUrl }));
      setRawBackgrounds((prev) => ({ ...prev, [id]: imageUrl }));
    } catch (error) {
      if (runId !== generationRunRef.current) return;
      console.error(`Failed to generate image for ${id}`, error);
      const message =
        error instanceof Error ? error.message : "Image generation failed.";
      setGenerationErrors((prev) => ({ ...prev, [id]: message }));
    } finally {
      if (runId !== generationRunRef.current) return;
      setGeneratingStatus((prev) => ({ ...prev, [id]: false }));
    }
  };

  // Prepares the Canvas with the intelligent layout
  const buildEditorData = (id: string, isMain: boolean) => {
    if (!plan) return;

    // Use raw background (clean) as default for editor
    const defaultBgImage = rawBackgrounds[id];
    if (!defaultBgImage) return;

    // If we have saved layers from a previous edit session, use them!
    if (savedLayers[id]) {
      return {
        background: defaultBgImage,
        elements: savedLayers[id],
        backgroundState: editorBackgrounds[id],
      };
    }

    // Otherwise, generate default elements from Plan
    const baseHeight = 800;
    let canvasWidth = baseHeight;
    const canvasHeight = baseHeight;

    if (aspectRatio === "16:9") canvasWidth = baseHeight * (16 / 9);
    else if (aspectRatio === "9:16") canvasWidth = baseHeight * (9 / 16);
    else if (aspectRatio === "3:4") canvasWidth = baseHeight * (3 / 4);
    else if (aspectRatio === "4:5") canvasWidth = baseHeight * (4 / 5);

    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const elements: CanvasElement[] = [];

    // Common Text Styles
    const headlineStyle = {
      fontSize: aspectRatio === "9:16" ? 36 : 48,
      fontFamily: "Inter",
      fontWeight: "bold",
      color: "#ffffff",
      textAlign: (aspectRatio === "16:9" ? "left" : "center") as
        "left" | "center",
      lineHeight: 1.1,
      letterSpacing: -1,
      zIndex: 20,
    };

    const subheadStyle = {
      fontSize: aspectRatio === "9:16" ? 18 : 24,
      fontFamily: "Inter",
      fontWeight: "normal",
      color: "#e4e4e7", // zinc-200
      textAlign: (aspectRatio === "16:9" ? "left" : "center") as
        "left" | "center",
      lineHeight: 1.4,
      letterSpacing: 0,
      zIndex: 20,
    };

    const ctaStyle = {
      fontSize: 18,
      fontFamily: "Inter",
      fontWeight: "bold",
      color: "#ffffff",
      backgroundColor: "#40d6c3",
      textAlign: "center" as "center",
      borderRadius: 8,
      padding: 12,
      lineHeight: 1,
      letterSpacing: 1,
      zIndex: 30,
    };

    // --- Asset Placement Logic ---
    if (assetImage) {
      elements.push({
        id: "brand-asset",
        type: "image",
        content: assetImage,
        x: aspectRatio === "16:9" ? canvasWidth - 150 : centerX - 50,
        y: aspectRatio === "16:9" ? centerY - 50 : 30,
        width: 100,
        height: 100,
        rotation: 0,
        style: { zIndex: 25, opacity: 1 },
      });
    }

    if (isMain) {
      // Headline
      elements.push({
        id: "main-headline",
        type: "text",
        content: plan.main_banner.headline,
        x: aspectRatio === "16:9" ? 50 : 20,
        y: aspectRatio === "16:9" ? centerY - 80 : assetImage ? 150 : 80,
        width: canvasWidth - (aspectRatio === "16:9" ? 100 : 40),
        height: 100,
        rotation: 0,
        style: { ...headlineStyle, opacity: 1 },
      });

      // Subheadline
      elements.push({
        id: "main-sub",
        type: "text",
        content: plan.main_banner.subheadline,
        x: aspectRatio === "16:9" ? 50 : 20,
        y: aspectRatio === "16:9" ? centerY + 20 : assetImage ? 260 : 190,
        width: canvasWidth - (aspectRatio === "16:9" ? 100 : 40),
        height: 80,
        rotation: 0,
        style: { ...subheadStyle, opacity: 1 },
      });

      // CTA
      elements.push({
        id: "main-cta",
        type: "cta",
        content: plan.main_banner.cta || "Learn More",
        x: aspectRatio === "16:9" ? 50 : centerX - 80,
        y: aspectRatio === "16:9" ? centerY + 100 : canvasHeight - 120,
        width: 160,
        height: 50,
        rotation: 0,
        style: { ...ctaStyle, opacity: 1 },
      });
    } else {
      const slideIndex = Number.parseInt(id.replace("slide-", ""), 10);
      if (Number.isNaN(slideIndex)) return;
      const slide = plan.additional_banners[slideIndex];

      if (slide) {
        // Slide Title
        elements.push({
          id: `slide-title-${slideIndex}`,
          type: "text",
          content: slide.title,
          x: 20,
          y: assetImage ? 140 : 50,
          width: canvasWidth - 40,
          height: 60,
          rotation: 0,
          style: { ...headlineStyle, opacity: 1 },
        });

        // Slide Content
        elements.push({
          id: `slide-content-${slideIndex}`,
          type: "text",
          content: slide.subtitle,
          x: 20,
          y: assetImage ? 220 : 130,
          width: canvasWidth - 40,
          height: 100,
          rotation: 0,
          style: { ...subheadStyle, opacity: 1 },
        });

        // CTA
        elements.push({
          id: `slide-cta-${slideIndex}`,
          type: "cta",
          content: slide.cta || "Try It Now",
          x: centerX - 80,
          y: canvasHeight - 120,
          width: 160,
          height: 50,
          rotation: 0,
          style: { ...ctaStyle, opacity: 1 },
        });
      }
    }

    return {
      background: defaultBgImage,
      elements,
      backgroundState: undefined as BackgroundState | undefined,
    };
  };
  const openEditor = (id: string, isMain: boolean) => {
    const data = buildEditorData(id, isMain);
    if (!data) return;
    setActiveEditorId(id);
    setEditorData(data);
    setIsEditorOpen(true);
  };

  const handleSaveFromEditor = (
    finalImage: string,
    elements: CanvasElement[],
    bgState: BackgroundState,
  ) => {
    if (!activeEditorId) return;

    // 1. Update the visual grid with the new edited image
    setGeneratedImages((prev) => ({ ...prev, [activeEditorId]: finalImage }));

    // 2. Save the layer state so user can re-edit later
    setSavedLayers((prev) => ({ ...prev, [activeEditorId]: elements }));

    // 3. Save background state logic (if user changed BG in editor)
    setEditorBackgrounds((prev) => ({ ...prev, [activeEditorId]: bgState }));

    // 4. Close Editor
    setIsEditorOpen(false);
    setActiveEditorId(null);
  };

  const handleDownload = async (id: string, isMain: boolean) => {
    try {
      const data = buildEditorData(id, isMain);
      if (!data) return;
      const bg = data.backgroundState ?? {
        type: "image" as const,
        value: data.background,
        opacity: 1,
      };
      const imageUrl = await renderCanvasDocument(
        aspectRatio,
        data.elements,
        bg,
      );
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `social-post-${Date.now()}.png`;
      link.click();
    } catch (error) {
      setStatusMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Export failed.",
      });
    }
  };
  const handleCopyCaption = async () => {
    if (!plan) return;
    const copyText = `${plan.seo.caption}\n\n${formatHashtags(plan.seo.hashtags)}`;
    if (!navigator.clipboard?.writeText) {
      toast.error("Clipboard is unavailable here. Select the caption and copy it.");
      return;
    }
    try {
      await navigator.clipboard.writeText(copyText);
      toast.success("Caption and hashtags copied");
    } catch (error) {
      console.error("Clipboard write failed", error);
      toast.error("Clipboard access was blocked. Select the caption and copy it.");
    }
  };

  const getRetryProps = (id: string, prompt: string) => {
    const refs: string[] = [];
    if (backgroundImage) refs.push(backgroundImage);
    if (selectedAvatar) refs.unshift(selectedAvatar.imageDataUrl);
    if (assetImage) refs.push(assetImage);
    return () =>
      triggerImageGeneration(
        id,
        prompt,
        aspectRatio,
        refs,
        generationRunRef.current,
      );
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* --- Full Screen Editor Overlay --- */}
      {isEditorOpen && editorData && (
        <CanvasEditor
          backgroundImage={editorData.background}
          initialElements={editorData.elements}
          initialBackgroundState={editorData.backgroundState}
          aspectRatio={aspectRatio}
          onClose={() => {
            setIsEditorOpen(false);
            setActiveEditorId(null);
          }}
          onSave={handleSaveFromEditor}
        />
      )}

      {/* --- Left Column: Creative Studio (Form) --- */}
      <div className="w-full flex-shrink-0 space-y-4 lg:w-[380px]">
        <ProjectToolbar
          draft={{
            version: 1,
            userPrompt,
            backgroundImage,
            assetImage,
            selectedAvatarId,
            aspectRatio,
            bannerCount,
            textProvider,
            plan,
            generatedImages,
            rawBackgrounds,
            savedLayers,
            editorBackgrounds,
            generationErrors,
          }}
          onProjectChange={setProjectId}
          onLoad={(draft) => {
            generationRunRef.current += 1;
            setUserPrompt(draft.userPrompt ?? "");
            setBackgroundImage(draft.backgroundImage ?? null);
            setAssetImage(draft.assetImage ?? null);
            setSelectedAvatarId(draft.selectedAvatarId ?? null);
            setAspectRatio(draft.aspectRatio ?? "1:1");
            setBannerCount(draft.bannerCount ?? 3);
            setTextProvider(draft.textProvider ?? "gemini");
            setPlan(draft.plan ?? null);
            setGeneratedImages(draft.generatedImages ?? {});
            setRawBackgrounds(draft.rawBackgrounds ?? {});
            setSavedLayers(draft.savedLayers ?? {});
            setEditorBackgrounds(draft.editorBackgrounds ?? {});
            setGenerationErrors(draft.generationErrors ?? {});
            setIsPlanning(false);
            setGeneratingStatus({});
          }}
        />

        <div className="rounded-xl border border-border bg-card p-5 lg:sticky lg:top-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="banner-brief">Brief</Label>
              <Textarea
                id="banner-brief"
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                className="h-32 resize-none text-[15px] leading-relaxed"
                placeholder="A weekend sale for a neighbourhood coffee roaster: 20% off cold brew, warm morning light, people at the counter."
              />
            </div>

            <div className="grid gap-2">
              <Label id="format-label">Format</Label>
              <ToggleGroup
                type="single"
                variant="outline"
                aria-labelledby="format-label"
                value={aspectRatio}
                onValueChange={(value) => value && setAspectRatio(value as AspectRatio)}
                className="grid w-full grid-cols-4"
              >
                {FORMAT_OPTIONS.map((ratio) => (
                  <ToggleGroupItem
                    key={ratio.id}
                    value={ratio.id}
                    aria-label={`${ratio.label} ${ratio.id}`}
                    className="h-auto flex-col gap-1.5 py-2.5 text-xs"
                  >
                    <span className="flex h-4 items-center">
                      <RatioGlyph w={ratio.w} h={ratio.h} />
                    </span>
                    <span className="tabular">{ratio.id}</span>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div className="grid gap-2">
              <Label id="count-label">Banners</Label>
              <ToggleGroup
                type="single"
                variant="outline"
                aria-labelledby="count-label"
                value={String(bannerCount)}
                onValueChange={(value) => value && setBannerCount(Number(value) as BannerCount)}
                className="grid w-full grid-cols-6"
              >
                {BANNER_COUNT_OPTIONS.map((count) => (
                  <ToggleGroupItem key={count} value={String(count)} className="tabular">
                    {count}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <p className="text-xs text-muted-foreground">
                One main banner
                {bannerCount > 1
                  ? ` and ${bannerCount - 1} variation${bannerCount - 1 > 1 ? "s" : ""}.`
                  : "."}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="planner-model">Planner</Label>
              <NativeSelect
                id="planner-model"
                value={textProvider}
                onChange={(e) =>
                  setTextProvider(e.target.value as TextGenerationProvider)
                }
              >
                {PLANNER_MODEL_OPTIONS.map((option) => (
                  <NativeSelectOption key={option.id} value={option.id}>
                    {option.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-medium text-foreground">
                Your images <span className="font-normal text-muted-foreground">(optional)</span>
              </span>
              <input
                type="file"
                ref={bgInputRef}
                onChange={(e) => handleFileUpload(e, setBackgroundImage)}
                className="hidden"
                accept="image/*"
              />
              <input
                type="file"
                ref={assetInputRef}
                onChange={(e) => handleFileUpload(e, setAssetImage)}
                className="hidden"
                accept="image/*"
              />
              <div className="grid grid-cols-2 gap-3">
                <AssetSlot
                  label="Background"
                  image={backgroundImage}
                  fit="cover"
                  icon={<ImageIcon className="size-4" />}
                  onPick={() => bgInputRef.current?.click()}
                  onClear={() => setBackgroundImage(null)}
                />
                <AssetSlot
                  label="Logo"
                  image={assetImage}
                  fit="contain"
                  icon={<Upload className="size-4" />}
                  onPick={() => assetInputRef.current?.click()}
                  onClear={() => setAssetImage(null)}
                />
              </div>
            </div>

            <AvatarLibraryPicker
              selectedAvatarId={selectedAvatarId}
              onSelectedAvatarIdChange={setSelectedAvatarId}
              onSelectedAvatarChange={setSelectedAvatar}
              title="Avatar in the pictures"
              mode="select"
            />

            <Button
              type="submit"
              size="lg"
              isLoading={isPlanning}
              className="w-full"
            >
              Generate {bannerCount} banner{bannerCount > 1 ? "s" : ""}
            </Button>

            {draftRestoreFailed && (
              <Button
                type="button"
                variant="link"
                className="h-auto px-0"
                onClick={() => setDraftRetry((n) => n + 1)}
              >
                Retry draft recovery
              </Button>
            )}
            {statusMessage && (
              <p
                role={statusMessage.type === "error" ? "alert" : "status"}
                className={cn(
                  "text-sm",
                  statusMessage.type === "error" ? "text-destructive" : "text-positive",
                )}
              >
                {statusMessage.text}
              </p>
            )}
          </form>
        </div>
      </div>

      {/* --- Right Column: Results --- */}
      <div className="min-w-0 flex-1">
        {!plan && !isPlanning && (
          <div className="flex h-full min-h-[480px] flex-col justify-between rounded-xl border border-dashed border-border p-6 sm:p-8">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Your banners appear here
              </h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Write the brief on the left and generate. You get the copy, a
                caption with hashtags, and {bannerCount} banner
                {bannerCount > 1 ? "s" : ""} at {aspectRatio}, each one editable
                as layers.
              </p>
            </div>
            <div
              aria-hidden="true"
              className="mt-8 grid grid-cols-3 items-end gap-4"
            >
              {Array.from({ length: Math.min(bannerCount, 3) }).map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "rounded-lg border border-dashed border-border",
                    aspectClass(aspectRatio),
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {isPlanning && (
          <div className="flex h-full min-h-[480px] flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card" role="status">
            <Spinner className="size-6 text-muted-foreground" />
            <div className="text-center">
              <p className="text-base font-medium text-foreground">Writing the plan</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Copy first, then each picture is painted in turn.
              </p>
            </div>
          </div>
        )}

        {plan && (
          <div className="space-y-10">
            <section aria-labelledby="banners-heading" className="space-y-4">
              <div className="flex items-baseline justify-between gap-4">
                <h2 id="banners-heading" className="text-base font-semibold text-foreground">
                  Banners
                </h2>
                <span className="text-sm text-muted-foreground">
                  Open one to edit its layers
                </span>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {[
                  {
                    id: "main",
                    isMain: true,
                    title: plan.main_banner.headline,
                    subtitle: plan.main_banner.subheadline,
                    tag: "Main",
                    prompt: plan.main_banner.image_prompt,
                  },
                  ...plan.additional_banners.map((slide, idx) => ({
                    id: `slide-${idx}`,
                    isMain: false,
                    title: slide.title,
                    subtitle: slide.subtitle,
                    tag: `Variation ${idx + 1}`,
                    prompt: slide.image_prompt,
                  })),
                ].map((banner, index) => {
                  const image = generatedImages[banner.id];
                  const error = generationErrors[banner.id];
                  const rendering = generatingStatus[banner.id];
                  return (
                    <article
                      key={banner.id}
                      className="enter overflow-hidden rounded-xl border border-border bg-card"
                      style={{ "--i": Math.min(index, 5) } as React.CSSProperties}
                    >
                      <div className={cn("relative w-full bg-background", aspectClass(aspectRatio))}>
                        {image ? (
                          <button
                            type="button"
                            onClick={() => openEditor(banner.id, banner.isMain)}
                            aria-label={`Edit ${banner.tag.toLowerCase()} banner`}
                            className="group absolute inset-0 outline-none"
                          >
                            <img
                              src={image}
                              alt={banner.title}
                              className="size-full object-cover"
                            />
                            {/* Until edited, the copy floats over the raw picture; after editing it is baked in. */}
                            {!savedLayers[banner.id] && (
                              <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-black/30 p-4 text-center">
                                <span className="text-xl font-bold text-white drop-shadow-md">
                                  {banner.title}
                                </span>
                                <span className="mt-2 text-sm text-white/85 drop-shadow-md">
                                  {banner.subtitle}
                                </span>
                              </span>
                            )}
                            <span className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
                              <span className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">
                                Edit layers
                              </span>
                            </span>
                          </button>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
                            {rendering ? (
                              <>
                                <Spinner className="text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Painting…</span>
                              </>
                            ) : error ? (
                              <>
                                <span className="text-sm font-medium text-destructive">
                                  This picture failed
                                </span>
                                <span className="max-w-[240px] text-xs text-muted-foreground">
                                  {error}
                                </span>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => getRetryProps(banner.id, banner.prompt)()}
                                  className="mt-1"
                                >
                                  <RefreshCcw /> Try again
                                </Button>
                              </>
                            ) : (
                              <span className="text-sm text-muted-foreground">Queued</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">{banner.tag}</p>
                          <h3 className="truncate text-sm font-medium text-foreground">
                            {banner.title}
                          </h3>
                        </div>
                        <Hint label="Download PNG">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Download ${banner.tag.toLowerCase()} banner`}
                            onClick={() => void handleDownload(banner.id, banner.isMain)}
                            disabled={!image}
                          >
                            <Download />
                          </Button>
                        </Hint>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section aria-labelledby="caption-heading" className="rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3">
                <h2 id="caption-heading" className="text-base font-semibold text-foreground">
                  Caption
                </h2>
                <Button variant="secondary" size="sm" onClick={handleCopyCaption}>
                  <Copy /> Copy caption and hashtags
                </Button>
              </div>
              <div className="space-y-4 p-5">
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">
                  {plan.seo.caption}
                </p>
                <p className="text-sm text-brand">{formatHashtags(plan.seo.hashtags)}</p>
                {plan.seo.keywords.length > 0 && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
                    <span>Keywords</span>
                    {plan.seo.keywords.map((kw, i) => (
                      <span key={i} className="text-foreground/80">
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
