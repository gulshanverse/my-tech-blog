"use client";

import { useEffect } from "react";

export function AuthorRouteShell({ children }: Readonly<{ children: React.ReactNode }>) {
  useEffect(() => {
    document.body.classList.add("author-route");
    return () => document.body.classList.remove("author-route");
  }, []);

  return children;
}

export default AuthorRouteShell;

