import LogoutButton from "./LogoutButton";

interface TopbarProps {
  householdName: string;
  userName: string;
  darkMode: boolean;
  onToggleDark: () => void;
  onMenuClick: () => void;
}

export default function Topbar({ householdName, userName, darkMode, onToggleDark, onMenuClick }: TopbarProps) {
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="h-14 flex-shrink-0 bg-[var(--bg-surface)] border-b border-[var(--border)] px-4 flex items-center justify-between gap-3">
      {/* Left: hamburger (mobile) + household name */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Logo — mobile only (sidebar hidden on mobile) */}
        <div className="lg:hidden flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-brand-primary flex items-center justify-center">
            <span className="text-white font-bold text-xs">M</span>
          </div>
          <span className="font-bold text-[var(--text-primary)] text-base tracking-tight">Maalify</span>
        </div>

        <div className="min-w-0">
          <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider leading-none">Keluarga</p>
          <h2 className="font-semibold text-[var(--text-primary)] leading-tight text-sm truncate">{householdName}</h2>
        </div>
      </div>

      {/* Right: dark mode + avatar + logout */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Dark mode toggle */}
        <button
          onClick={onToggleDark}
          className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
          aria-label={darkMode ? "Mode terang" : "Mode gelap"}
          title={darkMode ? "Mode terang" : "Mode gelap"}
        >
          {darkMode ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>

        {/* Avatar + name (hidden on xs) */}
        <div className="hidden sm:flex items-center gap-2">
          <p className="text-sm font-medium text-[var(--text-primary)]">{userName}</p>
          <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold">{initials}</span>
          </div>
        </div>

        <LogoutButton />
      </div>
    </header>
  );
}
