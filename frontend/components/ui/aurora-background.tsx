"use client";
import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

export function AuroraBackground({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900 transition-colors",
        className
      )}
      {...props}
    >
      {/* Aurora layer */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={cn(
            // aurora color gradient (blues, indigos, violets)
            "[--aurora:repeating-linear-gradient(100deg,#3b82f6_10%,#a5b4fc_15%,#93c5fd_20%,#ddd6fe_25%,#60a5fa_30%)]",
            // light: white stripe + aurora, then inverted so colors appear
            "[background-image:repeating-linear-gradient(100deg,#fff_0%,#fff_7%,transparent_10%,transparent_12%,#fff_16%),var(--aurora)]",
            // dark: black stripe + aurora, no invert
            "dark:[background-image:repeating-linear-gradient(100deg,#000_0%,#000_7%,transparent_10%,transparent_12%,#000_16%),var(--aurora)]",
            "[background-size:300%,200%]",
            "[background-position:50%_50%,50%_50%]",
            // animated pseudo-element layer for movement
            "after:content-[''] after:absolute after:inset-0",
            "after:[background-image:repeating-linear-gradient(100deg,#fff_0%,#fff_7%,transparent_10%,transparent_12%,#fff_16%),var(--aurora)]",
            "after:dark:[background-image:repeating-linear-gradient(100deg,#000_0%,#000_7%,transparent_10%,transparent_12%,#000_16%),var(--aurora)]",
            "after:[background-size:200%,100%]",
            "after:animate-aurora",
            "after:[background-attachment:fixed]",
            "after:mix-blend-difference",
            // visual treatment
            "pointer-events-none absolute -inset-[10px] opacity-50 will-change-transform",
            "blur-[10px] invert dark:invert-0",
            showRadialGradient &&
              "[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,transparent_70%)]"
          )}
        />
      </div>

      {/* Page content above aurora */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
