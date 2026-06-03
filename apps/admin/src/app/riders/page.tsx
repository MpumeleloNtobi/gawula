import Link from "next/link";
import { Clock, Route, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Become a rider | Gawula",
};

const BENEFITS = [
  {
    Icon: Clock,
    title: "Flexible hours",
    body: "Ride when it suits you. Pick up trips between classes, shifts or whenever you have a free hour.",
  },
  {
    Icon: Wallet,
    title: "Earn on every trip",
    body: "Get paid for each delivery you complete, with busier areas and peak times paying more.",
  },
  {
    Icon: Route,
    title: "Fewer trips, more drops",
    body: "Bundles group nearby stores into one run, so you cover less distance for more earnings.",
  },
];

const STEPS = [
  {
    title: "Sign up",
    body: "Leave your details and tell us where you would like to ride.",
  },
  {
    title: "Get verified",
    body: "We run a few quick checks and help you get set up to deliver.",
  },
  {
    title: "Start riding",
    body: "Accept trips near you and get paid for every completed delivery.",
  },
];

export default function RidersPage() {
  return (
    <main className="container max-w-6xl pb-24 pt-24 sm:pt-28">
      <section className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="max-w-xl">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Earn on your own schedule
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Deliver Gawula bundles around your neighbourhood and get paid for every trip. One run can cover several stores in the same mall or cluster, so your time on the road goes further.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="dark" size="lg" className="rounded-full px-6">
              <Link href="/riders/signup">Sign up to ride</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Signing up takes a few minutes. If we are not live in your neighbourhood yet, we will let you know the moment it goes live.
          </p>
        </div>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl lg:aspect-[5/6]">
          <svg
            viewBox="0 0 480 480"
            preserveAspectRatio="xMidYMid slice"
            className="h-full w-full"
            role="img"
            aria-label="Illustration of a Gawula courier cycling with a delivery box"
          >
            <defs>
              <linearGradient id="riderSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#FFE9DC" />
                <stop offset="1" stopColor="#FBD7C4" />
              </linearGradient>
            </defs>

            <rect width="480" height="480" fill="url(#riderSky)" />
            <circle cx="374" cy="116" r="48" fill="#FBBF24" opacity="0.5" />

            <g fill="#FFFFFF" opacity="0.75">
              <g className="gawula-cloud">
                <g transform="translate(120 96)">
                  <ellipse cx="0" cy="0" rx="26" ry="16" />
                  <ellipse cx="22" cy="7" rx="20" ry="13" />
                  <ellipse cx="-22" cy="7" rx="20" ry="13" />
                </g>
                <g transform="translate(640 96)">
                  <ellipse cx="0" cy="0" rx="26" ry="16" />
                  <ellipse cx="22" cy="7" rx="20" ry="13" />
                  <ellipse cx="-22" cy="7" rx="20" ry="13" />
                </g>
              </g>
              <g className="gawula-cloud-slow">
                <g transform="translate(330 168)">
                  <ellipse cx="0" cy="0" rx="20" ry="12" />
                  <ellipse cx="18" cy="5" rx="15" ry="10" />
                  <ellipse cx="-18" cy="5" rx="15" ry="10" />
                </g>
                <g transform="translate(850 168)">
                  <ellipse cx="0" cy="0" rx="20" ry="12" />
                  <ellipse cx="18" cy="5" rx="15" ry="10" />
                  <ellipse cx="-18" cy="5" rx="15" ry="10" />
                </g>
              </g>
            </g>

            <rect y="392" width="480" height="88" fill="#F4C4AC" />
            <ellipse cx="240" cy="398" rx="120" ry="12" fill="#2A1A12" opacity="0.12" />

            <g className="gawula-rig">
              <g transform="rotate(-9 206 234)">
                <rect x="182" y="210" width="48" height="48" rx="10" fill="#EF5A2A" />
                <rect x="200" y="228" width="12" height="12" rx="2.5" fill="#FFFFFF" />
              </g>

              <g
                fill="none"
                stroke="#2A1A12"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="176" y1="358" x2="238" y2="358" />
                <line x1="238" y1="358" x2="226" y2="288" />
                <line x1="238" y1="358" x2="296" y2="316" />
                <line x1="226" y1="288" x2="296" y2="312" />
                <line x1="176" y1="358" x2="226" y2="288" />
                <line x1="306" y1="358" x2="300" y2="300" />
                <line x1="288" y1="294" x2="314" y2="290" />
              </g>

              <ellipse cx="226" cy="286" rx="14" ry="6" fill="#2A1A12" />

              <g stroke="#2A1A12" strokeWidth="12" strokeLinecap="round">
                <line x1="226" y1="290" x2="266" y2="244" />
              </g>
              <g stroke="#2A1A12" strokeWidth="9" strokeLinecap="round" fill="none">
                <line x1="266" y1="246" x2="302" y2="298" />
                <line x1="226" y1="292" x2="248" y2="330" />
                <line x1="248" y1="330" x2="240" y2="360" />
                <line x1="222" y1="292" x2="232" y2="338" />
                <line x1="232" y1="338" x2="226" y2="360" />
              </g>

              <circle cx="282" cy="228" r="15" fill="#F2C29B" />
              <path d="M264 228 Q282 204 300 228 Z" fill="#EF5A2A" />
              <rect x="293" y="223" width="10" height="6" rx="3" fill="#2A1A12" opacity="0.5" />

              <g className="gawula-wheel">
                <circle cx="176" cy="358" r="33" fill="none" stroke="#2A1A12" strokeWidth="7" />
                <circle cx="176" cy="358" r="5" fill="#2A1A12" />
                <g stroke="#2A1A12" strokeWidth="3" opacity="0.55">
                  <line x1="176" y1="328" x2="176" y2="388" />
                  <line x1="146" y1="358" x2="206" y2="358" />
                  <line x1="155" y1="337" x2="197" y2="379" />
                  <line x1="155" y1="379" x2="197" y2="337" />
                </g>
              </g>
              <g className="gawula-wheel">
                <circle cx="306" cy="358" r="33" fill="none" stroke="#2A1A12" strokeWidth="7" />
                <circle cx="306" cy="358" r="5" fill="#2A1A12" />
                <g stroke="#2A1A12" strokeWidth="3" opacity="0.55">
                  <line x1="306" y1="328" x2="306" y2="388" />
                  <line x1="276" y1="358" x2="336" y2="358" />
                  <line x1="285" y1="337" x2="327" y2="379" />
                  <line x1="285" y1="379" x2="327" y2="337" />
                </g>
              </g>
            </g>
          </svg>
        </div>
      </section>

      <section className="mt-24">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Why ride with Gawula
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
          Be first to ride in your area
        </h2>
        <p className="mt-3 max-w-xl text-base text-muted-foreground">
          We are signing up riders area by area. Tell us where you would like to ride and we will be in touch as soon as we go live near you.
        </p>
        <div className="mt-7">
          <Button asChild variant="dark" size="lg" className="rounded-full px-6">
            <Link href="/riders/signup">Sign up to ride</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
