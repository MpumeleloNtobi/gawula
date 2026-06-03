import { InfoPage } from "@/components/info-page";

export const metadata = {
  title: "Careers | Gawula",
};

export default function CareersPage() {
  return (
    <InfoPage
      eyebrow="Careers"
      title="Build Gawula with us"
      body={[
        "We are a small team in Johannesburg rethinking how people order food across the stores they already love.",
        "There are no open roles listed right now. Check back soon, or get in touch if you think you can help us grow.",
      ]}
      primaryAction={{ label: "Browse the menu", href: "/menu" }}
    />
  );
}
