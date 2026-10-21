import Link from "next/link";
import { MitraMark } from "./brand";

/** Mark + lowercase wordmark, linking home. Larger on phones, where it's the only thing in the top bar. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`group flex shrink-0 items-center gap-2 ${className}`} aria-label="Mitra home">
      <MitraMark size={40} className="h-10 w-10 transition-transform duration-300 group-hover:-translate-y-0.5 sm:h-9 sm:w-9" />
      <span className="font-display text-[1.85rem] font-extrabold leading-none tracking-[-0.05em] sm:text-[1.7rem]">mitra</span>
    </Link>
  );
}
