"use client";

import Link from "next/link";
import { useId } from "react";
import { MitraMark } from "./brand";

/**
 * Mark + lowercase wordmark, linking home. Larger on phones, where it's the only thing in the top bar. Each copy
 * gets its own gradient id: a page can hold two (top bar and sidebar), and when one is hidden a shared id would
 * leave the other without its colours.
 */
export function Logo({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <Link href="/" className={`group flex shrink-0 items-center gap-2 ${className}`} aria-label="Mitra home">
      <MitraMark id={`m${id}`} size={40} className="h-10 w-10 transition-transform duration-300 group-hover:-rotate-12 sm:h-9 sm:w-9" />
      <span className="font-display text-[1.85rem] font-extrabold leading-none tracking-[-0.045em] sm:text-[1.7rem]">mitra</span>
    </Link>
  );
}
