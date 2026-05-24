/**
 * App-wide icon system — Lucide React wrappers.
 *
 * Rules:
 *  - No emoji in UI. Use Lucide icons so color/size can be controlled via CSS.
 *  - Wallet type icons: use walletTypeIcon()
 *  - Category icons from DB: use <CategoryIcon slug={...} />
 *  - Raw Lucide components can be imported directly from "lucide-react"
 */

import {
  // Wallet types
  Banknote, Building2, PiggyBank, Smartphone, Wallet,
  // Privacy
  Users, Lock, User,
  // Actions / navigation
  ArrowRightLeft, ArrowRight, Plus, Pencil, Trash2, X, ChevronRight,
  RefreshCw, Eye, EyeOff, Download, Upload, Search,
  // Finance
  TrendingUp, TrendingDown, BarChart2, Receipt, CreditCard, Coins,
  // Household / social
  Home, Target, Bell, Settings, HelpCircle, LogOut,
  // Category icons (for DB-stored category.icon slugs)
  Utensils, Car, ShoppingCart, HeartPulse, BookOpen, Tv,
  Briefcase, Gift, Laptop, Package, Zap, Globe,
  Coffee, Music, Plane, Dumbbell, Baby, Dog,
  Wrench, Leaf, Camera, Bus, Clock, Star,
  // Misc
  AlertCircle, CheckCircle2, Info, Image, FileText, Tag,
} from "lucide-react";
import type { LucideProps } from "lucide-react";

// ─── Wallet type icon ──────────────────────────────────────────────────────

export type WalletType = "cash" | "bank" | "savings" | "ewallet" | "credit_card";

const WALLET_TYPE_ICON: Record<WalletType, React.ComponentType<LucideProps>> = {
  cash:        Banknote,
  bank:        Building2,
  savings:     PiggyBank,
  ewallet:     Smartphone,
  credit_card: CreditCard,
};

export function WalletTypeIcon({
  type,
  size = 18,
  className,
}: {
  type: WalletType;
  size?: number;
  className?: string;
}) {
  const Icon = WALLET_TYPE_ICON[type] ?? Wallet;
  return <Icon size={size} className={className} />;
}

// ─── Category icon (DB-stored slug) ───────────────────────────────────────
// Slug strings are stored in categories.icon field.
// The picker in KategoriModal writes these slugs; this component renders them.

const CATEGORY_ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  // Income
  briefcase:      Briefcase,
  gift:           Gift,
  "trending-up":  TrendingUp,
  laptop:         Laptop,
  coins:          Coins,
  // Expense — food & daily
  utensils:       Utensils,
  coffee:         Coffee,
  // Expense — transport
  car:            Car,
  bus:            Bus,
  plane:          Plane,
  // Expense — shopping & lifestyle
  "shopping-cart": ShoppingCart,
  "credit-card":  CreditCard,
  package:        Package,
  // Expense — bills & utilities
  receipt:        Receipt,
  zap:            Zap,
  // Expense — health & care
  "heart-pulse":  HeartPulse,
  baby:           Baby,
  dog:            Dog,
  dumbbell:       Dumbbell,
  // Expense — education & entertainment
  "book-open":    BookOpen,
  tv:             Tv,
  music:          Music,
  camera:         Camera,
  // Expense — savings & investment
  "piggy-bank":     PiggyBank,
  "bar-chart-2":    BarChart2,
  "trending-down":  TrendingDown,
  target:           Target,
  // Home & services
  home:           Home,
  wrench:         Wrench,
  leaf:           Leaf,
  // Others
  globe:          Globe,
  star:           Star,
  clock:          Clock,
};

export function CategoryIcon({
  slug,
  size = 16,
  className,
}: {
  slug: string | null | undefined;
  size?: number;
  className?: string;
}) {
  const Icon = (slug ? CATEGORY_ICON_MAP[slug] : null) ?? Tag;
  return <Icon size={size} className={className} />;
}

// ─── Category icon picker data (for KategoriModal) ────────────────────────
// Each entry: { slug, label, Icon }

export const CATEGORY_ICON_OPTIONS: {
  slug: string;
  label: string;
  Icon: React.ComponentType<LucideProps>;
}[] = [
  // Income
  { slug: "briefcase",    label: "Gaji",        Icon: Briefcase },
  { slug: "gift",         label: "Bonus",       Icon: Gift },
  { slug: "trending-up",  label: "Investasi",   Icon: TrendingUp },
  { slug: "laptop",       label: "Freelance",   Icon: Laptop },
  { slug: "coins",        label: "Uang",        Icon: Coins },
  // Food & Daily
  { slug: "utensils",     label: "Makan",       Icon: Utensils },
  { slug: "coffee",       label: "Kopi",        Icon: Coffee },
  { slug: "shopping-cart",label: "Belanja",     Icon: ShoppingCart },
  // Transport
  { slug: "car",          label: "Mobil",       Icon: Car },
  { slug: "bus",          label: "Bus",         Icon: Bus },
  { slug: "plane",        label: "Pesawat",     Icon: Plane },
  // Bills & Utilities
  { slug: "receipt",      label: "Tagihan",     Icon: Receipt },
  { slug: "zap",          label: "Listrik",     Icon: Zap },
  { slug: "credit-card",  label: "Kartu",       Icon: CreditCard },
  // Health & Care
  { slug: "heart-pulse",  label: "Kesehatan",   Icon: HeartPulse },
  { slug: "baby",         label: "Anak",        Icon: Baby },
  { slug: "dog",          label: "Hewan",       Icon: Dog },
  { slug: "dumbbell",     label: "Gym",         Icon: Dumbbell },
  // Education & Entertainment
  { slug: "book-open",    label: "Pendidikan",  Icon: BookOpen },
  { slug: "tv",           label: "Hiburan",     Icon: Tv },
  { slug: "music",        label: "Musik",       Icon: Music },
  { slug: "camera",       label: "Foto",        Icon: Camera },
  // Savings & Investment
  { slug: "piggy-bank",   label: "Tabungan",    Icon: PiggyBank },
  { slug: "bar-chart-2",  label: "Investasi",   Icon: BarChart2 },
  { slug: "target",       label: "Target",      Icon: Target },
  // Home & Services
  { slug: "home",         label: "Rumah",       Icon: Home },
  { slug: "wrench",       label: "Servis",      Icon: Wrench },
  { slug: "leaf",         label: "Lingkungan",  Icon: Leaf },
  // Others
  { slug: "package",      label: "Lainnya",     Icon: Package },
  { slug: "globe",        label: "Online",      Icon: Globe },
  { slug: "star",         label: "Spesial",     Icon: Star },
  { slug: "clock",        label: "Rutin",       Icon: Clock },
];

// ─── Re-export common Lucide icons for direct use ─────────────────────────
export {
  Banknote, Building2, PiggyBank, Smartphone, Wallet,
  Users, Lock, User,
  ArrowRightLeft, ArrowRight, Plus, Pencil, Trash2, X, ChevronRight,
  RefreshCw, Eye, EyeOff, Download, Upload, Search,
  TrendingUp, TrendingDown, BarChart2, Receipt, CreditCard, Coins,
  Home, Target, Bell, Settings, HelpCircle, LogOut,
  Utensils, Car, ShoppingCart, HeartPulse, BookOpen, Tv,
  Briefcase, Gift, Laptop, Package, Zap, Globe,
  Coffee, Music, Plane, Dumbbell, Baby, Dog,
  Wrench, Leaf, Camera, Bus, Clock, Star,
  AlertCircle, CheckCircle2, Info, Image, FileText, Tag,
};
