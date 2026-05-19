import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatRupiah } from "@/lib/utils";
import type { Wallet, TransactionWithCategory } from "@/types";

const WALLET_TYPE_LABEL: Record<string, string> = {
  cash: "Tunai",
  bank: "Bank",
  savings: "Tabungan",
  ewallet: "E-Wallet",
};

const WALLET_TYPE_COLOR: Record<string, string> = {
  cash: "#27AE60",
  bank: "#1E3A5F",
  savings: "#F59E0B",
  ewallet: "#8B5CF6",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const householdId = membership?.household_id;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEnd =
    month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, "0")}-01`;

  const [walletsRes, incomeRes, expenseRes, recentRes] = await Promise.all([
    supabase
      .from("wallets")
      .select("*")
      .eq("household_id", householdId ?? "")
      .eq("is_active", true)
      .order("created_at"),

    supabase
      .from("transactions")
      .select("amount")
      .eq("household_id", householdId ?? "")
      .eq("type", "income")
      .gte("date", monthStart)
      .lt("date", monthEnd),

    supabase
      .from("transactions")
      .select("amount")
      .eq("household_id", householdId ?? "")
      .eq("type", "expense")
      .gte("date", monthStart)
      .lt("date", monthEnd),

    supabase
      .from("transactions")
      .select("*, categories(name, icon, color), wallets(name)")
      .eq("household_id", householdId ?? "")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const wallets = (walletsRes.data ?? []) as Wallet[];
  const totalAset = wallets.reduce((sum, w) => sum + Number(w.current_balance), 0);
  const totalIncome = (incomeRes.data ?? []).reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = (expenseRes.data ?? []).reduce((sum, t) => sum + Number(t.amount), 0);
  const recentTx = (recentRes.data ?? []) as TransactionWithCategory[];

  const bulanNama = now.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Ringkasan Keuangan</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">{bulanNama}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          label="Total Aset"
          value={totalAset}
          color="#1E3A5F"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          }
        />
        <SummaryCard
          label="Pemasukan Bulan Ini"
          value={totalIncome}
          color="#27AE60"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
            </svg>
          }
        />
        <SummaryCard
          label="Pengeluaran Bulan Ini"
          value={totalExpense}
          color="#E74C3C"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" />
            </svg>
          }
        />
      </div>

      {/* Wallets */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-[var(--text-primary)]">Dompet</h2>
          <a href="/dompet" className="text-sm text-brand-primary hover:underline font-medium">
            Lihat semua
          </a>
        </div>

        {wallets.length === 0 ? (
          <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-10 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-secondary)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 12V22H4V12" /><path d="M22 7H2v5h20V7z" />
                <path d="M12 22V7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
              </svg>
            </div>
            <p className="text-[var(--text-secondary)] text-sm">Belum ada dompet</p>
            <a
              href="/dompet"
              className="inline-block mt-3 px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              Tambah Dompet
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {wallets.map((wallet) => (
              <WalletCard key={wallet.id} wallet={wallet} />
            ))}
          </div>
        )}
      </section>

      {/* Recent Transactions */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-[var(--text-primary)]">Transaksi Terbaru</h2>
          <a href="/transaksi" className="text-sm text-brand-primary hover:underline font-medium">
            Lihat semua
          </a>
        </div>

        <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] overflow-hidden">
          {recentTx.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-secondary)]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </div>
              <p className="text-[var(--text-secondary)] text-sm">Belum ada transaksi</p>
              <a
                href="/transaksi"
                className="inline-block mt-3 px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                Catat Transaksi
              </a>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {recentTx.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} />
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-[var(--text-secondary)]">{label}</p>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: color + "1A", color }}
        >
          {icon}
        </div>
      </div>
      <p className="font-financial text-2xl font-semibold text-[var(--text-primary)]">
        Rp {formatRupiah(value)}
      </p>
    </div>
  );
}

function WalletCard({ wallet }: { wallet: Wallet }) {
  const color = wallet.color ?? WALLET_TYPE_COLOR[wallet.type] ?? "#1E3A5F";
  const typeLabel = WALLET_TYPE_LABEL[wallet.type] ?? wallet.type;

  return (
    <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-4">
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: color }}
        >
          {wallet.name[0].toUpperCase()}
        </div>
        <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded-full">
          {typeLabel}
        </span>
      </div>
      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{wallet.name}</p>
      <p className="font-financial text-lg font-semibold mt-1" style={{ color }}>
        Rp {formatRupiah(Number(wallet.current_balance))}
      </p>
    </div>
  );
}

function TransactionRow({ tx }: { tx: TransactionWithCategory }) {
  const isIncome = tx.type === "income";
  const category = tx.categories;
  const date = new Date(tx.date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });

  return (
    <li className="flex items-center gap-4 px-4 py-3.5 hover:bg-[var(--bg-elevated)] transition-colors">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
        style={{ backgroundColor: (category?.color ?? "#94A3B8") + "20" }}
      >
        {category?.icon ?? "💸"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{tx.description}</p>
        <p className="text-xs text-[var(--text-secondary)]">
          {category?.name} · {tx.wallets?.name} · {date}
        </p>
      </div>
      <p
        className={[
          "font-financial text-sm font-semibold flex-shrink-0",
          isIncome ? "text-success" : "text-danger",
        ].join(" ")}
      >
        {isIncome ? "+" : "-"}Rp {formatRupiah(Number(tx.amount))}
      </p>
    </li>
  );
}
