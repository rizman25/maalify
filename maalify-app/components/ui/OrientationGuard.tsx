"use client";

import { useEffect, useState } from "react";

export default function OrientationGuard() {
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    function check() {
      const isLandscape = window.innerWidth > window.innerHeight;
      // Mobile = dimensi terpendek layar < 768px (tablet biasanya >= 768px)
      const isMobile = Math.min(window.screen.width, window.screen.height) < 768;
      setShowOverlay(isLandscape && isMobile);
    }

    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  if (!showOverlay) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#1E3A5F] flex flex-col items-center justify-center text-white px-8 text-center">
      {/* Rotate icon */}
      <div className="mb-6 animate-bounce">
        <svg
          width="64" height="64" viewBox="0 0 24 24"
          fill="none" stroke="white" strokeWidth="1.5"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M20 7H9a2 2 0 0 0-2 2v9"/>
          <path d="m16 3 4 4-4 4"/>
          <path d="M4 17h11a2 2 0 0 0 2-2V6"/>
          <path d="m8 21-4-4 4-4"/>
        </svg>
      </div>
      <h2 className="text-xl font-bold mb-2">Putar Perangkatmu</h2>
      <p className="text-sm text-white/70 leading-relaxed">
        Maalify di HP lebih nyaman digunakan dalam posisi <strong className="text-white">Portrait</strong>.
        Silakan putar perangkatmu kembali.
      </p>
    </div>
  );
}
