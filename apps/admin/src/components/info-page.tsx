import Link from "next/link";
import { Button } from "@/components/ui/button";

type InfoPageAction = {
  label: string;
  href: string;
};

export function InfoPage({
  eyebrow,
  title,
  body,
  primaryAction,
  secondaryAction,
  children,
}: {
  eyebrow?: string;
  title: string;
  body: string | string[];
  primaryAction?: InfoPageAction;
  secondaryAction?: InfoPageAction;
  children?: React.ReactNode;
}) {
  const paragraphs = Array.isArray(body) ? body : [body];

  return (
    <main className="container max-w-2xl py-16 sm:py-24">
      {eyebrow ? (
        <p className="text-sm font-semibold text-primary">{eyebrow}</p>
      ) : null}
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h1>
      <div className="mt-5 space-y-4 text-base text-muted-foreground">
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      {children}
      {primaryAction || secondaryAction ? (
        <div className="mt-8 flex flex-wrap gap-3">
          {primaryAction ? (
            <Button asChild variant="dark" size="lg" className="rounded-full px-6">
              <Link href={primaryAction.href}>{primaryAction.label}</Link>
            </Button>
          ) : null}
          {secondaryAction ? (
            <Button asChild variant="secondary" size="lg" className="rounded-full px-6">
              <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
