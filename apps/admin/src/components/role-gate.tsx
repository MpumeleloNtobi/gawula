"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, homePathForRole, type PrincipalRole } from "@/lib/auth-store";
import { ApiError } from "@/lib/api";
import { isStrongPassword, PASSWORD_REQUIREMENT } from "@/lib/password";
import { isValidName, NAME_REQUIREMENT } from "@/lib/name";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { LoadingDots } from "@/components/ui/loading-dots";

type GateProps = {
  role: PrincipalRole;
  title: string;
  children: React.ReactNode;
};

const showQaCreds = process.env.NEXT_PUBLIC_SHOW_QA_CREDENTIALS === "true";

const qaDefaults: Record<PrincipalRole, { email: string; password: string }> = {
  customer: { email: "customer@qa.test", password: "qa-password" },
  rider: { email: "rider@qa.test", password: "qa-password" },
  partner: { email: "partner@qa.test", password: "qa-password" },
  admin: { email: "admin@qa.test", password: "qa-password" },
};

export function RoleGate({ role, title, children }: GateProps) {
  const hydrated = useAuth((s) => s.hydrated);
  const principal = useAuth((s) => s.principal);
  const token = useAuth((s) => s.token);
  const logout = useAuth((s) => s.logout);

  if (!hydrated) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        <LoadingDots />
      </div>
    );
  }

  if (!token || !principal?.roles?.includes(role)) {
    return (
      <LoginPanel
        role={role}
        title={title}
        authed={Boolean(token)}
        onSignOut={logout}
      />
    );
  }

  return <>{children}</>;
}

function LoginPanel({
  role,
  title,
  authed,
  onSignOut,
}: {
  role: PrincipalRole;
  title: string;
  authed: boolean;
  onSignOut: () => void;
}) {
  const isStaff = role === "partner" || role === "admin";
  return (
    <main className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-8 sm:py-10">
      <section className="w-full max-w-[360px]">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>

        {authed && (
          <p className="mt-5 rounded-lg bg-secondary px-4 py-3 text-sm text-muted-foreground">
            You are signed in without {isStaff ? "staff" : `${role}`} access.{" "}
            <button type="button" className="font-semibold text-foreground" onClick={onSignOut}>
              Sign out
            </button>{" "}
            to use a different account.
          </p>
        )}

        {role === "customer" && <CustomerAuth />}
        {role === "rider" && (authed ? <RiderAccessNotice /> : <CustomerAuth />)}
        {isStaff && <SimpleLogin role={role} />}
      </section>
    </main>
  );
}

function RiderAccessNotice() {
  return (
    <div className="mt-6">
      <p className="text-sm text-muted-foreground">
        Your account is not registered as a rider yet. Apply to start delivering with Gawula.
      </p>
      <Button asChild variant="dark" size="lg" className="mt-5 w-full">
        <Link href="/riders">Become a rider</Link>
      </Button>
    </div>
  );
}

function CustomerAuth() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  return mode === "login" ? (
    <CustomerLogin onSwitch={() => setMode("signup")} />
  ) : (
    <CustomerSignup onSwitch={() => setMode("login")} />
  );
}

