// Core numeric engine mirrored from the ELA2 workbook (General information,
// CALC1/CALC2, and Report sheets). Kept free of JSX/React so it can be unit
// tested directly and imported by any UI layer.

import {
  avg,
  computeEngineeringCurrentLevel,
  computeProductionCurrentLevel,
  defaultEngineeringAnswers,
  defaultProductionAnswers,
  type EngineeringAnswers,
  type ProductionAnswers,
} from "../data/questionnaire.ts";

// Quick-entry: "What software do you use?" radio options.
export const softwareOptions = [
  "AutoCAD Electrical",
  "SolidWorks Electrical",
  "Microstation (for E&P)",
  "Other",
] as const;

export type Inputs = {
  // Company profile ("General information" sheet, requirement #2 — these do
  // not feed the math, only the report/print output).
  companyName: string;
  segmentIndustry: string;
  options: string;
  variants: string;
  ecadUsageRating: string;
  externalEngineering: string;
  externalCabinetProduction: string;
  ecadTool: string;
  mcadTool: string;
  pdmTool: string;
  erpTool: string;

  // Quick-entry software question. `softwareChoice` is one of
  // `softwareOptions`; `softwareOther` holds the free-text value when
  // "Other" is selected. `ecadTool` (above) always mirrors the effective
  // choice so the report/print output needs no extra wiring.
  softwareChoice: string;
  softwareOther: string;

  // Business/FTE inputs.
  projectsPerYear: number;
  pagesPerProject: number;
  engineeringTimeShare: number;
  panelsPerYear: number;
  productionTimeShare: number;
  engineeringFte: number;
  engineeringRate: number;
  productionFte: number;
  productionRate: number;
  etoCurrent: number;
  etoFuture: number;
  workingHoursPerDay: number;
  workingDaysPerYear: number;
  currency: string;

  // Questionnaire.
  engineeringAnswers: EngineeringAnswers;
  productionAnswers: ProductionAnswers;
  engineeringTargetLevel: number;
  productionTargetLevel: number;
};

// Matches the workbook's `General information` sheet defaults (I2:I6, E3:E4,
// F3:F4, B6/C6, B21:B23). Company/segment and the "required fields" section
// (Options, Variants, ECAD rating, external engineering/production, and the
// 4 software tool fields) ship blank and editable, matching the template.
export const defaults: Inputs = {
  companyName: "",
  segmentIndustry: "",
  options: "",
  variants: "",
  ecadUsageRating: "",
  externalEngineering: "",
  externalCabinetProduction: "",
  ecadTool: softwareOptions[0],
  mcadTool: "",
  pdmTool: "",
  erpTool: "",

  softwareChoice: softwareOptions[0],
  softwareOther: "",

  projectsPerYear: 50,
  pagesPerProject: 100,
  engineeringTimeShare: 1,
  panelsPerYear: 100,
  productionTimeShare: 1,
  engineeringFte: 2,
  engineeringRate: 75,
  productionFte: 4,
  productionRate: 40,
  etoCurrent: 0.8,
  etoFuture: 0.3,
  workingHoursPerDay: 8,
  workingDaysPerYear: 235,
  currency: "$",

  engineeringAnswers: defaultEngineeringAnswers,
  productionAnswers: defaultProductionAnswers,
  engineeringTargetLevel: 3.68,
  productionTargetLevel: 3.5,
};

export const baseLevelLabels = [
  "1",
  "1.5",
  "2",
  "2.5",
  "3",
  "3.5",
  "4",
  "4.5",
  "5",
];

export const yAxisTicks = [1, 0.75, 0.5, 0.25, 0];

export const levelKey = [
  ["1", "Basic - AutoCAD LT"],
  ["2", "Enhanced - ACE"],
  ["3", "Advanced - EPLAN"],
  ["4", "Automation - EPLAN eBuild"],
  ["5", "Configuration - EEC"],
] as const;

function buildCalc2Lookup(baseValues: number[]) {
  const denseValues: number[] = [];

  for (let index = 0; index < baseValues.length - 1; index += 1) {
    const end = baseValues[index + 1];
    let current = baseValues[index];

    denseValues.push(current);

    for (let step = 1; step <= 4; step += 1) {
      current = (current + end) / 2;
      denseValues.push(current);
    }
  }

  denseValues.push(baseValues[baseValues.length - 1]);
  return denseValues;
}

function hlookupApprox(level: number, denseValues: number[]) {
  const clamped = Math.max(1, Math.min(5, level));
  const lookupLevel = Math.floor((clamped + 0.0000001) * 10) / 10;
  const index = Math.round((lookupLevel - 1) * 10);

  return denseValues[Math.max(0, Math.min(denseValues.length - 1, index))];
}

