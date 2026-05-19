export type UserRole = "admin" | "member";
export type TransactionType = "income" | "expense";
export type WalletType = "cash" | "bank" | "savings" | "ewallet";
export type DebtType = "payable" | "receivable";
export type DebtStatus = "active" | "settled" | "overdue";
export type SubscriptionPlan = "free" | "basic" | "premium";
export type NotificationType = "budget_warning" | "debt_due" | "system";
export type BudgetPeriod = "monthly" | "yearly";
export type RecurringFrequency = "daily" | "weekly" | "monthly";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Household {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  created_by: string;
  created_at: string;
}

export interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  role: UserRole;
  joined_at: string;
}

export interface Wallet {
  id: string;
  household_id: string;
  name: string;
  type: WalletType;
  initial_balance: number;
  current_balance: number;
  currency: string;
  color: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface Category {
  id: string;
  household_id: string | null;
  name: string;
  type: TransactionType;
  icon: string | null;
  color: string | null;
  is_default: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  household_id: string;
  wallet_id: string;
  category_id: string;
  user_id: string;
  recurring_id: string | null;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionWithCategory extends Transaction {
  categories: Pick<Category, "name" | "icon" | "color">;
  wallets: Pick<Wallet, "name">;
}

export interface Budget {
  id: string;
  household_id: string;
  category_id: string;
  amount: number;
  period: BudgetPeriod;
  month: number;
  year: number;
  created_at: string;
}

export interface Debt {
  id: string;
  household_id: string;
  user_id: string;
  type: DebtType;
  party_name: string;
  total_amount: number;
  remaining_amount: number;
  due_date: string | null;
  description: string | null;
  status: DebtStatus;
  created_at: string;
}
