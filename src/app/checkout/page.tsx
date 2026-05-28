"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CreditCard, Wallet, MapPin, User, Phone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCart, cartTotals } from "@/lib/cart-store";
import { useOrders } from "@/lib/orders-store";
import { HUBS } from "@/lib/mock-data";
import { formatPrice, cn, uid } from "@/lib/utils";

const TIP_OPTIONS = [0, 1000, 2000, 5000];

export default function CheckoutPage() {
  const router = useRouter();
  const lines = useCart((s) => s.lines);
  const hubId = useCart((s) => s.hub);
  const cartAddress = useCart((s) => s.address);
  const clear = useCart((s) => s.clear);
  const addOrder = useOrders((s) => s.addOrder);
  const totals = cartTotals(lines);
  const hub = HUBS.find((h) => h.id === hubId);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState(cartAddress ?? "");
  const [instructions, setInstructions] = useState("");
  const [payment, setPayment] = useState<"card" | "cash">("card");
  const [tip, setTip] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const grandTotal = totals.total + tip;
  const canSubmit =
    lines.length > 0 && name.trim() && phone.trim() && address.trim();

  if (lines.length === 0) {
    return (
      <div className="container max-w-2xl py-16">
        <div className="rounded-2xl border bg-card p-10 text-center">
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">
            Your basket is empty
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Add a few dishes before heading to checkout.
          </p>
          <Button asChild variant="dark" size="lg" className="mt-6">
            <Link href="/menu">Browse restaurants</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    const orderId = uid();
    addOrder({
      id: orderId,
      createdAt: Date.now(),
      hub: hubId,
      address,
      contactName: name,
      contactPhone: phone,
      paymentMethod: payment,
      tipCents: tip,
      lines,
      subtotal: totals.subtotal,
      deliveryFee: totals.deliveryFee,
      serviceFee: totals.serviceFee,
      total: grandTotal,
      status: "received",
    });
    clear();
    setTimeout(() => router.push(`/orders/${orderId}`), 500);
  };

  return (
    <div className="container max-w-5xl py-8 sm:py-12">
      <h1 className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
        Checkout
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Last step before your food gets fired.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]"
      >
        <div className="space-y-6">
          <section className="rounded-2xl border bg-card p-6">
            <h2 className="text-sm font-semibold tracking-[0.18em] text-muted-foreground">
              Delivery
            </h2>
            <div className="mt-4 space-y-4">
              <div className="rounded-xl bg-secondary/60 p-3 text-sm">
                <div className="flex items-center gap-1.5 text-xs font-medium tracking-[0.18em] text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  From
                </div>
                <div className="mt-1 font-medium">
                  {hub?.name ?? "No hub selected"}
                </div>
                {hub ? (
                  <div className="text-xs text-muted-foreground">
                    {hub.area} · {hub.etaMinutes[0]}–{hub.etaMinutes[1]} min
                  </div>
                ) : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" icon={<User className="h-4 w-4" />}>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Thandi Mokoena"
                    required
                  />
                </Field>
                <Field label="Phone" icon={<Phone className="h-4 w-4" />}>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="071 234 5678"
                    required
                  />
                </Field>
              </div>
              <Field label="Delivery address" icon={<MapPin className="h-4 w-4" />}>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Apartment 4B, 12 Tyrwhitt Avenue, Rosebank"
                  required
                />
              </Field>
              <Field label="Notes for the rider (optional)">
                <Textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Buzz for unit 4B, gate code 1947."
                  className="min-h-[72px]"
                />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-6">
            <h2 className="text-sm font-semibold tracking-[0.18em] text-muted-foreground">
              Payment
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <PaymentOption
                active={payment === "card"}
                onClick={() => setPayment("card")}
                icon={<CreditCard className="h-4 w-4" />}
                title="Card"
                subtitle="Pay securely on delivery confirmation"
              />
              <PaymentOption
                active={payment === "cash"}
                onClick={() => setPayment("cash")}
                icon={<Wallet className="h-4 w-4" />}
                title="Cash on delivery"
                subtitle="Pay the rider in exact change"
              />
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-6">
            <h2 className="text-sm font-semibold tracking-[0.18em] text-muted-foreground">
              Tip your rider
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {TIP_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => setTip(opt)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    tip === opt
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-card text-foreground hover:border-foreground/40"
                  )}
                >
                  {opt === 0 ? "No tip" : formatPrice(opt)}
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border bg-card p-6">
            <h2 className="text-sm font-semibold tracking-[0.18em] text-muted-foreground">
              Summary
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Subtotal" value={formatPrice(totals.subtotal)} />
              <Row label="Delivery" value={formatPrice(totals.deliveryFee)} />
              <Row label="Service fee" value={formatPrice(totals.serviceFee)} />
              {tip > 0 ? <Row label="Tip" value={formatPrice(tip)} /> : null}
            </dl>
            <div className="mt-4 flex items-baseline justify-between border-t pt-4">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-lg font-semibold">{formatPrice(grandTotal)}</span>
            </div>
            <Button
              type="submit"
              variant="dark"
              size="lg"
              className="mt-5 w-full"
              disabled={!canSubmit || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Placing order…
                </>
              ) : (
                <>Place order · {formatPrice(grandTotal)}</>
              )}
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              By placing this order you agree to our terms.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium tracking-[0.18em] text-muted-foreground">
        {icon}
        {label}
      </div>
      {children}
    </label>
  );
}

function PaymentOption({
  active,
  onClick,
  icon,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
        active
          ? "border-foreground bg-secondary/60"
          : "border-border hover:border-foreground/30"
      )}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">{subtitle}</span>
      </span>
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
