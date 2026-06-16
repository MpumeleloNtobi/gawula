"use client";

import * as React from "react";
import { LuCheck as Check } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";


type LaunchPartnerFormProps = {
  area?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE = /^\p{L}+(?:[ '-]\p{L}+)*$/u;
const FIELD_CLASS = "focus-visible:ring-foreground/40";

function isValidName(value: string) {
  const v = value.trim();
  return v.length >= 2 && NAME_RE.test(v);
}

function isValidEmail(value: string) {
  return EMAIL_RE.test(value.trim());
}

function isValidPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 12;
}

function extractSuburb(value: string) {
  const parts = value.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length > 1 && /^\d/.test(parts[0])) return parts[1];
  return parts[0] ?? value;
}

export function LaunchPartnerForm({ area = "" }: LaunchPartnerFormProps) {
  const [name, setName] = React.useState("");
  const [location, setLocation] = React.useState(() => extractSuburb(area));
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [partnerCode, setPartnerCode] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("gawula_partner");
      if (saved) {
        const { code, savedName, savedLocation } = JSON.parse(saved);
        setPartnerCode(code);
        setName(savedName);
        setLocation(extractSuburb(savedLocation));
        setSubmitted(true);
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  const reset = () => {
    localStorage.removeItem("gawula_partner");
    setSubmitted(false);
    setPartnerCode("");
    setName("");
    setLocation(area);
    setPhone("");
    setEmail("");
    setError("");
  };

  const copyCode = () => {
    navigator.clipboard.writeText(partnerCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isValidName(name)) {
      setError("Please enter your full name.");
      return;
    }
    if (!location.trim()) {
      setError("Let us know which area you cover.");
      return;
    }

    const hasPhone = phone.trim().length > 0;
    const hasEmail = email.trim().length > 0;
    if (!hasPhone && !hasEmail) {
      setError("Add a phone number or email so we can reach you.");
      return;
    }
    if (hasPhone && !isValidPhone(phone)) {
      setError("Enter a valid phone number.");
      return;
    }
    if (hasEmail && !isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setError("");
    const areaName = location.trim().replace(/\s+/g, "") || "Partner";
    const num = Math.floor(10 + Math.random() * 90);
    const code = `${areaName}${num}`;
    setPartnerCode(code);
    try {
      localStorage.setItem("gawula_partner", JSON.stringify({ code, savedName: name.trim(), savedLocation: location.trim() }));
    } catch {
      // storage unavailable
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div
        className="rounded-2xl bg-secondary p-6"
        role="status"
        aria-live="polite"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-5 w-5" />
        </span>
        <p className="mt-4 text-lg font-semibold">
          Thanks, {name.trim().split(" ")[0]}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          We will be in touch about becoming a launch partner in {location.trim()}.
        </p>
        <div className="mt-5 rounded-xl border border-border bg-background px-5 py-4">
          <p className="text-xs font-medium text-muted-foreground">Your partner code</p>
          <div className="mt-1 flex items-center justify-between gap-4">
            <p className="font-mono text-2xl font-semibold tracking-widest">{partnerCode}</p>
            <button
              type="button"
              onClick={copyCode}
              className="shrink-0 text-sm font-medium text-foreground opacity-60 hover:opacity-100"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Saved to this device. You will use it when signing stores up on Gawula.</p>
        </div>
        <button type="button" onClick={reset} className="mt-4 text-xs text-muted-foreground hover:text-foreground">
          Not you? Clear and start over
        </button>
      </div>
    );
  }

  return (
    <form className="grid gap-3" onSubmit={submit} noValidate>
      <div className="grid gap-1.5">
        <label className="text-sm font-medium" htmlFor="lp-name">
          Full name
        </label>
        <Input
          id="lp-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={FIELD_CLASS}
          autoComplete="name"
        />
      </div>

      <div className="grid gap-1.5">
        <label className="text-sm font-medium" htmlFor="lp-area">
          Your area
        </label>
        <Input
          id="lp-area"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          className={FIELD_CLASS}
          placeholder="Suburb or neighbourhood"
          autoComplete="address-level2"
        />
      </div>

      <div className="grid gap-3">
        <div className="grid gap-1.5">
          <label className="text-sm font-medium" htmlFor="lp-phone">
            Phone number
          </label>
          <Input
            id="lp-phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className={FIELD_CLASS}
            autoComplete="tel"
            inputMode="tel"
          />
        </div>

        <div className="grid gap-1.5">
          <label className="text-sm font-medium" htmlFor="lp-email">
            Email
          </label>
          <Input
            id="lp-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={FIELD_CLASS}
            autoComplete="email"
            inputMode="email"
          />
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        variant="dark"
        size="lg"
        className="mt-1 w-full rounded-full"
      >
        Submit
      </Button>
    </form>
  );
}
