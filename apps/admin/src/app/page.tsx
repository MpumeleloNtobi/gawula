import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag,
  Truck,
  Sparkles,
  Apple,
  ArrowRight,
  Building2,
  PartyPopper,
  Star,
} from "lucide-react";
import { LocationPicker } from "@/components/location-picker";
import { Button } from "@/components/ui/button";
import { BRANDS, HUBS } from "@/lib/mock-data";

const STEPS = [
  {
    icon: Sparkles,
    title: "Browse the brands",
    body: "Four kitchens, one menu. Mix burgers, ramen, bowls, and pizza in a single order.",
  },
  {
    icon: ShoppingBag,
    title: "Build one basket",
    body: "Add from any brand without juggling apps, timings, or separate checkouts.",
  },
  {
    icon: Truck,
    title: "One delivery",
    body: "Pay a single fee. Everything arrives together, hot and at the same time.",
  },
];

const OFFERINGS = [
  {
    icon: Apple,
    title: "Tabletop App",
    body: "All your favourite kitchens in one tap. Reorder in seconds, track in real time.",
    cta: "Get the app",
  },
  {
    icon: Building2,
    title: "Tabletop for Work",
    body: "Corporate meal plans that keep your team fed without the spreadsheet.",
    cta: "Talk to sales",
  },
  {
    icon: PartyPopper,
    title: "Catering & Events",
    body: "Feed a room, a launch, or a wedding — from the same kitchen, scaled up.",
    cta: "Plan an event",
  },
];

const TESTIMONIALS = [
  { name: "Lebo M.", handle: "@lebomak", body: "Ordered ramen and a pizza for two different cravings — arrived in the same bag, both hot." },
  { name: "Asanda K.", handle: "@asanda.k", body: "Best Friday-night decision we made all month. The buttermilk chicken is unreal." },
  { name: "Thabo R.", handle: "@thaborides", body: "One delivery fee for food from four restaurants? Take my money." },
  { name: "Nadia P.", handle: "@nadiaplate", body: "Tracking screen is genuinely fun. Driver showed up exactly when it said." },
  { name: "Sipho D.", handle: "@siphodube", body: "I get a poke bowl, my partner gets a smash burger. Marriage saved by Tabletop." },
  { name: "Karabo M.", handle: "@karabomash", body: "Tiramisu and tonkotsu in the same order. The future I was promised." },
];

