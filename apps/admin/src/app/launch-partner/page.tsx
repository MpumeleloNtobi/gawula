import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Become a launch partner | Gawula",
};

export default function LaunchPartnerPage({
  searchParams,
}: {
  searchParams?: { area?: string };
}) {
  const area = searchParams?.area?.trim() ?? "";
  const parts = area.split(",").map((s) => s.trim()).filter(Boolean);
  const displayArea = parts.length > 1 && /^\d/.test(parts[0]) ? parts[1] : parts[0] ?? area;
  const place = displayArea || "your area";
  const applyHref = area
    ? `/launch-partner/apply?area=${encodeURIComponent(area)}`
    : "/launch-partner/apply";

  const steps = [
    {
      title: "Apply",
      body: "Fill in the short application form. It takes a couple of minutes.",
    },
    {
      title: "We reach out",
      body: `If you are a good fit for ${place}, we will get in touch and set you up with a partner code.`,
    },
    {
      title: "Sign up stores",
      body: "Use your code to sign local stores up on Gawula, with our support behind you.",
    },
    {
      title: "Earn",
      body: "Keep the service fee on each store's orders for their first month live.",
    },
  ];

  const faqs = [
    {
      q: "Do I need experience?",
      a: "No. If you know your area and can have a straightforward conversation with a store owner, you have everything you need. We give you the tools and support to get stores set up.",
    },
    {
      q: "How and when do I get paid?",
      a: "You keep Gawula's service fee on every order a store you signed up takes in their first month live. We will walk you through the exact payout process when we get in touch after your application.",
    },
    {
      q: "Is there a limit to how many stores I can sign up?",
      a: "No limit. The more stores you bring on, the more you earn, and the faster your area goes live.",
    },
    {
      q: "What happens after the first month?",
      a: "The first-month earn period is your launch bonus. After that, stores stay on Gawula and keep growing their sales. We will share more about long-term partner opportunities as the platform grows.",
    },
    {
      q: "Is Gawula available across South Africa?",
      a: `We are launching area by area, starting where we have partners on the ground. ${area ? `${area} is on our radar` : "Your area could be next"}, and the more stores you bring on, the sooner it goes live.`,
    },
  ];

  return (
    <main className="container max-w-5xl pb-24 pt-24 sm:pt-28">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {area ? `Help launch Gawula in ${place}` : "Help launch Gawula near you"}
      </h1>
      <p className="mt-4 max-w-2xl text-base text-muted-foreground">
        Bring the stores {place} loves onto Gawula, help them go live, and earn from their orders for a full month. Work your own area, on your own time.
      </p>
      <Button asChild variant="dark" size="lg" className="mt-6 rounded-full px-7">
        <Link href={applyHref}>Apply to be a Launch Partner</Link>
      </Button>

      <div className="mt-10 max-w-2xl py-7">
        <p className="mt-2 text-3xl font-semibold tracking-tight">Earn 100% of the service fee</p>
        <p className="mt-2 text-base text-muted-foreground">
          On every order each store you sign up takes in their first month live. The more orders your stores get, the more you earn.
        </p>
      </div>

      <section className="mt-20">
        <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
        <ol className="mt-8 max-w-2xl">
          {steps.map(({ title, body }, index) => (
            <li key={title} className="flex gap-5">
              <div className="flex flex-col items-center">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-foreground">
                  {index + 1}
                </span>
                {index < steps.length - 1 ? (
                  <span aria-hidden className="mt-1 w-px flex-1 bg-border" />
                ) : null}
              </div>
              <div className={index < steps.length - 1 ? "pb-10" : ""}>
                <p className="pt-2 font-medium">{title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-20">
        <h2 className="text-2xl font-semibold tracking-tight">FAQ</h2>
        <dl className="mt-6 grid max-w-3xl gap-x-10 gap-y-6">
          {faqs.map(({ q, a }) => (
            <div key={q}>
              <dt className="font-medium">{q}</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
