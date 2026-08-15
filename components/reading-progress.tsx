"use client";

import { useEffect } from "react";

export function ReadingProgress() {
  useEffect(() => { const update = () => { const max = document.documentElement.scrollHeight - window.innerHeight; const progress = max > 0 ? (window.scrollY / max) * 100 : 0; const bar = document.querySelector<HTMLElement>("[data-reading-progress]"); if (bar) bar.style.width = `${progress}%`; }; update(); window.addEventListener("scroll", update, { passive: true }); return () => window.removeEventListener("scroll", update); }, []);
  return <div className="progress-track" aria-hidden="true"><div className="progress-value" data-reading-progress /></div>;
}
