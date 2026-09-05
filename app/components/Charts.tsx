"use client";

import { useState } from "react";
import { levelKey, number, yAxisTicks, type ChartData } from "../lib/calculations.ts";

// Rittal-style chart accents (red/gray) instead of generic blue/orange.
const chartColors = {
  primary: "#E50043",
  secondary: "#94A3B8",
};

export function WorkbookChart({
  title,
  data,
}: {
  title: string;
  data: ChartData;
}) {
  const [tooltip, setTooltip] = useState<{
    heading: string;
    primary: number;
    secondary: number;
    total: number;
    x: number;
    y: number;
  } | null>(null);
  const [axisTooltip, setAxisTooltip] = useState<{
    label: string;
    x: number;
    y: number;
  } | null>(null);
  const max = Math.max(...data.total, 1);

  function barHeading(label: string) {
    if (label === "As-is") {
      return `As-is (level ${number(data.currentLevel, 2)})`;
    }

    if (label === "Target") {
      return `Target (level ${number(data.targetLevel, 2)})`;
    }

    return `Level ${label}`;
  }

  return (
    <div
      className="min-w-0 rounded-md border border-[#d6dce3] bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.08)] print:break-inside-avoid print:shadow-none sm:p-5"
      onMouseLeave={() => {
        setTooltip(null);
        setAxisTooltip(null);
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-[#111827]">{title}</h3>
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-[#52606d]">
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: chartColors.primary }}
            />
            {data.primaryLabel}
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: chartColors.secondary }}
            />
            {data.secondaryLabel}
          </span>
        </div>
      </div>
      <p className="mt-2 text-xs text-[#94a3b8]">
        {data.primaryLabel} is the share of time spent on this workflow at each
        maturity level; {data.secondaryLabel} adds standardized/automated work
        on top. "As-is" and "Target" mark this customer's calculated levels.
      </p>
      <div
        aria-label={`${title}: bar chart of time share by usage level, from level 1 through 5, plus the customer's As-is and Target levels`}
        className="mt-4 grid grid-cols-[34px_1fr] gap-2 sm:grid-cols-[42px_1fr] sm:gap-3"
        role="img"
      >
        <div className="relative h-64 sm:h-72">
          {yAxisTicks.map((tick) => (
            <span
              className="absolute right-0 translate-y-1/2 text-xs tabular-nums text-[#52606d]"
              key={tick}
              style={{ bottom: `${tick * 100}%` }}
            >
              {Math.round(tick * 100)}%
            </span>
          ))}
        </div>
        <div className="h-64 overflow-x-auto overflow-y-visible sm:h-72">
          <div className="relative h-full min-w-[560px] border-l border-b border-[#d7dde5] px-2 pb-8 sm:min-w-[680px] sm:px-3">
            {yAxisTicks.map((tick) => (
              <span
                className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-[#e2e8f0]"
                key={tick}
                style={{ bottom: `calc(${tick * 100}% + 2rem)` }}
              />
            ))}
            <div className="relative z-10 flex h-full items-end gap-2 sm:gap-3">
              {data.labels.map((label, index) => {
                const total = data.total[index];
                const barHeight = (total / max) * 100;
                const primaryHeight =
                  total === 0 ? 0 : (data.primary[index] / total) * 100;
                const secondaryHeight =
                  total === 0 ? 0 : (data.secondary[index] / total) * 100;
                const isMarker = label === "As-is" || label === "Target";
                const levelDescription = levelKey.find(
                  ([level]) => level === label,
                )?.[1];
                const heading = barHeading(label);
                const showTooltip = (x: number, y: number) => {
                  setAxisTooltip(null);
                  setTooltip({
                    heading,
                    primary: data.primary[index],
                    secondary: data.secondary[index],
                    total,
                    x,
                    y,
                  });
                };

                return (
                  <div
                    className="relative flex h-full flex-1 flex-col justify-end"
                    key={label}
                  >
                    <div
                      className="flex h-[88%] items-end"
                      onMouseMove={(event) => showTooltip(event.clientX, event.clientY)}
                    >
                      <div
                        aria-label={`${heading}: ${data.primaryLabel} ${number(data.primary[index] * 100, 1)}%, ${data.secondaryLabel} ${number(data.secondary[index] * 100, 1)}%, total ${number(total * 100, 1)}%`}
                        className="mx-auto flex w-full max-w-9 flex-col justify-end overflow-hidden rounded-t-sm bg-[#e5e7eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e50043]"
                        onBlur={() => {
                          setTooltip(null);
                          setAxisTooltip(null);
                        }}
                        onFocus={(event) => {
                          const rect = event.currentTarget.getBoundingClientRect();
                          showTooltip(rect.left + rect.width / 2, rect.top);
                        }}
                        style={{ height: `${barHeight}%` }}
                        tabIndex={0}
                      >
                        <div
                          style={{
                            height: `${secondaryHeight}%`,
                            backgroundColor: chartColors.secondary,
                          }}
                        />
                        <div
                          style={{
                            height: `${primaryHeight}%`,
                            backgroundColor: chartColors.primary,
                          }}
                        />
                      </div>
                    </div>
                    <span
                      className={`absolute -bottom-7 left-1/2 w-14 -translate-x-1/2 text-center text-[10px] text-[#52606d] sm:w-16 sm:text-xs ${
                        isMarker || levelDescription
                          ? "cursor-help font-semibold text-[#111827]"
                          : ""
                      }`}
                      onMouseMove={(event) => {
                        if (!levelDescription) {
                          return;
                        }

                        event.stopPropagation();
                        setTooltip(null);
                        setAxisTooltip({
                          label: levelDescription,
                          x: event.clientX,
                          y: event.clientY,
                        });
                      }}
                      onMouseLeave={() => setAxisTooltip(null)}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Screen-reader / print text alternative for the bar chart above.
          The `sr-only` clipping goes on this wrapper div, not the <table>
          itself — a table's auto layout can ignore a direct width:1px (no
          table-layout:fixed), which left its full nowrap content width
          leaking into the page's horizontal scroll extent. */}
      <div className="sr-only">
        <table>
          <caption>{title} — data table</caption>
          <thead>
            <tr>
              <th scope="col">Level</th>
              <th scope="col">{data.primaryLabel}</th>
              <th scope="col">{data.secondaryLabel}</th>
              <th scope="col">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.labels.map((label, index) => (
              <tr key={label}>
                <th scope="row">{barHeading(label)}</th>
                <td>{number(data.primary[index] * 100, 1)}%</td>
                <td>{number(data.secondary[index] * 100, 1)}%</td>
                <td>{number(data.total[index] * 100, 1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tooltip ? (
        <div
          className="fixed z-[9999] min-w-56 max-w-[calc(100vw-2rem)] rounded-md border border-[#111827] bg-white p-3 text-sm shadow-[0_20px_55px_rgba(15,23,42,0.28)]"
          role="status"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, calc(-100% - 16px))",
          }}
        >
          <p className="font-semibold text-[#111827]">{tooltip.heading}</p>
          <div className="mt-2 grid gap-1 text-[#4d5662]">
            <p>
              {data.primaryLabel}:{" "}
              <span className="font-semibold text-[#111827]">
                {number(tooltip.primary * 100, 1)}%
              </span>
            </p>
            <p>
              {data.secondaryLabel}:{" "}
              <span className="font-semibold text-[#111827]">
                {number(tooltip.secondary * 100, 1)}%
              </span>
            </p>
            <p>
              Total:{" "}
              <span className="font-semibold text-[#111827]">
                {number(tooltip.total * 100, 1)}%
              </span>
            </p>
          </div>
        </div>
      ) : null}
      {axisTooltip ? (
        <div
          className="fixed z-[9999] min-w-56 max-w-[calc(100vw-2rem)] rounded-md border border-[#111827] bg-white p-3 text-sm shadow-[0_20px_55px_rgba(15,23,42,0.28)]"
          role="status"
          style={{
            left: axisTooltip.x,
            top: axisTooltip.y,
            transform: "translate(-50%, calc(-100% - 16px))",
          }}
        >
          <p className="text-[#4d5662]">{axisTooltip.label}</p>
        </div>
      ) : null}
    </div>
  );
}
