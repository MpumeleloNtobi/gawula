"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { LoadingDots } from "@/components/ui/loading-dots";
import { useAuth, homePathForRole } from "@/lib/auth-store";
import { ApiError } from "@/lib/api";
import { isStrongPassword, PASSWORD_REQUIREMENT } from "@/lib/password";
import { isValidName, nameError } from "@/lib/name";

type AuthPageProps = {
  mode: "login" | "signup";
};

const authCopy = {
  login: {
    title: "Sign in",
    action: "Sign in",
    busy: "Signing in",
    switchText: "New to Gawula?",
    switchHref: "/sign-up",
    switchLabel: "Sign up",
  },
  signup: {
    title: "Create your account",
    action: "Create account",
    busy: "Creating account",
    switchText: "Already have an account?",
    switchHref: "/sign-in",
    switchLabel: "Sign in",
  },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9][0-9\s-]{6,18}$/;

type FieldName =
  | "firstName"
  | "surname"
  | "email"
  | "phone"
  | "password"
  | "confirmPassword";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

export function AuthPage({ mode }: AuthPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const login = useAuth((s) => s.login);
  const staffLogin = useAuth((s) => s.staffLogin);
  const customerSignup = useAuth((s) => s.customerSignup);
  const copy = authCopy[mode];

  const [firstName, setFirstName] = React.useState("");
  const [surname, setSurname] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Partial<Record<FieldName, string>>>({});
  const [busy, setBusy] = React.useState(false);

  const values: Record<FieldName, string> = {
    firstName,
    surname,
    email,
    phone,
    password,
    confirmPassword,
  };

  const validateField = (name: FieldName, value: string): string | null => {
    const trimmed = value.trim();
    switch (name) {
      case "firstName":
        return nameError(value, "Name");
      case "surname":
        return nameError(value, "Surname");
      case "email":
        return EMAIL_RE.test(trimmed) ? null : "Enter a valid email address";
      case "phone":
        return PHONE_RE.test(trimmed) ? null : "Enter a valid phone number";
      case "password":
        if (mode === "login") {
          return value.length < 1 ? "Enter your password" : null;
        }
        return isStrongPassword(value) ? null : PASSWORD_REQUIREMENT;
      case "confirmPassword":
        return value === password ? null : "Passwords do not match";
      default:
        return null;
    }
  };

  const handleChange =
    (name: FieldName, setter: (value: string) => void) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setter(event.target.value);
      setError(null);
      setFieldErrors((prev) => {
        if (!prev[name]) return prev;
        const next = { ...prev };
        delete next[name];
        return next;
      });
    };

  const handleBlur = (name: FieldName) => () => {
    const message = validateField(name, values[name]);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (message) next[name] = message;
      else delete next[name];
      return next;
    });
  };

  const submitAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fields: FieldName[] =
      mode === "signup"
        ? ["firstName", "surname", "email", "phone", "password", "confirmPassword"]
        : ["email", "password"];
    const nextErrors: Partial<Record<FieldName, string>> = {};
    for (const name of fields) {
      const message = validateField(name, values[name]);
      if (message) nextErrors[name] = message;
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") {
        const name = `${firstName.trim()} ${surname.trim()}`.trim();
        await customerSignup({
          name,
          email: email.trim(),
          password,
          phone: phone.trim(),
        });
        router.push(next ?? "/menu");
      } else {
        await login(email.trim(), password).catch(async (err) => {
          if (err instanceof ApiError && (err.status === 401 || err.status === 400)) {
            return staffLogin(email.trim(), password);
          }
          throw err;
        });
        const active = useAuth.getState().activeRole ?? "customer";
        router.push(next ?? homePathForRole(active));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong, please try again");
      setBusy(false);
    }
  };

  const disabled =
    busy ||
    !email.trim() ||
    (mode === "signup"
      ? !isValidName(firstName) ||
        !isValidName(surname) ||
        !phone.trim() ||
        !isStrongPassword(password) ||
        confirmPassword.length < 8
      : password.length < 1);

  const orderedFields: FieldName[] =
    mode === "signup"
      ? ["firstName", "surname", "email", "phone", "password", "confirmPassword"]
      : ["email", "password"];
  const activeErrorField = orderedFields.find((name) => fieldErrors[name]);
  const errorFor = (name: FieldName) =>
    activeErrorField === name ? fieldErrors[name] : undefined;

  return (
    <main className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-8 sm:py-10">
      <section className="w-full max-w-[360px]">
        <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>

        <form className="mt-6 grid gap-3" onSubmit={submitAuth} noValidate>
          {mode === "signup" && (
            <>
              <div className="grid gap-1.5">
                <label className="sr-only" htmlFor="auth-first-name">
                  Name
                </label>
                <Input
                  id="auth-first-name"
                  value={firstName}
                  onChange={handleChange("firstName", setFirstName)}
                  onBlur={handleBlur("firstName")}
                  placeholder="Name as on ID"
                  autoComplete="given-name"
                  autoFocus
                />
                <FieldError message={errorFor("firstName")} />
              </div>
              <div className="grid gap-1.5">
                <label className="sr-only" htmlFor="auth-surname">
                  Surname
                </label>
                <Input
                  id="auth-surname"
                  value={surname}
                  onChange={handleChange("surname", setSurname)}
                  onBlur={handleBlur("surname")}
                  placeholder="Surname as on ID"
                  autoComplete="family-name"
                />
                <FieldError message={errorFor("surname")} />
              </div>
            </>
          )}

          <div className="grid gap-1.5">
            <label className="sr-only" htmlFor="auth-email">
              Email
            </label>
            <Input
              id="auth-email"
              value={email}
              onChange={handleChange("email", setEmail)}
              onBlur={handleBlur("email")}
              type="email"
              placeholder="Email"
              autoComplete="email"
              autoFocus={mode === "login"}
            />
            <FieldError message={errorFor("email")} />
          </div>

          {mode === "signup" && (
            <div className="grid gap-1.5">
              <label className="sr-only" htmlFor="auth-phone">
                Phone number
              </label>
              <Input
                id="auth-phone"
                value={phone}
                onChange={handleChange("phone", setPhone)}
                onBlur={handleBlur("phone")}
                type="tel"
                placeholder="Phone number"
                autoComplete="tel"
              />
              <FieldError message={errorFor("phone")} />
            </div>
          )}

          <div className="grid gap-1.5">
            <label className="sr-only" htmlFor="auth-password">
              Password
            </label>
            <PasswordInput
              id="auth-password"
              value={password}
              onChange={handleChange("password", setPassword)}
              onBlur={handleBlur("password")}
              placeholder="Password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
            <FieldError message={errorFor("password")} />
          </div>

          {mode === "signup" && (
            <div className="grid gap-1.5">
              <label className="sr-only" htmlFor="auth-confirm-password">
                Confirm password
              </label>
              <PasswordInput
                id="auth-confirm-password"
                value={confirmPassword}
                onChange={handleChange("confirmPassword", setConfirmPassword)}
                onBlur={handleBlur("confirmPassword")}
                placeholder="Confirm password"
                autoComplete="new-password"
              />
              <FieldError message={errorFor("confirmPassword")} />
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          {mode === "login" && (
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-sm font-semibold text-foreground hover:text-foreground/75"
              >
                Forgot password?
              </Link>
            </div>
          )}

          <Button
            type="submit"
            variant="dark"
            size="lg"
            className="w-full"
            disabled={disabled}
          >
            {busy ? (
              <span className="inline-flex items-center gap-2">
                {copy.busy}
                <LoadingDots />
              </span>
            ) : (
              copy.action
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {copy.switchText}{" "}
          <Link href={copy.switchHref} className="font-semibold text-foreground hover:text-foreground/75">
            {copy.switchLabel}
          </Link>
        </p>
      </section>
    </main>
  );
}