export type ChartData = {
  labels: string[];
  currentLevel: number;
  targetLevel: number;
  primaryLabel: string;
  secondaryLabel: string;
  primary: number[];
  secondary: number[];
  total: number[];
  denseTotal: number[];
};

export function engineeringChartData(input: Inputs): ChartData {
  const currentLevel = computeEngineeringCurrentLevel(input.engineeringAnswers);
  const targetLevel = input.engineeringTargetLevel;

  const k5 = 0.05;
  const k6 = 0.03;
  const k9 = 0.05;
  const k10 = 0.05;
  const k11 = 0.05;
  const k12 = 0.05;
  const k7 = (1 - (k5 + k6 + k9 + k10 + k11 + k12)) * input.etoCurrent * 0.75;
  const s7 =
    input.etoCurrent === 0 ? 0 : k7 * (input.etoFuture / input.etoCurrent);
  const o7 = k7;
  const q7 = avg(o7, s7);

  const k8 = 1 - (k5 + k6 + k7 + k9 + k10 + k11 + k12);
  const l8 = k8 * 0.9;
  const m8 = l8 * 0.8;
  const o8 = m8 * 0.5;
  const q8 = o8 * 0.4;
  const s8 = q8 * 0.2;

  const rows = [
    [k5, k5, k5, k5, k5, k5, k5, avg(k5, k5 * 0.8), k5 * 0.8],
    [k6, k6, k6, k6, k6, k6, k6, avg(k6, k6 * 0.8), k6 * 0.8],
    [k7, k7, k7, k7, o7, avg(o7, q7), q7, avg(q7, s7), s7],
    [k8, l8, m8, avg(m8, o8), o8, avg(o8, q8), q8, avg(q8, s8), s8],
    [k9, avg(k9, k9 * 0.5), k9 * 0.5, avg(k9 * 0.5, k9 * 0.3), k9 * 0.3, k9 * 0.3, k9 * 0.3, k9 * 0.3, k9 * 0.3],
    [k10, avg(k10, k10 * 0.5), k10 * 0.5, avg(k10 * 0.5, 0), 0, 0, 0, 0, 0],
    [k11, avg(k11, k11 * 0.5), k11 * 0.5, avg(k11 * 0.5, k11 * 0.25), k11 * 0.25, avg(k11 * 0.25, 0), 0, 0, 0],
    [k12, k12, k12, avg(k12, k12 * 0.5), k12 * 0.5, avg(k12 * 0.5, k12 * 0.4), k12 * 0.4, avg(k12 * 0.4, k12 * 0.32), k12 * 0.32],
  ];

  const sum1 = rows[0].map((_, index) =>
    rows.reduce((sum, row) => sum + row[index], 0),
  );
  const sum2 = [0, 0.03, 0.04, 0.05, 0.07, 0.07, 0.08, 0.09, 0.1];
  const totalBase = sum1.map((value, index) => value + sum2[index]);
  const denseEngineering = buildCalc2Lookup(sum1);
  const denseStandardization = buildCalc2Lookup(sum2);
  const denseTotal = buildCalc2Lookup(totalBase);
  const standardization = [
    ...sum2,
    hlookupApprox(currentLevel, denseStandardization),
    hlookupApprox(targetLevel, denseStandardization),
  ];
  const engineering = [
    ...sum1,
    hlookupApprox(currentLevel, denseEngineering),
    hlookupApprox(targetLevel, denseEngineering),
  ];
  const total = engineering.map((value, index) => value + standardization[index]);

  return {
    labels: [...baseLevelLabels, "As-is", "Target"],
    currentLevel,
    targetLevel,
    primaryLabel: "Engineering",
    secondaryLabel: "Standardization",
    primary: engineering,
    secondary: standardization,
    total,
    denseTotal,
  };
}

function engineeringEfficiencyValues(input: Inputs) {
  return engineeringChartData(input).denseTotal;
}

