"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LuLoaderCircle as Loader2 } from "react-icons/lu";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCart, cartTotals, linesByBrand, cartFulfillmentContext, resolveOrderLines } from "@/lib/cart-store";
import { useAuth } from "@/lib/auth-store";
import { useApiData } from "@/lib/use-api-data";
import { api, ApiError } from "@/lib/api";
import { formatPrice, cn } from "@/lib/utils";
import { RoleGate } from "@/components/role-gate";

const TIP_OPTIONS = [0, 1000, 2000, 5000];

type ComplexDto = {
  id: string;
  name: string;
  centroid: { lat: number; lng: number };
};

export default function CheckoutPage() {
  return (
    <RoleGate role="customer" title="Sign in to check out">
      <CheckoutFlow />
    </RoleGate>
  );
}

function CheckoutFlow() {
  const router = useRouter();
  const lines = useCart((s) => s.lines);
  const hubId = useCart((s) => s.hub);
  const cartAddress = useCart((s) => s.address);
  const clear = useCart((s) => s.clear);
  const token = useAuth((s) => s.token);
  const authHydrated = useAuth((s) => s.hydrated);
  const principal = useAuth((s) => s.principal);
  const { data: complexes } = useApiData<ComplexDto[]>("/complexes", { token });
  const selectedComplex = complexes?.find((complex) => complex.id === hubId) ?? complexes?.[0] ?? null;
  const complexId = selectedComplex?.id ?? null;
  const needsVerify =
    authHydrated && principal?.roles?.includes("customer") && principal.emailVerified === false;
  const totals = cartTotals(
    lines,
    selectedComplex ? { name: selectedComplex.name, coordinates: selectedComplex.centroid } : null,
  );
  const fulfillment = cartFulfillmentContext(lines);
  const hubCoordinates = selectedComplex?.centroid;
  const storeCount = linesByBrand(lines).size;
  const itemLabel = `${totals.itemCount} ${totals.itemCount === 1 ? "item" : "items"}`;

  const [forSomeoneElse, setForSomeoneElse] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState(cartAddress ?? "");
  const [instructions, setInstructions] = useState("");
  const [payment, setPayment] = useState<"card" | "cash">("card");
  const [tip, setTip] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grandTotal = totals.total + tip;
  const hasContact = forSomeoneElse
    ? firstName.trim() && lastName.trim() && phone.trim()
    : !!(principal?.name && principal?.phone);
  const canSubmit =
    lines.length > 0 &&
    hasContact &&
    (forSomeoneElse ? address.trim() : true) &&
    !needsVerify &&
    !!token &&
    !!complexId;

  if (lines.length === 0) {
    return (
      <div className="container max-w-2xl py-24 text-center text-sm text-muted-foreground">
        Your cart is empty
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting || !complexId) return;
    setSubmitting(true);
    setError(null);
    try {
      const orderLines = resolveOrderLines(lines, complexId);
      if (orderLines.length === 0) {
        throw new Error("These items are no longer available. Please rebuild your cart.");
      }
      const order = await api<{ id: string }>("/orders", {
        method: "POST",
        token,
        body: {
          complexId,
          tipCents: tip,
          paymentMethod: payment,
          lines: orderLines,
          address: forSomeoneElse
            ? {
                label: `${firstName.trim()} ${lastName.trim()}`.trim() || "Delivery",
                line1: address.trim(),
                city: "Johannesburg",
                instructions: instructions.trim() || undefined,
              }
            : cartAddress
              ? {
                  label: "Delivery",
                  line1: cartAddress.trim(),
                  city: "Johannesburg",
                  lat: hubCoordinates?.lat,
                  lng: hubCoordinates?.lng,
                  instructions: instructions.trim() || undefined,
                }
              : undefined,
        },
      });
      await api(`/payments/${order.id}/confirm`, { method: "POST", token });
      clear();
      router.push(`/track/${order.id}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not place your order. Please try again.",
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="container max-w-6xl py-6 pb-28 sm:py-10">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">Checkout</h1>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start"
      >
        <div className="space-y-5">
          <section className="py-1">

            <div className="mt-5 space-y-4">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={forSomeoneElse}
                  onChange={(e) => {
                    setForSomeoneElse(e.target.checked);
                    if (!e.target.checked) {
                      setFirstName("");
                      setLastName("");
                      setPhone("");
                    }
                  }}
                  className="peer sr-only"
                />
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 border-foreground/20 bg-background transition-colors peer-checked:border-foreground peer-checked:bg-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-foreground/30">
                  {forSomeoneElse && (
                    <svg viewBox="0 0 10 8" className="h-3 w-3 stroke-background" strokeWidth="2" fill="none">
                      <path d="M1 4l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className="text-sm">This order is for someone else</span>
              </label>

              {forSomeoneElse ? (
                <>
                  <Field label="Name">
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Surname">
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Phone">
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Delivery address">
                    <AddressAutocomplete
                      id="checkout-address"
                      value={address}
                      onValueChange={setAddress}
                      onSelect={(val) => setAddress(val)}
                      className="flex h-12 w-full rounded-lg border-0 bg-secondary px-4 text-base font-medium outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-foreground/20"
                    />
                  </Field>
                </>
              ) : null}
              <Field label="Notes for the rider (optional)">
                <Textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder=""
                  className="min-h-[84px]"
                />
              </Field>
            </div>
          </section>

          <section className="py-1">
            <h2 className="text-lg font-semibold">Payment</h2>
            <div className="mt-4 space-y-3">
              {(["card", "cash"] as const).map((option) => (
                <label key={option} className="flex cursor-pointer items-start gap-3">
                  <input
                    type="radio"
                    name="payment"
                    value={option}
                    checked={payment === option}
                    onChange={() => setPayment(option)}
                    className="mt-0.5 h-4 w-4 accent-foreground"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">
                      {option === "card" ? "Card" : "Cash on delivery"}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {option === "card"
                        ? "Pay securely on delivery confirmation"
                        : "Pay the rider in exact change"}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="py-1">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-lg font-semibold">Rider tip</h2>
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
          <div>
            <h2 className="text-base font-semibold">Order summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Row label="Subtotal" value={formatPrice(totals.subtotal)} />
              <Row label="Delivery" value={formatPrice(totals.deliveryFee)} />
              <Row label="Service fee" value={formatPrice(totals.serviceFee)} />
              {tip > 0 ? <Row label="Tip" value={formatPrice(tip)} /> : null}
              <div className="flex items-baseline justify-between">
                <dt className="text-sm font-semibold">Total</dt>
                <dd className="text-sm font-semibold">{formatPrice(grandTotal)}</dd>
              </div>
            </dl>
            {needsVerify ? (
              <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Verify your email to place this order. Use the link we sent to{" "}
                <span className="font-medium">{principal?.email}</span>.
              </p>
            ) : null}
            {error ? (
              <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
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
                <>Place order</>
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



function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
