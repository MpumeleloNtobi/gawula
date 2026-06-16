import { LuShoppingBag as ShoppingBag, LuClipboardList as ReceiptText, LuStar as Star, LuWallet as Wallet, LuSettings as Settings, LuPercent as Percent, LuTag as Tag, LuZap as Zap, LuLayoutGrid as LayoutGrid, LuMegaphone as Megaphone } from "react-icons/lu";

export const NAV = [
  {
    group: "Overview",
    items: [
      { id: "home", label: "Overview", icon: LayoutGrid, href: "/store" },
      { id: "orders", label: "Orders", icon: ShoppingBag, badge: 3, href: "/store/orders" },
    ],
  },
  {
    group: "Manage",
    items: [
      { id: "menu", label: "Menu", icon: ReceiptText, href: "/store/menu" },
      { id: "reviews", label: "Reviews", icon: Star, href: "/store/reviews" },
      { id: "marketing", label: "Marketing", icon: Megaphone, href: "/store/marketing" },
    ],
  },
  {
    group: "Business",
    items: [
      { id: "payments", label: "Payments", icon: Wallet, href: "/store/payments" },
      { id: "settings", label: "Settings", icon: Settings, href: "/store/settings" },
    ],
  },
];

export const PROMOS = [
  { ic: Percent, color: "var(--green)", bg: "var(--green-soft)", t: "20% off orders over R250", p: "Spend-based offer for new and returning customers.", status: "Active", redeems: "284 redeemed" },
  { ic: Tag, color: "#246bff", bg: "var(--blue-soft)", t: "Free fries on first order", p: "Win over first-time customers with a free side.", status: "Active", redeems: "112 redeemed" },
  { ic: Zap, color: "#b9740f", bg: "var(--amber-soft)", t: "Buy one burger, get one 50%", p: "Boost average order value during slow hours.", status: "Scheduled", redeems: "Starts Mon" },
];

const stripSpace = (s) => s.replace(/\s/g, "");

export const fmt = (n) =>
  "R" +
  stripSpace(
    n.toLocaleString("en-ZA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  ).replace(",", ".");

export const fmt0 = (n) => "R" + stripSpace(n.toLocaleString("en-ZA"));

export const statusMeta = {
  new: { l: "New", c: "st-new" },
  accepted: { l: "Accepted", c: "st-accept" },
  preparing: { l: "Preparing", c: "st-prep" },
  ready: { l: "Ready", c: "st-ready" },
  delivery: { l: "Delivering", c: "st-deliv" },
  completed: { l: "Collected", c: "st-done" },
  canceled: { l: "Cancelled", c: "st-cancel" },
};

export const tipStyle = {
  borderRadius: 12,
  border: "1px solid #ededed",
  boxShadow: "0 6px 24px rgba(13,13,13,.1)",
  fontSize: 12,
  fontWeight: 600,
  padding: "8px 12px",
};