export function productionChartData(input: Inputs): ChartData {
  const currentLevel = computeProductionCurrentLevel(input.productionAnswers);
  const targetLevel = input.productionTargetLevel;

  const staticRows = [
    [0.018, 0.01575, 0.0135, 0.01125, 0.009, 0.009, 0.009, 0.009, 0.009],
    [0.092, 0.087, 0.082, 0.077, 0.072, 0.0435, 0.015, 0.015, 0.015],
    [0.12, 0.105, 0.09, 0.075, 0.06, 0.06, 0.06, 0.06, 0.06],
    [0.225, 0.2025, 0.18, 0.1575, 0.135, 0.111, 0.087, 0.039, 0.039],
    [0.026, 0.02425, 0.0225, 0.02075, 0.019, 0.01675, 0.0145, 0.01225, 0.01],
    [0.022, 0.0215, 0.021, 0.0205, 0.02, 0.02, 0.02, 0.02, 0.02],
    [0.135, 0.12075, 0.1065, 0.09225, 0.078, 0.078, 0.078, 0.0485, 0.019],
    [0.272, 0.26525, 0.2585, 0.25175, 0.245, 0.24125, 0.2375, 0.23375, 0.23],
    [0.072, 0.07025, 0.0685, 0.06675, 0.065, 0.06375, 0.0625, 0.06125, 0.06],
    [0.018, 0.018, 0.018, 0.018, 0.018, 0.018, 0.018, 0.018, 0.018],
  ];
  const rateRatio =
    input.productionRate === 0 ? 0 : input.engineeringRate / input.productionRate;
  const article3d = [
    0,
    0.02 * rateRatio,
    0.02 * rateRatio,
    avg(0.02 * rateRatio, 0.03 * rateRatio),
    0.03 * rateRatio,
    0.03 * rateRatio,
    0.03 * rateRatio,
    0.03 * rateRatio,
    0.03 * rateRatio,
  ];
  const cabinetDesign = [
    0,
    0,
    0.005 * rateRatio,
    avg(0.005 * rateRatio, 0.02 * rateRatio),
    0.02 * rateRatio,
    avg(0.02 * rateRatio, 0.03 * rateRatio),
    0.03 * rateRatio,
    avg(0.03 * rateRatio, 0.035 * rateRatio),
    0.035 * rateRatio,
  ];

  const production = staticRows[0].map((_, index) =>
    staticRows.reduce((sum, row) => sum + row[index], 0),
  );
  const standardization = article3d.map((value, index) => value + cabinetDesign[index]);
  const totalLevelValues = production.map(
    (value, index) => value + standardization[index],
  );
  const denseProduction = buildCalc2Lookup(production);
  const denseStandardization = buildCalc2Lookup(standardization);
  const denseTotal = buildCalc2Lookup(totalLevelValues);
  const productionWithMarkers = [
    ...production,
    hlookupApprox(currentLevel, denseProduction),
    hlookupApprox(targetLevel, denseProduction),
  ];
  const standardizationWithMarkers = [
    ...standardization,
    hlookupApprox(currentLevel, denseStandardization),
    hlookupApprox(targetLevel, denseStandardization),
  ];

  return {
    labels: [...baseLevelLabels, "As-is", "Target"],
    currentLevel,
    targetLevel,
    primaryLabel: "Production",
    secondaryLabel: "Standardization",
    primary: productionWithMarkers,
    secondary: standardizationWithMarkers,
    total: productionWithMarkers.map(
      (value, index) => value + standardizationWithMarkers[index],
    ),
    denseTotal,
  };
}

function productionEfficiencyValues(input: Inputs) {
  return productionChartData(input).denseTotal;
}

export function calculate(input: Inputs) {
  const totalPages = input.projectsPerYear * input.pagesPerProject;
  const engineeringHours =
    input.workingDaysPerYear *
    input.workingHoursPerDay *
    input.engineeringFte *
    input.engineeringTimeShare;
  const engineeringCost = engineeringHours * input.engineeringRate;
  const productionHours =
    input.workingHoursPerDay *
    input.workingDaysPerYear *
    input.productionFte *
    input.productionTimeShare;
  const productionCost = productionHours * input.productionRate;

  const engineeringValues = engineeringEfficiencyValues(input);
  const productionValues = productionEfficiencyValues(input);
  const engineeringCurrentLevel = computeEngineeringCurrentLevel(input.engineeringAnswers);
  const engineeringTargetLevel = input.engineeringTargetLevel;
  const productionCurrentLevel = computeProductionCurrentLevel(input.productionAnswers);
  const productionTargetLevel = input.productionTargetLevel;
  const engineeringAsIsRatio = hlookupApprox(engineeringCurrentLevel, engineeringValues);
  const engineeringTargetRatio = hlookupApprox(engineeringTargetLevel, engineeringValues);
  const productionAsIsRatio = hlookupApprox(productionCurrentLevel, productionValues);
  const productionTargetRatio = hlookupApprox(productionTargetLevel, productionValues);
  const engineeringDifference = engineeringAsIsRatio - engineeringTargetRatio;
  const productionDifference = productionAsIsRatio - productionTargetRatio;

  return {
    totalPages,
    engineeringHours,
    engineeringCost,
    timePerPage: totalPages ? engineeringHours / totalPages : 0,
    engineeringSavings10: engineeringCost * 0.1,
    engineeringSavings20: engineeringCost * 0.2,
    engineeringSavings30: engineeringCost * 0.3,
    engineeringCurrentLevel,
    engineeringTargetLevel,
    engineeringAsIsRatio,
    engineeringTargetRatio,
    engineeringDifference,
    engineeringSavingPotential: engineeringCost * engineeringDifference,
    totalPanels: input.panelsPerYear,
    productionHours,
    productionCost,
    timePerPanel: input.panelsPerYear ? productionHours / input.panelsPerYear : 0,
    productionSavings10: productionCost * 0.1,
    productionSavings20: productionCost * 0.2,
    productionSavings30: productionCost * 0.3,
    productionCurrentLevel,
    productionTargetLevel,
    productionAsIsRatio,
    productionTargetRatio,
    productionDifference,
    productionSavingPotential: productionCost * productionDifference,
  };
}

