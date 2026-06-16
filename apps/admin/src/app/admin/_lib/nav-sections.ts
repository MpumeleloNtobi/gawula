import type { IconType } from "react-icons";
import { LuBike as Bike, LuClipboardList as ClipboardList, LuReceiptText as ReceiptText, LuSettings as Settings, LuUsers as Users, LuWallet as Wallet } from "react-icons/lu";
import { MdOutlineStorefront as Store } from "react-icons/md";
import { LuLayoutGrid as LayoutGrid } from "react-icons/lu";
import { LuChartColumn as BarChart3 } from "react-icons/lu";

export type AdminNavSection = {
  href: string;
  label: string;
  Icon: IconType;
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavSection[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Overview", Icon: LayoutGrid },
      { href: "/admin/orders", label: "Orders", Icon: ReceiptText },
      { href: "/admin/applications", label: "Applications", Icon: ClipboardList },
    ],
  },
  {
    label: "Network",
    items: [
      { href: "/admin/riders", label: "Riders", Icon: Bike },
      { href: "/admin/stores", label: "Stores", Icon: Store },
      { href: "/admin/customers", label: "Customers", Icon: Users },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "/admin/analytics", label: "Analytics", Icon: BarChart3 },
      { href: "/admin/payouts", label: "Payouts", Icon: Wallet },
      { href: "/admin/settings", label: "Settings", Icon: Settings },
    ],
  },
];

export const ADMIN_NAV_SECTIONS: AdminNavSection[] = ADMIN_NAV_GROUPS.flatMap((group) => group.items);

export function isAdminSectionActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}