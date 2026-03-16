import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, Sparkles, Trash2, Upload, UserRound, X } from 'lucide-react';
import { generateImage } from '../../services/geminiService';
import { AvatarAsset, createAvatarAsset, loadAvatarLibrary, saveAvatarLibrary } from '../../services/avatarLibrary';
import { Button } from '../ui/Button';

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_AVATARS = 12;

interface AvatarLibraryPickerProps {
  storageKey: string;
  selectedAvatarId: string | null;
  onSelectedAvatarIdChange: (avatarId: string | null) => void;
  onSelectedAvatarChange: (avatar: AvatarAsset | null) => void;
  title?: string;
  description?: string;
  mode?: 'manage' | 'select';
  emptyStateMessage?: string;
}

export const AvatarLibraryPicker: React.FC<AvatarLibraryPickerProps> = ({
  storageKey,
  selectedAvatarId,
  onSelectedAvatarIdChange,
  onSelectedAvatarChange,
  title = 'Avatar Library',
  description = 'Upload or generate a reusable character/avatar, then apply it to image and video generation.',
  mode = 'manage',
  emptyStateMessage,
}) => {
  const [avatars, setAvatars] = useState<AvatarAsset[]>([]);
  const [avatarPrompt, setAvatarPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isReady, setIsReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isManageMode = mode === 'manage';
  const resolvedEmptyStateMessage =
    emptyStateMessage ??
    (isManageMode
      ? 'Create or upload an avatar to start building reusable characters.'
      : 'No saved avatars yet. Create one in Avatar Studio, then come back to select it here.');

  useEffect(() => {
    setAvatars(loadAvatarLibrary(storageKey));
    setIsReady(true);
  }, [storageKey]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    saveAvatarLibrary(storageKey, avatars);
  }, [avatars, isReady, storageKey]);

  const selectedAvatar = useMemo(
    () => avatars.find((avatar) => avatar.id === selectedAvatarId) ?? null,
    [avatars, selectedAvatarId]
  );

  useEffect(() => {
    if (selectedAvatarId && !selectedAvatar) {
      onSelectedAvatarIdChange(null);
      onSelectedAvatarChange(null);
      return;
    }

    onSelectedAvatarChange(selectedAvatar);
  }, [onSelectedAvatarChange, onSelectedAvatarIdChange, selectedAvatar, selectedAvatarId]);

  const addAvatar = (avatar: AvatarAsset) => {
    setAvatars((prev) => [avatar, ...prev].slice(0, MAX_AVATARS));
    onSelectedAvatarIdChange(avatar.id);
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Could not read the selected image.'));
      reader.readAsDataURL(file);
    });

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setStatusMessage({ type: 'error', text: 'Please choose an image file for the avatar.' });
      return;
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      setStatusMessage({ type: 'error', text: 'Avatar image is too large. Use a file under 10MB.' });
      return;
    }

    try {
      const imageDataUrl = await readFileAsDataUrl(file);
      addAvatar(
        createAvatarAsset({
          name: file.name.replace(/\.[^.]+$/, '') || 'Uploaded Avatar',
          imageDataUrl,
          source: 'upload',
        })
      );
      setStatusMessage({ type: 'success', text: 'Avatar uploaded and selected.' });
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not upload avatar.',
      });
    }
  };

  const handleGenerateAvatar = async () => {
    const trimmedPrompt = avatarPrompt.trim();
    if (trimmedPrompt.length < 3) {
      setStatusMessage({ type: 'error', text: 'Add a short avatar description first.' });
      return;
    }

    setIsGenerating(true);
    setStatusMessage(null);

    try {
      const imageDataUrl = await generateImage(
        `Studio avatar portrait of ${trimmedPrompt}. One clear character, centered composition, clean background, premium lighting, expressive face, no text.`,
        '1:1'
      );

      addAvatar(
        createAvatarAsset({
          name: trimmedPrompt.slice(0, 40),
          imageDataUrl,
          source: 'generated',
          prompt: trimmedPrompt,
        })
      );
      setAvatarPrompt('');
      setStatusMessage({ type: 'success', text: 'Avatar created and selected.' });
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Could not create avatar right now.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteAvatar = (avatarId: string) => {
    setAvatars((prev) => prev.filter((avatar) => avatar.id !== avatarId));
    if (selectedAvatarId === avatarId) {
      onSelectedAvatarIdChange(null);
    }
  };

  return (
    <section className="rounded-[28px] border border-white/10 bg-black/20 p-4 space-y-4">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <UserRound className="h-4 w-4 text-primary" />
          {title}
        </h3>
        <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
      </div>

      {isManageMode && (
        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Generate avatar</label>
            <textarea
              value={avatarPrompt}
              onChange={(event) => setAvatarPrompt(event.target.value)}
              placeholder="Stylish female presenter, afro hair, modern streetwear..."
              className="h-24 w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-muted focus:border-primary/40 focus:ring-1 focus:ring-primary"
            />
            <Button type="button" variant="secondary" onClick={() => void handleGenerateAvatar()} isLoading={isGenerating} className="w-full">
              <Sparkles className="h-4 w-4" />
              Create Avatar
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Upload avatar</label>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} className="w-full">
              <Upload className="h-4 w-4" />
              Upload Image
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Select avatar</label>
          <span className="text-[10px] text-muted">{avatars.length}/{MAX_AVATARS} saved</span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => onSelectedAvatarIdChange(null)}
            className={`rounded-2xl border p-3 text-left transition-all ${
              !selectedAvatarId
                ? 'border-primary bg-primary/10'
                : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5'
            }`}
          >
            <div className="flex aspect-square items-center justify-center rounded-xl bg-white/5">
              <X className="h-5 w-5 text-muted" />
            </div>
            <p className="mt-2 text-xs font-medium text-white">No avatar</p>
            <p className="mt-1 text-[11px] text-muted">Generate without a saved character</p>
          </button>

          {avatars.map((avatar) => (
            <div
              key={avatar.id}
              className={`group rounded-2xl border p-3 transition-all ${
                selectedAvatarId === avatar.id
                  ? 'border-primary bg-primary/10'
                  : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              <button type="button" onClick={() => onSelectedAvatarIdChange(avatar.id)} className="w-full text-left">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-white/5">
                  <img src={avatar.imageDataUrl} alt={avatar.name} className="h-full w-full object-cover" />
                  <div className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-white">
                    {avatar.source === 'generated' ? 'AI' : 'Upload'}
                  </div>
                </div>
                <p className="mt-2 line-clamp-1 text-xs font-medium text-white">{avatar.name}</p>
                <p className="mt-1 text-[11px] text-muted">
                  {avatar.prompt ? avatar.prompt.slice(0, 42) : 'Custom uploaded avatar'}
                </p>
              </button>

              {isManageMode && (
                <button
                  type="button"
                  onClick={() => handleDeleteAvatar(avatar.id)}
                  className="mt-3 inline-flex items-center gap-1 text-[11px] text-red-300 opacity-80 transition-opacity hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              )}
            </div>
          ))}

          {avatars.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-center">
              <ImagePlus className="mx-auto h-5 w-5 text-muted" />
              <p className="mt-2 text-xs text-muted">{resolvedEmptyStateMessage}</p>
            </div>
          )}
        </div>
      </div>

      {selectedAvatar && (
        <div className="rounded-2xl border border-primary/15 bg-primary/5 p-3 text-xs text-white/80">
          Selected avatar: <span className="font-medium text-white">{selectedAvatar.name}</span>
        </div>
      )}

      {statusMessage && (
        <p className={`text-xs ${statusMessage.type === 'error' ? 'text-red-300' : 'text-emerald-300'}`}>
          {statusMessage.text}
        </p>
      )}
    </section>
  );
};
