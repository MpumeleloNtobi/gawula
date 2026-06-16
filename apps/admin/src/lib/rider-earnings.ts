export type RiderPeriod = "today" | "daily" | "weekly" | "monthly" | "yearly";

export type RiderHistoryTrip = {
  earningsCents: number;
  deliveredAt: string | null;
};

export type EarningsPoint = {
  label: string;
  rand: number;
  earningsCents: number;
  count: number;
};

export const riderPeriodOptions: { value: RiderPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export const riderBreakdownLabel: Record<RiderPeriod, string> = {
  today: "By hour",
  daily: "By day",
  weekly: "By week",
  monthly: "By month",
  yearly: "By year",
};

const weekdayFormatter = new Intl.DateTimeFormat("en-ZA", { weekday: "short" });
const dayMonthFormatter = new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short" });
const monthFormatter = new Intl.DateTimeFormat("en-ZA", { month: "short" });

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(date: Date) {
  const d = startOfDay(date);
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return d;
}

type Bucket = { match: (d: Date) => boolean; label: string; earningsCents: number; count: number };

function finalize(buckets: Bucket[]): EarningsPoint[] {
  return buckets.map(({ label, earningsCents, count }) => ({
    label,
    earningsCents,
    count,
    rand: earningsCents / 100,
  }));
}

export function buildRiderEarningsSeries(
  trips: RiderHistoryTrip[],
  period: RiderPeriod,
): EarningsPoint[] {
  const valid = (trips ?? []).filter((t) => t.deliveredAt);
  const now = new Date();
  let buckets: Bucket[] = [];

  if (period === "today") {
    const day = startOfDay(now).getTime();
    buckets = Array.from({ length: 24 }, (_, h) => ({
      label: `${String(h).padStart(2, "0")}h`,
      earningsCents: 0,
      count: 0,
      match: (d: Date) => startOfDay(d).getTime() === day && d.getHours() === h,
    }));
  } else if (period === "daily") {
    const start = startOfDay(now);
    buckets = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() - (6 - i));
      const time = day.getTime();
      return {
        label: weekdayFormatter.format(day),
        earningsCents: 0,
        count: 0,
        match: (d: Date) => startOfDay(d).getTime() === time,
      };
    });
  } else if (period === "weekly") {
    const start = startOfWeek(now);
    buckets = Array.from({ length: 8 }, (_, i) => {
      const week = new Date(start);
      week.setDate(start.getDate() - (7 - i) * 7);
      const time = week.getTime();
      return {
        label: dayMonthFormatter.format(week),
        earningsCents: 0,
        count: 0,
        match: (d: Date) => startOfWeek(d).getTime() === time,
      };
    });
  } else if (period === "monthly") {
    buckets = Array.from({ length: 12 }, (_, i) => {
      const month = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      const year = month.getFullYear();
      const m = month.getMonth();
      return {
        label: monthFormatter.format(month),
        earningsCents: 0,
        count: 0,
        match: (d: Date) => d.getFullYear() === year && d.getMonth() === m,
      };
    });
  } else {
    const years = valid.map((t) => new Date(t.deliveredAt as string).getFullYear());
    const minYear = years.length ? Math.min(...years) : now.getFullYear();
    const maxYear = now.getFullYear();
    buckets = [];
    for (let year = minYear; year <= maxYear; year += 1) {
      const y = year;
      buckets.push({
        label: String(y),
        earningsCents: 0,
        count: 0,
        match: (d: Date) => d.getFullYear() === y,
      });
    }
  }

  for (const trip of valid) {
    const d = new Date(trip.deliveredAt as string);
    if (Number.isNaN(d.getTime())) continue;
    const bucket = buckets.find((b) => b.match(d));
    if (!bucket) continue;
    bucket.earningsCents += trip.earningsCents;
    bucket.count += 1;
  }

  return finalize(buckets);
}

export function riderEarningsTotal(series: EarningsPoint[]): { earnings: number; count: number } {
  return series.reduce(
    (acc, point) => ({
      earnings: acc.earnings + point.earningsCents,
      count: acc.count + point.count,
    }),
    { earnings: 0, count: 0 },
  );
}

export function riderPeriodStart(period: RiderPeriod): Date | null {
  const now = new Date();
  if (period === "today") return startOfDay(now);
  if (period === "daily") {
    const d = startOfDay(now);
    d.setDate(d.getDate() - 6);
    return d;
  }
  if (period === "weekly") {
    const d = startOfWeek(now);
    d.setDate(d.getDate() - 7 * 7);
    return d;
  }
  if (period === "monthly") return new Date(now.getFullYear(), now.getMonth() - 11, 1);
  return null;
}
