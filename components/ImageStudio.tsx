import { getDraft, setDraft } from "../services/draftStore";
import { optimizeAvatarImageDataUrl } from "../services/avatarLibrary";
import React, { useEffect, useRef, useState } from "react";
import { editImageWithGemini } from "../services/geminiService";
import { Button } from "./ui/button";
import {
  Image as ImageIcon,
  Sparkles,
  Upload,
  Download,
  Undo2,
  Eraser,
  Wand2,
} from "lucide-react";
import { AvatarLibraryPicker } from "./workspace/AvatarLibraryPicker";
import { Hint } from "./ui/hint";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Spinner } from "./ui/spinner";
import { cn } from "@/lib/utils";
import type { AvatarAsset } from "../services/avatarLibrary";

const IMAGE_EDITOR_MODEL_OPTIONS = [
  { id: "gemini", label: "Gemini Image Editor" },
] as const;
type ImageEditorModel = (typeof IMAGE_EDITOR_MODEL_OPTIONS)[number]["id"];

const MAX_HISTORY_LENGTH = 12;
const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

export const ImageStudio: React.FC<{ draftStorageKey?: string }> = ({
  draftStorageKey = "image-studio-draft",
}) => {
  const [draftReady, setDraftReady] = useState(false);
  const [draftRetry, setDraftRetry] = useState(0);
  const [draftRestoreFailed, setDraftRestoreFailed] = useState(false);
  const pendingDraftSave = useRef<(() => void) | null>(null);
  useEffect(
    () => () => {
      pendingDraftSave.current?.();
    },
    [draftStorageKey],
  );
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarAsset | null>(
    null,
  );
  const [imageEditorModel, setImageEditorModel] =
    useState<ImageEditorModel>("gemini");
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let active = true;
    setDraftReady(false);
    setDraftRestoreFailed(false);
    void getDraft<{
      currentImage: string | null;
      history: string[];
      prompt: string;
    }>(draftStorageKey)
      .then((d) => {
        if (active && d) {
          setCurrentImage(d.currentImage);
          setHistory(d.history);
          setPrompt(d.prompt);
        }
        if (active) setDraftReady(true);
      })
      .catch(() => {
        if (active) {
          setDraftRestoreFailed(true);
          setStatusMessage({
            type: "error",
            text: "Draft recovery failed. Stored data was preserved; new edits will not autosave until recovery succeeds.",
          });
        }
      });
    return () => {
      active = false;
    };
  }, [draftStorageKey, draftRetry]);
  useEffect(() => {
    if (!draftReady) return;
    let flushed = false;
    const persist = () => {
      if (flushed) return;
      flushed = true;
      void setDraft(draftStorageKey, { currentImage, history, prompt }).catch(
        () =>
          setStatusMessage({
            type: "error",
            text: "Could not save image draft.",
          }),
      );
    };
    pendingDraftSave.current = persist;
    const timer = setTimeout(persist, 500);
    return () => {
      clearTimeout(timer);
    };
  }, [currentImage, history, prompt, draftReady, draftStorageKey]);

  useEffect(() => {
    if (!selectedAvatar) {
      return;
    }

    setCurrentImage(selectedAvatar.imageDataUrl);
    setHistory([selectedAvatar.imageDataUrl]);
    setPrompt("");
    setStatusMessage({
      type: "success",
      text: `${selectedAvatar.name} loaded into Image Studio.`,
    });
  }, [selectedAvatar]);

  const loadFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setStatusMessage({ type: "error", text: "That file isn't an image. Use PNG, JPEG or WebP." });
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      setStatusMessage({ type: "error", text: "Image too large. Use a file under 10 MB." });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      void optimizeAvatarImageDataUrl(reader.result as string)
        .then((base64String) => {
          setSelectedAvatarId(null);
          setCurrentImage(base64String);
          setHistory([base64String]);
          setPrompt("");
          setStatusMessage({ type: "success", text: "Image loaded." });
        })
        .catch((error) =>
          setStatusMessage({ type: "error", text: String(error) }),
        );
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    e.target.value = "";
  };

  const [isDragging, setIsDragging] = useState(false);
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) loadFile(file);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPrompt = prompt.trim();
    if (!currentImage || !trimmedPrompt) return;

    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const editedImage = await editImageWithGemini(
        currentImage,
        trimmedPrompt,
      );
      setHistory((prev) => [...prev, editedImage].slice(-MAX_HISTORY_LENGTH));
      setCurrentImage(editedImage);
      setPrompt("");
      setStatusMessage({
        type: "success",
        text: "Edit generated successfully.",
      });
    } catch (error) {
      console.error(error);
      setStatusMessage({
        type: "error",
        text: "Failed to edit image. Try a simpler instruction.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUndo = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      setCurrentImage(newHistory[newHistory.length - 1]);
    }
  };

  const triggerUpload = () => fileInputRef.current?.click();

  const handleDownload = () => {
    if (currentImage) {
      const link = document.createElement("a");
      link.href = currentImage;
      link.download = `edited-image-${Date.now()}.png`;
      link.click();
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
      <div className="flex flex-col gap-4 lg:col-span-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
        />

        {currentImage && (
          <section aria-labelledby="edit-heading" className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h2 id="edit-heading" className="text-base font-semibold text-foreground">
                Describe the change
              </h2>
              <div className="flex gap-1">
                <Hint label="Undo last edit">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Undo last edit"
                    onClick={handleUndo}
                    disabled={history.length <= 1 || isProcessing}
                  >
                    <Undo2 />
                  </Button>
                </Hint>
                <Hint label="Start over">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Start over"
                    onClick={() => {
                      setSelectedAvatarId(null);
                      setCurrentImage(null);
                      setHistory([]);
                      setPrompt("");
                      setStatusMessage(null);
                    }}
                    className="hover:text-destructive"
                  >
                    <Eraser />
                  </Button>
                </Hint>
              </div>
            </div>

            <form onSubmit={handleEdit} className="grid gap-4 p-5">
              <div className="grid gap-2">
                <Label htmlFor="edit-prompt" className="sr-only">
                  Edit instruction
                </Label>
                <Textarea
                  id="edit-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Swap the background for a sunny café terrace and warm up the light."
                  className="min-h-36 resize-none text-[15px] leading-relaxed"
                />
                <p className="text-xs text-muted-foreground">
                  Each edit uses 5 credits. Step {Math.max(history.length, 1)} of up to {MAX_HISTORY_LENGTH} kept for undo.
                </p>
              </div>
              <Button type="submit" size="lg" isLoading={isProcessing} disabled={!prompt.trim()} className="w-full">
                <Wand2 /> Apply edit
              </Button>
            </form>
          </section>
        )}

        <AvatarLibraryPicker
          selectedAvatarId={selectedAvatarId}
          onSelectedAvatarIdChange={setSelectedAvatarId}
          onSelectedAvatarChange={setSelectedAvatar}
          title="Start from an avatar"
          mode="select"
        />

        {draftRestoreFailed && (
          <Button variant="link" className="h-auto w-fit px-0" onClick={() => setDraftRetry((n) => n + 1)}>
            Retry draft recovery
          </Button>
        )}
        {statusMessage && (
          <p
            role={statusMessage.type === "error" ? "alert" : "status"}
            className={cn("text-sm", statusMessage.type === "error" ? "text-destructive" : "text-positive")}
          >
            {statusMessage.text}
          </p>
        )}
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-xl border bg-card p-4 transition-colors duration-150 sm:p-8 lg:col-span-8 lg:h-[calc(100vh-11rem)]",
          isDragging ? "border-brand" : "border-border",
        )}
      >
        {currentImage ? (
          <>
            <img
              src={currentImage}
              alt="The image being edited"
              className="max-h-full max-w-full rounded-md object-contain"
            />
            <Button variant="secondary" size="sm" onClick={handleDownload} className="absolute right-4 top-4">
              <Download /> Download
            </Button>
          </>
        ) : (
          <button
            type="button"
            onClick={triggerUpload}
            className="pressable flex flex-col items-center gap-3 rounded-lg p-8 text-center outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Upload className="size-5" />
            </span>
            <span className="text-base font-medium text-foreground">Upload a picture to edit</span>
            <span className="text-sm text-muted-foreground">
              Click to choose, or drop a PNG, JPEG or WebP here. Or pick an avatar on the left.
            </span>
          </button>
        )}

        {isProcessing && (
          <div
            role="status"
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black/70 animate-in fade-in-0 duration-200"
          >
            <Spinner className="size-6 text-foreground" />
            <p className="text-sm font-medium text-foreground">Applying the edit…</p>
          </div>
        )}
      </div>
    </div>
  );
};
