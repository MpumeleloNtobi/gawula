import { LaunchPartnerForm } from "@/components/launch-partner-form";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Launch partner application",
  description: "Apply to become a Gawula launch partner in your area.",
  noindex: true,
});

export default function LaunchPartnerApplyPage({
  searchParams,
}: {
  searchParams?: { area?: string };
}) {
  const area = searchParams?.area?.trim() ?? "";
  const parts = area.split(",").map((s) => s.trim()).filter(Boolean);
  const displayArea = parts.length > 1 && /^\d/.test(parts[0]) ? parts[1] : parts[0] ?? area;

  return (
    <main className="container max-w-2xl pb-24 pt-24 sm:pt-28">
      <div className="mx-auto max-w-md">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Apply to be a Launch Partner
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          Tell us a bit about yourself{displayArea ? ` and the stores you know in ${displayArea}` : ""}, and we will be in touch.
        </p>
        <div className="mt-8">
          <LaunchPartnerForm area={displayArea} />
        </div>
      </div>
    </main>
  );
}
