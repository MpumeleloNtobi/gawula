import { redirect } from "next/navigation";

export default function RiderHistoryPage() {
  redirect("/rider/orders?tab=history");
}
