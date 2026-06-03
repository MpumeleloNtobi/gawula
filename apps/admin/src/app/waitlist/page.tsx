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

  return (
    <main className="container max-w-2xl pb-24 pt-24 sm:pt-28">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {area ? `We are not in ${area} just yet` : "We are coming to more areas"}
      </h1>
      <p className="mt-4 max-w-xl text-base text-muted-foreground">
        Gawula is rolling out neighbourhood by neighbourhood. Leave your details and we will let you know the moment we go live near you.
      </p>
      <div className="mt-8">
        <CoverageWaitlistForm area={area} />
      </div>
    </main>
  );
}
