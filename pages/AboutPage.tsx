import React from 'react';

export const AboutPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-16 sm:px-6 sm:pt-24 lg:px-8">
      <h1 className="text-4xl font-semibold tracking-[-0.03em] text-foreground sm:text-5xl">Why we built it</h1>
      <div className="mt-8 space-y-5 text-lg leading-relaxed text-foreground">
        <p>
          A single social post now ships in four sizes, with a caption, hashtags, often a short clip, and a version for
          every channel. Most teams make that in five tools and lose an afternoon moving files between them.
        </p>
        <p>
          Social Studio keeps it in one place. You write the brief once; the planner writes the copy, the image models
          paint each format, and the editor, Image Studio and video tools pick up from there with the same avatars and the
          same credits.
        </p>
        <p className="text-muted-foreground">
          The AI providers are called from our server, never from your browser, so no key ever reaches the page. Credits
          are held when a run starts and settled only when it finishes.
        </p>
      </div>
    </div>
  );
};
