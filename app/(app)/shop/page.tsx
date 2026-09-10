import type { Metadata } from "next";
import { ShoppingBag } from "lucide-react";

export const metadata: Metadata = {
  title: "Shop",
};

export default function ShopPage() {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#3CB346]/12 text-[#2e9a38]">
        <ShoppingBag className="h-8 w-8" strokeWidth={1.7} />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">Shop</h1>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
        Reinigungsmittel, Leuchtmittel und Kleinmaterial fürs Haus — bald direkt hier bestellen.
      </p>
      <p className="mt-5 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
        Coming soon
      </p>
    </div>
  );
}
