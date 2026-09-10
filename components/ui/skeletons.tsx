export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton-shimmer rounded-2xl bg-neutral-200 dark:bg-neutral-800 ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-[28px] bg-neutral-50 px-5 py-4 dark:bg-neutral-900">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="mt-2 h-4 w-1/2" />
      <Skeleton className="mt-3 h-3 w-24" />
    </div>
  );
}

export function TicketSkeleton() {
  return (
    <div className="rounded-[28px] border border-neutral-100 bg-white px-5 py-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-3 w-24" />
    </div>
  );
}

function CardList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
}

function TicketList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <TicketSkeleton key={index} />
      ))}
    </div>
  );
}

export function HomePageSkeleton({
  variant = "resident",
  showHeader = true,
}: {
  variant?: "admin" | "resident";
  showHeader?: boolean;
}) {
  return (
    <div className="space-y-8">
      {showHeader && (
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-40" />
          </div>
        </div>
      )}

      {variant === "admin" ? (
        <>
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-[4.5rem] rounded-[24px]" />
            <Skeleton className="h-[4.5rem] rounded-[24px]" />
            <Skeleton className="h-[4.5rem] rounded-[24px]" />
          </div>
          <section>
            <Skeleton className="mb-3 h-5 w-28" />
            <CardList count={2} />
          </section>
          <section>
            <Skeleton className="mb-3 h-5 w-36" />
            <TicketList count={3} />
          </section>
        </>
      ) : (
        <>
          <Skeleton className="h-7 w-28 rounded-full" />
          <section>
            <Skeleton className="mb-3 h-5 w-24" />
            <CardList count={1} />
          </section>
          <section>
            <Skeleton className="mb-3 h-5 w-24" />
            <TicketList count={2} />
          </section>
          <Skeleton className="h-12 w-full rounded-full" />
        </>
      )}
    </div>
  );
}

export function ServicePageSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-7 w-28" />
        <Skeleton className="mt-2 h-4 w-48" />
      </div>
      <Skeleton className="h-[4.5rem] rounded-[28px]" />
      <section>
        <Skeleton className="mb-3 h-5 w-32" />
        <TicketList count={3} />
      </section>
    </div>
  );
}

export function ProjectsPageSkeleton() {
  return (
    <div>
      <Skeleton className="h-7 w-32" />
      <Skeleton className="mt-2 h-4 w-56" />
      <div className="mb-6 mt-6 flex justify-end">
        <Skeleton className="h-9 w-20 rounded-full" />
      </div>
      <CardList count={4} />
    </div>
  );
}

export function ProjectDetailSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-7 w-48" />
        <div className="mt-3 flex items-start justify-between gap-4">
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-24 rounded-[24px]" />
        <Skeleton className="h-24 rounded-[24px]" />
      </div>
      <section>
        <Skeleton className="mb-3 h-5 w-24" />
        <TicketList count={3} />
      </section>
    </div>
  );
}

export function TicketDetailSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-start gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-2 h-3 w-32" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="mt-4 min-h-0 flex-1 space-y-3">
        <TicketSkeleton />
        <TicketSkeleton />
      </div>
      <Skeleton className="mt-3 h-24 w-full rounded-[24px]" />
    </div>
  );
}

export function AccountPageSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-7 w-24" />
        <Skeleton className="mt-2 h-4 w-28" />
      </div>
      <Skeleton className="h-28 rounded-[28px]" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
    </div>
  );
}

export function ShopPageSkeleton() {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center">
      <Skeleton className="h-16 w-16 rounded-[22px]" />
      <Skeleton className="mt-5 h-7 w-24" />
      <Skeleton className="mt-3 h-4 w-56" />
      <Skeleton className="mt-2 h-4 w-40" />
    </div>
  );
}

export function AuthCardSkeleton() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-neutral-50 px-5 py-10 dark:bg-neutral-950">
      <div className="w-full max-w-md rounded-[32px] bg-white p-8 dark:bg-neutral-900">
        <div className="mb-8 flex flex-col items-center">
          <Skeleton className="h-16 w-16 rounded-2xl" />
          <Skeleton className="mt-4 h-7 w-28" />
          <Skeleton className="mt-2 h-4 w-40" />
        </div>
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="mt-4 h-12 w-full rounded-full" />
      </div>
    </div>
  );
}

export function AppBootSkeleton() {
  return (
    <div className="min-h-dvh bg-white px-5 pt-8 dark:bg-neutral-950">
      <div className="mx-auto max-w-2xl">
        <HomePageSkeleton variant="resident" />
      </div>
    </div>
  );
}
