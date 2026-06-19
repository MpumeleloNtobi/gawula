import { InfoPage } from "@/components/info-page";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Terms of service",
  description:
    "Read the terms of service for using Gawula, the multi-store ordering and delivery platform.",
  path: "/legal/terms",
});

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Terms of service"
      body={[
        "By using Gawula you agree to order responsibly, provide accurate delivery details and treat our riders and partner stores with respect.",
        "Our full terms of service are being finalised. Continued use of the platform means you accept the terms as they are published.",
      ]}
      secondaryAction={{ label: "Read the privacy policy", href: "/legal/privacy" }}
    />
  );
}
