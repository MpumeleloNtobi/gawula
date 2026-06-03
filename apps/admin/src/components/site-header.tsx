"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  Bike,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Home,
  LayoutGrid,
  MapPin,
  Menu,
  ReceiptText,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Store,
  Users,
  X,
} from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { useAuth, homePathForRole, type PrincipalRole } from "@/lib/auth-store";
import { HUBS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const navMenuLinks = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/menu", label: "Browse restaurants", Icon: ShoppingBag },
  { href: "/orders", label: "Orders", Icon: ReceiptText },
  { href: "/cart", label: "Cart", Icon: ShoppingCart },
];

const mobileBottomLinks = [
  {
    href: "/menu",
    label: "Home",
    Icon: Home,
    isActive: (currentPath: string) =>
      currentPath === "/menu" || currentPath.startsWith("/menu/"),
  },
  {
    href: "/orders",
    label: "Orders",
    Icon: ReceiptText,
    isActive: (currentPath: string) => currentPath.startsWith("/orders"),
  },
  {
    href: "/cart",
    label: "Cart",
    Icon: ShoppingCart,
    isActive: (currentPath: string) => currentPath.startsWith("/cart"),
  },
];

const deliveryLocations = [
  {
    hubId: "rosebank",
    name: "Erand Creek Estate",
    address: "14th rd, Johannesburg Ward 112, GT, 1687, ZA",
  },
  {
    hubId: "sandton",
    name: "Sandton Central",
    address: "West Street, Sandton, Johannesburg, GT, 2196, ZA",
  },
  {
    hubId: "melville",
    name: "Melville Village",
    address: "7th Street, Melville, Johannesburg, GT, 2092, ZA",
  },
  {
    hubId: "parkhurst",
    name: "Parkhurst",
    address: "4th Avenue, Parkhurst, Johannesburg, GT, 2193, ZA",
  },
];

const scheduleDays = [
  { id: "today", label: "Today", date: "28 May" },
  { id: "tomorrow", label: "Tomorrow", date: "29 May" },
  { id: "sat", label: "Sat", date: "30 May" },
  { id: "sun", label: "Sun", date: "31 May" },
  { id: "mon", label: "Mon", date: "1 Jun" },
  { id: "tue", label: "Tue", date: "2 Jun" },
  { id: "wed", label: "Wed", date: "3 Jun" },
];

