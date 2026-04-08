import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em]",
  {
    variants: {
      variant: {
        default: "border-cyan-400/20 bg-cyan-400/10 text-cyan-200",
        accent: "border-teal-300/20 bg-teal-300/10 text-teal-100",
        critical: "border-red-400/20 bg-red-500/10 text-red-200",
        warning: "border-amber-300/20 bg-amber-400/10 text-amber-100",
        success: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100",
        muted: "border-white/10 bg-white/5 text-slate-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
