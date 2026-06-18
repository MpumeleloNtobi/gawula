"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { IoFastFoodOutline } from "react-icons/io5";
import { LuArrowLeft as ArrowLeft, LuBike as Bike, LuChevronDown as ChevronDown, LuChevronLeft as ChevronLeft, LuChevronRight as ChevronRight, LuClock as Clock, LuLayoutGrid as Grid, LuHouse as Home, LuMapPin as MapPin, LuMenu as Menu, LuUser as Person, LuReceiptText as ReceiptText, LuSearch as Search, LuShoppingBag as ShoppingBag, LuShoppingCart as ShoppingCart, LuWallet as Wallet, LuX as X } from "react-icons/lu";
import { MdOutlineStorefront as Store } from "react-icons/md";
import { useCart } from "@/lib/cart-store";
import { useAuth, homePathForRole, type PrincipalRole } from "@/lib/auth-store";
import { useRiderStore } from "@/lib/rider-store";
import { api, ApiError } from "@/lib/api";
import { AvailabilityMenu } from "@/components/availability-menu";
import { ADMIN_NAV_SECTIONS, isAdminSectionActive } from "@/app/admin/_lib/nav-sections";
import { HUBS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const navMenuLinks = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/menu", label: "Browse", Icon: ShoppingBag },
  { href: "/orders", label: "Orders", Icon: ReceiptText },
  { href: "/cart", label: "Cart", Icon: ShoppingCart },
];

const riderNavLinks = [
  { href: "/rider", label: "Overview", Icon: Grid },
  { href: "/rider/orders", label: "Orders", Icon: ReceiptText },
  { href: "/rider/earnings", label: "Earnings", Icon: Wallet },
  { href: "/rider/profile", label: "Profile", Icon: Person },
];

