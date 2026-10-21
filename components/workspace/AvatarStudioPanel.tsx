import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { AvatarAsset } from '../../services/avatarLibrary';
import { AvatarLibraryPicker } from './AvatarLibraryPicker';
import { Button } from '../ui/button';

const avatarDestinations = [
  { title: 'Banner Generator', to: '/app/banner-generator', description: 'as the person in the pictures' },
  { title: 'Image Studio', to: '/app/image-studio', description: 'as the starting image for edits' },
  { title: 'Video Generator', to: '/app/video-generator', description: 'as the first frame of a clip' },
];

export const AvatarStudioPanel: React.FC = () => {
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarAsset | null>(null);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
      <AvatarLibraryPicker
        selectedAvatarId={selectedAvatarId}
        onSelectedAvatarIdChange={setSelectedAvatarId}
        onSelectedAvatarChange={setSelectedAvatar}
        title="Your avatars"
        mode="manage"
      />

      <section aria-labelledby="avatar-detail-heading" className="overflow-hidden rounded-xl border border-border bg-card">
        {selectedAvatar ? (
          <div key={selectedAvatar.id} className="enter">
            <img
              src={selectedAvatar.imageDataUrl}
              alt={selectedAvatar.name}
              className="aspect-square w-full bg-secondary object-cover"
            />
            <div className="space-y-1 p-5">
              <h2 id="avatar-detail-heading" className="text-base font-semibold text-foreground">
                {selectedAvatar.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedAvatar.source === 'generated' ? 'Generated' : 'Uploaded'}
              </p>
              {selectedAvatar.prompt && (
                <p className="pt-2 text-sm leading-relaxed text-foreground">{selectedAvatar.prompt}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-5">
            <h2 id="avatar-detail-heading" className="text-base font-semibold text-foreground">
              Pick an avatar to see it here
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Saved avatars are on your account, so every tool can use them.
            </p>
          </div>
        )}

        <ul className="divide-y divide-border border-t border-border">
          {avatarDestinations.map((destination) => (
            <li key={destination.to} className="flex items-center justify-between gap-3 px-5 py-3">
              <p className="text-sm">
                <span className="text-foreground">{destination.title}</span>{' '}
                <span className="text-muted-foreground">{destination.description}</span>
              </p>
              <Button asChild variant="ghost" size="sm">
                <Link to={destination.to}>Open</Link>
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
