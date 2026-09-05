"use client";

import { useEffect, type ReactNode } from "react";
import {
  engineeringRecommendations,
  formatQuantity,
  productionRecommendations,
  recommendationStatus,
  type RecommendationItem,
  type RecommendationStatus,
} from "../data/offers.ts";
import {
  buildEngineeringMetricRows,
  buildProductionMetricRows,
  money,
  moneyWithCents,
  number,
  type ChartData,
  type Inputs,
  type MetricRow,
  type Report,
} from "../lib/calculations.ts";
import { StatusBadge } from "./ui.tsx";

// Requirement #1/#9 — a dedicated, report-only preview: opened from an
// explicit "Export report" button, closed with "Back to editor", and
// window.print() only ever fires from this modal's own button. The rest of
// the dashboard (nav, questionnaire, form controls) is marked print:hidden
// in Calculator.tsx, so printing from here never leaks the raw app UI.
export function ExportReportModal({
  input,
  report,
  engineeringChart,
  productionChart,
  onClose,
}: {
  input: Inputs;
  report: Report;
  engineeringChart: ChartData;
  productionChart: ChartData;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const generatedAt = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const totalSaving =
    report.engineeringSavingPotential + report.productionSavingPotential;

  const engineeringOffers = engineeringRecommendations.map((row) => ({
    ...row,
    status: recommendationStatus(
      row.neededFromLevel,
      report.engineeringCurrentLevel,
      report.engineeringTargetLevel,
    ),
  }));
  const productionOffers = productionRecommendations.map((row) => ({
    ...row,
    status: recommendationStatus(
      row.neededFromLevel,
      report.productionCurrentLevel,
      report.productionTargetLevel,
    ),
  }));
  const allOffers = [...engineeringOffers, ...productionOffers];
  const toBeOffered = allOffers.filter(
    (row) => row.status === "To be offered/implemented",
  );
  const futureImprovements = allOffers.filter(
    (row) => row.status === "Possible future improvement",
  );

  const mainGap =
    report.engineeringDifference >= report.productionDifference
      ? { label: "Engineering", value: report.engineeringDifference }
      : { label: "Production", value: report.productionDifference };

  const engineeringMetrics = buildEngineeringMetricRows(report, input.currency);
  const productionMetrics = buildProductionMetricRows(report, input.currency);

  const additionalDetails = [
    ["Options", input.options],
    ["Variants", input.variants],
    ["General rating on ECAD usage", input.ecadUsageRating],
    ["External engineering", input.externalEngineering],
    ["External cabinet production", input.externalCabinetProduction],
    ["ECAD", input.ecadTool],
    ["MCAD", input.mcadTool],
    ["PDM/PLM", input.pdmTool],
    ["ERP", input.erpTool],
  ].filter(([, value]) => value.trim() !== "") as [string, string][];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#e9ecef] print:static print:inset-auto print:z-auto print:overflow-visible print:bg-white">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#dfe3e8] bg-white px-4 py-3 shadow-sm print:hidden sm:px-6">
        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-sm font-semibold text-[#111827]">
            Export preview
          </p>
          <p className="text-xs text-[#94a3b8]">
            This is the report a customer would receive — not the working dashboard.
          </p>
        </div>
        <div className="flex w-full shrink-0 gap-2 sm:w-auto">
          <button
            className="h-10 flex-1 rounded-md border border-[#d6dce3] bg-white px-3 text-xs font-semibold text-[#4d5662] transition hover:bg-[#f8fafc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e50043] sm:flex-none sm:text-sm"
            onClick={onClose}
            type="button"
          >
            Back to editor
          </button>
          <button
            className="h-10 flex-1 rounded-md bg-[#e50043] px-3 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(229,0,67,0.25)] transition hover:bg-[#c00038] sm:flex-none sm:text-sm"
            onClick={() => window.print()}
            type="button"
          >
            Print / Save as PDF
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 print:max-w-none print:p-0 sm:px-6">
        <article
          className="rounded-lg border border-[#d6dce3] bg-white p-6 shadow-[0_20px_45px_rgba(15,23,42,0.12)] print:rounded-none print:border-none print:p-0 print:shadow-none sm:p-10"
          id="export-report"
        >
          {/* Cover / header — requirement #2 */}
          <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-[#e50043] pb-6">
            <div className="flex items-center gap-4">
              <img
                alt="Rittal"
                className="h-14 w-24 shrink-0 object-contain sm:h-16 sm:w-28"
                src="/rittal-logo.png"
              />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">
                  Rittal
                </p>
                <h1 className="text-2xl font-bold text-[#111827] sm:text-3xl">
                  ELA2 Usage Level Report
                </h1>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-lg font-semibold text-[#111827]">
                {input.companyName || "Customer name not set"}
              </p>
              <p className="text-sm text-[#64748b]">{input.ecadTool}</p>
              <p className="mt-1 text-xs text-[#94a3b8]">Generated {generatedAt}</p>
            </div>
          </header>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <CoverStat
              emphasize
              label="Total saving potential"
              value={moneyWithCents(totalSaving, input.currency)}
            />
            <CoverStat
              label="Engineering level"
              value={`${number(report.engineeringCurrentLevel, 2)} → ${number(report.engineeringTargetLevel, 2)}`}
            />
            <CoverStat
              label="Production level"
              value={`${number(report.productionCurrentLevel, 2)} → ${number(report.productionTargetLevel, 2)}`}
            />
            <CoverStat
              label="Recommended now"
              value={`${toBeOffered.length} item${toBeOffered.length === 1 ? "" : "s"}`}
            />
          </div>

          {/* Executive summary — requirement #3 */}
          <ReportSection title="Executive summary">
            <ul className="grid gap-2 text-sm sm:grid-cols-2">
              <SummaryLine
                label="Total annual saving potential"
                value={moneyWithCents(totalSaving, input.currency)}
              />
              <SummaryLine
                label="Engineering saving potential"
                value={money(report.engineeringSavingPotential, input.currency)}
              />
              <SummaryLine
                label="Production saving potential"
                value={money(report.productionSavingPotential, input.currency)}
              />
              <SummaryLine
                label="Main maturity gap"
                value={`${mainGap.label} (${number(mainGap.value * 100, 1)}% potential improvement)`}
              />
              <SummaryLine
                label="Recommendations to be offered"
                value={`${toBeOffered.length} of ${allOffers.length} total`}
              />
            </ul>
          </ReportSection>

          {/* Input summary — requirement #4 */}
          <ReportSection title="Key assumptions">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
              <SummaryLine label="Projects / year" value={input.projectsPerYear.toLocaleString()} />
              <SummaryLine label="Pages / project" value={input.pagesPerProject.toLocaleString()} />
              <SummaryLine label="Panels / year" value={input.panelsPerYear.toLocaleString()} />
              <SummaryLine
                label="Engineering FTE / rate"
                value={`${number(input.engineeringFte, 1)} FTE @ ${money(input.engineeringRate, input.currency)}/h`}
              />
              <SummaryLine
                label="Production FTE / rate"
                value={`${number(input.productionFte, 1)} FTE @ ${money(input.productionRate, input.currency)}/h`}
              />
              <SummaryLine
                label="ETO current / future"
                value={`${number(input.etoCurrent * 100, 0)}% / ${number(input.etoFuture * 100, 0)}%`}
              />
              <SummaryLine label="Working hours / day" value={String(input.workingHoursPerDay)} />
              <SummaryLine label="Working days / year" value={String(input.workingDaysPerYear)} />
              <SummaryLine label="Currency" value={input.currency} />
            </dl>

            {additionalDetails.length > 0 ? (
              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-[#edf0f3] pt-3 text-sm sm:grid-cols-3">
                {additionalDetails.map(([label, value]) => (
                  <SummaryLine key={label} label={label} value={value} />
                ))}
              </dl>
            ) : null}
          </ReportSection>

          {/* Results — requirement #5 */}
          <ReportSection title="Results">
            <div className="grid gap-4 sm:grid-cols-2">
              <MetricsTable rows={engineeringMetrics} title="Engineering results" />
              <MetricsTable rows={productionMetrics} title="Production results" />
            </div>
            <div className="mt-4 rounded-md border border-[#e50043]/30 bg-[#fdeef0] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#c00038]">
                Total result
              </p>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-1">
                <span className="text-2xl font-bold text-[#111827]">
                  {moneyWithCents(totalSaving, input.currency)}
                </span>
                <span className="text-xs text-[#64748b]">
                  Engineering {money(report.engineeringSavingPotential, input.currency)} + Production{" "}
                  {money(report.productionSavingPotential, input.currency)}
                </span>
              </div>
            </div>
          </ReportSection>

          {/* Charts — requirement #6 */}
          <ReportSection title="Usage level charts">
            <div className="grid gap-6 sm:grid-cols-2">
              <PrintChartSummary chart={engineeringChart} title="Engineering time [%]" />
              <PrintChartSummary chart={productionChart} title="Production time [%]" />
            </div>
          </ReportSection>

          {/* Recommendations — requirement #7 */}
          <ReportSection title="Recommended offering">
            <p className="text-xs text-[#94a3b8]">
              Items ready to offer now, based on this customer's current and target levels.
            </p>
            <RecommendationTable input={input} rows={toBeOffered} />
          </ReportSection>

          {futureImprovements.length > 0 ? (
            <ReportSection
              title="Appendix: possible future improvements"
              titleClassName="text-[#64748b]"
            >
              <p className="text-xs text-[#94a3b8]">
                Above the current target level — worth revisiting as this customer's roadmap advances.
              </p>
              <RecommendationTable input={input} rows={futureImprovements} muted />
            </ReportSection>
          ) : null}
        </article>
      </div>
    </div>
  );
}

function ReportSection({
  title,
  titleClassName = "text-[#111827]",
  children,
}: {
  title: string;
  titleClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-8 print:break-inside-avoid">
      <h2
        className={`border-b border-[#e2e8f0] pb-2 text-base font-semibold ${titleClassName}`}
      >
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function CoverStat({
  emphasize,
  label,
  value,
}: {
  emphasize?: boolean;
  label: string;
  value: string;
}) {
  return (
    <div
      className={`rounded-md border p-3 ${
        emphasize ? "border-[#e50043]/30 bg-[#fdeef0]" : "border-[#e2e8f0] bg-[#fbfcfe]"
      }`}
    >
      <p
        className={`text-[10px] font-semibold uppercase tracking-[0.1em] ${
          emphasize ? "text-[#c00038]" : "text-[#94a3b8]"
        }`}
      >
        {label}
      </p>
      <p className="mt-1 text-base font-bold text-[#111827] sm:text-lg">{value}</p>
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-[#edf0f3] py-1 last:border-b-0 sm:border-none sm:py-0">
      <dt className="text-[#64748b]">{label}</dt>
      <dd className="text-right font-semibold text-[#111827]">{value}</dd>
    </div>
  );
}

function MetricsTable({ title, rows }: { title: string; rows: MetricRow[] }) {
  return (
    <div className="min-w-0">
      <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#94a3b8]">
        {title}
      </h3>
      <dl className="mt-2 grid gap-1.5 text-sm">
        {rows.map((row) => (
          <div
            className="flex items-baseline justify-between gap-3 border-b border-[#edf0f3] py-1 last:border-b-0"
            key={row.label}
          >
            <dt className="text-[#64748b]">{row.label}</dt>
            <dd className="text-right font-semibold text-[#111827]">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// Percentage-width bar comparison (no fixed pixel min-widths) so it always
// fits the printable page — the full interactive chart's horizontal scroll
// container would otherwise get clipped mid-page when printed.
function PrintChartSummary({ title, chart }: { title: string; chart: ChartData }) {
  const asIsIndex = chart.labels.indexOf("As-is");
  const targetIndex = chart.labels.indexOf("Target");
  const bars = [
    { label: "As-is", index: asIsIndex },
    { label: "Target", index: targetIndex },
  ].map(({ label, index }) => ({
    label,
    primary: chart.primary[index],
    secondary: chart.secondary[index],
    total: chart.total[index],
  }));
  const max = Math.max(...bars.map((bar) => bar.total), 0.01);

  return (
    <div className="min-w-0 print:break-inside-avoid">
      <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>
      <div className="mt-1.5 flex items-center gap-4 text-xs text-[#64748b]">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-[#E50043]" />
          {chart.primaryLabel}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm bg-[#94A3B8]" />
          {chart.secondaryLabel}
        </span>
      </div>
      <div className="mt-3 grid gap-3">
        {bars.map((bar) => (
          <div className="grid grid-cols-[52px_1fr_48px] items-center gap-2" key={bar.label}>
            <span className="text-xs font-semibold text-[#111827]">{bar.label}</span>
            <div className="h-4 w-full overflow-hidden rounded-sm bg-[#eef1f4]">
              <div
                className="flex h-full"
                style={{ width: `${(bar.total / max) * 100}%` }}
              >
                <div
                  style={{
                    width: bar.total ? `${(bar.primary / bar.total) * 100}%` : "0%",
                    backgroundColor: "#E50043",
                  }}
                />
                <div
                  style={{
                    width: bar.total ? `${(bar.secondary / bar.total) * 100}%` : "0%",
                    backgroundColor: "#94A3B8",
                  }}
                />
              </div>
            </div>
            <span className="text-right text-xs font-semibold text-[#111827]">
              {number(bar.total * 100, 1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecommendationTable({
  rows,
  input,
  muted,
}: {
  rows: (RecommendationItem & { status: RecommendationStatus })[];
  input: Inputs;
  muted?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <p className="mt-2 text-sm text-[#94a3b8]">No items in this category.</p>
    );
  }

  return (
    <>
      {/* Desktop / print: table. */}
      <div className="mt-2 hidden overflow-x-auto rounded border border-[#d6dce3] sm:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-[#f8fafc] text-xs uppercase tracking-[0.1em] text-[#52606d]">
            <tr>
              <th className="border-r border-[#d6dce3] px-3 py-2">Item</th>
              <th className="border-r border-[#d6dce3] px-3 py-2">Type</th>
              <th className="border-r border-[#d6dce3] px-3 py-2">Qty</th>
              <th className="border-r border-[#d6dce3] px-3 py-2">Needed from</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                className={`border-b border-[#edf0f3] ${muted ? "text-[#94a3b8]" : ""}`}
                key={`${row.item}-${index}`}
              >
                <td className="border-r border-[#edf0f3] px-3 py-2">{row.item}</td>
                <td className="border-r border-[#edf0f3] px-3 py-2">{row.type}</td>
                <td className="border-r border-[#edf0f3] px-3 py-2">
                  {formatQuantity(row.quantity, input)}
                </td>
                <td className="border-r border-[#edf0f3] px-3 py-2">
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
      <div className="mt-2 grid gap-2 sm:hidden">
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
  );
}
