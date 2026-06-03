import { InfoPage } from "@/components/info-page";

export const metadata = {
  title: "About | Gawula",
};

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow="About"
      title="Food from your favourites, all in one order"
      body={[
        "Gawula is built around how people really shop. You do not visit a mall for a single store and come back later for another; you make one trip with several stops.",
        "We bring that to delivery and pickup. Order from every store in the same mall, food court or cluster in one cart, and we coordinate a single trip to bring it all to you.",
      ]}
      primaryAction={{ label: "Browse the menu", href: "/menu" }}
    />
  );
}
