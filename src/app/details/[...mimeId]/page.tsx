"use client";

import { usePathname } from "next/navigation";

export default function Details() {
  const pathname = usePathname();

  return <div>{pathname}</div>;
}
