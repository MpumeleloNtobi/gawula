"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

type CoverageWaitlistFormProps = {
  area?: string;
};

export function CoverageWaitlistForm({ area = "" }: CoverageWaitlistFormProps) {
  const [location, setLocation] = React.useState(area);
  const [contact, setContact] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!location.trim() || !contact.trim()) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-md rounded-2xl bg-secondary p-6">
        <p className="text-base font-semibold">You are on the list.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          We will message {contact.trim()} the moment Gawula launches in {location.trim()}.
        </p>
      </div>
    );
  }

  return (
    <form className="grid max-w-md gap-3" onSubmit={submit}>
      <label className="sr-only" htmlFor="waitlist-area">
        Your area
      </label>
      <input
        id="waitlist-area"
        value={location}
        onChange={(event) => setLocation(event.target.value)}
        className="h-12 rounded-lg border-0 bg-secondary px-4 text-base font-medium outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-foreground/20"
        placeholder="Your suburb or area"
        autoComplete="address-level2"
      />

      <label className="sr-only" htmlFor="waitlist-contact">
        Phone number or email
      </label>
      <input
        id="waitlist-contact"
        value={contact}
        onChange={(event) => setContact(event.target.value)}
        className="h-12 rounded-lg border-0 bg-secondary px-4 text-base font-medium outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-foreground/20"
        placeholder="Phone number or email"
        autoComplete="email"
        inputMode="email"
      />

      <Button
        type="submit"
        variant="dark"
        size="lg"
        className="rounded-full px-6"
        disabled={!location.trim() || !contact.trim()}
      >
        Notify me when you launch
      </Button>
    </form>
  );
}
