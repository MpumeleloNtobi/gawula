import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CoverageWaitlistForm } from "@/components/coverage-waitlist-form";

export const metadata = {
  title: "Check coverage | Gawula",
};

export default function WaitlistPage({
  searchParams,
}: {
  searchParams?: { area?: string };
}) {
  const area = searchParams?.area?.trim() ?? "";
  const parts = area.split(",").map((s) => s.trim()).filter(Boolean);
  const displayArea = parts.length > 1 && /^\d/.test(parts[0]) ? parts[1] : parts[0] ?? area;
  const partnerHref = area
    ? `/launch-partner?area=${encodeURIComponent(area)}`
    : "/launch-partner";

  return (
    <main className="container max-w-2xl pb-24 pt-24 sm:pt-28">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {area ? `We are not in ${displayArea} just yet` : "We are coming to more areas"}
      </h1>
      {area ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Not {displayArea}?{" "}
          <Link href="/" className="text-primary hover:opacity-80">
            Search a different area
          </Link>
        </p>
      ) : null}
      <p className="mt-4 text-base text-muted-foreground">
        We open up neighbourhood by neighbourhood, and we move fastest where someone local is helping. Bring the stores {displayArea || "your area"} loves onto Gawula and earn while you grow it here.
      </p>

      <section className="mt-8 max-w-md">
        <h2 className="text-xl font-semibold tracking-tight">
          {area ? `Help launch Gawula in ${displayArea}` : "Help launch Gawula near you"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Know your area well? Connect us with local stores, help us launch faster, and earn for every store you bring on.
        </p>
        <Button asChild variant="dark" size="lg" className="mt-5 w-full rounded-full">
          <Link href={partnerHref}>Become a Launch Partner</Link>
        </Button>
      </section>

      <section className="mt-12 max-w-md">
        <h2 className="text-base font-semibold tracking-tight">
          Just want to know when we launch?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your details and we will message you the moment Gawula goes live {area ? `in ${displayArea}` : "near you"}.
        </p>
        <div className="mt-4">
          <CoverageWaitlistForm area={displayArea} />
        </div>
      </section>
    </main>
  );
}
