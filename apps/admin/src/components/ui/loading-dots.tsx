import { cn } from "@/lib/utils";

export function LoadingDots({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)} aria-hidden>
      <span className="wave-dot h-1.5 w-1.5 rounded-full bg-current [animation-delay:-0.22s]" />
      <span className="wave-dot h-1.5 w-1.5 rounded-full bg-current [animation-delay:-0.11s]" />
      <span className="wave-dot h-1.5 w-1.5 rounded-full bg-current" />
    </span>
  );
}
