import React, { useCallback } from 'react';
import { EVENTS, Joyride, type EventData, type Step } from 'react-joyride';

interface ProductTourProps {
  run: boolean;
  onFinish: () => void;
}

const TOUR_STEPS: Step[] = [
  {
    target: '[data-tour="nav-banner-generator"]',
    title: 'Banner Generator',
    content: 'Describe a campaign in plain language and get on-brand copy plus multiple banner visuals you can edit.',
    placement: 'right',
  },
  {
    target: '[data-tour="nav-avatar-studio"]',
    title: 'Avatar Studio',
    content: 'Create reusable character avatars once, then reuse them across banners, image edits, and videos.',
    placement: 'right',
  },
  {
    target: '[data-tour="nav-image-studio"]',
    title: 'Image Studio',
    content: 'Upload or reuse an avatar image and refine it with natural-language edit instructions.',
    placement: 'right',
  },
  {
    target: '[data-tour="nav-video-generator"]',
    title: 'Video Generator',
    content: 'Turn a prompt, image, or avatar into a motion clip, or storyboard a multi-scene reel.',
    placement: 'right',
  },
  {
    target: '[data-tour="nav-activities"]',
    title: 'Activities',
    content: 'Every plan, image render, edit, and video job you run shows up here with its status and credit usage.',
    placement: 'right',
  },
  {
    target: '[data-tour="nav-settings"]',
    title: 'Settings',
    content: 'Update your profile and check your plan, credits, and billing status. You can replay this tour from here anytime.',
    placement: 'right',
  },
];

const TOUR_OPTIONS = {
  primaryColor: '#40d6c3',
  backgroundColor: '#101b24',
  textColor: '#f4f8fb',
  arrowColor: '#101b24',
  overlayColor: 'rgba(7, 18, 25, 0.82)',
  spotlightPadding: 8,
  zIndex: 1000,
  showProgress: true,
  skipBeacon: true,
  width: 320,
};

export const ProductTour: React.FC<ProductTourProps> = ({ run, onFinish }) => {
  const handleEvent = useCallback(
    (data: EventData) => {
      if (data.type === EVENTS.TOUR_END) {
        onFinish();
      }
    },
    [onFinish]
  );

  return (
    <Joyride
      run={run}
      steps={TOUR_STEPS}
      continuous
      onEvent={handleEvent}
      options={TOUR_OPTIONS}
      locale={{ back: 'Back', close: 'Close', last: 'Done', next: 'Next', skip: 'Skip tour' }}
    />
  );
};
