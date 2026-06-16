"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LuCamera as Camera, LuFileText as FileText, LuX as X } from "react-icons/lu";
import { LuImagePlus as ImagePlus, LuRefreshCw as RefreshCw } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { LoadingDots } from "@/components/ui/loading-dots";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { LogoCropper } from "@/components/logo-cropper";
import { api, ApiError } from "@/lib/api";
import {
  TRADE_TYPES,
  usePartnerApplication,
} from "@/lib/partner-application-store";
import { cn } from "@/lib/utils";

type PartnerSignupFormProps = {
  areas: { id: string; label: string }[];
};

const STEP_TITLES = [
  "Your store",
  "Where you trade",
  "Contact person",
  "Business and documents",
];

const TOTAL_STEPS = STEP_TITLES.length;

const FIELD_CLASS =
  "h-12 w-full rounded-lg border-0 bg-secondary px-4 text-base font-medium text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-foreground/20";

const TEXTAREA_CLASS =
  "min-h-[104px] w-full resize-none overflow-y-hidden rounded-lg border-0 bg-secondary px-4 py-3 text-base font-medium text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-foreground/20";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NAME_RE = /^\p{L}+(?:[ '-]\p{L}+)*$/u;

function isValidName(value: string) {
  const v = value.trim();
  return v.length >= 2 && NAME_RE.test(v);
}

function isValidStoreName(value: string) {
  return value.trim().length >= 2;
}

function isValidEmail(value: string) {
  return EMAIL_RE.test(value.trim());
}

function isValidPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 12;
}

export function PartnerSignupForm({ areas }: PartnerSignupFormProps) {
  const router = useRouter();
  const setApplication = usePartnerApplication((s) => s.setApplication);

  const [step, setStep] = React.useState(1);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState("");

  const [storeName, setStoreName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [logoDocName, setLogoDocName] = React.useState("");
  const [tradeType, setTradeType] = React.useState("");
  const [locationName, setLocationName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [areaId, setAreaId] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [contactEmail, setContactEmail] = React.useState("");
  const [contactPhone, setContactPhone] = React.useState("");
  const [soleProprietor, setSoleProprietor] = React.useState<boolean | null>(
    null
  );
  const [registrationNumber, setRegistrationNumber] = React.useState("");
  const [registrationDocName, setRegistrationDocName] = React.useState("");
  const [storefrontDocName, setStorefrontDocName] = React.useState("");
  const [logoData, setLogoData] = React.useState("");
  const [registrationData, setRegistrationData] = React.useState("");
  const [storefrontData, setStorefrontData] = React.useState("");

  const areaOptions = React.useMemo(
    () => [...areas, { id: "other", label: "My area is not listed" }],
    [areas]
  );
  const isLiveArea = areaId !== "" && areaId !== "other";
  const areaLabel = areaOptions.find((o) => o.id === areaId)?.label;
  const inferAreaFromAddress = React.useCallback(
    (description: string) => {
      const hay = description.toLowerCase();
      const match = areas.find((a) => hay.includes(a.label.toLowerCase()));
      setAreaId(match ? match.id : "other");
    },
    [areas]
  );
  const tradeTypeLabel = TRADE_TYPES.find((t) => t.id === tradeType)?.label;
  const requiresLocationName = tradeType === "mall" || tradeType === "complex";
  const showsLocationName = requiresLocationName || tradeType === "strip";
  const locationNameLabel =
    tradeType === "complex"
      ? "Complex name"
      : tradeType === "strip"
        ? "Block name (optional)"
        : "Mall name";
  const registered = soleProprietor === false;

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
      case "storeName":
        return isValidStoreName(value)
          ? undefined
          : "Enter your store name";
      case "description":
        return v.length < 10
          ? "Add a short description of your store"
          : undefined;
      case "address":
        return v.length < 5 ? "Enter your trading address" : undefined;
      case "locationName":
        return requiresLocationName && v.length < 2
          ? `Enter the ${tradeType === "complex" ? "complex" : "mall"} name`
          : undefined;
      case "firstName":
        return isValidName(value)
          ? undefined
          : "Enter your name as it appears on your ID";
      case "lastName":
        return isValidName(value)
          ? undefined
          : "Enter your surname as it appears on your ID";
      case "email":
        return value.trim() && !isValidEmail(value)
          ? "Enter a valid email address"
          : undefined;
      case "phone":
        return value.trim() && !isValidPhone(value)
          ? "Enter a valid phone number"
          : undefined;
      case "contactEmail":
        if (!v) return "Enter the contact person's email";
        return isValidEmail(value) ? undefined : "Enter a valid email address";
      case "contactPhone":
        if (!v) return "Enter the contact person's phone number";
        return isValidPhone(value) ? undefined : "Enter a valid phone number";
      case "registrationNumber":
        return v.length < 4
          ? "Enter your business registration number"
          : undefined;
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
      if (!isValidStoreName(storeName)) next.storeName = "Enter your store name";
      if (description.trim().length < 10)
        next.description = "Add a short description of your store";
      if (!logoDocName) next.logo = "Upload your store logo";
      if (email.trim() && !isValidEmail(email))
        next.email = "Enter a valid email address";
      if (phone.trim() && !isValidPhone(phone))
        next.phone = "Enter a valid phone number";
    }
    if (target === 2) {
      if (!tradeType) next.tradeType = "Choose what kind of location you trade from";
      if (requiresLocationName && locationName.trim().length < 2)
        next.locationName = `Enter the ${tradeType === "complex" ? "complex" : "mall"} name`;
      if (!areaId) next.area = "Pick your trading address from the suggestions";
      if (address.trim().length < 5) next.address = "Enter your trading address";
    }
    if (target === 3) {
      if (!isValidName(firstName))
        next.firstName = "Enter your name as it appears on your ID";
      if (!isValidName(lastName))
        next.lastName = "Enter your surname as it appears on your ID";
      if (!contactEmail.trim())
        next.contactEmail = "Enter the contact person's email";
      else if (!isValidEmail(contactEmail))
        next.contactEmail = "Enter a valid email address";
      if (!contactPhone.trim())
        next.contactPhone = "Enter the contact person's phone number";
      else if (!isValidPhone(contactPhone))
        next.contactPhone = "Enter a valid phone number";
    }
    if (target === 4) {
      if (soleProprietor === null)
        next.soleProprietor = "Let us know how your store is registered";
      if (registered && registrationNumber.trim().length < 4)
        next.registrationNumber = "Enter your business registration number";
      if (registered && !registrationDocName)
        next.registrationDoc = "Upload your business registration document";
      if (!storefrontDocName)
        next.storefrontDoc = "Add a photo of your storefront";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const isStepComplete = (target: number) => {
    if (target === 1)
      return (
        isValidStoreName(storeName) &&
        description.trim().length >= 10 &&
        !!logoDocName &&
        (email.trim() === "" || isValidEmail(email)) &&
        (phone.trim() === "" || isValidPhone(phone))
      );
    if (target === 2)
      return (
        !!tradeType &&
        (!requiresLocationName || locationName.trim().length >= 2) &&
        !!areaId &&
        address.trim().length >= 5
      );
    if (target === 3)
      return (
        isValidName(firstName) &&
        isValidName(lastName) &&
        isValidEmail(contactEmail) &&
        isValidPhone(contactPhone)
      );
    if (target === 4)
      return (
        soleProprietor !== null &&
        (!registered || registrationNumber.trim().length >= 4) &&
        (!registered || !!registrationDocName) &&
        !!storefrontDocName
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
    if (
      !validateStep(1) ||
      !validateStep(2) ||
      !validateStep(3) ||
      !validateStep(4)
    )
      return;
    if (submitting) return;
    setSubmitError("");
    setSubmitting(true);

    const waitlisted = !isLiveArea;
    const locationNameValue = showsLocationName
      ? locationName.trim() || undefined
      : undefined;
    const registrationNumberValue = registered
      ? registrationNumber.trim() || undefined
      : undefined;
    const registrationDocNameValue = registered
      ? registrationDocName || undefined
      : undefined;

    try {
      const result = await api<{ id: string }>("/partners/applications", {
        method: "POST",
        body: {
          storeName: storeName.trim(),
          description: description.trim(),
          logoDocName: logoDocName || undefined,
          tradeType,
          tradeTypeLabel: tradeTypeLabel ?? "",
          locationName: locationNameValue,
          address: address.trim(),
          areaId,
          areaLabel: areaLabel ?? "",
          waitlisted,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          storeEmail: email.trim() || undefined,
          storePhone: phone.trim() || undefined,
          contactEmail: contactEmail.trim(),
          contactPhone: contactPhone.trim(),
          soleProprietor: soleProprietor === true,
          registrationNumber: registrationNumberValue,
          registrationDocName: registrationDocNameValue,
          storefrontDocName: storefrontDocName || undefined,
          logoData: logoData || undefined,
          registrationData: registered ? registrationData || undefined : undefined,
          storefrontData: storefrontData || undefined,
        },
      });

      setApplication({
        id: result.id,
        storeName: storeName.trim(),
        description: description.trim(),
        logoDocName: logoDocName || undefined,
        tradeType,
        tradeTypeLabel: tradeTypeLabel ?? "",
        locationName: locationNameValue,
        address: address.trim(),
        areaId,
        areaLabel: areaLabel ?? "",
        waitlisted,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        contactEmailVerified: false,
        soleProprietor: soleProprietor === true,
        registrationNumber: registrationNumberValue,
        registrationDocName: registrationDocNameValue,
        storefrontDocName: storefrontDocName || undefined,
        submittedAt: Date.now(),
        stage: "submitted",
      });
      router.push("/partners/application");
    } catch (error) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
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
            <Field id="store-name" label="Store name" error={errors.storeName}>
              <input
                id="store-name"
                name="store-name"
                value={storeName}
                onChange={handleChange("storeName", setStoreName)}
                onBlur={handleBlur("storeName")}
                autoComplete="on"
                aria-invalid={!!errors.storeName}
                aria-describedby={
                  errors.storeName ? "store-name-error" : undefined
                }
                className={FIELD_CLASS}
              />
            </Field>

            <Field
              id="store-description"
              label="Store description"
              error={errors.description}
            >
              <textarea
                id="store-description"
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                  if (touched.description || errors.description)
                    setFieldError("description", event.target.value);
                }}
                onBlur={(event) => {
                  setTouched((prev) => ({ ...prev, description: true }));
                  setFieldError("description", event.target.value);
                }}
                aria-invalid={!!errors.description}
                aria-describedby={
                  errors.description ? "store-description-error" : undefined
                }
                className={TEXTAREA_CLASS}
              />
            </Field>

            <Field id="partner-email" label="Store email (optional)" error={errors.email}>
              <input
                id="partner-email"
                type="email"
                value={email}
                onChange={handleChange("email", setEmail)}
                onBlur={handleBlur("email")}
                autoComplete="email"
                inputMode="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "partner-email-error" : undefined}
                className={FIELD_CLASS}
              />
            </Field>
            <Field id="partner-phone" label="Store phone number (optional)" error={errors.phone}>
              <input
                id="partner-phone"
                type="tel"
                value={phone}
                onChange={handleChange("phone", setPhone)}
                onBlur={handleBlur("phone")}
                autoComplete="tel"
                inputMode="tel"
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "partner-phone-error" : undefined}
                className={FIELD_CLASS}
              />
            </Field>

            <div className="grid gap-2.5">
              <p className="text-sm font-medium">Store logo</p>
              <FileField
                id="store-logo"
                label="Logo"
                fileName={logoDocName}
                error={errors.logo}
                shape="logo"
                onSelect={(name, dataUrl) => {
                  setLogoDocName(name);
                  setLogoData(dataUrl ?? "");
                  clearError("logo");
                }}
                onClear={() => {
                  setLogoDocName("");
                  setLogoData("");
                }}
              />
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <fieldset>
              <legend className="text-sm font-medium">
                What kind of location?
              </legend>
              <div className="mt-2 grid gap-0.5">
                {TRADE_TYPES.map((option) => (
                  <label
                    key={option.id}
                    className="flex h-12 cursor-pointer items-center gap-3 rounded-lg text-base font-medium"
                  >
                    <input
                      type="radio"
                      name="tradeType"
                      value={option.id}
                      checked={tradeType === option.id}
                      onChange={() => {
                        setTradeType(option.id);
                        clearError("tradeType");
                        clearError("locationName");
                      }}
                      className="h-4 w-4 accent-foreground"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              {errors.tradeType ? (
                <p className="mt-2 text-sm text-destructive">
                  {errors.tradeType}
                </p>
              ) : null}
            </fieldset>
            {showsLocationName ? (
              <Field
                id="store-location-name"
                label={locationNameLabel}
                error={errors.locationName}
              >
                <input
                  id="store-location-name"
                  name="store-location-name"
                  value={locationName}
                  onChange={handleChange("locationName", setLocationName)}
                  onBlur={handleBlur("locationName")}
                  autoComplete="on"
                  aria-invalid={!!errors.locationName}
                  aria-describedby={
                    errors.locationName ? "store-location-name-error" : undefined
                  }
                  className={FIELD_CLASS}
                />
              </Field>
            ) : null}
            <Field
              id="store-address"
              label="Trading address"
              error={errors.address}
            >
              <AddressAutocomplete
                id="store-address"
                value={address}
                onValueChange={(v) => {
                  setAddress(v);
                  if (touched.address || errors.address)
                    setFieldError("address", v);
                }}
                onSelect={(v) => {
                  inferAreaFromAddress(v);
                  clearError("area");
                }}
                onBlur={handleBlur("address")}
                invalid={!!errors.address}
                describedby={
                  errors.address ? "store-address-error" : undefined
                }
                className={FIELD_CLASS}
              />
            </Field>
            {isLiveArea ? (
              <p className="-mt-2 text-sm text-muted-foreground">
                We will serve this address from {areaLabel}.
              </p>
            ) : null}
            {areaId === "other" ? (
              <p className="-mt-2 text-sm text-muted-foreground">
                Exciting news, you could be the very first store to bring Gawula
                to this area. Finish your application and our team will be in
                contact soon to get you setup and ready to take orders.
              </p>
            ) : null}
            {errors.area ? (
              <p className="-mt-2 text-sm text-destructive">{errors.area}</p>
            ) : null}
          </>
        ) : null}

        {step === 3 ? (
          <>
            <div className="grid gap-5">
              <Field id="partner-first-name" label="Name" error={errors.firstName}>
                <input
                  id="partner-first-name"
                  name="partner-first-name"
                  value={firstName}
                  onChange={handleChange("firstName", setFirstName)}
                  onBlur={handleBlur("firstName")}
                  placeholder="As shown on your ID"
                  autoComplete="on"
                  aria-invalid={!!errors.firstName}
                  aria-describedby={
                    errors.firstName ? "partner-first-name-error" : undefined
                  }
                  className={FIELD_CLASS}
                />
              </Field>
              <Field
                id="partner-last-name"
                label="Surname"
                error={errors.lastName}
              >
                <input
                  id="partner-last-name"
                  name="partner-last-name"
                  value={lastName}
                  onChange={handleChange("lastName", setLastName)}
                  onBlur={handleBlur("lastName")}
                  placeholder="As shown on your ID"
                  autoComplete="on"
                  aria-invalid={!!errors.lastName}
                  aria-describedby={
                    errors.lastName ? "partner-last-name-error" : undefined
                  }
                  className={FIELD_CLASS}
                />
              </Field>
              <Field
                id="contact-email"
                label="Email"
                error={errors.contactEmail}
              >
                <input
                  id="contact-email"
                  name="contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={handleChange("contactEmail", setContactEmail)}
                  onBlur={handleBlur("contactEmail")}
                  autoComplete="on"
                  inputMode="email"
                  aria-invalid={!!errors.contactEmail}
                  aria-describedby={
                    errors.contactEmail ? "contact-email-error" : undefined
                  }
                  className={FIELD_CLASS}
                />
              </Field>
              <Field
                id="contact-phone"
                label="Phone number"
                error={errors.contactPhone}
              >
                <input
                  id="contact-phone"
                  name="contact-phone"
                  type="tel"
                  value={contactPhone}
                  onChange={handleChange("contactPhone", setContactPhone)}
                  onBlur={handleBlur("contactPhone")}
                  autoComplete="on"
                  inputMode="tel"
                  aria-invalid={!!errors.contactPhone}
                  aria-describedby={
                    errors.contactPhone ? "contact-phone-error" : undefined
                  }
                  className={FIELD_CLASS}
                />
              </Field>
            </div>
          </>
        ) : null}

        {step === 4 ? (
          <>
            {!isLiveArea ? (
              <div className="rounded-xl bg-secondary p-4 text-sm leading-relaxed text-muted-foreground">
                You are getting in early, and that is a great thing. As the first
                store to bring Gawula to your area, you will have a head start.
                We will be in contact soon to get you setup, so you are ready to
                take orders the moment we go live.
              </div>
            ) : null}
            <fieldset>
              <legend className="text-sm font-medium">
                How is your store registered?
              </legend>
              <div className="mt-2 grid gap-0.5">
                {[
                  {
                    value: true,
                    label: "Sole proprietor",
                    description:
                      "You trade as yourself, with no separate company registered at CIPC.",
                  },
                  {
                    value: false,
                    label: "Registered business",
                    description:
                      "Your store is a registered company (Pty Ltd, CC) with its own registration number.",
                  },
                ].map((option) => (
                  <label
                    key={option.label}
                    className="flex cursor-pointer items-start gap-3 rounded-lg py-2 text-base font-medium"
                  >
                    <input
                      type="radio"
                      name="registration"
                      checked={soleProprietor === option.value}
                      onChange={() => {
                        setSoleProprietor(option.value);
                        clearError("soleProprietor");
                      }}
                      className="mt-1 h-4 w-4 accent-foreground"
                    />
                    <span className="grid gap-0.5">
                      {option.label}
                      <span className="text-sm font-normal text-muted-foreground">
                        {option.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              {errors.soleProprietor ? (
                <p className="mt-2 text-sm text-destructive">
                  {errors.soleProprietor}
                </p>
              ) : null}
            </fieldset>

            {registered ? (
              <Field
                id="partner-reg-number"
                label="Business registration number"
                error={errors.registrationNumber}
              >
                <input
                  id="partner-reg-number"
                  value={registrationNumber}
                  onChange={handleChange(
                    "registrationNumber",
                    setRegistrationNumber
                  )}
                  onBlur={handleBlur("registrationNumber")}
                  placeholder="CIPC or company number"
                  aria-invalid={!!errors.registrationNumber}
                  aria-describedby={
                    errors.registrationNumber
                      ? "partner-reg-number-error"
                      : undefined
                  }
                  className={FIELD_CLASS}
                />
              </Field>
            ) : null}

            <div className="grid gap-2.5">
              <p className="text-sm font-medium">Documents</p>
              {registered ? (
                <FileField
                  id="partner-doc-registration"
                  label="Business registration"
                  fileName={registrationDocName}
                  error={errors.registrationDoc}
                  onSelect={(name, dataUrl) => {
                    setRegistrationDocName(name);
                    setRegistrationData(dataUrl ?? "");
                    clearError("registrationDoc");
                  }}
                  onClear={() => {
                    setRegistrationDocName("");
                    setRegistrationData("");
                  }}
                />
              ) : null}
              <FileField
                id="partner-doc-storefront"
                label="Storefront photo"
                fileName={storefrontDocName}
                error={errors.storefrontDoc}
                capture="environment"
                shape="cover"
                onSelect={(name, dataUrl) => {
                  setStorefrontDocName(name);
                  setStorefrontData(dataUrl ?? "");
                  clearError("storefrontDoc");
                }}
                onClear={() => {
                  setStorefrontDocName("");
                  setStorefrontData("");
                }}
              />
              <p className="text-sm text-muted-foreground">
                Upload clear files or photos so our team can set you up faster.
              </p>
            </div>
          </>
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
          {step === TOTAL_STEPS ? (
            submitting ? (
              <span className="inline-flex items-center gap-2">
                Submitting
                <LoadingDots />
              </span>
            ) : (
              "Submit application"
            )
          ) : (
            "Continue"
          )}
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

async function imageFileToDataUrl(file: File, maxDim = 1600, quality = 0.82): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not load image"));
      el.src = objectUrl;
    });
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unsupported");
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function readFileAsDataUrl(file: File, onSelect: (name: string, dataUrl?: string) => void) {
  const reader = new FileReader();
  reader.onload = () =>
    onSelect(file.name, typeof reader.result === "string" ? reader.result : undefined);
  reader.onerror = () => onSelect(file.name);
  reader.readAsDataURL(file);
}

function FileField({
  id,
  label,
  fileName,
  error,
  capture,
  shape,
  onSelect,
  onClear,
}: {
  id: string;
  label: string;
  fileName: string;
  error?: string;
  capture?: "user" | "environment";
  shape?: "logo" | "cover";
  onSelect: (name: string, dataUrl?: string) => void;
  onClear: () => void;
}) {
  const [preview, setPreview] = React.useState("");
  const [dragging, setDragging] = React.useState(false);
  const [cropSrc, setCropSrc] = React.useState("");
  const previewRef = React.useRef("");
  const cropUrlRef = React.useRef("");
  const pendingNameRef = React.useRef("");

  React.useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      if (cropUrlRef.current) URL.revokeObjectURL(cropUrlRef.current);
    },
    [],
  );

  const setPreviewUrl = (url: string) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = url;
    setPreview(url);
  };

  const handleFile = (file: File) => {
    if (shape === "logo" && file.type.startsWith("image/")) {
      if (cropUrlRef.current) URL.revokeObjectURL(cropUrlRef.current);
      cropUrlRef.current = URL.createObjectURL(file);
      pendingNameRef.current = file.name;
      setCropSrc(cropUrlRef.current);
      return;
    }
    setPreviewUrl(file.type.startsWith("image/") ? URL.createObjectURL(file) : "");
    if (file.type.startsWith("image/")) {
      imageFileToDataUrl(file)
        .then((dataUrl) => onSelect(file.name, dataUrl))
        .catch(() => readFileAsDataUrl(file, onSelect));
      return;
    }
    readFileAsDataUrl(file, onSelect);
  };

  const handleCropConfirm = (dataUrl: string) => {
    if (cropUrlRef.current) {
      URL.revokeObjectURL(cropUrlRef.current);
      cropUrlRef.current = "";
    }
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = "";
    }
    setPreview(dataUrl);
    onSelect(pendingNameRef.current, dataUrl);
    setCropSrc("");
  };

  const handleCropCancel = () => {
    if (cropUrlRef.current) {
      URL.revokeObjectURL(cropUrlRef.current);
      cropUrlRef.current = "";
    }
    setCropSrc("");
  };

  const handleClear = () => {
    setPreviewUrl("");
    onClear();
  };

  const acceptAttr =
    capture || shape === "logo" ? "image/*" : "image/*,application/pdf";
  const hint = capture || shape === "logo" ? "PNG or JPG" : "PNG, JPG or PDF";
  const framingHint =
    shape === "logo"
      ? "Square image works best"
      : shape === "cover"
        ? "Landscape image works best"
        : "";
  const hasFile = !!fileName;

  const replaceLabel = (
    <label
      htmlFor={id}
      className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-foreground/70"
    >
      <RefreshCw className="h-4 w-4" />
      Replace
      <input
        id={id}
        type="file"
        accept={acceptAttr}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </label>
  );

  const removeButton = (
    <button
      type="button"
      onClick={handleClear}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <X className="h-4 w-4" />
      Remove
    </button>
  );

  return (
    <div className="grid gap-1.5">
      {!hasFile ? (
        <>
          <label
            htmlFor={id}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFile(file);
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-7 text-center transition-colors",
              dragging
                ? "border-foreground/40 bg-secondary"
                : "border-input bg-secondary/40 hover:bg-secondary",
              error && "border-destructive/60",
            )}
          >
            <ImagePlus className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{label}</span>
            <span className="text-xs text-muted-foreground">
              Click to upload or drag and drop, {hint}
              {framingHint ? ` (${framingHint})` : ""}
            </span>
            <input
              id={id}
              type="file"
              accept={acceptAttr}
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </label>
          {capture ? (
            <label
              htmlFor={`${id}-capture`}
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 self-center text-sm font-medium text-foreground transition-colors hover:text-foreground/70"
            >
              <Camera className="h-4 w-4" />
              Take a photo
              <input
                id={`${id}-capture`}
                type="file"
                accept="image/*"
                capture={capture}
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </label>
          ) : null}
        </>
      ) : preview ? (
        <div className="overflow-hidden rounded-xl border border-input">
          <div className="bg-secondary px-3 pt-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {shape === "logo" ? (
              <div className="flex justify-center">
                <img
                  src={preview}
                  alt=""
                  className="h-28 w-28 rounded-full border border-border bg-white object-cover"
                />
              </div>
            ) : shape === "cover" ? (
              <img
                src={preview}
                alt=""
                className="aspect-[16/9] w-full rounded-lg object-cover"
              />
            ) : (
              <img
                src={preview}
                alt=""
                className="max-h-80 w-full rounded-lg object-contain"
              />
            )}
          </div>
          <div className="flex items-center justify-between gap-3 bg-secondary px-4 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-medium">{label}</p>
              <p className="truncate text-xs text-muted-foreground">
                {fileName}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {replaceLabel}
              {removeButton}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-input bg-secondary px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-sm font-medium">{label}</p>
              <p className="truncate text-xs text-muted-foreground">
                {fileName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {replaceLabel}
            {removeButton}
          </div>
        </div>
      )}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {cropSrc ? (
        <LogoCropper
          src={cropSrc}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      ) : null}
    </div>
  );
}
