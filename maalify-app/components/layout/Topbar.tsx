import LogoutButton from "./LogoutButton";

interface TopbarProps {
  householdName: string;
  userName: string;
}

export default function Topbar({ householdName, userName }: TopbarProps) {
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="h-16 flex-shrink-0 bg-[var(--bg-surface)] border-b border-[var(--border)] px-6 flex items-center justify-between">
      <div>
        <p className="text-sm text-[var(--text-secondary)]">Keluarga</p>
        <h2 className="font-semibold text-[var(--text-primary)] leading-tight">{householdName}</h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-[var(--text-primary)]">{userName}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-brand-primary flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm font-semibold">{initials}</span>
        </div>
        <LogoutButton />
      </div>
    </header>
  );
}
