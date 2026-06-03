import { InfoPage } from "@/components/info-page";

export const metadata = {
  title: "Privacy | Gawula",
};

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Privacy policy"
      body={[
        "We collect only what we need to take your order, coordinate your trip and keep your account secure. We do not sell your personal information.",
        "Our full privacy policy is being finalised. If you have any questions about how your data is handled, please get in touch.",
      ]}
      secondaryAction={{ label: "Read the terms", href: "/legal/terms" }}
    />
  );
}
