import assert from "node:assert/strict";
import test from "node:test";
import {
  computeEngineeringCurrentLevel,
  computeProductionCurrentLevel,
  defaultEngineeringAnswers,
  defaultProductionAnswers,
} from "../app/data/questionnaire.ts";
import {
  calculate,
  clampField,
  defaults,
  formatCount,
  moneyWithCents,
} from "../app/lib/calculations.ts";
import {
  formatQuantity,
  recommendationStatus,
} from "../app/data/offers.ts";

test("workbook defaults: default inputs match the workbook's General information sheet", () => {
  assert.equal(defaults.companyName, "");
  assert.equal(defaults.segmentIndustry, "");
  assert.equal(defaults.projectsPerYear, 50);
  assert.equal(defaults.pagesPerProject, 100);
  assert.equal(defaults.engineeringTimeShare, 1);
  assert.equal(defaults.panelsPerYear, 100);
  assert.equal(defaults.productionTimeShare, 1);
  assert.equal(defaults.engineeringFte, 2);
  assert.equal(defaults.engineeringRate, 75);
  assert.equal(defaults.productionFte, 4);
  assert.equal(defaults.productionRate, 40);
  assert.equal(defaults.etoCurrent, 0.8);
  assert.equal(defaults.etoFuture, 0.3);
  assert.equal(defaults.workingHoursPerDay, 8);
  assert.equal(defaults.workingDaysPerYear, 235);
  assert.equal(defaults.currency, "$");
  assert.equal(defaults.engineeringTargetLevel, 3.68);
  assert.equal(defaults.productionTargetLevel, 3.5);
});

test("questionnaire scoring: engineering current level averages the 8 section averages (CALC1!B4)", () => {
  const level = computeEngineeringCurrentLevel(defaultEngineeringAnswers);
  assert.equal(level, 2.1458333333333335);

  const allTop = computeEngineeringCurrentLevel({
    q1a: 5, q1b: 5, q1c: 5,
    q2a: 5, q2b: 5, q2c: 5, q2d: 5,
    q3a: 5, q4a: 5, q5a: 5,
    q6a: 5, q6b: 5,
    q7a: 5, q7b: 5,
    q8a: 5, q8b: 5,
  });
  assert.equal(allTop, 5);

  const allBottom = computeEngineeringCurrentLevel({
    q1a: 1, q1b: 1, q1c: 1,
    q2a: 1, q2b: 1, q2c: 1, q2d: 1,
    q3a: 1, q4a: 1, q5a: 1,
    q6a: 1, q6b: 1,
    q7a: 1, q7b: 1,
    q8a: 1, q8b: 1,
  });
  assert.equal(allBottom, 1);
});

test("questionnaire scoring: production current level averages the 8 questions (CALC1!B20)", () => {
  const level = computeProductionCurrentLevel(defaultProductionAnswers);
  assert.equal(level, 1.25);

  const uniform = computeProductionCurrentLevel({
    q11: 3, q12: 3, q13: 3, q14: 3, q15: 3, q16: 3, q17: 3, q18: 3,
  });
  assert.equal(uniform, 3);
});

test("questionnaire scoring: '0. Select value' (unanswered) is a real, selectable score of 0", () => {
  const level = computeEngineeringCurrentLevel({
    ...defaultEngineeringAnswers,
    q1a: 0,
  });
  assert.ok(level < computeEngineeringCurrentLevel(defaultEngineeringAnswers));
});

test("default report matches every workbook acceptance value (requirement #8)", () => {
  const report = calculate(defaults);

  assert.equal(report.totalPages, 5000);
  assert.equal(report.engineeringHours, 3760);
  assert.equal(report.engineeringCost, 282000);
  assert.equal(Number(report.timePerPage.toFixed(3)), 0.752);
  assert.equal(number2(report.engineeringCurrentLevel), "2.15");
  assert.equal(number1(report.engineeringAsIsRatio * 100), "84.5");
  assert.equal(number2(report.engineeringTargetLevel), "3.68");
  assert.equal(number1(report.engineeringTargetRatio * 100), "58.2");
  assert.equal(Math.round(report.engineeringSavingPotential), 74213);

  assert.equal(report.totalPanels, 100);
  assert.equal(report.productionHours, 7520);
  assert.equal(report.productionCost, 300800);
  assert.equal(Number(report.timePerPanel.toFixed(3)), 75.2);
  assert.equal(number2(report.productionCurrentLevel), "1.25");
  assert.equal(number1(report.productionAsIsRatio * 100), "97.6");
  assert.equal(number2(report.productionTargetLevel), "3.50");
  assert.equal(number1(report.productionTargetRatio * 100), "76.4");
  assert.equal(Math.round(report.productionSavingPotential), 63600);

  const total = report.engineeringSavingPotential + report.productionSavingPotential;
  assert.equal(moneyWithCents(total, "$"), "$137,813.21");
});

function number2(value) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function number1(value) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

