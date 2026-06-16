import Link from "next/link";
import { LuChevronRight as ChevronRight } from "react-icons/lu";
import { NearbyShopLogo } from "@/components/nearby-shop";
import { SHOPS_NEAR_YOU, shopSlug } from "@/components/nearby-shop-data";

export const metadata = {
  title: "Individual stores near you",
};

export default function AllStoresPage() {
  return (
    <main className="container pb-24 pt-12 md:pt-16">
      <header className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight">Individual stores near you</h1>
      </header>

      <section>
        <ul className="max-w-2xl divide-y">
          {SHOPS_NEAR_YOU.map((shop) => (
            <li key={shop.name}>
              <Link
                href={`/menu/stores/${shopSlug(shop.name)}`}
                className="flex items-center gap-4 py-3.5 transition-colors hover:bg-secondary/40"
              >
                <NearbyShopLogo shop={shop} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold leading-snug">{shop.name}</div>
                  {shop.badge ? (
                    <div className="mt-0.5 text-xs font-semibold text-[#e11900]">{shop.badge}</div>
                  ) : null}
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
