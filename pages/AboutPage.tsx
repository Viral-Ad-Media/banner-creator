import React from 'react';

export const AboutPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-20 pt-12 sm:px-6 lg:px-8 lg:pb-24 lg:pt-16">
      <div className="surface-card rounded-[34px] p-8 sm:p-10">
        <span className="section-kicker">About</span>
        <h1 className="mt-6 text-5xl font-semibold text-white">About Social Studio</h1>
        <p className="mt-5 text-lg leading-8 text-[#c2d2df]">
          Social Studio is a focused SaaS product for campaign teams that need to create and publish social visual content
          quickly. It combines campaign planning, banner generation, avatar-driven image workflows, editing, and short-form
          video creation in one interface so teams can move from idea to published creative without tool-hopping.
        </p>
        <p className="mt-4 text-lg leading-8 text-[#c2d2df]">
          The platform is built with a React frontend, a Supabase-backed Express API, and server-side AI integrations.
          This architecture keeps sensitive keys out of the browser while supporting a modern workspace that includes
          activities, settings, reusable avatars, and image-to-video workflows.
        </p>
        <p className="mt-4 text-lg leading-8 text-[#c2d2df]">
          The goal is straightforward: give fast-moving teams one creative operating surface for ideation, generation,
          review, and iteration instead of spreading that work across disconnected tools.
        </p>
      </div>
    </div>
  );
};
