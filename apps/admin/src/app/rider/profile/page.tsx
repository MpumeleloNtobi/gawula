"use client";

import { useEffect, useState, type ReactNode } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useApiData } from "@/lib/use-api-data";
import { RIDER_VEHICLES } from "@/lib/rider-application-store";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";

type RiderProfile = {
  id: string;
  name: string;
  status: string;
  onTrip: boolean;
  phone: string | null;
  vehicleType: string;
  vehicleBrand: string | null;
  vehicleColour: string | null;
  vehicleReg: string | null;
  homeAddress: string | null;
  joinedAt: string | null;
};

const statusLabels: Record<string, string> = {
  online: "Online",
  offline: "Offline",
  on_trip: "On a trip",
};

const vehicleLabels: Record<string, string> = {
  bicycle: "Bicycle",
  motorbike: "Motorbike",
  car: "Car",
  scooter: "Scooter",
};

const joinedFormatter = new Intl.DateTimeFormat("en-ZA", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const FIELD_CLASS =
  "h-12 w-full rounded-lg border-0 bg-secondary px-4 text-base font-medium text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-foreground/20";

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </div>
  );
}

export default function RiderProfilePage() {
  const token = useAuth((s) => s.token);
  const { data: me, refresh } = useApiData<RiderProfile>("/dispatch/me", { token });

  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    vehicleType: "",
    vehicleBrand: "",
    vehicleColour: "",
    vehicleReg: "",
    homeAddress: "",
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showVehicleDetails = form.vehicleType !== "" && form.vehicleType !== "bicycle";

  useEffect(() => {
    if (editing && me) {
      setForm({
        name: me.name,
        phone: me.phone ?? "",
        vehicleType: me.vehicleType,
        vehicleBrand: me.vehicleBrand ?? "",
        vehicleColour: me.vehicleColour ?? "",
        vehicleReg: me.vehicleReg ?? "",
        homeAddress: me.homeAddress ?? "",
      });
      setError(null);
    }
  }, [editing, me]);

  const save = async () => {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await api("/dispatch/me", {
        method: "PATCH",
        token,
        body: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          vehicleType: form.vehicleType,
          vehicleBrand: form.vehicleBrand.trim(),
          vehicleColour: form.vehicleColour.trim(),
          vehicleReg: form.vehicleReg.trim(),
          homeAddress: form.homeAddress.trim(),
        },
      });
      await refresh();
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save your profile");
    } finally {
      setPending(false);
    }
  };

  const detailGroups: { title: string; rows: { label: string; value: string }[] }[] = me
    ? [
        {
          title: "Your details",
          rows: [
            { label: "Phone", value: me.phone ?? "Not provided" },
            { label: "Address", value: me.homeAddress ?? "Not provided" },
          ],
        },
        {
          title: "Your vehicle",
          rows: [
            {
              label: "Type",
              value: vehicleLabels[me.vehicleType] ?? titleCase(me.vehicleType),
            },
            ...(me.vehicleType !== "bicycle"
              ? [
                  { label: "Brand", value: me.vehicleBrand ?? "Not provided" },
                  { label: "Colour", value: me.vehicleColour ?? "Not provided" },
                  { label: "Registration", value: me.vehicleReg ?? "Not provided" },
                ]
              : []),
          ],
        },
      ]
    : [];

  const initials = me
    ? me.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
    : "";

  const statusDot: Record<string, string> = {
    online: "bg-emerald-500",
    on_trip: "bg-primary",
    offline: "bg-muted-foreground/40",
  };

  return (
    <div className="container pb-24 pt-6 md:py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
        {me && !editing && (
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
      </div>

      <div className="mx-auto w-full max-w-lg">
      {!me ? (
        <p className="mt-8 text-sm text-muted-foreground">Loading your profile{"\u2026"}</p>
      ) : (
        <>
          <div className="mt-8 flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-secondary text-lg font-semibold text-foreground">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xl font-semibold">{me.name}</p>
              {me.joinedAt && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Joined {joinedFormatter.format(new Date(me.joinedAt))}
                </p>
              )}
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <span
                  className={`h-2 w-2 rounded-full ${statusDot[me.onTrip ? "on_trip" : me.status] ?? statusDot.offline}`}
                />
                {statusLabels[me.onTrip ? "on_trip" : me.status] ?? titleCase(me.status)}
              </p>
            </div>
          </div>

          {editing ? (
            <div className="mt-8 grid gap-8">
              <div className="grid gap-5">
                <h2 className="text-xl font-semibold tracking-tight">Your details</h2>
                <Field label="Name">
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="As shown on your ID"
                    autoComplete="name"
                    className={FIELD_CLASS}
                  />
                </Field>
                <Field label="Phone">
                  <input
                    type="tel"
                    inputMode="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="082 123 4567"
                    autoComplete="tel"
                    className={FIELD_CLASS}
                  />
                </Field>
                <Field label="Address">
                  <input
                    value={form.homeAddress}
                    onChange={(e) => setForm((f) => ({ ...f, homeAddress: e.target.value }))}
                    placeholder="Street, suburb, city"
                    autoComplete="street-address"
                    className={FIELD_CLASS}
                  />
                </Field>
              </div>

              <div className="grid gap-5">
                <h2 className="text-xl font-semibold tracking-tight">Your vehicle</h2>
                <Field label="Type">
                  <Dropdown
                    value={form.vehicleType}
                    options={RIDER_VEHICLES.map((v) => ({ value: v.id, label: v.label }))}
                    onSelect={(value) => setForm((f) => ({ ...f, vehicleType: value }))}
                    ariaLabel="Vehicle type"
                    placeholder="Choose your vehicle"
                    radio
                    triggerClassName="h-12 w-full rounded-lg border-0 bg-secondary px-4 text-base font-medium hover:bg-secondary/80"
                  />
                </Field>
                {showVehicleDetails && (
                  <>
                    <Field label="Brand">
                      <input
                        value={form.vehicleBrand}
                        onChange={(e) => setForm((f) => ({ ...f, vehicleBrand: e.target.value }))}
                        placeholder="e.g. Honda, Toyota"
                        className={FIELD_CLASS}
                      />
                    </Field>
                    <Field label="Colour">
                      <input
                        value={form.vehicleColour}
                        onChange={(e) => setForm((f) => ({ ...f, vehicleColour: e.target.value }))}
                        placeholder="e.g. Red"
                        className={FIELD_CLASS}
                      />
                    </Field>
                    <Field label="Registration">
                      <input
                        value={form.vehicleReg}
                        onChange={(e) => setForm((f) => ({ ...f, vehicleReg: e.target.value }))}
                        placeholder="Number plate"
                        autoCapitalize="characters"
                        className={FIELD_CLASS}
                      />
                    </Field>
                  </>
                )}
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                  onClick={() => setEditing(false)}
                  disabled={pending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="dark"
                  size="lg"
                  className="flex-1"
                  onClick={save}
                  disabled={pending || !form.name.trim()}
                >
                  {pending ? "Saving\u2026" : "Save"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-8 grid gap-8">
              {detailGroups.map((group) => (
                <div key={group.title} className="grid gap-5">
                  <h2 className="text-xl font-semibold tracking-tight">{group.title}</h2>
                  {group.rows.map((row) => (
                    <div key={row.label} className="grid gap-2">
                      <span className="text-sm font-medium">{row.label}</span>
                      <span className="flex h-12 items-center rounded-lg bg-secondary px-4 text-base font-medium text-muted-foreground">
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
