import type { ReactNode } from "react";

type Props = {
  src: string;
  children: ReactNode;
  /** Vignette intensity from 0 (none) to 1 (heavy). Default 0.4 */
  vignette?: number;
  /** Tint color for the warm overlay (hex/rgba). Default amber. */
  tint?: string;
  className?: string;
};

/**
 * Wraps a game UI inside a Pixar-style diorama background image, with a soft
 * warm vignette to keep foreground UI readable on top of the colorful scene.
 */
export default function SceneBackdrop({ src, children, vignette = 0.45, tint, className = "" }: Props) {
  const tintRgba = tint ?? "rgba(254,243,199,0.55)";
  return (
    <div className={`relative h-full w-full overflow-hidden rounded-2xl border-4 border-amber-900/25 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.35)] ${className}`}>
      <img
        src={src}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, ${tintRgba} 0%, rgba(254,215,170,0.18) 45%, rgba(0,0,0,${vignette}) 100%)`,
        }}
      />
      <div className="relative z-10 h-full w-full overflow-auto">{children}</div>
    </div>
  );
}
