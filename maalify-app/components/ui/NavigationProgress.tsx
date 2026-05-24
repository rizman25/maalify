"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { usePageLoading } from "@/context/PageLoadingContext";

// Inner component that uses useSearchParams (must be wrapped in Suspense)
function NavigationProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isLoading } = usePageLoading();

  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevKey = useRef(`${pathname}?${searchParams.toString()}`);

  function clearTimers() {
    if (timerRef.current)    clearTimeout(timerRef.current);
    if (completeRef.current) clearTimeout(completeRef.current);
  }

  function showSpinner() {
    clearTimers();
    setFading(false);
    setVisible(true);
  }

  function hideSpinner() {
    clearTimers();
    setFading(true);
    completeRef.current = setTimeout(() => {
      setVisible(false);
      setFading(false);
    }, 300);
  }

  // Route change (pathname OR search params)
  useEffect(() => {
    const key = `${pathname}?${searchParams.toString()}`;
    if (prevKey.current === key) return;
    prevKey.current = key;
    showSpinner();
    completeRef.current = setTimeout(() => hideSpinner(), 500);
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  // Data refresh (router.refresh() via PageLoadingContext)
  useEffect(() => {
    if (isLoading) {
      showSpinner();
    } else {
      if (visible) hideSpinner();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  useEffect(() => () => clearTimers(), []);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-[9999] transition-opacity duration-300"
      style={{ opacity: fading ? 0 : 1 }}
    >
      <div className="w-10 h-10 rounded-full bg-brand-primary shadow-lg flex items-center justify-center">
        <svg
          className="animate-spin text-white"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            cx="12" cy="12" r="10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.3"
          />
          <path
            d="M12 2a10 10 0 0 1 10 10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}

export default function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  );
}
