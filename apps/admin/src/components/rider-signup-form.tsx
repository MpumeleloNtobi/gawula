"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  RIDER_VEHICLES,
  RiderVehicle,
  useRiderApplication,
} from "@/lib/rider-application-store";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

type RiderSignupFormProps = {
  areas: { id: string; label: string }[];
};

const STEP_TITLES = [
  "Your details",
  "Where and how you'll ride",
  "Eligibility",
  "Review and submit",
];

const TOTAL_STEPS = STEP_TITLES.length;

const FIELD_CLASS =
  "h-12 w-full rounded-lg border-0 bg-secondary px-4 text-base font-medium text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-foreground/20";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NAME_RE = /^\p{L}+(?:[ '-]\p{L}+)*$/u;

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

export function RiderSignupForm({ areas }: RiderSignupFormProps) {
  const router = useRouter();
  const setApplication = useRiderApplication((s) => s.setApplication);
  const token = useAuth((s) => s.token);

  const [step, setStep] = React.useState(1);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [areaId, setAreaId] = React.useState("");
  const [areaOpen, setAreaOpen] = React.useState(false);
  const [vehicle, setVehicle] = React.useState<RiderVehicle | "">("");
  const [hasSmartphone, setHasSmartphone] = React.useState<boolean | null>(null);
  const [idNumber, setIdNumber] = React.useState("");
  const [idFrontDocName, setIdFrontDocName] = React.useState("");
  const [idBackDocName, setIdBackDocName] = React.useState("");
  const [selfieDocName, setSelfieDocName] = React.useState("");
  const [fullBodyDocName, setFullBodyDocName] = React.useState("");
  const [licenceDocName, setLicenceDocName] = React.useState("");

  const areaRef = React.useRef<HTMLDivElement>(null);

  const options = React.useMemo(
    () => [...areas, { id: "other", label: "My area is not listed" }],
    [areas]
  );
  const isLiveArea = areaId !== "" && areaId !== "other";
  const areaLabel = options.find((o) => o.id === areaId)?.label;
  const vehicleLabel = RIDER_VEHICLES.find((v) => v.id === vehicle)?.label;
  const requiresLicence = vehicle !== "" && vehicle !== "bicycle";

  React.useEffect(() => {
    if (!areaOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (areaRef.current && !areaRef.current.contains(event.target as Node)) {
        setAreaOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [areaOpen]);

  const clearError = (field: string) =>
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const liveError = (field: string, value: string): string | undefined => {
    const v = value.trim();
    switch (field) {
      case "firstName":
        return isValidName(value) ? undefined : "Enter your name as it appears on your ID";
      case "lastName":
        return isValidName(value) ? undefined : "Enter your surname as it appears on your ID";
      case "email":
        return !isValidEmail(value) ? "Enter a valid email address" : undefined;
      case "phone":
        return !isValidPhone(value) ? "Enter a valid phone number" : undefined;
      case "idNumber":
        return v.length < 6 ? "Enter your ID or passport number" : undefined;
      default:
        return undefined;
    }
  };

  const setFieldError = (field: string, value: string) =>
    setErrors((prev) => {
      const next = { ...prev };
      const msg = liveError(field, value);
      if (msg) next[field] = msg;
      else delete next[field];
      return next;
    });

  const handleChange =
    (field: string, setter: (value: string) => void) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setter(value);
      if (touched[field] || errors[field]) setFieldError(field, value);
    };

  const handleBlur =
    (field: string) => (event: React.FocusEvent<HTMLInputElement>) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      setFieldError(field, event.target.value);
    };

  const validateStep = (target: number) => {
    const next: Record<string, string> = {};
    if (target === 1) {
      if (!isValidName(firstName))
        next.firstName = "Enter your name as it appears on your ID";
      if (!isValidName(lastName))
        next.lastName = "Enter your surname as it appears on your ID";
      if (!isValidEmail(email))
        next.email = "Enter a valid email address";
      if (!isValidPhone(phone))
        next.phone = "Enter a valid phone number";
    }
    if (target === 2) {
      if (!areaId) next.area = "Choose where you would like to ride";
      if (!vehicle) next.vehicle = "Select the vehicle you will ride";
    }
    if (target === 3) {
      if (hasSmartphone === null)
        next.smartphone = "Let us know if you have your own smartphone";
      if (idNumber.trim().length < 6)
        next.idNumber = "Enter your ID or passport number";
      if (!idFrontDocName) next.idFront = "Capture the front of your ID";
      if (!idBackDocName) next.idBack = "Capture the back of your ID";
      if (!selfieDocName) next.selfie = "Capture a selfie of your face";
      if (!fullBodyDocName)
        next.fullBody = "Capture a full body photo of yourself";
      if (requiresLicence && !licenceDocName)
        next.licenceDoc = "Upload your driver's licence for this vehicle";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const isStepComplete = (target: number) => {
    if (target === 1)
      return (
        isValidName(firstName) &&
        isValidName(lastName) &&
        isValidEmail(email) &&
        isValidPhone(phone)
      );
    if (target === 2) return !!areaId && !!vehicle;
    if (target === 3)
      return (
        hasSmartphone !== null &&
        idNumber.trim().length >= 6 &&
        !!idFrontDocName &&
        !!idBackDocName &&
        !!selfieDocName &&
        !!fullBodyDocName &&
        (!requiresLicence || !!licenceDocName)
      );
    return true;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const goBack = () => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 1));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step < TOTAL_STEPS) {
      goNext();
      return;
    }
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;
    if (submitting) return;
    if (!token) {
      router.push("/login?next=/riders");
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    const waitlisted = !isLiveArea;
    try {
      const result = await api<{ id: string; stage: string; waitlisted: boolean }>(
        "/riders/applications",
        {
          method: "POST",
          token,
          body: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            areaId,
            areaLabel: areaLabel ?? "",
            waitlisted,
            vehicleType: vehicle,
            hasSmartphone: hasSmartphone === true,
            idNumber: idNumber.trim(),
            idFrontDocName: idFrontDocName || undefined,
            idBackDocName: idBackDocName || undefined,
            selfieDocName: selfieDocName || undefined,
            fullBodyDocName: fullBodyDocName || undefined,
            licenceDocName: requiresLicence ? licenceDocName || undefined : undefined,
          },
        }
      );
      setApplication({
        applicationId: result.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        areaId,
        areaLabel: areaLabel ?? "",
        waitlisted,
        vehicle: vehicle as RiderVehicle,
        hasSmartphone: hasSmartphone === true,
        idNumber: idNumber.trim(),
        idFrontDocName: idFrontDocName || undefined,
        idBackDocName: idBackDocName || undefined,
        selfieDocName: selfieDocName || undefined,
        fullBodyDocName: fullBodyDocName || undefined,
        licenceDocName: requiresLicence ? licenceDocName || undefined : undefined,
        submittedAt: Date.now(),
        stage: "submitted",
      });
      router.push("/riders/application");
    } catch (err) {
      setSubmitError(
        err instanceof ApiError
          ? err.message
          : "We could not submit your application. Please try again."
      );
      setSubmitting(false);
    }
  };

  return (
    <form className="max-w-lg" onSubmit={submit} noValidate>
      <div aria-hidden className="flex gap-1.5">
        {STEP_TITLES.map((title, i) => (
          <span
            key={title}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i < step ? "bg-foreground" : "bg-border"
            )}
          />
        ))}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Step {step} of {TOTAL_STEPS}
      </p>
      <h2 className="mt-1 text-xl font-semibold tracking-tight">
        {STEP_TITLES[step - 1]}
      </h2>

      <div className="mt-6 grid gap-5">
        {step === 1 ? (
          <>
            <div className="grid gap-5">
              <Field id="rider-first-name" label="Name" error={errors.firstName}>
                <input
                  id="rider-first-name"
                  value={firstName}
                  onChange={handleChange("firstName", setFirstName)}
                  onBlur={handleBlur("firstName")}
                  placeholder="As shown on your ID"
                  autoComplete="given-name"
                  aria-invalid={!!errors.firstName}
                  aria-describedby={
                    errors.firstName ? "rider-first-name-error" : undefined
                  }
                  className={FIELD_CLASS}
                />
              </Field>
              <Field id="rider-last-name" label="Surname" error={errors.lastName}>
                <input
                  id="rider-last-name"
                  value={lastName}
                  onChange={handleChange("lastName", setLastName)}
                  onBlur={handleBlur("lastName")}
                  placeholder="As shown on your ID"
                  autoComplete="family-name"
                  aria-invalid={!!errors.lastName}
                  aria-describedby={
                    errors.lastName ? "rider-last-name-error" : undefined
                  }
                  className={FIELD_CLASS}
                />
              </Field>
            </div>
            <Field id="rider-email" label="Email" error={errors.email}>
              <input
                id="rider-email"
                type="email"
                value={email}
                onChange={handleChange("email", setEmail)}
                onBlur={handleBlur("email")}
                placeholder="you@example.com"
                autoComplete="email"
                inputMode="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "rider-email-error" : undefined}
                className={FIELD_CLASS}
              />
            </Field>
            <Field id="rider-phone" label="Phone number" error={errors.phone}>
              <input
                id="rider-phone"
                type="tel"
                value={phone}
                onChange={handleChange("phone", setPhone)}
                onBlur={handleBlur("phone")}
                placeholder="082 123 4567"
                autoComplete="tel"
                inputMode="tel"
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "rider-phone-error" : undefined}
                className={FIELD_CLASS}
              />
            </Field>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Field
              id="rider-area-trigger"
              label="Where?"
              error={errors.area}
            >
              <div className="relative" ref={areaRef}>
                <button
                  id="rider-area-trigger"
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={areaOpen}
                  aria-invalid={!!errors.area}
                  onClick={() => setAreaOpen((open) => !open)}
                  className={cn(
                    "flex h-12 w-full items-center justify-between rounded-lg border-0 bg-secondary px-4 text-base font-medium outline-none transition-colors focus:ring-2 focus:ring-foreground/20",
                    !areaId && "text-muted-foreground"
                  )}
                >
                  <span>{areaLabel ?? "Choose your area"}</span>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                      areaOpen && "rotate-180"
                    )}
                  />
                </button>
                {areaOpen ? (
                  <ul
                    role="listbox"
                    className="absolute left-0 right-0 top-full z-30 mt-2 max-h-64 overflow-y-auto rounded-xl border bg-popover py-1 shadow-xl"
                  >
                    {options.map((option) => (
                      <li key={option.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={areaId === option.id}
                          onClick={() => {
                            setAreaId(option.id);
                            setAreaOpen(false);
                            clearError("area");
                          }}
                          className={cn(
                            "flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-accent",
                            areaId === option.id && "font-medium"
                          )}
                        >
                          {option.label}
                          {areaId === option.id ? (
                            <Check className="h-4 w-4 text-primary" />
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </Field>

            {areaId === "other" ? (
              <p className="-mt-2 text-sm text-muted-foreground">
                Gawula is not live there yet. Finish your application and we will
                let you know the moment we arrive.
              </p>
            ) : null}

            <fieldset>
              <legend className="text-sm font-medium">
                How?
              </legend>
              <div className="mt-2 grid gap-0.5">
                {RIDER_VEHICLES.map((option) => (
                  <label
                    key={option.id}
                    className="flex h-12 cursor-pointer items-center gap-3 rounded-lg text-base font-medium"
                  >
                    <input
                      type="radio"
                      name="vehicle"
                      value={option.id}
                      checked={vehicle === option.id}
                      onChange={() => {
                        setVehicle(option.id);
                        clearError("vehicle");
                      }}
                      className="h-4 w-4 accent-foreground"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              {errors.vehicle ? (
                <p className="mt-2 text-sm text-destructive">{errors.vehicle}</p>
              ) : null}
            </fieldset>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <fieldset>
              <legend className="text-sm font-medium">
                Do you have your own smartphone?
              </legend>
              <div className="mt-2 grid gap-0.5">
                {[
                  { value: true, label: "Yes" },
                  { value: false, label: "No" },
                ].map((option) => (
                  <label
                    key={option.label}
                    className="flex h-12 cursor-pointer items-center gap-3 rounded-lg text-base font-medium"
                  >
                    <input
                      type="radio"
                      name="smartphone"
                      checked={hasSmartphone === option.value}
                      onChange={() => {
                        setHasSmartphone(option.value);
                        clearError("smartphone");
                      }}
                      className="h-4 w-4 accent-foreground"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              {errors.smartphone ? (
                <p className="mt-2 text-sm text-destructive">
                  {errors.smartphone}
                </p>
              ) : null}
              {hasSmartphone === false ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  You will need a smartphone to accept and navigate trips. You
                  can still apply and sort one out before you start.
                </p>
              ) : null}
            </fieldset>

            <Field
              id="rider-id"
              label="ID or passport number"
              error={errors.idNumber}
            >
              <input
                id="rider-id"
                value={idNumber}
                onChange={handleChange("idNumber", setIdNumber)}
                onBlur={handleBlur("idNumber")}
                placeholder="Confirms your right to work"
                aria-invalid={!!errors.idNumber}
                aria-describedby={
                  errors.idNumber ? "rider-id-error" : undefined
                }
                className={FIELD_CLASS}
              />
            </Field>

            <div className="grid gap-2.5">
              <p className="text-sm font-medium">Verify it's you</p>
              <FileField
                id="rider-doc-id-front"
                label="Front of your ID"
                fileName={idFrontDocName}
                error={errors.idFront}
                capture="environment"
                onSelect={(name) => {
                  setIdFrontDocName(name);
                  clearError("idFront");
                }}
                onClear={() => setIdFrontDocName("")}
              />
              <FileField
                id="rider-doc-id-back"
                label="Back of your ID"
                fileName={idBackDocName}
                error={errors.idBack}
                capture="environment"
                onSelect={(name) => {
                  setIdBackDocName(name);
                  clearError("idBack");
                }}
                onClear={() => setIdBackDocName("")}
              />
              <FileField
                id="rider-doc-selfie"
                label="Selfie of your face"
                fileName={selfieDocName}
                error={errors.selfie}
                capture="user"
                onSelect={(name) => {
                  setSelfieDocName(name);
                  clearError("selfie");
                }}
                onClear={() => setSelfieDocName("")}
              />
              <FileField
                id="rider-doc-full-body"
                label="Full body photo"
                fileName={fullBodyDocName}
                error={errors.fullBody}
                capture="user"
                onSelect={(name) => {
                  setFullBodyDocName(name);
                  clearError("fullBody");
                }}
                onClear={() => setFullBodyDocName("")}
              />
              {requiresLicence ? (
                <FileField
                  id="rider-doc-licence"
                  label="Driver's licence"
                  fileName={licenceDocName}
                  error={errors.licenceDoc}
                  onSelect={(name) => {
                    setLicenceDocName(name);
                    clearError("licenceDoc");
                  }}
                  onClear={() => setLicenceDocName("")}
                />
              ) : null}
              <p className="text-sm text-muted-foreground">
                {requiresLicence
                  ? "Use your camera or upload clear photos. A licence is required for your chosen vehicle."
                  : "Use your camera or upload clear photos so we can verify you faster."}
              </p>
            </div>
          </>
        ) : null}

        {step === 4 ? (
          <div className="grid gap-3">
            {!isLiveArea ? (
              <div className="rounded-lg bg-secondary p-4 text-sm text-muted-foreground">
                Gawula is not live in your area yet. We will add you to the
                waiting list and message you the moment we go live near you.
              </div>
            ) : null}
            <dl className="divide-y divide-background rounded-lg bg-secondary">
              <SummaryRow
                label="Name"
                value={`${firstName.trim()} ${lastName.trim()}`.trim()}
              />
              <SummaryRow label="Email" value={email.trim()} />
              <SummaryRow label="Phone" value={phone.trim()} />
              <SummaryRow
                label="Area"
                value={areaLabel ?? ""}
              />
              <SummaryRow label="Vehicle" value={vehicleLabel ?? ""} />
              <SummaryRow
                label="Own smartphone"
                value={hasSmartphone ? "Yes" : "No"}
              />
              <SummaryRow label="ID / passport" value={idNumber.trim()} />
              <SummaryRow
                label="Front of ID"
                value={idFrontDocName || "Not captured"}
              />
              <SummaryRow
                label="Back of ID"
                value={idBackDocName || "Not captured"}
              />
              <SummaryRow
                label="Selfie"
                value={selfieDocName || "Not captured"}
              />
              <SummaryRow
                label="Full body photo"
                value={fullBodyDocName || "Not captured"}
              />
              {requiresLicence ? (
                <SummaryRow
                  label="Driver's licence"
                  value={licenceDocName || "Not uploaded"}
                />
              ) : null}
            </dl>
          </div>
        ) : null}
      </div>

      <div className="mt-8 flex items-center gap-3">
        {step > 1 ? (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="flex-1"
            onClick={goBack}
            disabled={submitting}
          >
            Back
          </Button>
        ) : null}
        <Button
          type="submit"
          variant="dark"
          size="lg"
          className="flex-1"
          disabled={!isStepComplete(step) || submitting}
        >
          {step === TOTAL_STEPS
            ? submitting
              ? "Submitting…"
              : "Submit application"
            : "Continue"}
        </Button>
      </div>
      {submitError ? (
        <p className="mt-3 text-sm text-destructive">{submitError}</p>
      ) : null}
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function FileField({
  id,
  label,
  fileName,
  error,
  capture,
  onSelect,
  onClear,
}: {
  id: string;
  label: string;
  fileName: string;
  error?: string;
  capture?: "user" | "environment";
  onSelect: (name: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-3 rounded-lg bg-secondary px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          <p className="truncate text-sm text-muted-foreground">
            {fileName || "No file selected"}
          </p>
        </div>
        {fileName ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
            Remove
          </button>
        ) : (
          <label
            htmlFor={id}
            className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-foreground"
          >
            <Upload className="h-4 w-4" />
            {capture ? "Capture" : "Upload"}
            <input
              id={id}
              type="file"
              accept={capture ? "image/*" : "image/*,application/pdf"}
              capture={capture}
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onSelect(file.name);
              }}
            />
          </label>
        )}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-sm font-medium">{value}</dd>
    </div>
  );
}
