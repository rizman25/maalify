"use client";

/**
 * TourDriver — driver.js spotlight tour untuk user baru.
 *
 * 8 langkah dibagi 2 halaman:
 *   Dashboard  (global step 0–2)
 *   Transaksi  (global step 3–7)
 *
 * State persisted di localStorage:
 *   maalify-tour-done  → tour sudah selesai / dilewati
 *   maalify-tour-step  → global step terakhir yang perlu dilanjutkan
 */

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const DONE_KEY = "maalify-tour-done";
const STEP_KEY = "maalify-tour-step";

/** Coba selector desktop dulu, kalau tidak ada pakai mobile */
function resolveEl(desktopId: string, mobileId: string): string {
  if (typeof document !== "undefined" && document.getElementById(desktopId)) {
    return `#${desktopId}`;
  }
  return `#${mobileId}`;
}

export default function TourDriver() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Sudah selesai? Skip.
    if (localStorage.getItem(DONE_KEY)) return;

    const savedStep = parseInt(localStorage.getItem(STEP_KEY) ?? "0", 10);

    // ── HALAMAN DASHBOARD (global step 0, 1, 2) ──────────────────────────
    if (pathname === "/dashboard" && savedStep < 3) {
      const navTransaksi = resolveEl("tour-nav-transaksi", "tour-bottom-transaksi");

      const driverObj = driver({
        showProgress: true,
        progressText: "{{current}} dari {{total}}",
        nextBtnText: "Lanjut →",
        prevBtnText: "← Kembali",
        doneBtnText: "Selesai",
        allowClose: true,
        overlayOpacity: 0.55,
        popoverClass: "maalify-tour-popover",
        onDestroyStarted: () => {
          // User klik X / ESC → anggap tour selesai
          localStorage.setItem(DONE_KEY, "1");
          driverObj.destroy();
        },
        steps: [
          {
            element: "#tour-summary",
            popover: {
              title: "📊 Ringkasan Keuangan",
              description:
                "Di sini kamu bisa lihat total saldo, pemasukan, dan pengeluaran bulan ini dalam satu tampilan.",
              side: "bottom",
              align: "start",
            },
          },
          {
            element: "#tour-ai-chat",
            popover: {
              title: "🤖 Asisten AI Maali",
              description:
                "Tanya apa saja soal keuangan keluarga! Maali siap bantu analisis pengeluaran dan kasih saran hemat.",
              side: "top",
              align: "end",
            },
          },
          {
            element: navTransaksi,
            popover: {
              title: "📝 Menu Transaksi",
              description:
                "Yuk kita catat transaksi pertama kamu! Tap <b>Lanjut</b> untuk melihat fitur pencatatan.",
              side: "right",
              align: "center",
            },
          },
        ],
        // Override tombol Next pada step terakhir dashboard → navigasi ke /transaksi
        onNextClick: () => {
          const activeIdx = driverObj.getActiveIndex() ?? 0;
          if (activeIdx === 2) {
            // Step terakhir dashboard: simpan progress lalu pindah halaman
            localStorage.setItem(STEP_KEY, "3");
            driverObj.destroy();
            router.push("/transaksi");
          } else {
            driverObj.moveNext();
          }
        },
      });

      // Mulai dari step yang belum selesai
      const localStart = Math.min(savedStep, 2);
      driverObj.drive(localStart);
    }

    // ── HALAMAN TRANSAKSI (global step 3–7) ──────────────────────────────
    if (pathname === "/transaksi" && savedStep >= 3) {
      const navDompet   = resolveEl("tour-nav-dompet",   "tour-bottom-dompet");
      const navAnggaran = resolveEl("tour-nav-anggaran",  "tour-bottom-anggaran");
      const navHutang   = resolveEl("tour-nav-hutang",    "tour-bottom-menu");

      const driverObj = driver({
        showProgress: true,
        progressText: "{{current}} dari {{total}}",
        nextBtnText: "Lanjut →",
        prevBtnText: "← Kembali",
        doneBtnText: "Mulai! 🚀",
        allowClose: true,
        overlayOpacity: 0.55,
        popoverClass: "maalify-tour-popover",
        onDestroyStarted: () => {
          localStorage.setItem(DONE_KEY, "1");
          driverObj.destroy();
        },
        onDestroyed: () => {
          // Pastikan done tersimpan (termasuk saat klik Mulai! / selesai normal)
          localStorage.setItem(DONE_KEY, "1");
        },
        steps: [
          {
            element: "#tour-catat",
            popover: {
              title: "✏️ Catat Transaksi",
              description:
                "Tap tombol ini untuk mencatat pemasukan atau pengeluaran baru.",
              side: "bottom",
              align: "end",
            },
          },
          {
            element: "#tour-scan",
            popover: {
              title: "📷 Scan Struk",
              description:
                "Foto struk belanja kamu — AI akan otomatis membaca dan mengisi detail transaksinya. Praktis!",
              side: "bottom",
              align: "end",
            },
          },
          {
            element: navDompet,
            popover: {
              title: "👛 Dompet",
              description:
                "Kelola semua rekening, dompet digital, dan kas tunai. Saldo otomatis terupdate tiap transaksi.",
              side: "right",
              align: "center",
            },
          },
          {
            element: navAnggaran,
            popover: {
              title: "📊 Anggaran",
              description:
                "Tetapkan batas pengeluaran per kategori setiap bulan. Dapat notifikasi kalau mendekati batas.",
              side: "right",
              align: "center",
            },
          },
          {
            element: navHutang,
            popover: {
              title: "🤝 Hutang & Piutang",
              description:
                "Lacak semua pinjam-meminjam. Catat jatuh tempo dan progres pembayaran dengan mudah.",
              side: navHutang.includes("menu") ? "top" : "right",
              align: "center",
            },
          },
        ],
      });

      // Hitung local step (global 3 → local 0, global 4 → local 1, dst.)
      const localStart = Math.min(Math.max(savedStep - 3, 0), 4);
      driverObj.drive(localStart);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
