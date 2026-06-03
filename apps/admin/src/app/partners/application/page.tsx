import { PartnerApplicationStatus } from "@/components/partner-application-status";

export const metadata = {
  title: "Your store application | Gawula",
};

export default function PartnerApplicationPage() {
  return (
    <main className="container max-w-2xl pb-24 pt-24 sm:pt-28">
      <PartnerApplicationStatus />
    </main>
  );
}
