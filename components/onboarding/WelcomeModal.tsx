import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { cn } from '@/lib/utils';

interface WelcomeModalProps {
  open: boolean;
  userName: string;
  onComplete: () => void;
}

const STEPS = [
  {
    title: 'Welcome to Social Studio',
    body: 'Plan campaigns, generate visuals and edit them in one workspace. Here is a one-minute look around.',
  },
  {
    title: 'Banner Generator',
    body: 'Describe a campaign in a sentence and get copy, hashtags and several banners you can edit as layers.',
  },
  {
    title: 'Avatars, edits and video',
    body: 'Save characters once and reuse them, change any picture by describing the change, and turn stills into clips or reels.',
  },
  {
    title: 'Ready when you are',
    body: 'Every run appears in Activities with the credits it used; your plan lives in Settings. Next, a short tour of the sidebar.',
  },
] as const;

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ open, userName, onComplete }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  useEffect(() => {
    if (open) setStepIndex(0);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onComplete()}>
      <DialogContent className="max-w-md gap-0 p-0">
        <div className="p-6 pb-0">
          <p className="text-sm text-muted-foreground">
            {stepIndex === 0 ? `Hi ${userName || 'there'}` : `${stepIndex + 1} of ${STEPS.length}`}
          </p>
          {/* Keyed so each step's text eases in; the dialog itself stays put. */}
          <DialogHeader key={stepIndex} className="enter mt-2 text-left">
            <DialogTitle className="text-xl font-semibold leading-tight">{step.title}</DialogTitle>
            <DialogDescription className="text-base leading-relaxed text-muted-foreground">
              {step.body}
            </DialogDescription>
          </DialogHeader>
        </div>

        <DialogFooter className="mt-8 flex-row items-center justify-between border-t border-border p-4 sm:justify-between">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {STEPS.map((_, index) => (
              <span
                key={index}
                className={cn(
                  'size-1.5 rounded-full transition-colors duration-200',
                  index === stepIndex ? 'bg-foreground' : 'bg-border',
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {stepIndex > 0 ? (
              <Button variant="ghost" size="sm" onClick={() => setStepIndex((current) => current - 1)}>
                Back
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={onComplete}>
                Skip
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => (isLastStep ? onComplete() : setStepIndex((current) => current + 1))}
            >
              {isLastStep ? 'Start the tour' : 'Next'}
              {!isLastStep && <ArrowRight />}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
