import type { SupabaseClient } from "@supabase/supabase-js";

interface RecurringTx {
  id: string;
  wallet_id: string;
  category_id: string;
  type: string;
  amount: number;
  description: string;
  frequency: "daily" | "weekly" | "monthly";
  start_date: string;
  end_date: string | null;
  last_generated: string | null;
  created_by: string;
}

function addDate(from: Date, frequency: RecurringTx["frequency"]): Date {
  const d = new Date(from);
  if (frequency === "monthly") d.setMonth(d.getMonth() + 1);
  else if (frequency === "weekly") d.setDate(d.getDate() + 7);
  else d.setDate(d.getDate() + 1);
  return d;
}

function getDatesToGenerate(rec: RecurringTx, today: Date): string[] {
  const todayStr = today.toISOString().split("T")[0];
  const startDate = new Date(rec.start_date + "T00:00:00");
  const endDate = rec.end_date ? new Date(rec.end_date + "T00:00:00") : null;

  let cursor: Date;
  if (rec.last_generated) {
    cursor = addDate(new Date(rec.last_generated + "T00:00:00"), rec.frequency);
  } else {
    cursor = new Date(startDate);
  }

  const dates: string[] = [];
  const MAX_GENERATE = 36; // safety cap

  while (dates.length < MAX_GENERATE) {
    const dateStr = cursor.toISOString().split("T")[0];
    if (dateStr > todayStr) break;
    if (endDate && cursor > endDate) break;
    dates.push(dateStr);
    cursor = addDate(cursor, rec.frequency);
  }

  return dates;
}

export async function generateRecurringTransactions(
  supabase: SupabaseClient,
  householdId: string
): Promise<number> {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const { data: recurringList } = await supabase
    .from("recurring_transactions")
    .select("id, wallet_id, category_id, type, amount, description, frequency, start_date, end_date, last_generated, created_by")
    .eq("household_id", householdId)
    .eq("is_active", true)
    .lte("start_date", todayStr);

  if (!recurringList || recurringList.length === 0) return 0;

  let totalGenerated = 0;

  for (const rec of recurringList as RecurringTx[]) {
    const dates = getDatesToGenerate(rec, today);
    if (dates.length === 0) continue;

    const txs = dates.map((date) => ({
      household_id: householdId,
      wallet_id: rec.wallet_id,
      category_id: rec.category_id,
      user_id: rec.created_by,
      recurring_id: rec.id,
      type: rec.type,
      amount: rec.amount,
      description: rec.description,
      date,
    }));

    const { error } = await supabase.from("transactions").insert(txs);
    if (!error) {
      await supabase
        .from("recurring_transactions")
        .update({ last_generated: dates[dates.length - 1] })
        .eq("id", rec.id);
      totalGenerated += dates.length;
    }
  }

  return totalGenerated;
}
