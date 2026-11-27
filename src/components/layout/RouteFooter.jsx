"use client";

import { usePathname } from "next/navigation";

export default function RouteFooter({ children }) {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return children;
}
