import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-1 animate-skeleton bg-[linear-gradient(90deg,var(--bg-3),var(--bg-hover),var(--bg-3))] bg-[length:200%_100%] h-3",
        className,
      )}
      {...props}
    />
  );
}
