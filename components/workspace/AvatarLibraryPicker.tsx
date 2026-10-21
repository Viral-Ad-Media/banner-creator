import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ImagePlus,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { generateImage } from "../../services/geminiService";
import {
  AvatarAsset,
  createAvatar,
  deleteAvatar,
  listAvatarLibrary,
  optimizeAvatarImageDataUrl,
} from "../../services/avatarLibrary";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Skeleton } from "../ui/skeleton";
import { Hint } from "../ui/hint";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { cn } from "@/lib/utils";

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_AVATARS = 12;

interface AvatarLibraryPickerProps {
  selectedAvatarId: string | null;
  onSelectedAvatarIdChange: (avatarId: string | null) => void;
  onSelectedAvatarChange: (avatar: AvatarAsset | null) => void;
  title?: string;
  mode?: "manage" | "select";
  emptyStateMessage?: string;
}

export const AvatarLibraryPicker: React.FC<AvatarLibraryPickerProps> = ({
  selectedAvatarId,
  onSelectedAvatarIdChange,
  onSelectedAvatarChange,
  title = "Avatar Library",
  mode = "manage",
  emptyStateMessage,
}) => {
  const [avatars, setAvatars] = useState<AvatarAsset[]>([]);
  const [avatarPrompt, setAvatarPrompt] = useState("");
  const [pendingDelete, setPendingDelete] = useState<AvatarAsset | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isManageMode = mode === "manage";
  const resolvedEmptyStateMessage =
    emptyStateMessage ??
    (isManageMode
      ? "Create or upload an avatar to start building reusable characters."
      : "No saved avatars yet. You can keep going without one, or create one in Avatar Studio and come back later.");

  useEffect(() => {
    let isCancelled = false;

    const loadAvatars = async () => {
      setIsLoadingLibrary(true);
      setAvatars([]);

      try {
        const nextAvatars = await listAvatarLibrary();
        if (!isCancelled) {
          setAvatars(nextAvatars);
        }
      } catch (error) {
        if (!isCancelled) {
          setStatusMessage({
            type: "error",
            text:
              error instanceof Error
                ? error.message
                : "Could not load saved avatars right now.",
          });
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingLibrary(false);
        }
      }
    };

    void loadAvatars();

    return () => {
      isCancelled = true;
    };
  }, []);

  const selectedAvatar = useMemo(
    () => avatars.find((avatar) => avatar.id === selectedAvatarId) ?? null,
    [avatars, selectedAvatarId],
  );

  useEffect(() => {
    if (isLoadingLibrary) {
      return;
    }

    if (selectedAvatarId && !selectedAvatar) {
      onSelectedAvatarIdChange(null);
      onSelectedAvatarChange(null);
      return;
    }

    onSelectedAvatarChange(selectedAvatar);
  }, [
    isLoadingLibrary,
    onSelectedAvatarChange,
    onSelectedAvatarIdChange,
    selectedAvatar,
    selectedAvatarId,
  ]);

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () =>
        reject(new Error("Could not read the selected image."));
      reader.readAsDataURL(file);
    });

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setStatusMessage({
        type: "error",
        text: "Please choose an image file for the avatar.",
      });
      return;
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      setStatusMessage({
        type: "error",
        text: "Avatar image is too large. Use a file under 10MB.",
      });
      return;
    }

    try {
      const imageDataUrl = await readFileAsDataUrl(file);
      const optimizedImageDataUrl =
        await optimizeAvatarImageDataUrl(imageDataUrl);
      const avatar = await createAvatar({
        name: file.name.replace(/\.[^.]+$/, "") || "Uploaded Avatar",
        imageDataUrl: optimizedImageDataUrl,
        source: "upload",
      });

      setAvatars((prev) => [avatar, ...prev].slice(0, MAX_AVATARS));
      onSelectedAvatarIdChange(avatar.id);
      setStatusMessage({
        type: "success",
        text: "Avatar uploaded and selected.",
      });
    } catch (error) {
      setStatusMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Could not upload avatar.",
      });
    }
  };

  const handleGenerateAvatar = async () => {
    const trimmedPrompt = avatarPrompt.trim();
    if (trimmedPrompt.length < 3) {
      setStatusMessage({
        type: "error",
        text: "Add a short avatar prompt first.",
      });
      return;
    }

    if (avatars.length >= MAX_AVATARS) {
      setStatusMessage({
        type: "error",
        text: "Remove an avatar before generating another.",
      });
      return;
    }
    setIsGenerating(true);
    setStatusMessage(null);

    try {
      const imageDataUrl = await generateImage(
        `Studio avatar portrait of ${trimmedPrompt}. One clear character, centered composition, clean background, premium lighting, expressive face, no text.`,
        "1:1",
      );

      const optimizedImageDataUrl =
        await optimizeAvatarImageDataUrl(imageDataUrl);
      const avatar = await createAvatar({
        name: trimmedPrompt.slice(0, 40),
        imageDataUrl: optimizedImageDataUrl,
        source: "generated",
        prompt: trimmedPrompt,
      });

      setAvatars((prev) => [avatar, ...prev].slice(0, MAX_AVATARS));
      onSelectedAvatarIdChange(avatar.id);
      setAvatarPrompt("");
      setStatusMessage({
        type: "success",
        text: "Avatar created and selected.",
      });
    } catch (error) {
      setStatusMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Could not create avatar right now.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteAvatar = async (avatarId: string) => {
    try {
      await deleteAvatar(avatarId);
      setAvatars((prev) => prev.filter((avatar) => avatar.id !== avatarId));

      if (selectedAvatarId === avatarId) {
        onSelectedAvatarIdChange(null);
      }
    } catch (error) {
      setStatusMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Could not remove the avatar right now.",
      });
    }
  };

  const tile = (selected: boolean) =>
    cn(
      "pressable relative block w-full overflow-hidden rounded-lg border text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
      selected ? "border-foreground" : "border-border hover:border-input",
    );

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium text-foreground">
          {title}
          {!isManageMode && <span className="font-normal text-muted-foreground"> (optional)</span>}
        </h3>
        <span className="tabular text-xs text-muted-foreground">
          {avatars.length} of {MAX_AVATARS} saved
        </span>
      </div>

      {isManageMode && (
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="avatar-prompt">Describe a new avatar</Label>
            <Textarea
              id="avatar-prompt"
              value={avatarPrompt}
              onChange={(event) => setAvatarPrompt(event.target.value)}
              placeholder="A presenter in her thirties, short natural hair, denim jacket, friendly half-smile, studio light."
              className="h-24 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              onClick={() => void handleGenerateAvatar()}
              isLoading={isGenerating}
              disabled={avatars.length >= MAX_AVATARS || isLoadingLibrary || !avatarPrompt.trim()}
            >
              <Sparkles /> Generate
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatars.length >= MAX_AVATARS}
            >
              <Upload /> Upload
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Generating uses 5 credits. Uploads are free.</p>
        </div>
      )}

      {isLoadingLibrary ? (
        <div className="grid grid-cols-3 gap-3" aria-label="Loading avatars">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : avatars.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
          {resolvedEmptyStateMessage}
        </p>
      ) : (
        <div role={isManageMode ? undefined : "radiogroup"} aria-label={title} className="grid grid-cols-3 gap-3">
          {!isManageMode && (
            <button
              type="button"
              role="radio"
              aria-checked={!selectedAvatarId}
              onClick={() => onSelectedAvatarIdChange(null)}
              className={tile(!selectedAvatarId)}
            >
              <span className="flex aspect-square flex-col items-center justify-center gap-1 bg-secondary text-xs text-muted-foreground">
                <X className="size-4" />
                None
              </span>
            </button>
          )}

          {avatars.map((avatar) => (
            <div key={avatar.id} className="group relative">
              <button
                type="button"
                role={isManageMode ? undefined : "radio"}
                aria-checked={isManageMode ? undefined : selectedAvatarId === avatar.id}
                aria-pressed={isManageMode ? selectedAvatarId === avatar.id : undefined}
                onClick={() => onSelectedAvatarIdChange(avatar.id)}
                className={tile(selectedAvatarId === avatar.id)}
              >
                <img
                  src={avatar.imageDataUrl}
                  alt=""
                  className="aspect-square w-full bg-secondary object-cover"
                />
                <span className="block truncate px-2 py-1.5 text-xs text-foreground">
                  {avatar.name}
                </span>
              </button>
              {isManageMode && (
                <Hint label="Remove avatar">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon-xs"
                    aria-label={`Remove ${avatar.name}`}
                    onClick={() => setPendingDelete(avatar)}
                    className="absolute right-1.5 top-1.5 bg-black/60 text-white hover:bg-destructive"
                  >
                    <Trash2 />
                  </Button>
                </Hint>
              )}
            </div>
          ))}
        </div>
      )}

      {statusMessage && (
        <p
          role={statusMessage.type === "error" ? "alert" : "status"}
          className={cn("text-sm", statusMessage.type === "error" ? "text-destructive" : "text-positive")}
        >
          {statusMessage.text}
        </p>
      )}

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {pendingDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              It disappears from every tool. Banners and videos already made with it are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (pendingDelete) void handleDeleteAvatar(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Remove avatar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};
