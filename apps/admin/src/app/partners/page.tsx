import Link from "next/link";
import { LineChart, Percent, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Partner with Gawula | Gawula",
};

const BENEFITS = [
  {
    Icon: Store,
    title: "Be part of every cart",
    body: "When a customer builds a bundle from the mall or food court, your store is part of the trip, not a separate journey.",
  },
  {
    Icon: Percent,
    title: "Start at 0% commission",
    body: "Keep all your earnings for up to 30 days while you find your feet on the platform.",
  },
  {
    Icon: LineChart,
    title: "Tools to grow",
    body: "Manage your menu, track orders and understand your customers from one simple dashboard.",
  },
];

const STEPS = [
  {
    title: "Sign up your store",
    body: "Tell us about your store and the cluster you trade from. It takes a few minutes.",
  },
  {
    title: "Add your menu",
    body: "Upload your items, prices and photos, or let our team help you get set up.",
  },
  {
    title: "Go live and get orders",
    body: "Start appearing in customer carts across your mall or food court.",
  },
];

export default function PartnersPage() {
  return (
    <main className="container max-w-6xl pb-24 pt-24 sm:pt-28">
      <section className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="max-w-xl">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Grow your store with Gawula
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Reach customers who are already shopping the whole mall, food court or cluster in one order, starting with 0% commission for up to 30 days.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="dark" size="lg" className="rounded-full px-6">
              <Link href="/partners/signup">Get started</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Signing up takes a few minutes. If we are not live in your area yet, we will let you know the moment it goes live.
          </p>
        </div>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl lg:aspect-[5/6]">
          <svg
            viewBox="0 0 480 480"
            preserveAspectRatio="xMidYMid slice"
            className="h-full w-full"
            role="img"
            aria-label="Illustration of a store owner handing over a Gawula order"
          >
            <defs>
              <linearGradient id="storeSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#FFE9DC" />
                <stop offset="1" stopColor="#FBD7C4" />
              </linearGradient>
            </defs>

            <rect width="480" height="480" fill="url(#storeSky)" />

            <rect y="392" width="480" height="88" fill="#F4C4AC" />

            <g>
              <path
                d="M214 252 q-34 12 -42 72"
                fill="none"
                stroke="#EF5A2A"
                strokeWidth="17"
                strokeLinecap="round"
              />
              <circle cx="176" cy="324" r="10" fill="#F2C29B" />

              <path d="M206 242 q34 -16 68 0 l12 116 H194 Z" fill="#EF5A2A" />
              <rect x="222" y="300" width="36" height="26" rx="4" fill="#FFFFFF" opacity="0.85" />
              <path
                d="M210 248 q30 20 60 0"
                fill="none"
                stroke="#2A1A12"
                strokeWidth="4"
                opacity="0.2"
              />

              <rect x="231" y="226" width="18" height="14" rx="6" fill="#E7B189" />
              <circle cx="240" cy="208" r="24" fill="#F2C29B" />
              <path d="M216 208 a24 24 0 0 1 48 0 Z" fill="#2A1A12" />
              <circle cx="232" cy="214" r="2.6" fill="#2A1A12" />
              <circle cx="248" cy="214" r="2.6" fill="#2A1A12" />
              <path
                d="M233 222 q7 6 14 0"
                fill="none"
                stroke="#2A1A12"
                strokeWidth="3"
                strokeLinecap="round"
              />

              <path
                d="M268 250 q42 4 58 44"
                fill="none"
                stroke="#EF5A2A"
                strokeWidth="17"
                strokeLinecap="round"
              />
              <circle cx="324" cy="300" r="10" fill="#F2C29B" />
            </g>

            <g>
              <rect x="120" y="332" width="240" height="14" rx="4" fill="#2A1A12" />
              <rect x="128" y="346" width="224" height="46" fill="#FFFFFF" />
              <g stroke="#2A1A12" strokeWidth="3" opacity="0.12">
                <line x1="196" y1="346" x2="196" y2="392" />
                <line x1="284" y1="346" x2="284" y2="392" />
              </g>
            </g>

            <g className="gawula-rig">
              <rect x="298" y="282" width="54" height="50" rx="9" fill="#EF5A2A" />
              <path d="M298 304 h54" stroke="#FFFFFF" strokeWidth="4" opacity="0.5" />
              <rect x="317" y="298" width="16" height="16" rx="3" fill="#FFFFFF" />
            </g>
          </svg>
        </div>
      </section>

      <section className="mt-24">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Why stores choose Gawula
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <div key={benefit.title} className="flex flex-col items-center rounded-2xl bg-secondary/50 p-6 text-center">
              <benefit.Icon className="h-7 w-7 text-primary" strokeWidth={2} />
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{benefit.title}</h3>
              <p className="mt-2 text-base text-muted-foreground">{benefit.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-24">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          How it works
        </h2>
        <ol className="mt-10 grid gap-8 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex flex-col items-center rounded-2xl bg-secondary/50 p-6 text-center">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-base font-semibold tabular-nums text-primary-foreground">
                {index + 1}
              </span>
              <h3 className="mt-4 text-lg font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-2 text-base text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-24">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Ready to reach more customers?
        </h2>
        <p className="mt-3 max-w-xl text-base text-muted-foreground">
          Add your store today and start appearing in carts across your mall or food court.
        </p>
        <div className="mt-7">
          <Button asChild variant="dark" size="lg" className="rounded-full px-6">
            <Link href="/partners/signup">Get started</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
