import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const features = [
  {
    title: 'Campaign planning',
    description:
      'Describe the post in a sentence. The planner returns a headline, a support line, a caption, hashtags, keywords and an angle for every extra banner. Choose Gemini or an OpenRouter model per run.',
    detail: ['1 to 6 banners per run', 'Caption, hashtags and keywords', 'Planner model per run'],
  },
  {
    title: 'Banner images in four sizes',
    description:
      'Every banner is painted for its format: square feed posts, 4:5 portraits, 9:16 stories and 16:9 web banners. Add your own background or logo and the planner composes around it.',
    detail: ['1:1, 4:5, 9:16, 16:9', 'Your background or logo', 'Up to two reference images'],
  },
  {
    title: 'The layer editor',
    description:
      'Open any banner as layers. Move and restyle the text, swap the picture, add shapes and stickers, then download a PNG that matches what you see.',
    detail: ['Text, image and shape layers', 'Undo and redo', 'Export what you see'],
  },
  {
    title: 'Avatar library',
    description:
      'Upload a character or generate one, then reuse it in banners, image edits and video. The library is stored with your account, up to twelve avatars.',
    detail: ['Upload or generate', 'Used across every tool', 'Synced to your account'],
  },
  {
    title: 'Image Studio',
    description:
      'Load an upload or an avatar and change it by describing the change: the light, the background, the outfit. Each edit is a step you can undo.',
    detail: ['Edit by description', 'Step-by-step undo', 'Drafts kept in the browser'],
  },
  {
    title: 'Video and reels',
    description:
      'Make a 4 to 8 second clip from a prompt, a still or an avatar, or plan a reel of several scenes and merge them into one file with sound.',
    detail: ['16:9 and 9:16', 'Image-to-video', 'Multi-scene reels'],
  },
  {
    title: 'Activity and credits',
    description:
      'Every run is listed with its status and its cost. Credits are held while a run works and released if it fails.',
    detail: ['Run history', 'Credits held, then settled', 'Recover finished results'],
  },
];

export const FeaturesPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 sm:pt-24 lg:px-8">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-[-0.03em] text-foreground sm:text-6xl">How each tool works</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-foreground">
          Seven parts of one workspace, from the first sentence of a brief to the file you post.
        </p>
      </div>

      <div className="mt-16 divide-y divide-border border-t border-border">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="grid gap-4 py-10 lg:grid-cols-12 lg:gap-10"
          >
            <h2 className="text-2xl font-semibold leading-tight text-foreground lg:col-span-4">{feature.title}</h2>
            <p className="text-base leading-relaxed text-foreground lg:col-span-5">{feature.description}</p>
            <ul className="space-y-1.5 text-sm text-muted-foreground lg:col-span-3">
              {feature.detail.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <Button asChild size="lg" className="mt-12">
        <Link to="/auth?mode=register">Start free with 120 credits</Link>
      </Button>
    </div>
  );
};
