import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MODEL = "google/gemini-2.0-flash-001";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({ error: "OPENROUTER_API_KEY belum dikonfigurasi" }, { status: 500 });
  }

  const { messages }: { messages: Message[] } = await req.json();
  if (!messages?.length) return NextResponse.json({ error: "Pesan kosong" }, { status: 400 });

  // Ambil data household
  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const householdId = membership?.household_id;
  if (!householdId) return NextResponse.json({ error: "Household tidak ditemukan" }, { status: 400 });

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const pad = (n: number) => String(n).padStart(2, "0");
  const monthStart = `${year}-${pad(month)}-01`;
  const monthEnd = month === 12 ? `${year + 1}-01-01` : `${year}-${pad(month + 1)}-01`;
  const prevMonthStart = month === 1 ? `${year - 1}-12-01` : `${year}-${pad(month - 1)}-01`;

  const BULAN = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

  // Fetch semua data keuangan secara paralel
  const [txRes, prevTxRes, walletsRes, budgetsRes, debtsRes, goalsRes, recentTxRes, catRes] = await Promise.all([
    supabase.from("transactions").select("type, amount, description, date, categories(name)")
      .eq("household_id", householdId).gte("date", monthStart).lt("date", monthEnd),

    supabase.from("transactions").select("type, amount")
      .eq("household_id", householdId).gte("date", prevMonthStart).lt("date", monthStart),

    supabase.from("wallets").select("name, type, current_balance, is_active")
      .eq("household_id", householdId).eq("is_active", true).order("current_balance", { ascending: false }),

    supabase.from("budgets")
      .select("amount, categories(name)")
      .eq("household_id", householdId).eq("month", month).eq("year", year),

    supabase.from("debts").select("type, party_name, remaining_amount, due_date, status")
      .eq("household_id", householdId).eq("status", "active"),

    supabase.from("savings_goals").select("name, target_amount, current_amount, deadline, is_completed")
      .eq("household_id", householdId).eq("is_completed", false),

    supabase.from("transactions")
      .select("type, amount, description, date, categories(name), wallets(name)")
      .eq("household_id", householdId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10),

    supabase.from("transactions")
      .select("amount, categories(name)")
      .eq("household_id", householdId).eq("type", "expense")
      .gte("date", monthStart).lt("date", monthEnd),
  ]);

  // Hitung ringkasan
  const txs = txRes.data ?? [];
  const curIncome = txs.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const curExpense = txs.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const netSavings = curIncome - curExpense;

  const prevTxs = prevTxRes.data ?? [];
  const prevIncome = prevTxs.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const prevExpense = prevTxs.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

  const totalAset = (walletsRes.data ?? []).reduce((s, w) => s + Number(w.current_balance), 0);

  // Pengeluaran per kategori bulan ini
  const catMap = new Map<string, number>();
  for (const row of catRes.data ?? []) {
    const cats = row.categories as { name: string } | { name: string }[] | null;
    const cat = Array.isArray(cats) ? cats[0] : cats;
    if (!cat) continue;
    catMap.set(cat.name, (catMap.get(cat.name) ?? 0) + Number(row.amount));
  }
  const topCategories = Array.from(catMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, amount]) => `  - ${name}: Rp ${amount.toLocaleString("id-ID")}`)
    .join("\n");

  // Anggaran vs aktual
  const budgetLines = (budgetsRes.data ?? []).map(b => {
    const cats = b.categories as { name: string } | { name: string }[] | null;
    const cat = Array.isArray(cats) ? cats[0] : cats;
    const catName = cat?.name ?? "?";
    const spent = catMap.get(catName) ?? 0;
    const pct = b.amount > 0 ? Math.round((spent / Number(b.amount)) * 100) : 0;
    return `  - ${catName}: dipakai Rp ${spent.toLocaleString("id-ID")} dari Rp ${Number(b.amount).toLocaleString("id-ID")} (${pct}%)`;
  }).join("\n");

  // Dompet
  const walletLines = (walletsRes.data ?? []).map(w =>
    `  - ${w.name} (${w.type}): Rp ${Number(w.current_balance).toLocaleString("id-ID")}`
  ).join("\n");

  // Hutang aktif
  const today = now.toISOString().split("T")[0];
  const debtLines = (debtsRes.data ?? []).map(d => {
    const overdue = d.due_date && d.due_date < today ? " ⚠️ JATUH TEMPO" : "";
    return `  - ${d.type === "payable" ? "Hutang" : "Piutang"} ke ${d.party_name}: Rp ${Number(d.remaining_amount).toLocaleString("id-ID")}${d.due_date ? ` (jatuh tempo ${d.due_date})` : ""}${overdue}`;
  }).join("\n") || "  Tidak ada";

  // Tabungan
  const goalLines = (goalsRes.data ?? []).map(g => {
    const pct = g.target_amount > 0 ? Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100) : 0;
    return `  - ${g.name}: Rp ${Number(g.current_amount).toLocaleString("id-ID")} / Rp ${Number(g.target_amount).toLocaleString("id-ID")} (${pct}%)${g.deadline ? ` deadline ${g.deadline}` : ""}`;
  }).join("\n") || "  Tidak ada";

  // 10 transaksi terakhir
  const recentLines = (recentTxRes.data ?? []).map(t => {
    const cats = t.categories as { name: string } | { name: string }[] | null;
    const wallets = t.wallets as { name: string } | { name: string }[] | null;
    const cat = Array.isArray(cats) ? cats[0] : cats;
    const wallet = Array.isArray(wallets) ? wallets[0] : wallets;
    return `  - ${t.date} | ${t.type === "income" ? "+" : "-"}Rp ${Number(t.amount).toLocaleString("id-ID")} | ${t.description} | ${cat?.name ?? "-"} | ${wallet?.name ?? "-"}`;
  }).join("\n");

  const formatRp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;
  const bulanIni = BULAN[month - 1] + " " + year;
  const bulanLalu = BULAN[(month === 1 ? 12 : month - 1) - 1];

  const systemPrompt = `Kamu adalah Maal, asisten keuangan keluarga yang cerdas dan ramah dalam aplikasi Maalify.
Kamu membantu user memahami kondisi keuangan mereka, memberikan saran praktis, dan menjawab pertanyaan seputar keuangan keluarga.

Gunakan bahasa Indonesia yang santai tapi profesional. Jawaban singkat dan to the point.
Gunakan format angka Rupiah yang mudah dibaca (contoh: Rp 1.500.000 bukan 1500000).
Gunakan emoji secukupnya agar lebih ramah.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATA KEUANGAN USER (per hari ini, ${today})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 RINGKASAN BULAN INI (${bulanIni}):
  - Pemasukan: ${formatRp(curIncome)} ${prevIncome > 0 ? `(${bulanLalu}: ${formatRp(prevIncome)})` : ""}
  - Pengeluaran: ${formatRp(curExpense)} ${prevExpense > 0 ? `(${bulanLalu}: ${formatRp(prevExpense)})` : ""}
  - Tabungan bersih: ${formatRp(Math.abs(netSavings))} (${netSavings >= 0 ? "✅ Surplus" : "⚠️ Defisit"})

💳 SALDO DOMPET (total: ${formatRp(totalAset)}):
${walletLines || "  Belum ada dompet"}

📈 PENGELUARAN PER KATEGORI (${bulanIni}):
${topCategories || "  Belum ada pengeluaran"}

🎯 STATUS ANGGARAN (${bulanIni}):
${budgetLines || "  Belum ada anggaran"}

💸 HUTANG & PIUTANG AKTIF:
${debtLines}

🏦 TARGET TABUNGAN:
${goalLines}

🕐 10 TRANSAKSI TERAKHIR:
${recentLines || "  Belum ada transaksi"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Jawab pertanyaan user berdasarkan data di atas.
Jika user menanyakan hal di luar data yang tersedia, sampaikan dengan jujur.
Berikan saran keuangan yang relevan dan praktis.`;

  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
    max_tokens: 1024,
    temperature: 0.7,
  };

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://maalify.app",
      "X-Title": "Maalify - AI Asisten Keuangan",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    return NextResponse.json({ error: `AI error: ${errText}` }, { status: 500 });
  }

  const json = await res.json();
  const reply = (json.choices?.[0]?.message?.content ?? "").trim();

  return NextResponse.json({ reply });
}