function isRiderSectionActive(pathname: string, href: string) {
  return href === "/rider"
    ? pathname === "/rider"
    : pathname === href || pathname.startsWith(`${href}/`);
}

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
  const address = useCart((s) => s.address);
  const cartHydrated = useCart((s) => s.hydrated);
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
    pathname === "/sign-in" ||
    pathname === "/sign-up" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/verify-email";
  const portalRoots = ["/rider", "/admin"];
  const isPortal =
    !isAuthFlow &&
    portalRoots.some((root) => pathname === root || pathname.startsWith(`${root}/`));
  const isReplicaRoute = [
    "/store",
    "/rider-demo",
  ].some((r) => pathname === r || pathname.startsWith(`${r}/`));
  const isBrandStorePage =
    pathname.startsWith("/menu/") &&
    !pathname.startsWith("/menu/bundles") &&
    !pathname.startsWith("/menu/stores");
  const isCartPage = pathname.startsWith("/cart");
  const isCheckoutPage = pathname.startsWith("/checkout");
  const isMenuListPage = pathname === "/menu";
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
  const isCustomAddress =
    Boolean(address) && !deliveryLocations.some((location) => location.address === address);
  const deliveryName = isCustomAddress
    ? (address as string).split(",")[0].trim()
    : activeLocation.name;
  const deliverySubtitle = isCustomAddress ? (address as string) : activeLocation.address;
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
    customer: "Customer",
    rider: "Rider",
    partner: "Store",
    admin: "Admin",
  };

  const switchToMode = (role: PrincipalRole) => {
    setActiveMode(role);
    closeNavMenu();
    router.push(homePathForRole(role));
  };

  if (isReplicaRoute) {
    return null;
  }

  if (isPortal) {
    const isAdminPortal =
      activeRole === "admin" && (pathname === "/admin" || pathname.startsWith("/admin/"));
    const isRiderPortal =
      pathname.startsWith("/rider") && Boolean(principal?.roles?.includes("rider"));
    const otherModes = (principal?.roles ?? []).filter(
      (role) => role !== activeRole && !(isRiderPortal && role === "customer"),
    );
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
                className="grid shrink-0 place-items-center"
                onClick={openNavMenu}
              >
                <Menu className="h-5 w-5" />
              </button>
              <Link href="/" className="flex min-w-0 items-center gap-2">
                <span className="text-xl font-semibold tracking-tight text-primary">Gawula</span>
              </Link>
              {isRiderPortal ? <RiderAvailabilityPill /> : null}
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
                ) : null}
              </div>
              {isAdminPortal ? (
                <nav className="mt-8 grid gap-1 text-base font-semibold">
                  {ADMIN_NAV_SECTIONS.map(({ href, label, Icon }) => {
                    const active = isAdminSectionActive(pathname, href);
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
                        <Icon className="h-5 w-5" />
                        <span>{label}</span>
                      </Link>
                    );
                  })}
                </nav>
              ) : null}
              {isRiderPortal ? (
                <nav className="mt-8 grid gap-1 text-base font-semibold">
                  {riderNavLinks.map(({ href, label, Icon }) => {
                    const active = isRiderSectionActive(pathname, href);
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
                        <Icon className="h-5 w-5" />
                        <span>{label}</span>
                      </Link>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => switchToMode("customer")}
                    className="flex h-12 items-center gap-4 rounded-md px-1 text-left"
                  >
                  <IoFastFoodOutline className="h-5 w-5" />
                    <span>Customer</span>
                  </button>
                </nav>
              ) : null}
              {otherModes.length > 0 ? (
                <nav className="mt-1 grid gap-1 text-base font-semibold">
                  {otherModes.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => switchToMode(role)}
                      className="flex h-12 items-center gap-4 rounded-md px-1 text-left"
                    >
                      {role === "rider" ? (
                        <Bike className="h-5 w-5" />
                      ) : role === "customer" ? (
                        <IoFastFoodOutline className="h-5 w-5" />
                      ) : (
                        <Store className="h-5 w-5" />
                      )}
                      <span>{roleLabels[role]}</span>
                    </button>
                  ))}
                </nav>
              ) : null}
              {isAuthed && principal ? (
                <div className="mt-auto">
                  {principal.roles?.includes("rider") && pathname.startsWith("/rider") ? (
                    <RiderAvailabilityRow />
                  ) : null}
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
          (isBrandStorePage || isCartPage || isCheckoutPage || isMenuListPage) && "hidden sm:block",
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
                "-ml-0.5 shrink-0 place-items-center",
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
                isCartPage && "hidden",
              )}
            >
              Gawula
            </Link>
            {isOrderingFlow ? (
              <>
                <div className="hidden h-9 shrink-0 items-center rounded-full bg-secondary p-0.5 text-sm font-semibold lg:flex">
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
                        {cartHydrated
                          ? fulfillment === "delivery"
                            ? deliveryName
                            : activeHub.name
                          : null}
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
                            className="inline-grid h-9 w-9 place-items-center justify-self-end rounded-full text-muted-foreground transition-colors hover:text-foreground"
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
                            <div className="font-semibold">{deliveryName}</div>
                            <div className="mt-0.5 text-sm leading-snug text-muted-foreground">
                              {deliverySubtitle}
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
                  className="hidden h-9 min-w-[360px] max-w-[720px] flex-1 items-center gap-3 rounded-full bg-[#eeeeee] px-4 md:flex"
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
                href="/waitlist"
                aria-current={pathname.startsWith("/waitlist") ? "page" : undefined}
                className={cn(
                  "whitespace-nowrap",
                  pathname.startsWith("/waitlist") && "text-primary",
                )}
              >
                Join the waitlist
              </Link>
              <Link
                href="/launch-partner"
                aria-current={pathname.startsWith("/launch-partner") ? "page" : undefined}
                className={cn(
                  "whitespace-nowrap",
                  pathname.startsWith("/launch-partner") && "text-primary",
                )}
              >
                Become a Launch Partner
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
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-foreground px-1.5 text-[11px] leading-none text-background">
                  {itemCount}
                </span>
              </Link>
              {isAuthed ? null : (
                <>
                  <Link
                    href="/sign-in"
                    className="hidden h-10 items-center px-2 text-sm font-semibold sm:inline-flex"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/sign-up"
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
                    href="/sign-in"
                    className="inline-flex h-10 items-center rounded-full bg-white px-4 text-sm font-semibold text-black shadow-sm hover:bg-white/90 sm:px-5"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/sign-up"
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
                className="inline-grid h-9 w-9 place-items-center justify-self-end rounded-full text-muted-foreground transition-colors hover:text-foreground"
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
                    href="/sign-up"
                    className="flex h-12 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground"
                    onClick={closeNavMenu}
                  >
                    Sign up
                  </Link>
                  <Link
                    href="/sign-in"
                    className="flex h-12 items-center justify-center rounded-full bg-secondary px-5 text-sm font-semibold"
                    onClick={closeNavMenu}
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>
            <nav className="mt-8 grid gap-1 text-base font-semibold">
              {navMenuLinks.map(({ href, label, Icon }) => {
                const active = pathname === href || pathname.startsWith(`${href}/`);
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
                    <Icon className="h-5 w-5" />
                    <span>{label}</span>
                  </Link>
                );
              })}
              {isAuthed && principal?.roles?.includes("rider") && (
                <button
                  type="button"
                  className="flex h-12 items-center gap-4 rounded-md px-1 text-left font-semibold"
                  onClick={() => switchToMode("rider")}
                >
                  <Bike className="h-5 w-5" />
                  <span>Rider</span>
                </button>
              )}
              {isAuthed && principal?.roles?.includes("partner") && (
                <button
                  type="button"
                  className="flex h-12 items-center gap-4 rounded-md px-1 text-left font-semibold"
                  onClick={() => switchToMode("partner")}
                >
                  <Store className="h-5 w-5" />
                  <span>Store</span>
                </button>
              )}
            </nav>
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
                    <Icon className="h-5 w-5" />
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
              <Menu className="h-5 w-5" />
              <span className="truncate">Menu</span>
            </button>
          </div>
        </nav>
      ) : null}
      {isHome ? null : (
        <div
          aria-hidden
          className={cn(
            usesCompactNav ? "h-16" : "h-20",
            (isBrandStorePage || isCartPage || isCheckoutPage || isMenuListPage) && "hidden sm:block",
          )}
        />
      )}
    </>
  );
}

