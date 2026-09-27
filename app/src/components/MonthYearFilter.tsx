export const CURRENT_YEAR = new Date().getFullYear();

export const MONTH_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "All months" },
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export function yearOptions(back: number = 6): number[] {
  const years: number[] = [];
  for (let y = CURRENT_YEAR; y >= CURRENT_YEAR - back; y--) years.push(y);
  return years;
}

/**
 * Shared month/year filter control (Feature 2 Finance + Feature 3 Insights).
 * Month is optional ("All months" + a year = full-year P&L); year is
 * required. The same control is reused in both pages so the filter UI
 * logic lives in exactly one place.
 */
export default function MonthYearFilter({
  month,
  year,
  onMonth,
  onYear,
}: {
  month: string;
  year: string;
  onMonth: (v: string) => void;
  onYear: (v: string) => void;
}) {
  return (
    <div
      className="card"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
        padding: "12px 16px",
        marginBottom: 20,
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-ink-secondary)" }}>
        Period
      </span>
      <select
        aria-label="Month"
        value={month}
        onChange={(e) => onMonth(e.target.value)}
        style={{ width: "auto", minWidth: 140 }}
      >
        {MONTH_OPTIONS.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
      <select
        aria-label="Year"
        value={year}
        onChange={(e) => onYear(e.target.value)}
        style={{ width: "auto", minWidth: 110 }}
      >
        {yearOptions().map((y) => (
          <option key={y} value={String(y)}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}