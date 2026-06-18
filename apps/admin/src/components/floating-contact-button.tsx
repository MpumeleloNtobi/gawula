"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuHeadset as Headset, LuMail as Mail } from "react-icons/lu";

const supportNumber = "27749351469";

function supportMessageForPath(pathname: string) {
  const isOrderContext =
    pathname.startsWith("/cart") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/track") ||
    pathname.startsWith("/orders");
  if (isOrderContext) {
    return "Hi Gawula support \uD83D\uDC4B\nOrder number (if any):\nWhat I need help with:";
  }
  return "Hi Gawula support \uD83D\uDC4B I need help with:";
}

const emailHref = "mailto:hello@gawula.co.za?subject=Gawula%20support";

function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Zm-5.42 7.4h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26C2.16 6.44 6.6 2.01 12.05 2.01c2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88Zm8.41-18.29A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.89 11.89 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.16-3.48-8.42Z" />
    </svg>
  );
}

export function FloatingContactButton({ hasBottomNav = true }: { hasBottomNav?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const whatsappHref = `https://wa.me/${supportNumber}?text=${encodeURIComponent(
    supportMessageForPath(pathname),
  )}`;

  React.useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`fixed right-4 z-30 overflow-visible md:bottom-6 md:right-8 ${hasBottomNav ? "bottom-20" : "bottom-6"}`}>
      {open ? (
        <div className="absolute bottom-[calc(100%+0.75rem)] right-0 max-h-[calc(100vh-10rem)] w-48 overflow-y-auto rounded-2xl bg-background p-1 shadow-xl">
          <Link
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold hover:bg-secondary"
            onClick={() => setOpen(false)}
          >
            <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
            WhatsApp
          </Link>
          <Link
            href={emailHref}
            className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold hover:bg-secondary"
            onClick={() => setOpen(false)}
          >
            <Mail className="h-4 w-4" />
            Email
          </Link>
        </div>
      ) : null}
      <button
        type="button"
        aria-label="Contact customer support"
        aria-expanded={open}
        title="Customer support"
        className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-black text-white shadow-lg transition-transform hover:scale-105"
        onClick={() => setOpen((current) => !current)}
      >
        <Headset className="h-5 w-5" />
      </button>
    </div>
  );
}