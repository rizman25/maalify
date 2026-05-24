"use client";

import { createContext, useContext, useState, useCallback } from "react";

type PageLoadingContextType = {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
};

const PageLoadingContext = createContext<PageLoadingContextType>({
  isLoading: false,
  startLoading: () => {},
  stopLoading: () => {},
});

export function PageLoadingProvider({ children }: { children: React.ReactNode }) {
  // Use a counter so concurrent operations don't cancel each other
  const [count, setCount] = useState(0);

  const startLoading = useCallback(() => setCount(n => n + 1), []);
  const stopLoading  = useCallback(() => setCount(n => Math.max(0, n - 1)), []);

  return (
    <PageLoadingContext.Provider value={{ isLoading: count > 0, startLoading, stopLoading }}>
      {children}
    </PageLoadingContext.Provider>
  );
}

export function usePageLoading() {
  return useContext(PageLoadingContext);
}
