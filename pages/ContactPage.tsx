import React from 'react';

export const ContactPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-20 pt-12 sm:px-6 lg:px-8 lg:pb-24 lg:pt-16">
      <div className="surface-card rounded-[34px] p-8 sm:p-10">
        <span className="section-kicker">Contact</span>
        <h1 className="mt-6 text-5xl font-semibold text-white">Questions, onboarding, or enterprise planning?</h1>
        <p className="mt-4 text-lg leading-8 text-[#c2d2df]">
          Reach out for workspace onboarding, plan guidance, implementation questions, or help setting up campaign, avatar,
          and video workflows.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          <div className="rounded-[28px] border border-white/10 bg-black/20 p-6">
            <h2 className="text-lg font-semibold text-white">Sales</h2>
            <p className="mt-2 text-sm text-muted">sales@socialstudio.app</p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-black/20 p-6">
            <h2 className="text-lg font-semibold text-white">Support</h2>
            <p className="mt-2 text-sm text-muted">support@socialstudio.app</p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-black/20 p-6">
            <h2 className="text-lg font-semibold text-white">Enterprise</h2>
            <p className="mt-2 text-sm text-muted">enterprise@socialstudio.app</p>
          </div>
        </div>
      </div>
    </div>
  );
};
