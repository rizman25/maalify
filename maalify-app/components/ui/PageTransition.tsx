"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [displayed, setDisplayed] = useState(children);
  const [animating, setAnimating] = useState(false);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (prevPathname.current === pathname) {
      setDisplayed(children);
      return;
    }
    prevPathname.current = pathname;

    // Trigger fade-out → swap content → fade-in
    setAnimating(true);
    const t = setTimeout(() => {
      setDisplayed(children);
      setAnimating(false);
    }, 120);

    return () => clearTimeout(t);
  }, [pathname, children]);

  return (
    <div
      style={{
        opacity: animating ? 0 : 1,
        transform: animating ? "translateY(6px)" : "translateY(0)",
        transition: "opacity 0.18s ease, transform 0.18s ease",
      }}
    >
      {displayed}
    </div>
  );
}
