"use client";

import { useId, type ReactNode } from "react";

export function Field({
  error,
  hint,
  inputMode = "decimal",
  label,
  maxLength,
  onChange,
  suffix,
  value,
}: {
  error?: string;
  hint?: string;
  inputMode?: "decimal" | "text";
  label: string;
  maxLength?: number;
  onChange: (value: string) => void;
  suffix?: string;
  value: string;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="grid min-w-0 gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-sm font-medium text-[#4d5662]" htmlFor={id}>
          {label}
        </label>
        {hint ? (
          <span className="text-xs font-normal text-[#94a3b8]" id={hintId}>
            {hint}
          </span>
        ) : null}
      </div>
      <span className="relative block min-w-0">
        <input
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? true : undefined}
          className={`h-11 w-full max-w-full rounded border bg-white px-3 text-base shadow-inner outline-none transition focus-visible:ring-2 focus-visible:ring-[#e50043]/40 print:border-none print:shadow-none ${
            error
              ? "border-[#dc2626] focus:border-[#dc2626]"
              : "border-[#cbd5e1] focus:border-[#e50043]"
          } ${suffix ? "pr-9" : ""}`}
          id={id}
          inputMode={inputMode}
          maxLength={maxLength}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-semibold text-[#64748b]">
            {suffix}
          </span>
        ) : null}
      </span>
      {error ? (
        <p className="text-xs font-medium text-[#dc2626]" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "To be offered/implemented"
      ? "border-[#bbf0cd] bg-[#e7f6ec] text-[#166534]"
      : status === "Possible future improvement"
        ? "border-[#fde3b8] bg-[#fef3e2] text-[#92400e]"
        : "border-[#dbe1e7] bg-[#eef1f4] text-[#3f4b57]";

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${styles}`}
    >
      {status}
    </span>
  );
}

export function SectionCard({
  actions,
  children,
  className = "",
  description,
  id,
  step,
  title,
}: {
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  description?: string;
  id: string;
  step?: number;
  title: string;
}) {
  return (
    <section
      className={`scroll-mt-24 rounded-lg border border-[#d6dce3] bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.08)] print:break-inside-avoid print:shadow-none sm:p-6 ${className}`}
      id={id}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {step ? (
              <span
                aria-hidden="true"
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e50043] text-xs font-bold text-white print:hidden"
              >
                {step}
              </span>
            ) : null}
            <h2 className="text-lg font-semibold text-[#111827] sm:text-xl">
              {title}
            </h2>
          </div>
          {description ? (
            <p className="mt-1 text-sm text-[#64748b]">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap gap-2 print:hidden">{actions}</div>
        ) : null}
      </div>
      <div className="mt-5 min-w-0">{children}</div>
    </section>
  );
}
