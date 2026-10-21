import React from 'react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-16 sm:px-6 sm:pt-24 lg:px-8">
      <div>
        <h1 className="text-4xl font-semibold tracking-[-0.03em] text-foreground sm:text-5xl">Privacy Policy</h1>
        <div className="mt-8 space-y-5 text-base leading-relaxed text-foreground">
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
