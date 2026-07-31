import React from 'react';

type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  label: string;
  placement?: TooltipPlacement;
  children: React.ReactNode;
  className?: string;
}

const PLACEMENT_CLASSES: Record<TooltipPlacement, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

/** Lightweight hover/focus-triggered tooltip. Wrap a single icon-only control as its child. */
export const Tooltip: React.FC<TooltipProps> = ({ label, placement = 'top', children, className = '' }) => {
  return (
    <span className={`group/tooltip relative inline-flex ${className}`}>
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-[9999] whitespace-nowrap rounded-lg border border-white/10 bg-[#101b24] px-2.5 py-1.5 text-[11px] font-medium text-white opacity-0 shadow-[0_12px_28px_-12px_rgba(0,0,0,0.85)] transition-opacity duration-150 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100 ${PLACEMENT_CLASSES[placement]}`}
      >
        {label}
      </span>
    </span>
  );
};
