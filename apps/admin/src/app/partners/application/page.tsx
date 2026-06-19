import { PartnerApplicationStatus } from "@/components/partner-application-status";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Your store application",
  description: "Check the status of your Gawula store application.",
  noindex: true,
});

export default function PartnerApplicationPage() {
  return (
    <main className="container max-w-2xl pb-24 pt-24 sm:pt-28">
      <PartnerApplicationStatus />
    </main>
  );
}