function RiderAvailabilityPill() {
  const token = useAuth((s) => s.token);
  const status = useRiderStore((s) => s.status);
  const refresh = useRiderStore((s) => s.refresh);
  const setStatus = useRiderStore((s) => s.setStatus);
  const [pending, setPending] = React.useState(false);

  const apply = async (next: "online" | "offline") => {
    if (pending || status === null || next === status) return;
    const online = next === "online";
    const prev = status;
    setPending(true);
    setStatus(online ? "online" : "offline");
    try {
      await api("/dispatch/availability", { method: "POST", token, body: { online } });
      await refresh?.();
    } catch {
      setStatus(prev);
    } finally {
      setPending(false);
    }
  };

  return (
    <AvailabilityMenu
      value={status ?? "offline"}
      options={[
        { label: "Online", value: "online" },
        { label: "Offline", value: "offline" },
      ]}
      triggerLabel={status === "online" ? "Online" : "Offline"}
      disabled={pending || status === null}
      onApply={apply}
    />
  );
}

function RiderAvailabilityRow() {
  const token = useAuth((s) => s.token);
  const status = useRiderStore((s) => s.status);
  const onTrip = useRiderStore((s) => s.onTrip);
  const refresh = useRiderStore((s) => s.refresh);
  const setStatus = useRiderStore((s) => s.setStatus);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const online = status === "online";
  const disabled = pending || status === null;

  const toggle = async () => {
    if (disabled) return;
    setPending(true);
    setError(null);
    const next = !online;
    setStatus(next ? "online" : "offline");
    try {
      await api("/dispatch/availability", { method: "POST", token, body: { online: next } });
      await refresh?.();
    } catch (err) {
      setStatus(online ? "online" : "offline");
      setError(err instanceof ApiError ? err.message : "Could not update availability");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {status === null ? "Availability" : online ? "Online" : "Offline"}
          </p>
          {onTrip ? (
            <p className="mt-0.5 text-xs text-muted-foreground">On a trip</p>
          ) : null}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={online}
          aria-label={online ? "Go offline" : "Go online"}
          onClick={toggle}
          disabled={disabled}
          className={cn(
            "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full ring-1 ring-black/10 transition-colors",
            online ? "bg-primary" : "bg-neutral-300",
            disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          )}
        >
          <span
            className={cn(
              "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
              online ? "translate-x-6" : "translate-x-1",
            )}
          />
        </button>
      </div>
      {error ? (
        <p role="alert" aria-live="polite" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}