import { RiderApplicationStatus } from "@/components/rider-application-status";

export const metadata = {
  title: "Your rider application | Gawula",
};

export default function RiderApplicationPage() {
  return (
    <main className="container max-w-2xl pb-24 pt-24 sm:pt-28">
      <RiderApplicationStatus />
    </main>
  );
}
