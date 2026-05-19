"use client";

interface Props {
  dark: boolean;
  onToggle: () => void;
  size?: "sm" | "md";
}

export default function ThemeToggle({ dark, onToggle, size = "md" }: Props) {
  const isSmall = size === "sm";

  return (
    <button
      onClick={onToggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Mode Terang" : "Mode Gelap"}
      className={[
        "relative flex items-center flex-shrink-0 rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
        isSmall ? "w-12 h-6 p-0.5" : "w-14 h-7 p-1",
        dark
          ? "bg-[#1E3A5F]"
          : "bg-neutral-200",
      ].join(" ")}
    >
      {/* Track icons */}
      <span className={[
        "absolute left-0 right-0 flex items-center justify-between pointer-events-none",
        isSmall ? "px-1.5" : "px-2",
      ].join(" ")}>
        {/* Sun — left side (light mode icon) */}
        <svg
          width={isSmall ? "9" : "11"}
          height={isSmall ? "9" : "11"}
          viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`transition-opacity duration-200 ${dark ? "opacity-40 text-slate-400" : "opacity-0"}`}
        >
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
        {/* Moon — right side (dark mode icon) */}
        <svg
          width={isSmall ? "9" : "11"}
          height={isSmall ? "9" : "11"}
          viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`transition-opacity duration-200 ${dark ? "opacity-0" : "opacity-40 text-neutral-500"}`}
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </span>

      {/* Thumb */}
      <span
        className={[
          "relative z-10 flex items-center justify-center rounded-full bg-white shadow-md transition-all duration-300",
          isSmall ? "w-5 h-5" : "w-5 h-5",
          dark
            ? isSmall ? "translate-x-6" : "translate-x-7"
            : "translate-x-0",
        ].join(" ")}
      >
        {dark ? (
          // Moon icon on thumb when dark
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#1E3A5F" stroke="#1E3A5F" strokeWidth="1">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        ) : (
          // Sun icon on thumb when light
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        )}
      </span>
    </button>
  );
}
