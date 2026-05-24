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
  const [width, setWidth] = useState(0);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevKey = useRef(`${pathname}?${searchParams.toString()}`);

  function clearTimers() {
    if (timerRef.current)   clearTimeout(timerRef.current);
    if (completeRef.current) clearTimeout(completeRef.current);
  }

  function runBar() {
    clearTimers();
    setVisible(true);
    setWidth(0);
    timerRef.current = setTimeout(() => setWidth(75), 10);
  }

  function finishBar() {
    clearTimers();
    setWidth(100);
    completeRef.current = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 300);
  }

  // Route change (pathname OR search params)
  useEffect(() => {
    const key = `${pathname}?${searchParams.toString()}`;
    if (prevKey.current === key) return;
    prevKey.current = key;
    runBar();
    completeRef.current = setTimeout(() => finishBar(), 400);
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  // Data refresh (router.refresh() via PageLoadingContext)
  useEffect(() => {
    if (isLoading) {
      runBar();
    } else {
      // Only finish if bar is currently running
      if (visible) finishBar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  useEffect(() => () => clearTimers(), []);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 z-[9999] h-[3px] bg-brand-primary shadow-[0_0_8px_rgba(30,58,95,0.5)] transition-all duration-300 ease-out"
      style={{ width: `${width}%` }}
    />
  );
}

export default function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  );
}
