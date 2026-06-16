import { Dropdown } from "@/components/ui/dropdown";

export const PERIOD_OPTIONS = [
  { label: "Today", value: "today" },
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

export function PeriodSelect({ value, onChange }) {
  return (
    <Dropdown
      value={value}
      options={PERIOD_OPTIONS}
      onSelect={onChange}
      ariaLabel="Period"
      align="end"
      triggerClassName="border-solid bg-secondary"
      radio
    />
  );
}
