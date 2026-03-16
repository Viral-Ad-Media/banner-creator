import React, { useState } from 'react';
import { Image as ImageIcon, LayoutTemplate, Sparkles, UserRound, Video } from 'lucide-react';
import type { AvatarAsset } from '../../services/avatarLibrary';
import { AvatarLibraryPicker } from './AvatarLibraryPicker';

interface AvatarStudioPanelProps {
  avatarStorageKey: string;
}

const avatarDestinations = [
  {
    title: 'Banner Generator',
    description: 'Use a saved avatar as the subject reference when generating campaign visuals.',
    icon: LayoutTemplate,
  },
  {
    title: 'Image Studio',
    description: 'Drop a saved avatar straight into the editor as the starting image for new edits.',
    icon: ImageIcon,
  },
  {
    title: 'Video Generator',
    description: 'Turn a saved avatar into the source frame for image-to-video motion renders.',
    icon: Video,
  },
];

export const AvatarStudioPanel: React.FC<AvatarStudioPanelProps> = ({ avatarStorageKey }) => {
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarAsset | null>(null);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.06fr)_360px]">
      <section className="surface-card rounded-[32px] p-6">
        <div className="border-b border-white/8 pb-5">
          <span className="section-kicker">
            <UserRound className="h-5 w-5 text-primary" />
            Avatar Studio
          </span>
          <h2 className="mt-4 text-3xl font-semibold text-white">Build reusable characters once, then carry them across the workspace.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#c0d1de]">
            Create avatars with AI or upload your own portraits here. Everything you save stays available inside Banner
            Generator, Image Studio, and Video Generator for quick selection later.
          </p>
        </div>

        <div className="mt-6">
          <AvatarLibraryPicker
            storageKey={avatarStorageKey}
            selectedAvatarId={selectedAvatarId}
            onSelectedAvatarIdChange={setSelectedAvatarId}
            onSelectedAvatarChange={setSelectedAvatar}
            title="Saved Avatars"
            description="Generate, upload, organize, and select the characters you want available across your creative tools."
            mode="manage"
          />
        </div>
      </section>

      <div className="space-y-6">
        <section className="surface-card rounded-[32px] p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Sparkles className="h-5 w-5 text-primary" />
            Current Selection
          </h3>

          {selectedAvatar ? (
            <div className="mt-5 space-y-4">
              <div className="overflow-hidden rounded-[26px] border border-white/10 bg-black/20">
                <div className="aspect-square bg-white/5">
                  <img src={selectedAvatar.imageDataUrl} alt={selectedAvatar.name} className="h-full w-full object-cover" />
                </div>
                <div className="space-y-2 p-4">
                  <p className="text-lg font-semibold text-white">{selectedAvatar.name}</p>
                  <p className="text-xs uppercase tracking-[0.22em] text-primary">
                    {selectedAvatar.source === 'generated' ? 'AI generated' : 'Uploaded'}
                  </p>
                  <p className="text-sm leading-6 text-white/70">
                    {selectedAvatar.prompt ?? 'Ready to reuse anywhere in the workspace.'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-[26px] border border-dashed border-white/10 bg-black/20 p-6 text-sm leading-7 text-muted">
              Select an avatar to preview it here. You can still create new ones above and keep them ready for the other tools.
            </div>
          )}
        </section>

        <section className="rounded-[32px] border border-primary/15 bg-primary/5 p-6 shadow-[0_28px_80px_-44px_rgba(0,0,0,0.8)]">
          <h3 className="text-lg font-semibold text-white">Where avatars show up</h3>
          <div className="mt-5 space-y-3">
            {avatarDestinations.map((destination) => {
              const Icon = destination.icon;

              return (
                <div key={destination.title} className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/6 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{destination.title}</p>
                      <p className="mt-1 text-xs leading-6 text-white/70">{destination.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
