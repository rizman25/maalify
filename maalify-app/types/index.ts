// Tipe-tipe utama Maalify — akan dilengkapi di Phase 3 (database)

export type UserRole = "admin" | "member";

export type TransactionType = "income" | "expense";

export type WalletType = "cash" | "bank" | "savings" | "ewallet";

export type DebtType = "payable" | "receivable";

export type DebtStatus = "active" | "settled" | "overdue";

export type SubscriptionPlan = "free" | "basic" | "premium";

export type NotificationType = "budget_warning" | "debt_due" | "system";
