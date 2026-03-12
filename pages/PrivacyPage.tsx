import React from 'react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold text-white">Privacy Policy</h1>
      <div className="space-y-4 mt-6 text-sm text-muted leading-relaxed">
        <p>
          We collect account details, usage analytics, and generation history needed to operate the product and enforce
          plan limits.
        </p>
        <p>
          Authentication is handled through Supabase. Data generated in the app is stored in your workspace records and
          is only used to provide product functionality and support.
        </p>
        <p>
          You can request account deletion by contacting support. This sample policy should be replaced with a legal
          version before production launch.
        </p>
      </div>
    </div>
  );
};
