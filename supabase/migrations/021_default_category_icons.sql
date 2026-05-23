-- Migration 021: Update icon slugs for all default categories
-- Replaces emoji icon values with Lucide slug strings that the app can render
-- Run in Supabase SQL Editor

UPDATE public.categories SET icon = 'shopping-cart'  WHERE is_default = true AND name = 'Belanja';
UPDATE public.categories SET icon = 'gift'            WHERE is_default = true AND name = 'Bonus';
UPDATE public.categories SET icon = 'laptop'          WHERE is_default = true AND name = 'Freelance';
UPDATE public.categories SET icon = 'briefcase'       WHERE is_default = true AND name = 'Gaji';
UPDATE public.categories SET icon = 'tv'              WHERE is_default = true AND name = 'Hiburan';
UPDATE public.categories SET icon = 'trending-down'   WHERE is_default = true AND name = 'Investasi (Keluar)';
UPDATE public.categories SET icon = 'trending-up'     WHERE is_default = true AND name = 'Investasi (Masuk)';
UPDATE public.categories SET icon = 'heart-pulse'     WHERE is_default = true AND name = 'Kesehatan';
UPDATE public.categories SET icon = 'coins'           WHERE is_default = true AND name = 'Lainnya (Pemasukan)';
UPDATE public.categories SET icon = 'package'         WHERE is_default = true AND name = 'Lainnya (Pengeluaran)';
UPDATE public.categories SET icon = 'utensils'        WHERE is_default = true AND name = 'Makan & Minum';
UPDATE public.categories SET icon = 'book-open'       WHERE is_default = true AND name = 'Pendidikan';
UPDATE public.categories SET icon = 'piggy-bank'      WHERE is_default = true AND name = 'Tabungan';
UPDATE public.categories SET icon = 'zap'             WHERE is_default = true AND name = 'Tagihan & Utilitas';
UPDATE public.categories SET icon = 'car'             WHERE is_default = true AND name = 'Transportasi';

-- Verifikasi hasil:
-- SELECT name, icon FROM categories WHERE is_default = true ORDER BY name;
