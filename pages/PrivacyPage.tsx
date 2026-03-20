import React from 'react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-20 pt-12 sm:px-6 lg:px-8 lg:pb-24 lg:pt-16">
      <div className="surface-card rounded-[34px] p-8 sm:p-10">
        <span className="section-kicker">Privacy</span>
        <h1 className="mt-6 text-5xl font-semibold text-white">Privacy Policy</h1>
        <div className="mt-8 space-y-5 text-sm leading-7 text-[#c2d2df]">
          <p>
            We collect account details, workspace usage analytics, generation history, and billing-related metadata needed
            to operate the product and enforce plan limits.
          </p>
          <p>
            Authentication is handled through Supabase. Banner plans, image generations, image edits, and related workspace
            activity may be stored in backend records so the app can provide history, usage reporting, and account support.
          </p>
          <p>
            Some workspace data is stored locally in your browser for product convenience, including draft state and recent
            video job references restored on the same device/browser. Saved avatar assets are stored with your account so
            they remain available across the workspace after refreshes and sign-ins.
          </p>
          <p>
            Uploaded images, avatar assets, prompts, and generation requests may be processed by integrated AI providers to
            produce requested output. This placeholder policy should be replaced with a legally reviewed production version
            before public launch.
          </p>
          <p>
            You can request account deletion by contacting support. Deleting an account may remove associated workspace
            records, subject to operational or legal retention requirements.
          </p>
        </div>
      </div>
    </div>
  );
};
