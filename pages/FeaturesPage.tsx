import React from 'react';
import { Clapperboard, History, Image as ImageIcon, PenTool, Sparkles, UserSquare2, Workflow } from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: 'AI Campaign Planning',
    description: 'Generate banner concepts with structured copy, messaging angles, and channel-ready captions.',
  },
  {
    icon: ImageIcon,
    title: 'Banner Image Generation',
    description: 'Produce high-quality social visuals in multiple aspect ratios and request several creative variations in one run.',
  },
  {
    icon: UserSquare2,
    title: 'Shared Avatar Library',
    description: 'Create or upload reusable avatars, then apply them across banner generation, image editing, and video workflows.',
  },
  {
    icon: PenTool,
    title: 'Image Studio Editing',
    description: 'Load an upload or avatar into Image Studio and iterate with natural-language editing instructions and local undo history.',
  },
  {
    icon: Clapperboard,
    title: 'Video and Image-to-Video',
    description: 'Generate short clips from prompts or use a selected avatar image as the starting frame for motion generation.',
  },
  {
    icon: History,
    title: 'Activities and Usage',
    description: 'Review recent generation history, credit consumption, and workspace progress from a dedicated activity feed.',
  },
  {
    icon: Workflow,
    title: 'Workspace Settings',
    description: 'Manage profile details, review plan information, and keep billing and usage context visible in-app.',
  },
];

export const FeaturesPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-6 lg:px-8 lg:pb-24 lg:pt-16">
      <div className="max-w-3xl">
        <span className="section-kicker">Feature Set</span>
        <h1 className="mt-6 text-balance text-5xl font-semibold leading-tight text-white">Features built for creative velocity</h1>
        <p className="mt-4 text-lg leading-8 text-[#c2d2df]">
          Every part of the workflow is integrated, from first idea to export-ready social banner.
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {features.map((feature) => (
          <article key={feature.title} className="surface-card rounded-[28px] p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-primary/12 text-primary">
              <feature.icon className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-white">{feature.title}</h2>
            <p className="mt-3 text-sm leading-7 text-muted">{feature.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
};
