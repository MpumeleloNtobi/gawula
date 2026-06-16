"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuMenu as MenuIcon, LuArrowLeft as ArrowLeft } from "react-icons/lu";
import { LuShoppingBag as ShoppingBag } from "react-icons/lu";
import { IoFastFoodOutline } from "react-icons/io5";
import { RoleGate } from "@/components/role-gate";
import { useAuth } from "@/lib/auth-store";
import { storeApi } from "@/lib/store";
import { useStoreAvailability } from "@/lib/store-availability-store";
import { AvailabilityMenu } from "@/components/availability-menu";
import { CSS } from "./_ue/styles";
import { NAV } from "./_ue/data";
import { OrdersProvider } from "./_ue/OrdersContext";

export default function StoreLayout({ children }) {
  return (
    <RoleGate role="partner" title="Store sign in">
      <StoreShell>{children}</StoreShell>
    </RoleGate>
  );
}

function StoreShell({ children }) {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();
  const principal = useAuth((s) => s.principal);
  const token = useAuth((s) => s.token);
  const logout = useAuth((s) => s.logout);
  const setActiveMode = useAuth((s) => s.setActiveMode);
  const router = useRouter();
  const setPaused = useStoreAvailability((s) => s.setPaused);
  const paused = useStoreAvailability((s) => s.paused);
  const setRefresh = useStoreAvailability((s) => s.setRefresh);
  const [availBusy, setAvailBusy] = useState(false);

  const toggleAvailability = useCallback(async (nextPaused) => {
    if (availBusy || paused === null) return;
    setPaused(nextPaused);
    setAvailBusy(true);
    try {
      await storeApi.updateSettings(token, { pauseNewOrders: nextPaused });
    } catch {
      setPaused(!nextPaused);
    } finally {
      setAvailBusy(false);
    }
  }, [availBusy, paused, token, setPaused]);
  const navItems = NAV.flatMap((g) => g.items);
  const isActive = (href) =>
    href === "/store"
      ? pathname === "/store"
      : pathname === href || pathname.startsWith(href + "/");
  const storeName = principal?.name ?? "Your store";

  const loadSettings = useCallback(async () => {
    if (!token) return;
    try {
      const s = await storeApi.settings(token);
      setPaused(Boolean(s.pauseNewOrders));
    } catch {
      // ignore; toggle will retry on user interaction
    }
  }, [token, setPaused]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    setRefresh(loadSettings);
    return () => setRefresh(null);
  }, [loadSettings, setRefresh]);

  return (
    <OrdersProvider>
      <div className="ue-root">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <aside className={`sidebar ${navOpen ? "open" : ""}`}>
          <div className="sidebar-head">
            <Link className="top-brand" href="/store">
              Gawula
            </Link>
            <button
              type="button"
              className="sidebar-close"
              onClick={() => setNavOpen(false)}
              aria-label="Close menu"
            >
              <ArrowLeft size={20} />
            </button>
          </div>
          <div className="sidebar-actions">
            <button
              type="button"
              className="sidebar-action"
              onClick={() => {
                setNavOpen(false);
                logout();
              }}
            >
              Sign out
            </button>
          </div>
          <nav className="nav">
            {navItems.map((it) => {
              const Icon = it.icon;
              const active = isActive(it.href);
              return (
                <Link
                  key={it.id}
                  href={it.href}
                  className={`nav-item ${active ? "active" : ""}`}
                  onClick={() => setNavOpen(false)}
                >
                  <Icon size={20} /> {it.label}
                  {it.badge && <span className="nav-badge">{it.badge}</span>}
                </Link>
              );
            })}
            <button
              type="button"
              className="nav-item"
              onClick={() => {
                setNavOpen(false);
                setActiveMode("customer");
                router.push("/menu");
              }}
            >
              <IoFastFoodOutline size={20} /> Customer
            </button>
          </nav>
          <StoreAvailabilityRow onToggle={toggleAvailability} busy={availBusy} />
        </aside>
        <div
          className={`sidebar-overlay ${navOpen ? "show" : ""}`}
          onClick={() => setNavOpen(false)}
        />
        <div className="main">
          <header className="topbar">
            <div className="topbar-inner">
            <button
              className="menu-btn"
              onClick={() => setNavOpen(true)}
              aria-label="Open menu"
            >
              <MenuIcon size={20} />
            </button>
            <Link className="top-brand" href="/store">
              Gawula
            </Link>
            <AvailabilityMenu
              value={paused ?? false}
              options={[
                { label: "Open", value: false },
                { label: "Closed", value: true },
              ]}
              triggerLabel={paused === true ? "Closed" : "Open"}
              disabled={availBusy || paused === null}
              onApply={(next) => {
                if (next !== paused) toggleAvailability(next);
              }}
            />
            </div>
          </header>
          <div className="content">
            <div className="page">
              {children}
            </div>
          </div>
        </div>
      </div>
    </OrdersProvider>
  );
}

function StoreAvailabilityRow({ onToggle, busy }) {
  const paused = useStoreAvailability((s) => s.paused);
  const online = paused === false;
  const disabled = busy || paused === null;

  return (
    <div style={{ marginTop: "auto", padding: "16px 4px 4px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
          {paused === null ? "Availability" : online ? "Open" : "Closed"}
        </p>
        <button
          type="button"
          role="switch"
          aria-checked={online}
          aria-label={online ? "Close store" : "Open store"}
          onClick={() => onToggle(!paused)}
          disabled={disabled}
          style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            height: 28,
            width: 48,
            flexShrink: 0,
            borderRadius: 9999,
            background: online ? "var(--green)" : "#d4d4d4",
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.6 : 1,
            transition: "background-color .15s",
          }}
        >
          <span
            style={{
              display: "inline-block",
              height: 20,
              width: 20,
              borderRadius: "50%",
              background: "#fff",
              boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
              transform: online ? "translateX(24px)" : "translateX(4px)",
              transition: "transform .15s",
            }}
          />
        </button>
      </div>
    </div>
  );
}
