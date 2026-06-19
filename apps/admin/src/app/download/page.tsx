import { InfoPage } from "@/components/info-page";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Get the app",
  description:
    "Get the Gawula app to reorder favourites in two taps and track your rider block by block. Launching soon; order on the web meanwhile.",
  path: "/download",
});

export default function DownloadPage() {
  return (
    <InfoPage
      eyebrow="Mobile app"
      title="Get the best Gawula experience"
      body={[
        "Reorder your favourite bundles in two taps and track your rider block by block. Everything your neighbourhood has to offer, all in one order.",
        "The Gawula app is launching soon. In the meantime you can order everything right here on the web.",
      ]}
      primaryAction={{ label: "Order on the web", href: "/menu" }}
    />
  );
}
