"use client";

import { useEffect } from "react";

function resetPortalScroll() {
  const targets = document.querySelectorAll(
    ".main, .cb-portal-main",
  );

  targets.forEach((target) => {
    target.scrollTop = 0;
    target.scrollLeft = 0;
  });

  window.scrollTo({
    top: 0,
    left: 0,
    behavior: "auto",
  });
}

export default function PortalScrollManager() {
  useEffect(() => {
    function handleClick(event) {
      const navigationItem = event.target.closest(
        ".side-item, .cb-portal-nav-item",
      );

      if (!navigationItem) return;

      requestAnimationFrame(() => {
        resetPortalScroll();
      });
    }

    function handleRouteChange() {
      requestAnimationFrame(() => {
        resetPortalScroll();
      });
    }

    document.addEventListener("click", handleClick);
    window.addEventListener("popstate", handleRouteChange);
    window.addEventListener("hashchange", handleRouteChange);

    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("popstate", handleRouteChange);
      window.removeEventListener("hashchange", handleRouteChange);
    };
  }, []);

  return null;
}
