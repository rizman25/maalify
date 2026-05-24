"use client";

import { useRouter } from "next/navigation";
import { useTransition, useEffect, useCallback } from "react";
import { usePageLoading } from "@/context/PageLoadingContext";

/**
 * Drop-in replacement for router.refresh() with global loading indicator.
 *
 * Usage:
 *   const { refresh } = useRefresh();
 *   // instead of: router.refresh()
 *   refresh();
 *
 * The top progress bar will appear automatically via PageLoadingContext.
 */
export function useRefresh() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { startLoading, stopLoading } = usePageLoading();

  // Stop loading when transition finishes
  useEffect(() => {
    if (!isPending) stopLoading();
  }, [isPending, stopLoading]);

  const refresh = useCallback(() => {
    startLoading();
    startTransition(() => {
      router.refresh();
    });
  }, [router, startLoading]);

  return { refresh, isPending };
}
