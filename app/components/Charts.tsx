"use client";

import { useState } from "react";
import { number, type CategoryChartData } from "../lib/calculations.ts";

function CategoryBar({
  label,
  level,
  total,
  scale,
  categories,
  values,
  onSegmentHover,
  onSegmentLeave,
}: {
  label: string;
  level: number;
  total: number;
  scale: number;
  categories: CategoryChartData["categories"];
  values: "asIs" | "target";
  onSegmentHover: (
    event: React.MouseEvent,
    category: CategoryChartData["categories"][number],
  ) => void;
  onSegmentLeave: () => void;
}) {
  const widthPercent = scale ? (total / scale) * 100 : 0;

  return (
    <div className="grid grid-cols-[64px_1fr_56px] items-center gap-2 sm:grid-cols-[80px_1fr_64px] sm:gap-3">
      <span className="text-xs font-semibold text-[#111827] sm:text-sm">
        {label}
        <span className="block text-[10px] font-normal text-[#94a3b8]">
          level {number(level, 2)}
        </span>
      </span>
      <div className="h-6 w-full overflow-hidden rounded-sm bg-[#eef1f4] sm:h-7">
        <div className="flex h-full" style={{ width: `${widthPercent}%` }}>
          {categories.map((category) => {
            const value = category[values];
            const segmentWidth = total ? (value / total) * 100 : 0;

            if (segmentWidth <= 0) {
              return null;
            }

            return (
              <div
                aria-label={`${category.number} ${category.label}: ${number(value * 100, 1)}%`}
                className="h-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827]"
                key={category.number}
                onBlur={onSegmentLeave}
                onFocus={(event) => onSegmentHover(event, category)}
                onMouseEnter={(event) => onSegmentHover(event, category)}
                onMouseLeave={onSegmentLeave}
                style={{ width: `${segmentWidth}%`, backgroundColor: category.color }}
                tabIndex={0}
              />
            );
          })}
        </div>
      </div>
      <span className="text-right text-xs font-semibold text-[#111827] sm:text-sm">
        {number(total * 100, 1)}%
      </span>
    </div>
  );
}

export function WorkbookChart({
  title,
  data,
}: {
  title: string;
  data: CategoryChartData;
}) {
  const [tooltip, setTooltip] = useState<{
    heading: string;
    x: number;
    y: number;
  } | null>(null);

  const asIsTotal = data.categories.reduce((sum, category) => sum + category.asIs, 0);
  const targetTotal = data.categories.reduce((sum, category) => sum + category.target, 0);
  const scale = Math.max(asIsTotal, targetTotal, 1);

  function showTooltip(
    event: React.MouseEvent | React.FocusEvent,
    category: CategoryChartData["categories"][number],
  ) {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setTooltip({
      heading: `${category.number}. ${category.label}`,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  }

  return (
    <div
      className="min-w-0 rounded-md border border-[#d6dce3] bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,0.08)] print:break-inside-avoid print:shadow-none sm:p-5"
      onMouseLeave={() => setTooltip(null)}
    >
      <h3 className="text-base font-semibold text-[#111827]">{title}</h3>
      <p className="mt-1 text-xs text-[#94a3b8]">
        Share of time by work item — for this customer&apos;s calculated As-is (level{" "}
        {number(data.currentLevel, 2)}) and Target (level {number(data.targetLevel, 2)}) levels.
      </p>

      <div
        aria-label={`${title}: stacked bar chart of time share by numbered workflow item, for the As-is and Target levels`}
        className="mt-4 grid gap-3 overflow-x-auto"
        role="img"
      >
        <div className="min-w-[280px]">
          <CategoryBar
            categories={data.categories}
            label="As-is"
            level={data.currentLevel}
            onSegmentHover={(event, category) => showTooltip(event, category)}
            onSegmentLeave={() => setTooltip(null)}
            scale={scale}
            total={asIsTotal}
            values="asIs"
          />
          <div className="h-2" />
          <CategoryBar
            categories={data.categories}
            label="Target"
            level={data.targetLevel}
            onSegmentHover={(event, category) => showTooltip(event, category)}
            onSegmentLeave={() => setTooltip(null)}
            scale={scale}
            total={targetTotal}
            values="target"
          />
        </div>
      </div>

      <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-[#4d5662] sm:grid-cols-3">
        {data.categories.map((category) => (
          <li className="flex items-center gap-1.5" key={category.number}>
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            <span className="truncate">
              {category.number}. {category.label}
            </span>
          </li>
        ))}
      </ul>

      {/* Screen-reader / print text alternative for the bar chart above. */}
      <div className="sr-only">
        <table>
          <caption>{title} — data table</caption>
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Item</th>
              <th scope="col">As-is</th>
              <th scope="col">Target</th>
            </tr>
          </thead>
          <tbody>
            {data.categories.map((category) => (
              <tr key={category.number}>
                <th scope="row">{category.number}</th>
                <td>{category.label}</td>
                <td>{number(category.asIs * 100, 1)}%</td>
                <td>{number(category.target * 100, 1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tooltip ? (
        <div
          className="fixed z-[9999] max-w-[calc(100vw-2rem)] rounded-md border border-[#111827] bg-white px-3 py-2 text-xs font-semibold text-[#111827] shadow-[0_20px_55px_rgba(15,23,42,0.28)]"
          role="status"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, calc(-100% - 12px))",
          }}
        >
          {tooltip.heading}
        </div>
      ) : null}
    </div>
  );
}
