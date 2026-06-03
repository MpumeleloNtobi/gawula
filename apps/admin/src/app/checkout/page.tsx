"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CreditCard, Wallet, MapPin, User, Phone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCart, cartTotals, linesByBrand, cartFulfillmentContext } from "@/lib/cart-store";
import { useOrders } from "@/lib/orders-store";
import { useAuth } from "@/lib/auth-store";
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
  const authHydrated = useAuth((s) => s.hydrated);
  const principal = useAuth((s) => s.principal);
  const needsVerify =
    authHydrated && principal?.roles?.includes("customer") && principal.emailVerified === false;
  const totals = cartTotals(lines, HUBS.find((h) => h.id === hubId) ?? null);
  const fulfillment = cartFulfillmentContext(lines);
  const hub = HUBS.find((h) => h.id === hubId);
  const storeCount = linesByBrand(lines).size;
  const itemLabel = `${totals.itemCount} ${totals.itemCount === 1 ? "item" : "items"}`;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState(cartAddress ?? "");
  const [instructions, setInstructions] = useState("");
  const [payment, setPayment] = useState<"card" | "cash">("card");
  const [tip, setTip] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const grandTotal = totals.total + tip;
  const canSubmit =
    lines.length > 0 && name.trim() && phone.trim() && address.trim() && !needsVerify;

  if (lines.length === 0) {
    return (
      <div className="container max-w-2xl py-16">
        <div className="rounded-lg bg-card p-10 text-center">
          <h1 className="text-2xl font-semibold">Cart is empty</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Add a few dishes before heading to checkout.
          </p>
          <Button asChild variant="dark" size="lg" className="mt-6 rounded-full px-6">
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
    <div className="container max-w-6xl py-6 pb-28 sm:py-10">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Checkout</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {itemLabel} from {storeCount} {storeCount === 1 ? "store" : "stores"}
          </p>
          {fulfillment ? (
            <p className="mt-1 text-sm font-semibold text-[#116B35]">
              {fulfillment.isMultiStore ? "One coordinated pickup" : "Prepared"} from {fulfillment.locationName}
            </p>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">Total {formatPrice(grandTotal)}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start"
      >
        <div className="space-y-5">
          <section className="rounded-lg bg-card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Delivery details</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {hub?.name ?? "No hub selected"}{hub?.area ? `, ${hub.area}` : ""}
                </p>
                {fulfillment ? (
                  <p className="mt-1 text-xs font-semibold text-[#116B35]">
                    {fulfillment.pickupPoint}
                  </p>
                ) : null}
              </div>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-foreground">
                <MapPin className="h-4 w-4" />
              </span>
            </div>

            <div className="mt-5 space-y-4">
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
                  className="min-h-[84px]"
                />
              </Field>
            </div>
          </section>

          <section className="rounded-lg bg-card p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Payment</h2>
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

          <section className="rounded-lg bg-card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Rider tip</h2>
                <p className="mt-1 text-sm text-muted-foreground">Optional</p>
              </div>
              {tip > 0 ? <span className="text-sm font-semibold">{formatPrice(tip)}</span> : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {TIP_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => setTip(opt)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                    tip === opt
                      ? "bg-foreground text-background"
                      : "bg-secondary text-foreground hover:bg-secondary/80"
                  )}
                >
                  {opt === 0 ? "No tip" : formatPrice(opt)}
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg bg-secondary p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold">Order summary</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {storeCount} {storeCount === 1 ? "store" : "stores"} in this order
                </p>
                {fulfillment ? (
                  <p className="mt-1 text-xs font-semibold text-[#116B35]">
                    {fulfillment.proximityLabel}
                  </p>
                ) : null}
              </div>
              <span className="text-sm font-semibold">{itemLabel}</span>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <Row label="Subtotal" value={formatPrice(totals.subtotal)} />
              <Row label="Delivery" value={formatPrice(totals.deliveryFee)} />
              {totals.deliveryQuote.effortFee > 0 ? (
                <div className="rounded-md bg-background/70 px-3 py-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {totals.deliveryQuote.modeLabel}
                  </span>{" "}
                  includes {formatPrice(totals.deliveryQuote.effortFee)} for {totals.deliveryQuote.pickupStops} pickup stops
                  {totals.deliveryQuote.distanceKm > 0 ? ` over ${totals.deliveryQuote.distanceKm.toFixed(1)} km` : ""}.
                </div>
              ) : null}
              <Row label="Service fee" value={formatPrice(totals.serviceFee)} />
              {tip > 0 ? <Row label="Tip" value={formatPrice(tip)} /> : null}
            </dl>
            <div className="mt-5 flex items-baseline justify-between">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-lg font-semibold">{formatPrice(grandTotal)}</span>
            </div>
            {needsVerify ? (
              <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Verify your email to place this order. Use the link we sent to{" "}
                <span className="font-medium">{principal?.email}</span>.
              </p>
            ) : null}
            <Button
              type="submit"
              variant="dark"
              size="lg"
              className="mt-5 w-full rounded-full"
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
      <div className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
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
        "flex items-start gap-3 rounded-lg p-4 text-left transition-colors",
        active
          ? "bg-secondary"
          : "bg-background hover:bg-secondary/60"
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
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
