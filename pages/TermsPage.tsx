import React from 'react';

export const TermsPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-16 sm:px-6 sm:pt-24 lg:px-8">
      <div>
        <h1 className="text-4xl font-semibold tracking-[-0.03em] text-foreground sm:text-5xl">Terms of Service</h1>
        <div className="mt-8 space-y-5 text-base leading-relaxed text-foreground">
          <p>
            By using this platform, you agree to use it lawfully and avoid generating or uploading content that violates
            intellectual property rights, privacy rights, platform rules, or applicable regulations.
          </p>
          <p>
            You are responsible for prompts, uploaded images, avatar assets, and generated media created through your
            account. You should review outputs before publishing them or using them in commercial campaigns.
          </p>
          <p>
            Subscription limits, usage credits, workspace allowances, and billing behavior are defined by your active plan.
            Abuse, automated misuse, or fraudulent behavior may lead to suspension or termination.
          </p>
          <p>
            Video, image, and AI-assisted editing features depend on third-party model availability and may occasionally
            produce incomplete, inaccurate, or unusable results. We do not guarantee uninterrupted model access or output quality.
          </p>
          <p>
            These terms are a product placeholder and should be replaced with legally reviewed terms before public launch.
          </p>
        </div>
      </div>
    </div>
  );
};