const formatScheduleTime = (minutes: number) => {
  const normalizedMinutes = minutes % (24 * 60);
  const hours24 = Math.floor(normalizedMinutes / 60);
  const minutePart = normalizedMinutes % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${minutePart.toString().padStart(2, "0")} ${period}`;
};

const scheduleTimeSlots = Array.from({ length: 95 }, (_, index) => {
  const startMinutes = index * 15;
  const endMinutes = startMinutes + 30;
  return `${formatScheduleTime(startMinutes)}\u2013${formatScheduleTime(endMinutes)}`;
});

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const lines = useCart((s) => s.lines);
  const hubId = useCart((s) => s.hub);
  const setHub = useCart((s) => s.setHub);
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const hub = HUBS.find((h) => h.id === hubId);
  const activeHub = hub ?? HUBS[0];

  const authHydrated = useAuth((s) => s.hydrated);
  const principal = useAuth((s) => s.principal);
  const token = useAuth((s) => s.token);
  const logout = useAuth((s) => s.logout);
  const activeRole = useAuth((s) => s.activeRole);
  const setActiveMode = useAuth((s) => s.setActiveMode);
  const isAuthed = authHydrated && Boolean(token) && Boolean(principal);

  const isOrderingFlow =
    pathname.startsWith("/menu") ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/orders");
  const isHome = pathname === "/";
  const isAuthFlow =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/verify-email";
  const portalRoots = ["/rider", "/admin", "/partner"];
  const isPortal =
    !isAuthFlow &&
    portalRoots.some((root) => pathname === root || pathname.startsWith(`${root}/`));
  const usesCompactNav = isHome || isOrderingFlow || isAuthFlow;

  const [navMenuOpen, setNavMenuOpen] = React.useState(false);
  const [navMenuMounted, setNavMenuMounted] = React.useState(false);
  const [navMenuVisible, setNavMenuVisible] = React.useState(false);
  const [deliveryMenuOpen, setDeliveryMenuOpen] = React.useState(false);
  const [locationChoicesOpen, setLocationChoicesOpen] = React.useState(false);
  const [fulfillment, setFulfillment] = React.useState<"delivery" | "pickup">("delivery");
  const [deliveryTiming, setDeliveryTiming] = React.useState<"now" | "schedule">("now");
  const [scheduledDayId, setScheduledDayId] = React.useState(scheduleDays[0].id);
  const [scheduledTime, setScheduledTime] = React.useState(scheduleTimeSlots[0]);
  const [pendingScheduledDayId, setPendingScheduledDayId] = React.useState(scheduleDays[0].id);
  const [pendingScheduledTime, setPendingScheduledTime] = React.useState(scheduleTimeSlots[0]);
  const [scheduleModalOpen, setScheduleModalOpen] = React.useState(false);
  const [headerSearch, setHeaderSearch] = React.useState("");
  const [homeHeroOutOfSight, setHomeHeroOutOfSight] = React.useState(false);
  const closeNavMenuButtonRef = React.useRef<HTMLButtonElement>(null);
  const scheduleDayListRef = React.useRef<HTMLDivElement>(null);

  const openNavMenu = React.useCallback(() => {
    setNavMenuMounted(true);
    setNavMenuOpen(true);
  }, []);

  const closeNavMenu = React.useCallback(() => {
    setNavMenuVisible(false);
    setNavMenuOpen(false);
  }, []);

  React.useEffect(() => {
    closeNavMenu();
    setDeliveryMenuOpen(false);
    setScheduleModalOpen(false);
  }, [pathname, closeNavMenu]);

  React.useEffect(() => {
    const syncSearch = () => {
      setHeaderSearch(new URLSearchParams(window.location.search).get("q") ?? "");
    };
    syncSearch();
    window.addEventListener("gawula-searchchange", syncSearch);
    window.addEventListener("popstate", syncSearch);
    return () => {
      window.removeEventListener("gawula-searchchange", syncSearch);
      window.removeEventListener("popstate", syncSearch);
    };
  }, [pathname]);

  React.useEffect(() => {
    if (!deliveryMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDeliveryMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deliveryMenuOpen]);

  React.useEffect(() => {
    if (!scheduleModalOpen) return;
    const originalOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setScheduleModalOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [scheduleModalOpen]);

  React.useEffect(() => {
    if (!navMenuOpen) return;
    closeNavMenuButtonRef.current?.focus();
    const originalOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeNavMenu();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [navMenuOpen, closeNavMenu]);

  React.useEffect(() => {
    if (!navMenuMounted || !navMenuOpen) return;
    const frame = requestAnimationFrame(() => setNavMenuVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [navMenuMounted, navMenuOpen]);

  React.useEffect(() => {
    if (navMenuOpen || !navMenuMounted) return;
    const timeout = window.setTimeout(() => setNavMenuMounted(false), 220);
    return () => window.clearTimeout(timeout);
  }, [navMenuMounted, navMenuOpen]);

  React.useEffect(() => {
    if (!isHome) {
      setHomeHeroOutOfSight(false);
      return;
    }

    const hero = document.getElementById("site-hero");
    if (!hero) return;

    const updateLogoColor = () => {
      setHomeHeroOutOfSight(hero.getBoundingClientRect().bottom <= 64);
    };

    updateLogoColor();
    window.addEventListener("scroll", updateLogoColor, { passive: true });
    window.addEventListener("resize", updateLogoColor);
    return () => {
      window.removeEventListener("scroll", updateLogoColor);
      window.removeEventListener("resize", updateLogoColor);
    };
  }, [isHome]);

  const activeLocation =
    deliveryLocations.find((location) => location.hubId === activeHub.id) ?? deliveryLocations[0];
  const scheduledDay = scheduleDays.find((day) => day.id === scheduledDayId) ?? scheduleDays[0];
  const deliveryTimeLabel = deliveryTiming === "now" ? "Now" : `${scheduledDay.label}, ${scheduledTime}`;
  const showMobileBottomNav =
    isOrderingFlow &&
    !pathname.startsWith("/menu/item/") &&
    !pathname.startsWith("/checkout");

  const submitHeaderSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = headerSearch.trim();
    const url = `/menu${query ? `?q=${encodeURIComponent(query)}` : ""}`;
    if (pathname === "/menu") {
      window.history.pushState(null, "", url);
      window.dispatchEvent(new Event("gawula-searchchange"));
      return;
    }
    router.push(url);
  };

  const chooseHub = (hubId: string, area: string) => {
    const location = deliveryLocations.find((option) => option.hubId === hubId);
    setHub(hubId, location?.address ?? area);
    setLocationChoicesOpen(false);
  };

  const openScheduleModal = () => {
    setPendingScheduledDayId(scheduledDayId);
    setPendingScheduledTime(scheduledTime);
    setScheduleModalOpen(true);
  };

  const confirmSchedule = () => {
    setScheduledDayId(pendingScheduledDayId);
    setScheduledTime(pendingScheduledTime);
    setDeliveryTiming("schedule");
    setScheduleModalOpen(false);
  };

  const chooseDeliveryNow = () => {
    setDeliveryTiming("now");
    setScheduleModalOpen(false);
  };

  const scrollScheduleDays = (direction: -1 | 1) => {
    scheduleDayListRef.current?.scrollBy({ left: direction * 180, behavior: "smooth" });
  };

  const roleLabels: Record<PrincipalRole, string> = {
    customer: "Order food",
    rider: "Rider portal",
    partner: "Partner portal",
    admin: "Admin",
  };

  const switchToMode = (role: PrincipalRole) => {
    setActiveMode(role);
    closeNavMenu();
    router.push(homePathForRole(role));
  };

  if (isPortal) {
    const portalLabel = activeRole ? roleLabels[activeRole] : "Gawula";
    const otherModes = (principal?.roles ?? []).filter((role) => role !== activeRole);
    const adminSections = [
      { href: "/admin", label: "Overview", Icon: LayoutGrid },
      { href: "/admin/orders", label: "Orders", Icon: ReceiptText },
      { href: "/admin/applications", label: "Applications", Icon: ClipboardList },
      { href: "/admin/riders", label: "Riders", Icon: Bike },
      { href: "/admin/stores", label: "Stores", Icon: Store },
      { href: "/admin/customers", label: "Customers", Icon: Users },
      { href: "/admin/analytics", label: "Analytics", Icon: BarChart3 },
      { href: "/admin/payouts", label: "Payouts", Icon: ReceiptText },
      { href: "/admin/settings", label: "Settings", Icon: Settings },
    ];
    const isAdminPortal =
      activeRole === "admin" && (pathname === "/admin" || pathname.startsWith("/admin/"));
    const sectionActive = (href: string) =>
      href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
    return (
      <>
        <header className="fixed inset-x-0 top-0 z-40 bg-background text-foreground">
          <div className="flex h-16 w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label="Menu"
                aria-controls="site-nav-menu"
                aria-expanded={navMenuOpen}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
                onClick={openNavMenu}
              >
                <Menu className="h-5 w-5" />
              </button>
              <Link href="/" className="flex min-w-0 items-center gap-2">
                <span className="text-xl font-semibold tracking-tight text-primary">Gawula</span>
                <span className="hidden text-sm font-medium text-muted-foreground sm:inline">
                  {portalLabel}
                </span>
              </Link>
            </div>
          </div>
        </header>
        {navMenuMounted ? (
          <div
            className={cn("fixed inset-0 z-50", navMenuVisible ? "pointer-events-auto" : "pointer-events-none")}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <button
              type="button"
              aria-label="Close menu"
              className={cn(
                "absolute inset-0 bg-black/30 transition-opacity duration-200 ease-out",
                navMenuVisible ? "opacity-100" : "opacity-0",
              )}
              onClick={closeNavMenu}
            />
            <aside
              id="site-nav-menu"
              className={cn(
                "relative flex h-full w-full max-w-[320px] flex-col bg-background px-6 py-5 text-foreground shadow-2xl transition-transform duration-200 ease-out will-change-transform",
                navMenuVisible ? "translate-x-0" : "-translate-x-full",
              )}
            >
              <div className="flex items-center justify-between">
                <Link
                  href="/"
                  className="text-xl font-semibold tracking-tight text-primary"
                  onClick={closeNavMenu}
                >
                  Gawula
                </Link>
                <button
                  type="button"
                  ref={closeNavMenuButtonRef}
                  aria-label="Close menu"
                  className="grid h-9 w-9 place-items-center rounded-full"
                  onClick={closeNavMenu}
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              </div>
              {isAuthed ? (
                <div className="mt-7 grid gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      closeNavMenu();
                      router.push("/");
                    }}
                    className="flex h-12 items-center justify-center rounded-full bg-secondary px-5 text-sm font-semibold"
                  >
                    Sign out
                  </button>
                </div>
              ) : null}
              {isAdminPortal ? (
                <nav className="mt-8 grid gap-1 text-base font-semibold">
                  {adminSections.map(({ href, label, Icon }) => {
                    const active = sectionActive(href);
                    return (
                      <Link
                        key={href}
                        href={href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex h-12 items-center gap-4 rounded-md px-1",
                          active ? "text-primary" : undefined,
                        )}
                        onClick={closeNavMenu}
                      >
                        <Icon className="h-5 w-5" strokeWidth={2.25} />
                        <span>{label}</span>
                      </Link>
                    );
                  })}
                </nav>
              ) : null}
              {otherModes.length > 0 ? (
                <div className="mt-5 border-t border-border pt-5">
                  <p className="px-1 text-sm text-muted-foreground">Switch mode</p>
                  <nav className="mt-2 grid gap-1 text-base font-semibold">
                    {otherModes.map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => switchToMode(role)}
                        className="flex h-12 items-center gap-4 rounded-md px-1 text-left"
                      >
                        {role === "rider" ? (
                          <Bike className="h-5 w-5" strokeWidth={2.25} />
                        ) : role === "customer" ? (
                          <ShoppingBag className="h-5 w-5" strokeWidth={2.25} />
                        ) : (
                          <Store className="h-5 w-5" strokeWidth={2.25} />
                        )}
                        <span>{roleLabels[role]}</span>
                      </button>
                    ))}
                  </nav>
                </div>
              ) : null}
            </aside>
          </div>
        ) : null}
        <div aria-hidden className="h-16" />
      </>
    );
  }

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 text-foreground transition-colors",
          isHome && !homeHeroOutOfSight ? "bg-transparent" : "bg-background",
        )}
      >
      <div
        className={cn(
          usesCompactNav
            ? "flex h-16 w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-10"
            : "container flex h-20 items-center justify-between gap-4",
        )}
      >
        {!usesCompactNav ? (
          <Link href="/" className="flex items-center gap-2">
            <span
              className="text-xl font-semibold tracking-tight text-primary"
            >
              Gawula
            </span>
          </Link>
        ) : null}

        {usesCompactNav ? (
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              aria-label="Menu"
              aria-controls="site-nav-menu"
              aria-expanded={navMenuOpen}
              className={cn(
                "h-9 w-9 shrink-0 place-items-center rounded-full",
                isOrderingFlow ? "hidden md:grid" : "hidden",
              )}
              onClick={openNavMenu}
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link
              href="/"
              className={cn(
                "shrink-0 text-xl font-semibold tracking-tight",
                isHome && !homeHeroOutOfSight ? "text-white" : "text-primary",
              )}
            >
              Gawula
            </Link>
            {isOrderingFlow ? (
              <>
                <div className="hidden h-9 shrink-0 items-center rounded-full bg-secondary p-0.5 text-sm font-semibold md:flex">
                  <button
                    type="button"
                    aria-pressed={fulfillment === "delivery"}
                    className={cn(
                      "h-8 rounded-full px-3",
                      fulfillment === "delivery" && "bg-background shadow-sm",
                    )}
                    onClick={() => setFulfillment("delivery")}
                  >
                    Delivery
                  </button>
                  <button
                    type="button"
                    aria-pressed={fulfillment === "pickup"}
                    className={cn(
                      "h-8 rounded-full px-3",
                      fulfillment === "pickup" && "bg-background shadow-sm",
                    )}
                    onClick={() => setFulfillment("pickup")}
                  >
                    Pickup
                  </button>
                </div>
                {activeHub ? (
                  <div className="relative hidden shrink-0 lg:block">
                    <button
                      type="button"
                      aria-expanded={deliveryMenuOpen}
                      className="flex h-10 items-center gap-2 rounded-full px-2 text-sm font-semibold"
                      onClick={() => setDeliveryMenuOpen((open) => !open)}
                    >
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="max-w-[170px] truncate">
                        {fulfillment === "delivery" ? activeLocation.name : activeHub.name}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span>{deliveryTimeLabel}</span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    {deliveryMenuOpen ? (
                      <div className="absolute left-0 top-full z-50 mt-2 w-[360px] rounded-2xl border bg-popover p-4 text-sm shadow-xl">
                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                          <span aria-hidden="true" />
                          <h2 className="text-base font-semibold tracking-tight">Delivery details</h2>
                          <button
                            type="button"
                            aria-label="Cancel delivery details"
                            className="inline-grid h-9 w-9 place-items-center justify-self-end rounded-full hover:bg-secondary"
                            onClick={() => {
                              setLocationChoicesOpen(false);
                              setDeliveryMenuOpen(false);
                            }}
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                        <div className="mt-5 flex items-start gap-3">
                          <MapPin className="mt-1 h-5 w-5 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold">{activeLocation.name}</div>
                            <div className="mt-0.5 text-sm leading-snug text-muted-foreground">
                              {activeLocation.address}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="h-9 shrink-0 rounded-full bg-secondary px-4 text-sm font-semibold hover:bg-secondary/80"
                            onClick={() => setLocationChoicesOpen((open) => !open)}
                          >
                            Change
                          </button>
                        </div>

                        {locationChoicesOpen ? (
                          <div className="mt-4 grid gap-1 rounded-2xl bg-secondary p-1">
                            {deliveryLocations.map((location) => {
                              const optionHub = HUBS.find((option) => option.id === location.hubId);
                              return (
                                <button
                                  key={location.hubId}
                                  type="button"
                                  className={cn(
                                    "rounded-xl px-3 py-2.5 text-left",
                                    location.hubId === activeHub.id && "bg-background shadow-sm",
                                  )}
                                  onClick={() =>
                                    chooseHub(location.hubId, optionHub?.area ?? location.address)
                                  }
                                >
                                  <span className="block font-semibold">{location.name}</span>
                                  <span className="block text-xs text-muted-foreground">
                                    {location.address}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ) : null}

                        <div className="mt-5 flex items-center justify-between gap-3">
                          <div
                            className={cn(
                              "inline-flex items-center gap-2 text-sm font-semibold",
                              deliveryTiming === "now" ? "text-foreground" : "text-muted-foreground",
                            )}
                          >
                            <Clock className="h-4 w-4" />
                            Deliver now
                          </div>
                          <button
                            type="button"
                            aria-pressed={deliveryTiming === "schedule"}
                            aria-haspopup="dialog"
                            aria-expanded={scheduleModalOpen}
                            className={cn(
                              "h-9 rounded-full px-4 text-sm font-semibold",
                              deliveryTiming === "schedule"
                                ? "bg-foreground text-background"
                                : "bg-secondary hover:bg-secondary/80",
                            )}
                            onClick={openScheduleModal}
                          >
                            Schedule
                          </button>
                        </div>
                        <button
                          type="button"
                          className="mt-5 h-12 w-full rounded-full bg-foreground px-5 text-sm font-semibold text-background"
                          onClick={() => {
                            setLocationChoicesOpen(false);
                            setDeliveryMenuOpen(false);
                          }}
                        >
                          Done
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <button
                    type="button"
                    className="hidden h-10 shrink-0 items-center gap-2 rounded-full px-2 text-sm font-semibold lg:flex"
                  >
                    <span>Delivery</span>
                    <span className="text-muted-foreground">•</span>
                    <span>Now</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                )}
                <form
                  className="hidden h-9 min-w-[360px] max-w-[720px] flex-1 items-center gap-3 rounded-full bg-[#eeeeee] px-4 lg:flex"
                  onSubmit={submitHeaderSearch}
                >
                  <Search className="h-4 w-4 text-black" />
                  <input
                    type="text"
                    aria-label="Search Gawula"
                    placeholder="Search Gawula"
                    value={headerSearch}
                    onChange={(event) => setHeaderSearch(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-sm font-normal leading-none text-black outline-none placeholder:text-[#545454]"
                  />
                </form>
              </>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-center gap-1 sm:gap-3">
          {!usesCompactNav ? (
            <nav className="flex items-center gap-4 text-sm font-medium sm:gap-5">
              <Link
                href="/riders"
                aria-current={pathname.startsWith("/riders") ? "page" : undefined}
                className={cn(
                  "whitespace-nowrap",
                  pathname.startsWith("/riders") && "text-primary",
                )}
              >
                Become a rider
              </Link>
              <Link
                href="/partners"
                aria-current={pathname.startsWith("/partners") ? "page" : undefined}
                className={cn(
                  "whitespace-nowrap",
                  pathname.startsWith("/partners") && "text-primary",
                )}
              >
                List your restaurant
              </Link>
            </nav>
          ) : null}

          {isOrderingFlow ? (
            <>
              <Link
                href="/cart"
                aria-label={`View cart with ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
                className="relative hidden h-10 w-10 place-items-center border-0 bg-transparent font-semibold md:grid"
              >
                <ShoppingCart className="h-5 w-5" strokeWidth={2.75} />
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-foreground px-1.5 text-[11px] leading-none text-background">
                  {itemCount}
                </span>
              </Link>
              {isAuthed ? (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    router.push("/");
                  }}
                  className="hidden h-10 items-center px-2 text-sm font-semibold text-muted-foreground hover:text-foreground sm:inline-flex"
                >
                  Sign out
                </button>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="hidden h-10 items-center px-2 text-sm font-semibold sm:inline-flex"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    className="hidden h-10 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground sm:inline-flex"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </>
          ) : isHome ? (
            <>
              {isAuthed ? (
                <Link
                  href="/menu"
                  className="inline-flex h-10 items-center rounded-full bg-white px-4 text-sm font-semibold text-black shadow-sm hover:bg-white/90 sm:px-5"
                >
                  Order now
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="inline-flex h-10 items-center rounded-full bg-white px-4 text-sm font-semibold text-black shadow-sm hover:bg-white/90 sm:px-5"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex h-10 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 sm:px-5"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </>
          ) : null}
        </div>
      </div>
      </header>
      {scheduleModalOpen ? (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-labelledby="schedule-delivery-title">
          <button
            type="button"
            aria-label="Close schedule modal"
            className="absolute inset-0 bg-black/35"
            onClick={() => setScheduleModalOpen(false)}
          />
          <div className="absolute left-1/2 top-1/2 flex h-[calc(100vh-2rem)] max-h-[760px] w-[calc(100%-2rem)] max-w-[560px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-background p-5 text-foreground shadow-2xl">
            <div className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3">
              <span aria-hidden="true" />
              <h2 id="schedule-delivery-title" className="text-base font-semibold tracking-tight">
                Schedule delivery
              </h2>
              <button
                type="button"
                aria-label="Close schedule modal"
                className="inline-grid h-9 w-9 place-items-center justify-self-end rounded-full hover:bg-secondary"
                onClick={() => setScheduleModalOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 grid shrink-0 grid-cols-[2.25rem_minmax(0,1fr)_2.25rem] items-center gap-2">
              <button
                type="button"
                aria-label="Show earlier schedule days"
                className="inline-grid h-9 w-9 place-items-center rounded-full bg-secondary hover:bg-secondary/80"
                onClick={() => scrollScheduleDays(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div ref={scheduleDayListRef} className="min-w-0 overflow-hidden scroll-smooth">
                <div className="flex w-max gap-2">
                  {scheduleDays.map((day) => (
                    <button
                      key={day.id}
                      type="button"
                      aria-pressed={day.id === pendingScheduledDayId}
                      className={cn(
                        "grid min-w-[82px] shrink-0 rounded-xl border-2 bg-transparent px-3 py-2 text-center text-sm font-semibold hover:border-foreground/60",
                        day.id === pendingScheduledDayId ? "border-foreground" : "border-border",
                      )}
                      onClick={() => setPendingScheduledDayId(day.id)}
                    >
                      <span>{day.label}</span>
                      <span className="mt-0.5 text-xs font-semibold opacity-75">{day.date}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                aria-label="Show later schedule days"
                className="inline-grid h-9 w-9 place-items-center rounded-full bg-secondary hover:bg-secondary/80"
                onClick={() => scrollScheduleDays(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="grid gap-1">
                {scheduleTimeSlots.map((slot) => (
                  <label
                    key={slot}
                    className="flex h-10 cursor-pointer items-center justify-between rounded-lg px-3 text-sm font-semibold hover:bg-secondary"
                  >
                    <span>{slot}</span>
                    <input
                      type="radio"
                      name="schedule-time"
                      value={slot}
                      checked={slot === pendingScheduledTime}
                      className="h-4 w-4 accent-foreground"
                      onChange={() => setPendingScheduledTime(slot)}
                    />
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-5 grid shrink-0 gap-2 border-t pt-4">
              <button
                type="button"
                className="h-12 rounded-full bg-foreground px-5 text-sm font-semibold text-background"
                onClick={confirmSchedule}
              >
                Schedule
              </button>
              <button
                type="button"
                className="h-12 rounded-full bg-secondary px-5 text-sm font-semibold hover:bg-secondary/80"
                onClick={chooseDeliveryNow}
              >
                Deliver now
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {navMenuMounted ? (
        <div
          className={cn("fixed inset-0 z-50", navMenuVisible ? "pointer-events-auto" : "pointer-events-none")}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <button
            type="button"
            aria-label="Close menu"
            className={cn(
              "absolute inset-0 bg-black/30 transition-opacity duration-200 ease-out",
              navMenuVisible ? "opacity-100" : "opacity-0",
            )}
            onClick={closeNavMenu}
          />
          <aside
            id="site-nav-menu"
            className={cn(
              "relative flex h-full w-full max-w-[320px] flex-col bg-background px-6 py-5 text-foreground shadow-2xl transition-transform duration-200 ease-out will-change-transform",
              navMenuVisible ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <div className="flex items-center justify-between">
              <Link
                href="/"
                className="text-xl font-semibold tracking-tight text-primary"
                onClick={closeNavMenu}
              >
                Gawula
              </Link>
              <button
                type="button"
                ref={closeNavMenuButtonRef}
                aria-label="Close menu"
                className="grid h-9 w-9 place-items-center rounded-full"
                onClick={closeNavMenu}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-7 grid gap-3">
              {isAuthed ? (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    closeNavMenu();
                    router.push("/");
                  }}
                  className="flex h-12 items-center justify-center rounded-full bg-secondary px-5 text-sm font-semibold"
                >
                  Sign out
                </button>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="flex h-12 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground"
                    onClick={closeNavMenu}
                  >
                    Sign up
                  </Link>
                  <Link
                    href="/login"
                    className="flex h-12 items-center justify-center rounded-full bg-secondary px-5 text-sm font-semibold"
                    onClick={closeNavMenu}
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>
            <nav className="mt-8 grid gap-1 text-base font-semibold">
              {navMenuLinks.map(({ href, label, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex h-12 items-center gap-4 rounded-md px-1"
                  onClick={closeNavMenu}
                >
                  <Icon className="h-5 w-5" strokeWidth={2.25} />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>
            <nav className="mt-1 grid gap-1 text-base font-semibold">
              <Link
                href="/riders"
                className="flex h-12 items-center gap-4 rounded-md px-1"
                onClick={closeNavMenu}
              >
                <Bike className="h-5 w-5" strokeWidth={2.25} />
                <span>Become a rider</span>
              </Link>
              <Link
                href="/partners"
                className="flex h-12 items-center gap-4 rounded-md px-1"
                onClick={closeNavMenu}
              >
                <Store className="h-5 w-5" strokeWidth={2.25} />
                <span>List your store</span>
              </Link>
            </nav>
            <div className="mt-auto border-t pt-5 text-sm font-medium text-muted-foreground">
              <p>{activeLocation.name}</p>
              <p className="mt-1 text-foreground">
                {deliveryTiming === "now" ? "Delivery now" : `Scheduled for ${scheduledTime}`}
              </p>
            </div>
          </aside>
        </div>
      ) : null}
      {showMobileBottomNav ? (
        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-2 pb-[calc(env(safe-area-inset-bottom)_+_0.5rem)] pt-2 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur md:hidden"
          aria-label="Primary mobile navigation"
        >
          <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
            {mobileBottomLinks.map(({ href, label, Icon, isActive }) => {
              const active = isActive(pathname);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-semibold",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  <span className="relative">
                    <Icon className="h-5 w-5" strokeWidth={active ? 2.75 : 2.25} />
                    {label === "Cart" && itemCount > 0 ? (
                      <span className="absolute -right-2.5 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-foreground px-1 text-[10px] leading-none text-background">
                        {itemCount}
                      </span>
                    ) : null}
                  </span>
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
            <button
              type="button"
              aria-label="Open menu"
              aria-controls="site-nav-menu"
              aria-expanded={navMenuOpen}
              className={cn(
                "flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-semibold",
                navMenuOpen ? "text-foreground" : "text-muted-foreground",
              )}
              onClick={openNavMenu}
            >
              <Menu className="h-5 w-5" strokeWidth={navMenuOpen ? 2.75 : 2.25} />
              <span className="truncate">Menu</span>
            </button>
          </div>
        </nav>
      ) : null}
      {isHome ? null : <div aria-hidden className={usesCompactNav ? "h-16" : "h-20"} />}
    </>
  );
}