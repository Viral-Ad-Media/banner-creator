import React, { useState } from 'react';
import { ArrowRight, Film, LayoutTemplate, Sparkles, UserRound, Wand2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface WelcomeModalProps {
  userName: string;
  onComplete: () => void;
}

const STEPS = [
  {
    icon: Sparkles,
    title: 'Welcome to Social Studio',
    body: "Plan campaigns, generate visuals, and edit them in one workspace. Let's take a 60-second look at what's here.",
  },
  {
    icon: LayoutTemplate,
    title: 'Banner Generator',
    body: 'Describe a campaign in plain language and get on-brand copy, hashtags, and multiple banner visuals you can edit right in the canvas.',
  },
  {
    icon: UserRound,
    title: 'Avatar Studio, Image Studio, Video Generator',
    body: 'Build reusable character avatars, refine any image with natural-language edits, and turn stills into motion clips or scene reels.',
  },
  {
    icon: Film,
    title: "You're ready",
    body: 'Everything you generate is tracked in Activities, and your plan details live in Settings. Next, a quick tour of the workspace.',
  },
] as const;

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ userName, onComplete }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="surface-card-strong relative w-full max-w-md overflow-hidden rounded-[30px] p-8">
        <button
          type="button"
          onClick={onComplete}
          className="absolute right-5 top-5 text-xs font-semibold uppercase tracking-[0.2em] text-muted transition-colors hover:text-white"
        >
          Skip
        </button>

        <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-primary/12 text-primary shadow-[0_0_0_1px_rgba(64,214,195,0.16)]">
          <Icon className="h-7 w-7" />
        </div>

        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-primary/90">
          {stepIndex === 0 ? `Hi ${userName || 'there'}` : `Step ${stepIndex + 1} of ${STEPS.length}`}
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{step.title}</h2>
        <p className="mt-3 text-sm leading-6 text-muted">{step.body}</p>

        <div className="mt-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, index) => (
              <span
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === stepIndex ? 'w-6 bg-primary' : 'w-1.5 bg-white/15'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setStepIndex((current) => current - 1)}>
                Back
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => (isLastStep ? onComplete() : setStepIndex((current) => current + 1))}
            >
              {isLastStep ? 'Start tour' : 'Next'}
              {!isLastStep && <ArrowRight className="h-4 w-4" />}
              {isLastStep && <Wand2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
