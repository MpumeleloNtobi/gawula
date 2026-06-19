import Image from "next/image";
import Link from "next/link";
import { LocationPicker } from "@/components/location-picker";
import { WhereWeOperate } from "@/components/where-we-operate";
import { FloatingContactButton } from "@/components/floating-contact-button";
import { SiteJsonLd } from "@/components/site-json-ld";

const FEATURE_CARDS = [
  {
    title: "Become a rider",
    body: "Make money and work on your schedule. Sign up in minutes.",
    cta: "Start earning",
    bg: "bg-[#FFF1E6]",
    fg: "text-[#3D1D00]",
    btnBg: "bg-[#3D1D00]",
    btnFg: "text-white",
    href: "/riders",
  },
  {
    title: "List your store",
    body: "Attract new customers and grow sales, starting with 0% commissions for up to 30 days.",
    cta: "Sign up",
    bg: "bg-[#FCE4D8]",
    fg: "text-[#5B1A00]",
    btnBg: "bg-[#5B1A00]",
    btnFg: "text-white",
    href: "/partners",
  },
];

export default function LandingPage() {
  return (
    <main className="overflow-x-hidden">
      <SiteJsonLd />
      <section id="site-hero" className="relative">
        <div className="relative h-[560px] w-full overflow-hidden sm:h-[640px] lg:h-[680px]">
          <Image
            src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=2400&q=80"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/30" />
          <div className="container relative flex h-full flex-col items-center justify-center text-center">
            <div className="w-full max-w-3xl text-white">
              <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.02em] sm:text-5xl lg:text-6xl">
                One trip. Many stores. One delivery.
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-lg font-medium text-white/90">
                Order from every store in the same mall, food court or cluster in one cart. Choose a single delivery, or pick up at each store.
              </p>
              <div className="mx-auto mt-8 w-full max-w-xl">
                <LocationPicker />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-28">
        <div className="grid gap-5 md:grid-cols-3">
          {FEATURE_CARDS.map((card) => (
            <div
              key={card.title}
              className={`relative flex aspect-[5/6] flex-col justify-between overflow-hidden rounded-3xl p-7 ${card.bg} ${card.fg}`}
            >
              <h3 className="max-w-[180px] text-3xl font-semibold leading-tight tracking-tight">
                {card.title}
              </h3>
              <div className="relative flex flex-col gap-5">
                <p className="max-w-[200px] text-sm opacity-80">{card.body}</p>
                <Link
                  href={card.href}
                  className={`inline-flex w-fit items-center rounded-full px-5 py-2.5 text-sm font-semibold ${card.btnBg} ${card.btnFg}`}
                >
                  {card.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <WhereWeOperate />
      <FloatingContactButton hasBottomNav={false} />
    </main>
  );
}
