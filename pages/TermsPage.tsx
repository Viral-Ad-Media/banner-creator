import React from 'react';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold text-white">Terms of Service</h1>
      <div className="space-y-4 mt-6 text-sm text-muted leading-relaxed">
        <p>
          By using this platform, you agree to use it lawfully and avoid generating content that violates intellectual
          property rights or applicable regulations.
        </p>
        <p>
          Subscription limits, usage credits, and billing behavior are defined by your active plan. Abuse or fraud may
          lead to suspension.
        </p>
        <p>
          These terms are a product placeholder and should be replaced with legally reviewed terms before public launch.
        </p>
      </div>
    </div>
  );
};
