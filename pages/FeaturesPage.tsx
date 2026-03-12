import React from 'react';
import { Image as ImageIcon, PenTool, Sparkles, Workflow } from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: 'AI Campaign Planning',
    description: 'Generate banner concepts with structured copy, messaging angles, and channel-ready captions.',
  },
  {
    icon: ImageIcon,
    title: 'Image Generation',
    description: 'Produce high-quality social visuals in multiple aspect ratios from a single brief.',
  },
  {
    icon: PenTool,
    title: 'Built-in Editor',
    description: 'Refine text, composition, and visual style inside the app before download.',
  },
  {
    icon: Workflow,
    title: 'SaaS Usage Tracking',
    description: 'Track monthly credits, persist generation history, and gate capabilities by plan tier.',
  },
];

export const FeaturesPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold text-white">Features built for creative velocity</h1>
        <p className="text-muted mt-4">
          Every part of the workflow is integrated, from first idea to export-ready social banner.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5 mt-10">
        {features.map((feature) => (
          <article key={feature.title} className="rounded-2xl border border-white/10 bg-surface/70 p-6">
            <feature.icon className="w-6 h-6 text-primary mb-4" />
            <h2 className="text-lg font-semibold text-white">{feature.title}</h2>
            <p className="text-sm text-muted mt-2 leading-relaxed">{feature.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
};
