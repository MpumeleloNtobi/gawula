import { PartnerSignupForm } from "@/components/partner-signup-form";
import { HUBS } from "@/lib/mock-data";

export const metadata = {
  title: "Add your store | Gawula",
};

const PARTNER_AREAS = HUBS.map((hub) => ({
  id: hub.id,
  label: hub.area.split(",")[0],
}));

export default function PartnerSignupPage() {
  return (
    <main className="container max-w-2xl pb-24 pt-24 sm:pt-28">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Add your store
      </h1>
      <p className="mt-4 max-w-xl text-base text-muted-foreground">
        Tell us about your store and where you trade. If Gawula is already live there you can get set up straight away, and if not we will let you know as soon as your area is ready.
      </p>
      <div className="mt-8">
        <PartnerSignupForm areas={PARTNER_AREAS} />
      </div>
    </main>
  );
}
