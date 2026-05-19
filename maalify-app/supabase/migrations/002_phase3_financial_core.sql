-- ============================================================
-- Maalify — Migration 002: Financial Core & Transactions
-- Jalankan di: Supabase Dashboard > SQL Editor
-- ============================================================

-- ─── Helper Functions ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_household_member(hid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = hid AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_household_admin(hid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = hid AND user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── ENUMs ───────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE wallet_type AS ENUM ('cash', 'bank', 'savings', 'ewallet');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('income', 'expense');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE category_type AS ENUM ('income', 'expense');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE budget_period AS ENUM ('monthly', 'yearly');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE debt_type AS ENUM ('payable', 'receivable');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE debt_status AS ENUM ('active', 'settled', 'overdue');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE recurring_frequency AS ENUM ('daily', 'weekly', 'monthly');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('budget_warning', 'debt_due', 'system');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── wallets ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wallets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id    UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  type            wallet_type NOT NULL,
  initial_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  current_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency        CHAR(3) NOT NULL DEFAULT 'IDR',
  color           VARCHAR(7),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_by      UUID NOT NULL REFERENCES public.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── categories ──────────────────────────────────────────────
-- household_id NULL = kategori default sistem (berlaku global)
CREATE TABLE IF NOT EXISTS public.categories (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE,
  name         VARCHAR(80) NOT NULL,
  type         category_type NOT NULL,
  icon         VARCHAR(50),
  color        VARCHAR(7),
  is_default   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── budgets ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.budgets (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  category_id  UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  amount       DECIMAL(15,2) NOT NULL,
  period       budget_period NOT NULL DEFAULT 'monthly',
  month        SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year         SMALLINT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, category_id, month, year)
);

-- ─── debts ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.debts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id     UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES public.users(id),
  type             debt_type NOT NULL,
  party_name       VARCHAR(100) NOT NULL,
  total_amount     DECIMAL(15,2) NOT NULL,
  remaining_amount DECIMAL(15,2) NOT NULL,
  due_date         DATE,
  description      TEXT,
  status           debt_status NOT NULL DEFAULT 'active',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── recurring_transactions ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id   UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  wallet_id      UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  category_id    UUID NOT NULL REFERENCES public.categories(id),
  type           transaction_type NOT NULL,
  amount         DECIMAL(15,2) NOT NULL,
  description    VARCHAR(200) NOT NULL,
  frequency      recurring_frequency NOT NULL,
  start_date     DATE NOT NULL,
  end_date       DATE,
  last_generated DATE,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_by     UUID NOT NULL REFERENCES public.users(id),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── transactions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transactions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  wallet_id    UUID NOT NULL REFERENCES public.wallets(id),
  category_id  UUID NOT NULL REFERENCES public.categories(id),
  user_id      UUID NOT NULL REFERENCES public.users(id),
  recurring_id UUID REFERENCES public.recurring_transactions(id) ON DELETE SET NULL,
  type         transaction_type NOT NULL,
  amount       DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  description  VARCHAR(200) NOT NULL,
  date         DATE NOT NULL,
  note         TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── transfers ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transfers (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id   UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  from_wallet_id UUID NOT NULL REFERENCES public.wallets(id),
  to_wallet_id   UUID NOT NULL REFERENCES public.wallets(id),
  amount         DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  description    VARCHAR(200),
  date           DATE NOT NULL,
  user_id        UUID NOT NULL REFERENCES public.users(id),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  CHECK (from_wallet_id <> to_wallet_id)
);

-- ─── debt_payments ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.debt_payments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  debt_id    UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  wallet_id  UUID NOT NULL REFERENCES public.wallets(id),
  amount     DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  paid_at    DATE NOT NULL,
  note       TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── attachments ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attachments (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  storage_path   TEXT NOT NULL,
  file_name      VARCHAR(255) NOT NULL,
  file_size      INTEGER NOT NULL,
  mime_type      VARCHAR(100) NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── notifications ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  type         notification_type NOT NULL,
  title        VARCHAR(150) NOT NULL,
  message      TEXT NOT NULL,
  is_read      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_wallets_household        ON public.wallets(household_id);
CREATE INDEX IF NOT EXISTS idx_categories_household     ON public.categories(household_id);
CREATE INDEX IF NOT EXISTS idx_transactions_household   ON public.transactions(household_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet      ON public.transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category    ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_period           ON public.budgets(household_id, year, month);
CREATE INDEX IF NOT EXISTS idx_debts_household          ON public.debts(household_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user       ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_transfers_household      ON public.transfers(household_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_debt       ON public.debt_payments(debt_id);
CREATE INDEX IF NOT EXISTS idx_recurring_household      ON public.recurring_transactions(household_id);

-- ─── Row Level Security ──────────────────────────────────────
ALTER TABLE public.wallets                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_payments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications          ENABLE ROW LEVEL SECURITY;

-- wallets: semua member bisa read & insert, hanya admin yg update/delete
CREATE POLICY "wallets_select" ON public.wallets
  FOR SELECT USING (public.is_household_member(household_id));

CREATE POLICY "wallets_insert" ON public.wallets
  FOR INSERT WITH CHECK (public.is_household_member(household_id));

CREATE POLICY "wallets_update" ON public.wallets
  FOR UPDATE USING (public.is_household_admin(household_id));

CREATE POLICY "wallets_delete" ON public.wallets
  FOR DELETE USING (public.is_household_admin(household_id));

-- categories: default (NULL household_id) bisa dibaca semua; kustom per household
CREATE POLICY "categories_select" ON public.categories
  FOR SELECT USING (
    household_id IS NULL OR public.is_household_member(household_id)
  );

CREATE POLICY "categories_insert" ON public.categories
  FOR INSERT WITH CHECK (
    household_id IS NOT NULL AND public.is_household_admin(household_id)
  );

CREATE POLICY "categories_update" ON public.categories
  FOR UPDATE USING (
    household_id IS NOT NULL AND public.is_household_admin(household_id)
  );

CREATE POLICY "categories_delete" ON public.categories
  FOR DELETE USING (
    household_id IS NOT NULL
    AND public.is_household_admin(household_id)
    AND is_default = FALSE
  );

-- budgets: member bisa read, admin bisa manage
CREATE POLICY "budgets_select" ON public.budgets
  FOR SELECT USING (public.is_household_member(household_id));

CREATE POLICY "budgets_insert" ON public.budgets
  FOR INSERT WITH CHECK (public.is_household_admin(household_id));

CREATE POLICY "budgets_update" ON public.budgets
  FOR UPDATE USING (public.is_household_admin(household_id));

CREATE POLICY "budgets_delete" ON public.budgets
  FOR DELETE USING (public.is_household_admin(household_id));

-- debts: semua member bisa manage, admin bisa delete
CREATE POLICY "debts_select" ON public.debts
  FOR SELECT USING (public.is_household_member(household_id));

CREATE POLICY "debts_insert" ON public.debts
  FOR INSERT WITH CHECK (public.is_household_member(household_id));

CREATE POLICY "debts_update" ON public.debts
  FOR UPDATE USING (public.is_household_member(household_id));

CREATE POLICY "debts_delete" ON public.debts
  FOR DELETE USING (public.is_household_admin(household_id));

-- recurring_transactions
CREATE POLICY "recurring_select" ON public.recurring_transactions
  FOR SELECT USING (public.is_household_member(household_id));

CREATE POLICY "recurring_insert" ON public.recurring_transactions
  FOR INSERT WITH CHECK (public.is_household_member(household_id));

CREATE POLICY "recurring_update" ON public.recurring_transactions
  FOR UPDATE USING (public.is_household_member(household_id));

CREATE POLICY "recurring_delete" ON public.recurring_transactions
  FOR DELETE USING (public.is_household_admin(household_id));

-- transactions: semua member bisa create; hanya pemilik/admin yg bisa edit/hapus
CREATE POLICY "transactions_select" ON public.transactions
  FOR SELECT USING (public.is_household_member(household_id));

CREATE POLICY "transactions_insert" ON public.transactions
  FOR INSERT WITH CHECK (public.is_household_member(household_id));

CREATE POLICY "transactions_update" ON public.transactions
  FOR UPDATE USING (
    user_id = auth.uid() OR public.is_household_admin(household_id)
  );

CREATE POLICY "transactions_delete" ON public.transactions
  FOR DELETE USING (
    user_id = auth.uid() OR public.is_household_admin(household_id)
  );

-- transfers
CREATE POLICY "transfers_select" ON public.transfers
  FOR SELECT USING (public.is_household_member(household_id));

CREATE POLICY "transfers_insert" ON public.transfers
  FOR INSERT WITH CHECK (public.is_household_member(household_id));

CREATE POLICY "transfers_delete" ON public.transfers
  FOR DELETE USING (public.is_household_admin(household_id));

-- debt_payments: akses melalui debts.household_id
CREATE POLICY "debt_payments_select" ON public.debt_payments
  FOR SELECT USING (
    debt_id IN (
      SELECT id FROM public.debts WHERE public.is_household_member(household_id)
    )
  );

CREATE POLICY "debt_payments_insert" ON public.debt_payments
  FOR INSERT WITH CHECK (
    debt_id IN (
      SELECT id FROM public.debts WHERE public.is_household_member(household_id)
    )
  );

CREATE POLICY "debt_payments_delete" ON public.debt_payments
  FOR DELETE USING (created_by = auth.uid());

-- attachments: akses melalui transactions.household_id
CREATE POLICY "attachments_select" ON public.attachments
  FOR SELECT USING (
    transaction_id IN (
      SELECT id FROM public.transactions WHERE public.is_household_member(household_id)
    )
  );

CREATE POLICY "attachments_insert" ON public.attachments
  FOR INSERT WITH CHECK (
    transaction_id IN (
      SELECT id FROM public.transactions WHERE public.is_household_member(household_id)
    )
  );

CREATE POLICY "attachments_delete" ON public.attachments
  FOR DELETE USING (
    transaction_id IN (
      SELECT id FROM public.transactions
      WHERE user_id = auth.uid() OR public.is_household_admin(household_id)
    )
  );

-- notifications: setiap user hanya bisa akses miliknya sendiri
CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─── Trigger: wallet balance dari transactions ────────────────
CREATE OR REPLACE FUNCTION public.handle_transaction_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'income' THEN
      UPDATE public.wallets SET current_balance = current_balance + NEW.amount WHERE id = NEW.wallet_id;
    ELSE
      UPDATE public.wallets SET current_balance = current_balance - NEW.amount WHERE id = NEW.wallet_id;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type = 'income' THEN
      UPDATE public.wallets SET current_balance = current_balance - OLD.amount WHERE id = OLD.wallet_id;
    ELSE
      UPDATE public.wallets SET current_balance = current_balance + OLD.amount WHERE id = OLD.wallet_id;
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Reverse transaksi lama
    IF OLD.type = 'income' THEN
      UPDATE public.wallets SET current_balance = current_balance - OLD.amount WHERE id = OLD.wallet_id;
    ELSE
      UPDATE public.wallets SET current_balance = current_balance + OLD.amount WHERE id = OLD.wallet_id;
    END IF;
    -- Apply transaksi baru
    IF NEW.type = 'income' THEN
      UPDATE public.wallets SET current_balance = current_balance + NEW.amount WHERE id = NEW.wallet_id;
    ELSE
      UPDATE public.wallets SET current_balance = current_balance - NEW.amount WHERE id = NEW.wallet_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_balance_on_insert
  AFTER INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_transaction_balance();

CREATE TRIGGER trg_update_balance_on_delete
  AFTER DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_transaction_balance();

CREATE TRIGGER trg_update_balance_on_update
  AFTER UPDATE OF amount, type, wallet_id ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_transaction_balance();

-- ─── Trigger: wallet balance dari transfers ───────────────────
CREATE OR REPLACE FUNCTION public.handle_transfer_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.wallets SET current_balance = current_balance - NEW.amount WHERE id = NEW.from_wallet_id;
  UPDATE public.wallets SET current_balance = current_balance + NEW.amount WHERE id = NEW.to_wallet_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_transfer_balance
  AFTER INSERT ON public.transfers
  FOR EACH ROW EXECUTE FUNCTION public.handle_transfer_balance();

-- ─── Trigger: kurangi remaining_amount saat debt_payment ─────
CREATE OR REPLACE FUNCTION public.handle_debt_payment()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.debts
  SET
    remaining_amount = remaining_amount - NEW.amount,
    status = CASE
      WHEN remaining_amount - NEW.amount <= 0 THEN 'settled'::debt_status
      ELSE status
    END
  WHERE id = NEW.debt_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_debt_payment_reduce
  AFTER INSERT ON public.debt_payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_debt_payment();

-- ─── Trigger: transactions.updated_at ────────────────────────
CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── Default categories (hanya insert jika belum ada) ─────────
INSERT INTO public.categories (name, type, icon, color, is_default)
SELECT name, type::category_type, icon, color, is_default
FROM (VALUES
  ('Gaji',                'income',  '💼', '#27AE60', TRUE),
  ('Bonus',               'income',  '🎁', '#27AE60', TRUE),
  ('Investasi (Masuk)',   'income',  '📈', '#27AE60', TRUE),
  ('Freelance',           'income',  '💻', '#27AE60', TRUE),
  ('Lainnya (Pemasukan)', 'income',  '💰', '#27AE60', TRUE),
  ('Makan & Minum',       'expense', '🍽️', '#E74C3C', TRUE),
  ('Transportasi',        'expense', '🚗', '#E74C3C', TRUE),
  ('Belanja',             'expense', '🛒', '#E74C3C', TRUE),
  ('Tagihan & Utilitas',  'expense', '🧾', '#E74C3C', TRUE),
  ('Kesehatan',           'expense', '🏥', '#E74C3C', TRUE),
  ('Pendidikan',          'expense', '📚', '#E74C3C', TRUE),
  ('Hiburan',             'expense', '🎬', '#E74C3C', TRUE),
  ('Tabungan',            'expense', '🏦', '#F39C12', TRUE),
  ('Investasi (Keluar)',  'expense', '📊', '#F39C12', TRUE),
  ('Lainnya (Pengeluaran)', 'expense', '📦', '#E74C3C', TRUE)
) AS v(name, type, icon, color, is_default)
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE is_default = TRUE);
