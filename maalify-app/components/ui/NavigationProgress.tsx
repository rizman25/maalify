"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function NavigationProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    // Tidak perlu animasi pada load pertama
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;

    // Clear timer sebelumnya
    if (timerRef.current) clearTimeout(timerRef.current);
    if (completeRef.current) clearTimeout(completeRef.current);

    // Mulai animasi
    setVisible(true);
    setWidth(0);

    // Cepat ke 80% lalu tahan
    timerRef.current = setTimeout(() => setWidth(80), 10);

    // Complete setelah halaman baru muncul
    completeRef.current = setTimeout(() => {
      setWidth(100);
      setTimeout(() => {
        setVisible(false);
        setWidth(0);
      }, 300);
    }, 400);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (completeRef.current) clearTimeout(completeRef.current);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 z-[9999] h-[3px] bg-brand-primary transition-all duration-300 ease-out"
      style={{ width: `${width}%` }}
    />
  );
}
