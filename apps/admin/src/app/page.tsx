import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { LocationPicker } from "@/components/location-picker";

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
    title: "Become a merchant",
    body: "Attract new customers and grow sales, starting with 0% commissions for up to 30 days.",
    cta: "Sign up",
    bg: "bg-[#FCE4D8]",
    fg: "text-[#5B1A00]",
    btnBg: "bg-[#5B1A00]",
    btnFg: "text-white",
    href: "/partners",
  },
  {
    title: "Get the best Gawula experience",
    body: "Experience the best your neighbourhood has to offer, all in one app.",
    cta: "Get the app",
    bg: "bg-[#FFE3DD]",
    fg: "text-[#4A0D00]",
    btnBg: "bg-primary",
    btnFg: "text-white",
    href: "/download",
  },
];

const CITIES = [
  { name: "Johannesburg", x: 70.6, y: 30.8, live: true },
  { name: "Pretoria", x: 72.2, y: 28.0, live: true },
  { name: "Bloemfontein", x: 59.8, y: 54.5, live: false },
  { name: "Cape Town", x: 14.3, y: 91.7, live: false },
  { name: "Durban", x: 88.4, y: 60.5, live: false },
  { name: "Polokwane", x: 79.2, y: 14.6, live: false },
  { name: "Port Elizabeth", x: 56.5, y: 92.0, live: false },
];

export default function LandingPage() {
  return (
    <main className="overflow-x-hidden">
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
                <p className="mt-4 text-sm text-white/85">
                  Or{" "}
                  <Link href="/login" className="font-semibold text-white hover:text-white/80">
                    sign in
                  </Link>{" "}
                  to order
                </p>
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

      <section className="bg-accent/60">
        <div className="container py-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
            <div className="relative mx-auto aspect-[1280/1029] w-full max-w-2xl overflow-hidden rounded-3xl bg-card">
              <Image
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/South_Africa_location_map.svg/1280px-South_Africa_location_map.svg.png"
                alt="Map of South Africa highlighting the cities where Gawula operates"
                fill
                sizes="(min-width: 1024px) 640px, 100vw"
                className="object-cover"
              />
              {CITIES.map((city) => (
                <span
                  key={city.name}
                  aria-hidden
                  style={{ left: `${city.x}%`, top: `${city.y}%` }}
                  className="absolute flex -translate-x-1/2 -translate-y-full flex-col items-center"
                >
                  <MapPin
                    className={`h-6 w-6 drop-shadow ${
                      city.live ? "fill-primary text-[#F0D2B8]" : "fill-muted-foreground/40 text-muted-foreground"
                    }`}
                    strokeWidth={city.live ? 2 : 1.5}
                  />
                </span>
              ))}
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Where we operate
              </h2>
              <ul className="mt-6 space-y-1">
                {CITIES.map((city) => (
                  <li
                    key={city.name}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <span className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className={`h-2.5 w-2.5 rounded-full ${
                          city.live ? "bg-primary" : "bg-muted-foreground/30"
                        }`}
                      />
                      <span className="text-base text-foreground">{city.name}</span>
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        city.live
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {city.live ? "Live" : "Coming soon"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
