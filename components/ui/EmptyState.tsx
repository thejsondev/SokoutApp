import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-neutral-100 bg-neutral-50 px-5 py-10 text-center dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3CB346]/12 text-[#2e9a38]">
        <Icon className="h-6 w-6" strokeWidth={1.8} />
      </div>
      <p className="mt-4 font-medium text-neutral-900 dark:text-white">{title}</p>
      {hint && <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{hint}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
