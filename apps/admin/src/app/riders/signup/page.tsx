import { RiderSignupForm } from "@/components/rider-signup-form";
import { HUBS } from "@/lib/mock-data";

export const metadata = {
  title: "Sign up to ride | Gawula",
};

const RIDER_AREAS = HUBS.map((hub) => ({
  id: hub.id,
  label: hub.area.split(",")[0],
}));

export default function RiderSignupPage() {
  return (
    <main className="container max-w-2xl pb-24 pt-24 sm:pt-28">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Sign up to ride
      </h1>
      <p className="mt-4 max-w-xl text-base text-muted-foreground">
        Tell us where you would like to ride. If Gawula is already live there you can get started straight away, and if not we will let you know as soon as we arrive.
      </p>
      <div className="mt-8">
        <RiderSignupForm areas={RIDER_AREAS} />
      </div>
    </main>
  );
}
