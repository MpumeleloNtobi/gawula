import { InfoPage } from "@/components/info-page";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Catering and group orders",
  description:
    "Feed your team from several stores in one order, with one invoice and one delivery. Group ordering for workplaces is on the way.",
  path: "/catering",
});

export default function CateringPage() {
  return (
    <InfoPage
      eyebrow="Catering"
      title="Cater your team"
      body={[
        "Feed the whole office from several stores in one order, with one invoice and one delivery. Everyone gets what they want without juggling separate orders or multiple riders.",
        "Group ordering for teams is on the way. Tell us about your workplace and we will be in touch.",
      ]}
      primaryAction={{ label: "Talk to us", href: "/sign-up" }}
      secondaryAction={{ label: "Browse the menu", href: "/menu" }}
    />
  );
}
