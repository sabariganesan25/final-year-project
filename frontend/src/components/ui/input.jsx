import { cn } from "../../lib/utils";

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]",
        className,
      )}
      {...props}
    />
  );
}
