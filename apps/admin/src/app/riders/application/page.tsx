import { RiderApplicationStatus } from "@/components/rider-application-status";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Your rider application",
  description: "Check the status of your Gawula rider application.",
  noindex: true,
});

export default function RiderApplicationPage() {
  return (
    <main className="container max-w-2xl pb-24 pt-24 sm:pt-28">
      <RiderApplicationStatus />
    </main>
  );
}