export type Report = ReturnType<typeof calculate>;

export function money(value: number, currency: string) {
  return `${currency}${Math.round(value).toLocaleString()}`;
}

export function moneyWithCents(value: number, currency: string) {
  return `${currency}${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function number(value: number, digits = 2) {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

// Whole numbers render without a decimal (e.g. "2"), fractional counts keep
// one decimal (e.g. "2.5") — requirement #13.
export function formatCount(value: number) {
  return Number.isInteger(value) ? String(value) : number(value, 1);
}

export function normalizeNumericInput(value: string) {
  if (value === "") {
    return 0;
  }

  const normalized = value
    .replace(/^0+(?=\d)/, "")
    .replace(/^(-?)0+(?=\d)/, "$1");

  return Number(normalized);
}

export type ReportRow = {
  label: string;
  engineeringValue: string;
  productionLabel: string;
  productionValue: string;
  total?: string;
};

// Mirrors the Report sheet layout (A1:J18) as structured rows so the UI can
// render the same data as a table (desktop) or stacked cards (mobile).
export function buildReportRows(report: Report, currency: string): ReportRow[] {
  return [
    {
      label: "Total pages per year",
      engineeringValue: report.totalPages.toLocaleString(),
      productionLabel: "Total panels per year",
      productionValue: report.totalPanels.toLocaleString(),
    },
    {
      label: "Engineering hours per year",
      engineeringValue: number(report.engineeringHours, 0),
      productionLabel: "Production hours per year",
      productionValue: number(report.productionHours, 0),
    },
    {
      label: "Engineering costs per year",
      engineeringValue: money(report.engineeringCost, currency),
      productionLabel: "Production costs per year",
      productionValue: money(report.productionCost, currency),
    },
    {
      label: "Time per page",
      engineeringValue: `${number(report.timePerPage, 3)} h`,
      productionLabel: "Time per panel",
      productionValue: `${number(report.timePerPanel, 3)} h`,
    },
    {
      label: "Saving potential ratio 10%",
      engineeringValue: money(report.engineeringSavings10, currency),
      productionLabel: "Saving potential ratio 10%",
      productionValue: money(report.productionSavings10, currency),
    },
    {
      label: "Saving potential ratio 20%",
      engineeringValue: money(report.engineeringSavings20, currency),
      productionLabel: "Saving potential ratio 20%",
      productionValue: money(report.productionSavings20, currency),
    },
    {
      label: "Saving potential ratio 30%",
      engineeringValue: money(report.engineeringSavings30, currency),
      productionLabel: "Saving potential ratio 30%",
      productionValue: money(report.productionSavings30, currency),
    },
    {
      label: "As-is efficiency level",
      engineeringValue: `${number(report.engineeringCurrentLevel, 2)} / ${number(report.engineeringAsIsRatio * 100, 1)}%`,
      productionLabel: "As-is efficiency level",
      productionValue: `${number(report.productionCurrentLevel, 2)} / ${number(report.productionAsIsRatio * 100, 1)}%`,
    },
    {
      label: "Target efficiency level",
      engineeringValue: `${number(report.engineeringTargetLevel, 2)} / ${number(report.engineeringTargetRatio * 100, 1)}%`,
      productionLabel: "Target efficiency level",
      productionValue: `${number(report.productionTargetLevel, 2)} / ${number(report.productionTargetRatio * 100, 1)}%`,
    },
    {
      label: "Difference",
      engineeringValue: `${number(report.engineeringDifference * 100, 1)}%`,
      productionLabel: "Difference",
      productionValue: `${number(report.productionDifference * 100, 1)}%`,
    },
    {
      label: "Saving potential engineering",
      engineeringValue: money(report.engineeringSavingPotential, currency),
      productionLabel: "Saving potential production",
      productionValue: money(report.productionSavingPotential, currency),
      total: moneyWithCents(
        report.engineeringSavingPotential + report.productionSavingPotential,
        currency,
      ),
    },
  ];
}

export type MetricRow = { label: string; value: string };

// Requirement #10 — mobile drops the paired 5-column table for one stacked
// metrics card per side, so each side's own numbers read top to bottom.
export function buildEngineeringMetricRows(report: Report, currency: string): MetricRow[] {
  return [
    { label: "Total pages / year", value: report.totalPages.toLocaleString() },
    { label: "Engineering hours / year", value: number(report.engineeringHours, 0) },
    { label: "Engineering costs / year", value: money(report.engineeringCost, currency) },
    { label: "Time / page", value: `${number(report.timePerPage, 3)} h` },
    {
      label: "Engineering as-is level",
      value: `${number(report.engineeringCurrentLevel, 2)} (${number(report.engineeringAsIsRatio * 100, 1)}%)`,
    },
    {
      label: "Engineering target level",
      value: `${number(report.engineeringTargetLevel, 2)} (${number(report.engineeringTargetRatio * 100, 1)}%)`,
    },
    { label: "Difference", value: `${number(report.engineeringDifference * 100, 1)}%` },
    { label: "Saving potential", value: money(report.engineeringSavingPotential, currency) },
  ];
}

export function buildProductionMetricRows(report: Report, currency: string): MetricRow[] {
  return [
    { label: "Total panels / year", value: report.totalPanels.toLocaleString() },
    { label: "Production hours / year", value: number(report.productionHours, 0) },
    { label: "Production costs / year", value: money(report.productionCost, currency) },
    { label: "Time / panel", value: `${number(report.timePerPanel, 3)} h` },
    {
      label: "Production as-is level",
      value: `${number(report.productionCurrentLevel, 2)} (${number(report.productionAsIsRatio * 100, 1)}%)`,
    },
    {
      label: "Production target level",
      value: `${number(report.productionTargetLevel, 2)} (${number(report.productionTargetRatio * 100, 1)}%)`,
    },
    { label: "Difference", value: `${number(report.productionDifference * 100, 1)}%` },
    { label: "Saving potential", value: money(report.productionSavingPotential, currency) },
  ];
}

export type NumericInputKey = {
  [K in keyof Inputs]: Inputs[K] extends number ? K : never;
}[keyof Inputs];

export const percentFields: NumericInputKey[] = [
  "engineeringTimeShare",
  "productionTimeShare",
  "etoCurrent",
  "etoFuture",
];

export type FieldConstraint = { min?: number; max?: number };

// Validation ranges for requirement #7: percentages 0-100, target levels
// 1-5, and every other numeric business input non-negative.
export const fieldConstraints: Partial<Record<NumericInputKey, FieldConstraint>> = {
  projectsPerYear: { min: 0 },
  pagesPerProject: { min: 0 },
  panelsPerYear: { min: 0 },
  engineeringFte: { min: 1, max: 10 },
  engineeringRate: { min: 0 },
  productionFte: { min: 1, max: 10 },
  productionRate: { min: 0 },
  workingHoursPerDay: { min: 0 },
  workingDaysPerYear: { min: 0 },
  engineeringTimeShare: { min: 0, max: 100 },
  productionTimeShare: { min: 0, max: 100 },
  etoCurrent: { min: 0, max: 100 },
  etoFuture: { min: 0, max: 100 },
  engineeringTargetLevel: { min: 1, max: 5 },
  productionTargetLevel: { min: 1, max: 5 },
};

// Applies a field's min/max constraint (in the units the user types, i.e.
// before the percent fields are converted to a 0-1 fraction). Returns the
// clamped value plus whether clamping actually changed it, so the caller can
// surface a validation message instead of silently snapping the value.
export function clampField(key: NumericInputKey, rawValue: number) {
  const constraint = fieldConstraints[key];

  if (!constraint) {
    return { value: rawValue, clamped: false };
  }

  let value = rawValue;

  if (constraint.min !== undefined && value < constraint.min) {
    value = constraint.min;
  }

  if (constraint.max !== undefined && value > constraint.max) {
    value = constraint.max;
  }

  return { value, clamped: value !== rawValue };
}
