import { cn } from "../../lib/utils";

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        "flex min-h-24 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]",
        className,
      )}
      {...props}
    />
  );
}
