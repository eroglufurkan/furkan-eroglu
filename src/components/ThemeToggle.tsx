"use client";

import type { ThemeId } from "@/game/theme";

/**
 * One button that flips between the two rooms. The icon shows what you would
 * get by pressing it, which is the convention people already expect.
 */
export default function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: ThemeId;
  onToggle: () => void;
}) {
  const goingBright = theme === "dark";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={goingBright ? "Switch to the bright room" : "Switch to the dark room"}
      title={goingBright ? "Bright room" : "Dark room"}
      className="flex h-[30px] w-[30px] shrink-0 items-center justify-center border border-ash-700 text-bone-dim transition-colors hover:border-ash-500 hover:text-bone"
    >
      {goingBright ? (
        // Sun
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden fill="none">
          <circle cx="8" cy="8" r="3.2" fill="currentColor" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <rect
              key={deg}
              x="7.4"
              y="0.6"
              width="1.2"
              height="2.6"
              rx="0.6"
              fill="currentColor"
              transform={`rotate(${deg} 8 8)`}
            />
          ))}
        </svg>
      ) : (
        // Moon
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
          <path
            d="M13.2 10.1A5.6 5.6 0 0 1 6 2.7a5.7 5.7 0 1 0 7.2 7.4Z"
            fill="currentColor"
          />
        </svg>
      )}
    </button>
  );
}