export default function LandingPage() {
  return (
    <main className="overflow-x-hidden">
      <section className="border-b">
        <div className="container grid items-center gap-12 py-16 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-24">
          <div className="flex flex-col gap-7">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-secondary/60 px-3 py-1 text-xs font-medium text-foreground/70">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              One kitchen · Four restaurant brands
            </div>

            <h1 className="text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.03em] sm:text-6xl lg:text-7xl">
              Great food,<br />
              <span className="text-primary">in one tap.</span>
            </h1>

            <p className="max-w-md text-lg leading-relaxed text-muted-foreground">
              Burgers, bowls, ramen, and wood-fired pizza — all cooked in the same kitchen, packed in one bag, delivered together.
            </p>

            <div className="w-full max-w-xl">
              <LocationPicker />
              <p className="mt-3 text-xs text-muted-foreground">
                Serving five Johannesburg suburbs. More on the way.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-[5/6] overflow-hidden rounded-3xl bg-secondary">
              <Image
                src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80"
                alt="Margherita pizza"
                fill
                priority
                sizes="(min-width: 1024px) 560px, 100vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 hidden aspect-square w-40 overflow-hidden rounded-2xl border-4 border-background bg-secondary shadow-sm sm:block lg:w-48">
              <Image
                src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80"
                alt="Smash burger"
                fill
                sizes="200px"
                className="object-cover"
              />
            </div>
            <div className="absolute -right-4 -top-4 hidden aspect-square w-32 overflow-hidden rounded-2xl border-4 border-background bg-secondary shadow-sm sm:block lg:w-40">
              <Image
                src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80"
                alt="Poke bowl"
                fill
                sizes="160px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="container py-16 sm:py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <h2 className="max-w-xl text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
            The best online restaurants, in one place.
          </h2>
          <Link
            href="/menu"
            className="inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
          >
            See all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {BRANDS.map((brand) => {
            const displayName = brand.name.split("—")[1]?.trim() ?? brand.name;
            const monogram = displayName.charAt(0);
            return (
              <Link
                key={brand.id}
                href={`/menu/${brand.id}`}
                className="group block overflow-hidden rounded-2xl border bg-card transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-lg"
              >
                <div className="relative aspect-[4/3] bg-secondary">
                  <div className="absolute inset-0 overflow-hidden">
                    <Image
                      src={brand.cover}
                      alt={brand.name}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  </div>
                  <div
                    className="absolute -bottom-7 left-4 grid h-14 w-14 place-items-center rounded-full border-4 border-background text-base font-semibold text-white shadow-sm"
                    style={{ backgroundColor: brand.logoColor }}
                    aria-hidden
                  >
                    {monogram}
                  </div>
                </div>
                <div className="p-4 pt-9">
                  <h3 className="truncate text-base font-semibold leading-tight">
                    {displayName}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {brand.tagline}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section id="how-it-works" className="border-y bg-secondary/40 py-16 sm:py-20">
        <div className="container">
          <h2 className="mb-10 max-w-xl text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
            Three taps from craving to doorstep.
          </h2>

          <ol className="grid gap-6 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="flex flex-col gap-5 rounded-2xl border bg-background p-7"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <step.icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <span className="text-sm font-medium tabular-nums text-muted-foreground">
                    0{i + 1} / 03
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="offerings" className="container py-16 sm:py-20">
        <h2 className="mb-10 max-w-xl text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
          One platform. Many ways to eat.
        </h2>

        <div className="grid gap-5 md:grid-cols-3">
          {OFFERINGS.map((o) => (
            <div
              key={o.title}
              className="group flex flex-col gap-5 rounded-2xl border bg-card p-7 transition-colors hover:border-foreground/20"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <o.icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <div>
                <h3 className="text-lg font-semibold tracking-tight">{o.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{o.body}</p>
              </div>
              <button className="mt-auto inline-flex items-center gap-1 text-sm font-medium">
                {o.cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y bg-secondary/40 py-16 sm:py-20">
        <div className="container mb-10">
          <h2 className="max-w-xl text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
            Loved by hungry humans.
          </h2>
        </div>

        <div className="relative flex overflow-hidden">
          <div className="marquee-track-slow flex shrink-0 gap-5 pr-5">
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
              <figure
                key={i}
                className="flex w-80 shrink-0 flex-col gap-4 rounded-2xl border bg-background p-6"
              >
                <div className="flex gap-0.5 text-foreground">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Star key={k} className="h-3.5 w-3.5 fill-foreground" strokeWidth={0} />
                  ))}
                </div>
                <blockquote className="text-sm leading-relaxed">&ldquo;{t.body}&rdquo;</blockquote>
                <figcaption className="mt-auto text-xs">
                  <span className="font-semibold">{t.name}</span>{" "}
                  <span className="text-muted-foreground">{t.handle}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-16 sm:py-20">
        <div className="grid items-center gap-10 overflow-hidden rounded-3xl border bg-foreground p-10 text-background sm:p-14 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-5">
            <h2 className="text-3xl font-semibold tracking-[-0.02em] sm:text-4xl lg:text-5xl">
              Enjoy good food in a few taps.
            </h2>
            <p className="max-w-md text-background/70">
              Reorder favourites in two taps. Track your driver block by block. Save addresses and payment methods for next time.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button size="lg" className="h-12 gap-2 bg-background text-foreground hover:bg-background/90">
                <Apple className="h-4 w-4" />
                Download for iOS
              </Button>
              <Button size="lg" className="h-12 gap-2 bg-background text-foreground hover:bg-background/90">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M3.6 2.3a2 2 0 00-.6 1.4v17a2 2 0 00.6 1.4l9.4-9.7L3.6 2.3zm10.7 10l2.7 2.8-9.5 5.5 6.8-8.3zm0-1.2l-6.8-8.3 9.5 5.5-2.7 2.8zm6.6 1.7a1.6 1.6 0 000-2.8l-2.4-1.4-3 3 3 3 2.4-1.4z" />
                </svg>
                Get it on Android
              </Button>
            </div>
          </div>

          <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-2xl">
            <Image
              src="https://images.unsplash.com/photo-1565299543923-37dd37887442?auto=format&fit=crop&w=900&q=80"
              alt="Friends sharing a meal"
              fill
              sizes="(min-width: 1024px) 400px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="container grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
                t
              </span>
              <span className="text-lg font-semibold tracking-tight">tabletop</span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              A multi-brand kitchen built for cravings that don&apos;t agree.
            </p>
            <a
              href="mailto:hello@tabletop.app"
              className="mt-5 inline-block text-sm text-muted-foreground hover:text-foreground"
            >
              hello@tabletop.app
            </a>
          </div>

          <div>
            <p className="text-sm font-semibold">Company</p>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-foreground">About</Link></li>
              <li><Link href="#" className="hover:text-foreground">Careers</Link></li>
              <li><Link href="#" className="hover:text-foreground">FAQ</Link></li>
              <li><Link href="#" className="hover:text-foreground">Privacy</Link></li>
              <li><Link href="#" className="hover:text-foreground">Terms</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold">Locations</p>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {HUBS.map((h) => (
                <li key={h.id}>
                  <Link href="/menu" className="hover:text-foreground">
                    {h.area.split(",")[0]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold">Restaurants</p>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {BRANDS.map((b) => (
                <li key={b.id}>
                  <Link href={`/menu/${b.id}`} className="hover:text-foreground">
                    {b.name.split("—")[1]?.trim() ?? b.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t">
          <div className="container flex flex-col gap-3 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 Tabletop Kitchen Co. All rights reserved.</p>
            <p>Made with care in Johannesburg.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