test("savings updates: report reflects input FTE/rate/time-share changes", () => {
  const zeroInput = {
    ...defaults,
    projectsPerYear: 0,
    pagesPerProject: 0,
    panelsPerYear: 0,
    engineeringFte: 0,
    engineeringRate: 0,
    productionFte: 0,
    productionRate: 0,
  };
  const zeroReport = calculate(zeroInput);
  assert.equal(zeroReport.engineeringCost, 0);
  assert.equal(zeroReport.productionCost, 0);
  assert.equal(zeroReport.engineeringSavings10, 0);

  const staffedReport = calculate(defaults);
  const moreStaff = calculate({ ...defaults, engineeringFte: 4 });
  assert.ok(moreStaff.engineeringCost > staffedReport.engineeringCost);
  assert.ok(moreStaff.engineeringSavingPotential !== staffedReport.engineeringSavingPotential);
});

test("changing a questionnaire answer updates the current level and total savings", () => {
  const before = calculate(defaults);
  const beforeTotal = before.engineeringSavingPotential + before.productionSavingPotential;

  const after = calculate({
    ...defaults,
    engineeringAnswers: { ...defaults.engineeringAnswers, q1a: 5, q1b: 5, q1c: 5 },
  });
  const afterTotal = after.engineeringSavingPotential + after.productionSavingPotential;

  assert.ok(after.engineeringCurrentLevel > before.engineeringCurrentLevel);
  assert.notEqual(afterTotal, beforeTotal);
});

test("recommendation status updates: below current level is already available", () => {
  assert.equal(
    recommendationStatus(1.5, 2.15, 3.68),
    "Should already be available/implemented",
  );
});

test("recommendation status updates: above target level is a future improvement", () => {
  assert.equal(
    recommendationStatus(4.5, 2.15, 3.68),
    "Possible future improvement",
  );
});

test("recommendation status updates: between current and target is offered now", () => {
  assert.equal(
    recommendationStatus(3, 2.15, 3.68),
    "To be offered/implemented",
  );
});

test("recommendation statuses recompute as current/target levels change", () => {
  const before = calculate(defaults);
  const statusBefore = recommendationStatus(
    2.5,
    before.engineeringCurrentLevel,
    before.engineeringTargetLevel,
  );
  assert.equal(statusBefore, "To be offered/implemented");

  const after = calculate({
    ...defaults,
    engineeringAnswers: {
      ...defaults.engineeringAnswers,
      q1a: 5, q1b: 5, q1c: 5, q2a: 5, q2b: 5, q2c: 5, q2d: 5,
    },
  });
  const statusAfter = recommendationStatus(
    2.5,
    after.engineeringCurrentLevel,
    after.engineeringTargetLevel,
  );
  assert.equal(statusAfter, "Should already be available/implemented");

  const lowerTarget = calculate({ ...defaults, engineeringTargetLevel: 2 });
  const statusLowerTarget = recommendationStatus(
    2.5,
    lowerTarget.engineeringCurrentLevel,
    lowerTarget.engineeringTargetLevel,
  );
  assert.equal(statusLowerTarget, "Possible future improvement");
});

test("recommendation quantity formatting avoids unnecessary decimals and keeps TBD", () => {
  const input = { ...defaults, engineeringFte: 3, productionFte: 5 };
  assert.equal(formatQuantity({ kind: "engineeringFte" }, input), "3");
  assert.equal(formatQuantity({ kind: "productionFte" }, input), "5");
  assert.equal(formatQuantity({ kind: "fixed", value: 4 }, input), "4");
  assert.equal(formatQuantity({ kind: "tbd" }, input), "TBD");

  const fractionalInput = { ...defaults, engineeringFte: 2.5 };
  assert.equal(formatQuantity({ kind: "engineeringFte" }, fractionalInput), "2.5");
  assert.equal(formatCount(2), "2");
  assert.equal(formatCount(2.5), "2.5");
});

test("numeric validation: percentages clamp to 0-100, targets clamp to 1-5, business inputs stay non-negative", () => {
  assert.deepEqual(clampField("etoCurrent", 150), { value: 100, clamped: true });
  assert.deepEqual(clampField("etoCurrent", -10), { value: 0, clamped: true });
  assert.deepEqual(clampField("etoCurrent", 80), { value: 80, clamped: false });

  assert.deepEqual(clampField("engineeringTargetLevel", 10), { value: 5, clamped: true });
  assert.deepEqual(clampField("engineeringTargetLevel", 0), { value: 1, clamped: true });
  assert.deepEqual(clampField("engineeringTargetLevel", 3.68), { value: 3.68, clamped: false });

  assert.deepEqual(clampField("engineeringFte", -3), { value: 1, clamped: true });
  assert.deepEqual(clampField("engineeringFte", 30), { value: 10, clamped: true });
  assert.deepEqual(clampField("engineeringFte", 3), { value: 3, clamped: false });
});
