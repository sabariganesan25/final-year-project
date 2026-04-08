import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--accent)] text-slate-950 shadow-[0_12px_30px_rgba(84,211,194,0.25)] hover:bg-[var(--accent-strong)]",
        secondary: "bg-white/5 text-slate-100 hover:bg-white/10 border border-white/10",
        ghost: "text-slate-300 hover:bg-white/5",
        danger: "bg-[var(--danger)] text-white hover:bg-red-500",
        success: "bg-[var(--success)] text-slate-950 hover:bg-emerald-300",
        outline: "border border-white/15 bg-transparent text-slate-100 hover:bg-white/5",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 px-5",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({ className, variant, size, asChild = false, ...props }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button };
