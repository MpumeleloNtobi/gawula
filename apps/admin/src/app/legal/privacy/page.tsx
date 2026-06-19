import { InfoPage } from "@/components/info-page";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy policy",
  description:
    "Learn how Gawula collects, uses and protects your personal information when you order across multiple stores.",
  path: "/legal/privacy",
});

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
