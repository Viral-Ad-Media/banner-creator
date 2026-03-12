import React from 'react';

export const ContactPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold text-white">Contact</h1>
      <p className="text-muted mt-4">Questions about plans, integration, or enterprise onboarding?</p>

      <div className="mt-8 grid sm:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-white/10 bg-surface/70 p-6">
          <h2 className="text-lg font-semibold text-white">Sales</h2>
          <p className="text-sm text-muted mt-2">sales@socialstudio.app</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-surface/70 p-6">
          <h2 className="text-lg font-semibold text-white">Support</h2>
          <p className="text-sm text-muted mt-2">support@socialstudio.app</p>
        </div>
      </div>
    </div>
  );
};
