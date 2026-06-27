"use client";

import { SkipForward } from "lucide-react";

interface SkipButtonProps {
  onSkip: () => void;
  disabled?: boolean;
}

export function SkipButton({ onSkip, disabled }: SkipButtonProps) {
  if (disabled) return null;
  return (
    <button
      onClick={onSkip}
      className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-background/80 backdrop-blur-sm border border-border/50 text-muted-foreground hover:text-foreground hover:bg-background/95 px-3 py-1.5 rounded-full text-sm font-medium transition-colors shadow-md"
    >
      Skip <SkipForward className="w-3.5 h-3.5" />
    </button>
  );
}