function CustomerLogin({ onSwitch }: { onSwitch: () => void }) {
  const router = useRouter();
  const login = useAuth((s) => s.login);
  const staffLogin = useAuth((s) => s.staffLogin);
  const defaults = qaDefaults.customer;
  const [email, setEmail] = useState(showQaCreds ? defaults.email : "");
  const [password, setPassword] = useState(showQaCreds ? defaults.password : "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const principal = await login(email.trim(), password).catch(async (err) => {
        if (err instanceof ApiError && (err.status === 401 || err.status === 400)) {
          return staffLogin(email.trim(), password);
        }
        throw err;
      });
      const primary = principal.roles[0];
      if (primary && primary !== "customer") {
        router.push(homePathForRole(primary));
        return;
      }
      setBusy(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not sign in");
      setBusy(false);
    }
  }

  return (
    <>
      <p className="mt-2 text-sm text-muted-foreground">
        Welcome back. Sign in to place an order.
      </p>
      <form onSubmit={submit} className="mt-6 grid gap-3">
        <label className="sr-only" htmlFor="cust-email">
          Email
        </label>
        <Input
          id="cust-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="email"
          placeholder="Email"
          autoFocus
        />
        <label className="sr-only" htmlFor="cust-password">
          Password
        </label>
        <PasswordInput
          id="cust-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          placeholder="Password"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" variant="dark" size="lg" className="w-full" disabled={busy}>
          {busy ? (
            <span className="inline-flex items-center gap-2">
              Signing in
              <LoadingDots />
            </span>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
      <p className="mt-5 text-sm text-muted-foreground">
        New to Gawula?{" "}
        <button type="button" onClick={onSwitch} className="font-semibold text-foreground">
          Create an account
        </button>
      </p>
      {showQaCreds && (
        <p className="mt-6 text-xs leading-5 text-muted-foreground">
          QA test account is pre-filled.
        </p>
      )}
    </>
  );
}

function CustomerSignup({ onSwitch }: { onSwitch: () => void }) {
  const customerSignup = useAuth((s) => s.customerSignup);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidName(name)) {
      setError(NAME_REQUIREMENT);
      return;
    }
    if (!isStrongPassword(password)) {
      setError(PASSWORD_REQUIREMENT);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await customerSignup({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create your account");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <p className="mt-2 text-sm text-muted-foreground">
        Create an account to start ordering from your favourite stores.
      </p>
      <form onSubmit={submit} className="mt-6 grid gap-3">
        <label className="sr-only" htmlFor="su-name">
          Full name
        </label>
        <Input
          id="su-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          placeholder="Full name"
          autoFocus
        />
        <label className="sr-only" htmlFor="su-email">
          Email
        </label>
        <Input
          id="su-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="email"
          placeholder="Email"
        />
        <label className="sr-only" htmlFor="su-phone">
          Phone number
        </label>
        <Input
          id="su-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          type="tel"
          autoComplete="tel"
          placeholder="Phone number"
        />
        <label className="sr-only" htmlFor="su-password">
          Password
        </label>
        <PasswordInput
          id="su-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          placeholder="Password"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          type="submit"
          variant="dark"
          size="lg"
          className="w-full"
          disabled={
            busy ||
            !isValidName(name) ||
            !email.trim() ||
            !phone.trim() ||
            !isStrongPassword(password)
          }
        >
          {busy ? (
            <span className="inline-flex items-center gap-2">
              Creating account
              <LoadingDots />
            </span>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
      <p className="mt-5 text-sm text-muted-foreground">
        Already have an account?{" "}
        <button type="button" onClick={onSwitch} className="font-semibold text-foreground">
          Sign in
        </button>
      </p>
    </>
  );
}

function SimpleLogin({ role }: { role: "partner" | "admin" }) {
  const staffLogin = useAuth((s) => s.staffLogin);
  const defaults = qaDefaults[role];
  const [email, setEmail] = useState(showQaCreds ? defaults.email : "");
  const [password, setPassword] = useState(showQaCreds ? defaults.password : "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const description = "Sign in with your staff email and password.";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await staffLogin(email.trim(), password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not sign in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <form onSubmit={submit} className="mt-6 grid gap-3">
        <label className="sr-only" htmlFor="gate-email">
          Email
        </label>
        <Input
          id="gate-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="email"
          placeholder="Email"
          autoFocus
        />
        <label className="sr-only" htmlFor="gate-password">
          Password
        </label>
        <PasswordInput
          id="gate-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          placeholder="Password"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" variant="dark" size="lg" className="w-full" disabled={busy}>
          {busy ? (
            <span className="inline-flex items-center gap-2">
              Signing in
              <LoadingDots />
            </span>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
      {showQaCreds && (
        <p className="mt-6 text-xs leading-5 text-muted-foreground">
          QA test account is pre-filled.
        </p>
      )}
    </>
  );
}
