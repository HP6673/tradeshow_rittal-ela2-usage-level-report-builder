"use client";

import { useMemo, useState } from "react";
import {
  engineeringRecommendations,
  formatQuantity,
  productionRecommendations,
  recommendationStatus,
  recommendationStatuses,
  type RecommendationItem,
  type RecommendationStatus,
} from "../data/offers.ts";
import { number, type Inputs } from "../lib/calculations.ts";
import { SectionCard, StatusBadge } from "./ui.tsx";

type FilterValue = "All" | RecommendationStatus;

function withStatus(
  rows: RecommendationItem[],
  currentLevel: number,
  targetLevel: number,
) {
  return rows.map((row) => ({
    ...row,
    status: recommendationStatus(row.neededFromLevel, currentLevel, targetLevel),
  }));
}

export function RecommendationsSection({
  input,
  engineeringCurrentLevel,
  engineeringTargetLevel,
  productionCurrentLevel,
  productionTargetLevel,
}: {
  input: Inputs;
  engineeringCurrentLevel: number;
  engineeringTargetLevel: number;
  productionCurrentLevel: number;
  productionTargetLevel: number;
}) {
  const [filter, setFilter] = useState<FilterValue>("All");

  const engineeringRows = useMemo(
    () => withStatus(engineeringRecommendations, engineeringCurrentLevel, engineeringTargetLevel),
    [engineeringCurrentLevel, engineeringTargetLevel],
  );
  const productionRows = useMemo(
    () => withStatus(productionRecommendations, productionCurrentLevel, productionTargetLevel),
    [productionCurrentLevel, productionTargetLevel],
  );
  const allRows = useMemo(
    () => [...engineeringRows, ...productionRows],
    [engineeringRows, productionRows],
  );

  const counts: Record<FilterValue, number> = {
    All: allRows.length,
    "To be offered/implemented": 0,
    "Possible future improvement": 0,
    "Should already be available/implemented": 0,
  };
  for (const row of allRows) {
    counts[row.status] += 1;
  }

  const filteredEngineering =
    filter === "All" ? engineeringRows : engineeringRows.filter((row) => row.status === filter);
  const filteredProduction =
    filter === "All" ? productionRows : productionRows.filter((row) => row.status === filter);

  return (
    <SectionCard
      description="From workbook sheet “To be offered” — needed-from level compares against this customer's current and target levels above."
      id="step-3"
      step={3}
      title="Recommended offering"
    >
      <div
        aria-label="Filter recommendations by status"
        className="flex flex-wrap gap-2"
        role="group"
      >
        {(["All", ...recommendationStatuses] as FilterValue[]).map((value) => {
          const active = filter === value;

          return (
            <button
              aria-pressed={active}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e50043] ${
                active
                  ? "border-[#e50043] bg-[#e50043] text-white"
                  : "border-[#d6dce3] bg-white text-[#4d5662] hover:bg-[#f8fafc]"
              }`}
              key={value}
              onClick={() => setFilter(value)}
              type="button"
            >
              {value} ({counts[value]})
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <RecommendationTable
          input={input}
          rows={filteredEngineering}
          title="Improvements to engineering"
          total={engineeringRows.length}
        />
        <RecommendationTable
          input={input}
          rows={filteredProduction}
          title="Improvements to production"
          total={productionRows.length}
        />
      </div>
    </SectionCard>
  );
}

function RecommendationTable({
  title,
  rows,
  total,
  input,
}: {
  title: string;
  rows: (RecommendationItem & { status: RecommendationStatus })[];
  total: number;
  input: Inputs;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2 rounded bg-[#28323f] px-4 py-3">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <span className="text-xs text-[#cbd5e1]">
          {rows.length} of {total}
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="mt-3 rounded border border-dashed border-[#d6dce3] bg-[#fbfcfe] p-4 text-center text-sm text-[#94a3b8]">
          No items match this filter.
        </p>
      ) : (
        <>
          {/* Desktop / tablet: full table. */}
          <div className="mt-3 hidden overflow-x-auto rounded border border-[#d6dce3] sm:block">
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#52606d]">
                <tr>
                  <th className="border-r border-[#d6dce3] px-3 py-2">Item</th>
                  <th className="border-r border-[#d6dce3] px-3 py-2">Type</th>
                  <th className="border-r border-[#d6dce3] px-3 py-2">Qty</th>
                  <th className="border-r border-[#d6dce3] px-3 py-2">
                    Needed from level
                  </th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr className="border-b border-[#edf0f3]" key={`${row.item}-${index}`}>
                    <td className="border-r border-[#edf0f3] px-3 py-2 text-[#52606d]">
                      {row.item}
                    </td>
                    <td className="border-r border-[#edf0f3] px-3 py-2 text-[#52606d]">
                      {row.type}
                    </td>
                    <td className="border-r border-[#edf0f3] px-3 py-2 text-[#52606d]">
                      {formatQuantity(row.quantity, input)}
                    </td>
                    <td className="border-r border-[#edf0f3] px-3 py-2 text-[#52606d]">
                      {number(row.neededFromLevel, 2)}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: stacked cards instead of a wide table. */}
          <div className="mt-3 grid gap-2 sm:hidden">
            {rows.map((row, index) => (
              <div
                className="min-w-0 rounded border border-[#d6dce3] bg-[#fbfcfe] p-3"
                key={`${row.item}-${index}`}
              >
                <p className="text-sm font-semibold text-[#111827]">{row.item}</p>
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-[#52606d]">
                  <dt className="text-[#94a3b8]">Type</dt>
                  <dd>{row.type}</dd>
                  <dt className="text-[#94a3b8]">Quantity</dt>
                  <dd>{formatQuantity(row.quantity, input)}</dd>
                  <dt className="text-[#94a3b8]">Needed from level</dt>
                  <dd>{number(row.neededFromLevel, 2)}</dd>
                </dl>
                <div className="mt-2">
                  <StatusBadge status={row.status} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
