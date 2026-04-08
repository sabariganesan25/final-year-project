import { cn } from "../../lib/utils";

export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(
        "flex h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
