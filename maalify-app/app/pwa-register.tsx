"use client";

import { useEffect, useState } from "react";

export default function PwaRegister() {
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Catat apakah sudah ada SW aktif sebelum register
    // Jika iya → controllerchange berikutnya adalah UPDATE (bukan first install)
    const hadController = !!navigator.serviceWorker.controller;

    navigator.serviceWorker
      .register("/sw.js")
      .catch(() => {/* silent — SW tidak kritis */});

    // sw.js memanggil skipWaiting() saat install →
    // controllerchange akan fired di semua tab yang sedang buka
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (hadController) {
        setUpdateReady(true);
      }
    });
  }, []);

  if (!updateReady) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 lg:bottom-4 z-[9998] flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 bg-[#1E3A5F] text-white px-4 py-3 rounded-2xl shadow-2xl text-sm max-w-sm w-full">
        {/* Refresh icon */}
        <div className="shrink-0 w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight">Versi baru tersedia</p>
          <p className="text-white/60 text-xs mt-0.5">Perbarui untuk fitur & perbaikan terbaru</p>
        </div>

        {/* Perbarui button */}
        <button
          onClick={() => window.location.reload()}
          className="shrink-0 bg-white text-[#1E3A5F] font-semibold px-3 py-1.5 rounded-lg text-xs hover:bg-white/90 active:scale-95 transition-all"
        >
          Perbarui
        </button>

        {/* Dismiss */}
        <button
          onClick={() => setUpdateReady(false)}
          className="shrink-0 text-white/50 hover:text-white transition-colors"
          title="Tutup"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
