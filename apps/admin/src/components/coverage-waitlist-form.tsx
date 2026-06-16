"use client";

import * as React from "react";
import { LuCheck as Check } from "react-icons/lu";
import { Button } from "@/components/ui/button";

type CoverageWaitlistFormProps = {
  area?: string;
};

export function CoverageWaitlistForm({ area = "" }: CoverageWaitlistFormProps) {
  const [location, setLocation] = React.useState(area);
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  const hasContact = Boolean(phone.trim() || email.trim());

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!location.trim() || !hasContact) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-2xl bg-secondary p-6" role="status" aria-live="polite">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-5 w-5" />
        </span>
        <p className="mt-4 text-lg font-semibold">You are on the list</p>
        <p className="mt-1 text-sm text-muted-foreground">
          We will reach out the moment Gawula launches in {location.trim()}.
        </p>
      </div>
    );
  }

  return (
    <form className="grid gap-3" onSubmit={submit}>
      <div className="grid gap-1.5">
        <label className="text-sm font-medium" htmlFor="waitlist-area">
          Your area
        </label>
        <input
          id="waitlist-area"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          className="h-12 rounded-xl border-0 bg-secondary px-4 text-base font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground focus:ring-2 focus:ring-foreground/40"
          placeholder="Suburb or neighbourhood"
          autoComplete="address-level2"
        />
      </div>

      <div className="grid gap-3">
        <div className="grid gap-1.5">
          <label className="text-sm font-medium" htmlFor="waitlist-phone">
            Phone number
          </label>
          <input
            id="waitlist-phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="h-12 rounded-xl border-0 bg-secondary px-4 text-base font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground focus:ring-2 focus:ring-foreground/40"
            autoComplete="tel"
            inputMode="tel"
          />
        </div>

        <div className="grid gap-1.5">
          <label className="text-sm font-medium" htmlFor="waitlist-email">
            Email
          </label>
          <input
            id="waitlist-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-12 rounded-xl border-0 bg-secondary px-4 text-base font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground focus:ring-2 focus:ring-foreground/40"
            autoComplete="email"
            inputMode="email"
          />
        </div>
      </div>

      <Button
        type="submit"
        variant="dark"
        size="lg"
        className="mt-1 w-full rounded-full"
        disabled={!location.trim() || !hasContact}
      >
        Notify me when you launch
      </Button>
    </form>
  );
}
