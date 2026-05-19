/** Format angka ke format rupiah: 1500000 → "1.500.000" */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID").format(amount);
}

/** Gabungkan class names (utility sederhana) */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
