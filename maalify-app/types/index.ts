export type UserRole = "super_admin" | "admin" | "member";
export type ProjectType = "trip" | "wedding" | "property" | "purchase" | "education" | "vehicle" | "health" | "other";
export type ProjectStatus = "planning" | "active" | "completed" | "cancelled";
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
  is_shared: boolean;
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

export type TransactionVisibility = "private" | "shared";

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
  attachment_url: string | null;
  visibility: TransactionVisibility;
  created_at: string;
  updated_at: string;
}

export interface TransactionWithCategory extends Transaction {
  categories: Pick<Category, "name" | "icon" | "color">;
  wallets: Pick<Wallet, "name">;
  users?: { name: string } | null;
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

export interface Project {
  id: string;
  household_id: string;
  wallet_id: string | null;
  name: string;
  type: ProjectType;
  description: string | null;
  cover_emoji: string | null;
  target_amount: number;
  current_amount: number;
  target_date: string;
  status: ProjectStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  wallets?: { current_balance: number; name: string }[] | { current_balance: number; name: string } | null;
}

export interface ProjectItem {
  id: string;
  project_id: string;
  name: string;
  planned_amount: number;
  actual_amount: number | null;
  is_paid: boolean;
  paid_at: string | null;
  transaction_id: string | null;
  sort_order: number;
  created_by: string;
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

export interface AppNotification {
  id: string;
  type: "debt_overdue" | "debt_due_soon" | "budget_over" | "budget_near" | "savings_goal_due" | "recurring_due";
  title: string;
  message: string;
  href: string;
  urgency: "high" | "medium";
}
