import React from "react";
import { cn } from "@/lib/utils";

/**
 * The product mark: a square post and a tall story frame, the two shapes every
 * campaign in the app is cut into.
 */
export const BrandMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={cn("size-6 shrink-0", className)}
  >
    <rect x="2" y="6" width="12" height="12" rx="2" fill="var(--brand)" />
    <rect
      x="15.5"
      y="2"
      width="6.5"
      height="20"
      rx="1.5"
      fill="none"
      stroke="var(--brand)"
      strokeWidth="1.6"
    />
  </svg>
);

export const Wordmark: React.FC<{ className?: string }> = ({ className }) => (
  <span className={cn("inline-flex items-center gap-2.5", className)}>
    <BrandMark />
    <span className="text-[15px] font-semibold text-foreground">
      Social Studio
    </span>
  </span>
);
