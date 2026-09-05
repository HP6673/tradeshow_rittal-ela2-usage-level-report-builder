"use client";

import {
  buildEngineeringMetricRows,
  buildProductionMetricRows,
  buildReportRows,
  moneyWithCents,
  number,
  type ChartData,
  type Report,
} from "../lib/calculations.ts";
import { SectionCard } from "./ui.tsx";
import { WorkbookChart } from "./Charts.tsx";

function LevelSummaryCard({
  title,
  currentLevel,
  targetLevel,
  asIsRatio,
  targetRatio,
}: {
  title: string;
  currentLevel: number;
  targetLevel: number;
  asIsRatio: number;
  targetRatio: number;
}) {
  return (
    <div className="min-w-0 rounded-md border border-[#e2e8f0] bg-[#fbfcfe] p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#313842]">
        {title}
      </h3>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-[#94a3b8]">As-is level</p>
          <p className="text-xl font-semibold text-[#111827]">
            {number(currentLevel, 2)}
          </p>
          <p className="text-xs text-[#64748b]">{number(asIsRatio * 100, 1)}%</p>
        </div>
        <div>
          <p className="text-xs text-[#94a3b8]">Target level</p>
          <p className="text-xl font-semibold text-[#111827]">
            {number(targetLevel, 2)}
          </p>
          <p className="text-xs text-[#64748b]">{number(targetRatio * 100, 1)}%</p>
        </div>
      </div>
    </div>
  );
}

export function ReportSummarySection({
  report,
  currency,
  engineeringChart,
  productionChart,
}: {
  report: Report;
  currency: string;
  engineeringChart: ChartData;
  productionChart: ChartData;
}) {
  const rows = buildReportRows(report, currency);
  const engineeringMetrics = buildEngineeringMetricRows(report, currency);
  const productionMetrics = buildProductionMetricRows(report, currency);
  const totalSaving =
    report.engineeringSavingPotential + report.productionSavingPotential;

  return (
    <SectionCard
      description="Live results from the quick inputs above — matches workbook CALC1/Report."
      id="step-2"
      step={2}
      title="Results & savings"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <LevelSummaryCard
          asIsRatio={report.engineeringAsIsRatio}
          currentLevel={report.engineeringCurrentLevel}
          targetLevel={report.engineeringTargetLevel}
          targetRatio={report.engineeringTargetRatio}
          title="Engineering level"
        />
        <LevelSummaryCard
          asIsRatio={report.productionAsIsRatio}
          currentLevel={report.productionCurrentLevel}
          targetLevel={report.productionTargetLevel}
          targetRatio={report.productionTargetRatio}
          title="Production level"
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <WorkbookChart data={engineeringChart} title="Engineering time [%]" />
        <WorkbookChart data={productionChart} title="Production time [%]" />
      </div>

      <div className="mt-5">
        {/* Desktop / tablet: full 5-column workbook-style table. */}
        <div className="hidden overflow-x-auto rounded border border-[#d6dce3] md:block">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.12em] text-[#52606d]">
              <tr>
                <th className="border-r border-[#d6dce3] px-3 py-3">Engineering</th>
                <th className="border-r border-[#d6dce3] px-3 py-3">Value</th>
                <th className="border-r border-[#d6dce3] px-3 py-3">Panel production</th>
                <th className="border-r border-[#d6dce3] px-3 py-3">Value</th>
                <th className="px-3 py-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr className="border-b border-[#edf0f3]" key={row.label}>
                  <td className="border-r border-[#edf0f3] px-3 py-3 align-top text-[#52606d]">
                    {row.label}
                  </td>
                  <td className="border-r border-[#edf0f3] px-3 py-3 align-top font-semibold text-[#111827]">
                    {row.engineeringValue}
                  </td>
                  <td className="border-r border-[#edf0f3] px-3 py-3 align-top text-[#52606d]">
                    {row.productionLabel}
                  </td>
                  <td className="border-r border-[#edf0f3] px-3 py-3 align-top font-semibold text-[#111827]">
                    {row.productionValue}
                  </td>
                  <td className="px-3 py-3 align-top font-semibold text-[#111827]">
                    {row.total ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: stacked Engineering / Production / Total savings cards
            instead of the wide workbook table (requirement #10). */}
        <div className="grid gap-3 md:hidden">
          <MetricsCard rows={engineeringMetrics} title="Engineering metrics" />
          <MetricsCard rows={productionMetrics} title="Production metrics" />
          <div className="rounded-md border border-[#e50043]/30 bg-[#fdeef0] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#c00038]">
              Total savings
            </p>
            <p className="mt-1 text-2xl font-semibold text-[#111827]">
              {moneyWithCents(totalSaving, currency)}
            </p>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function MetricsCard({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string }[];
}) {
  return (
    <div className="min-w-0 rounded-md border border-[#d6dce3] bg-[#fbfcfe] p-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#313842]">
        {title}
      </h3>
      <dl className="mt-3 grid gap-2">
        {rows.map((row) => (
          <div
            className="flex items-baseline justify-between gap-3 border-b border-[#edf0f3] pb-1 last:border-b-0 last:pb-0"
            key={row.label}
          >
            <dt className="text-xs text-[#64748b]">{row.label}</dt>
            <dd className="text-sm font-semibold text-[#111827]">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
