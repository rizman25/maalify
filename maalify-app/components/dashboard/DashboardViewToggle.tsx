"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function DashboardViewToggle({ current }: { current: "household" | "personal" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function switchTo(view: "household" | "personal") {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "household") params.delete("view");
    else params.set("view", "personal");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-[var(--bg-elevated)] rounded-xl">
      <button
        onClick={() => switchTo("household")}
        className={[
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
          current === "household"
            ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm"
            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
        ].join(" ")}
      >
        <span>👨‍👩‍👧‍👦</span>
        <span>Keluarga</span>
      </button>
      <button
        onClick={() => switchTo("personal")}
        className={[
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
          current === "personal"
            ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm"
            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
        ].join(" ")}
      >
        <span>🙋</span>
        <span>Pribadi</span>
      </button>
    </div>
  );
}
