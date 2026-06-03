import { InfoPage } from "@/components/info-page";

export const metadata = {
  title: "Get the app | Gawula",
};

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
