import { cn } from "../../lib/utils";

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(10,17,31,0.92),rgba(6,10,20,0.98))] shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("flex flex-col gap-1 p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn("text-lg font-semibold tracking-tight text-white", className)} {...props} />;
}

export function CardDescription({ className, ...props }) {
  return <p className={cn("text-sm text-slate-400", className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}
