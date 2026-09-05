// Answer scoring mirrored from the ELA2 workbook's `Questionnaire` sheet.
// Pure data/types — no React, no formatting — so it can be unit tested and
// reused by any UI.

export type EngineeringAnswers = {
  q1a: number;
  q1b: number;
  q1c: number;
  q2a: number;
  q2b: number;
  q2c: number;
  q2d: number;
  q3a: number;
  q4a: number;
  q5a: number;
  q6a: number;
  q6b: number;
  q7a: number;
  q7b: number;
  q8a: number;
  q8b: number;
};

export type ProductionAnswers = {
  q11: number;
  q12: number;
  q13: number;
  q14: number;
  q15: number;
  q16: number;
  q17: number;
  q18: number;
};

// Matches the answers currently selected in Questionnaire!C5:C34 (engineering)
// and C41:C62 (production) in the source workbook.
export const defaultEngineeringAnswers: EngineeringAnswers = {
  q1a: 1,
  q1b: 1,
  q1c: 3,
  q2a: 3,
  q2b: 1,
  q2c: 3,
  q2d: 3,
  q3a: 3,
  q4a: 1,
  q5a: 1,
  q6a: 3,
  q6b: 3,
  q7a: 3,
  q7b: 3,
  q8a: 3,
  q8b: 1,
};

export const defaultProductionAnswers: ProductionAnswers = {
  q11: 2,
  q12: 1,
  q13: 1,
  q14: 1,
  q15: 1,
  q16: 2,
  q17: 1,
  q18: 1,
};

export const avg = (...values: number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

// CALC1!B4 — average of the 8 engineering section averages (E4, E9, E15,
// E18, E21, E24, E28, E32).
export function computeEngineeringCurrentLevel(answers: EngineeringAnswers) {
  const sectionAverages = [
    avg(answers.q1a, answers.q1b, answers.q1c),
    avg(answers.q2a, answers.q2b, answers.q2c, answers.q2d),
    answers.q3a,
    answers.q4a,
    answers.q5a,
    avg(answers.q6a, answers.q6b),
    avg(answers.q7a, answers.q7b),
    avg(answers.q8a, answers.q8b),
  ];

  return avg(...sectionAverages);
}

// CALC1!B20 — average of the 8 production question answers (E40, E43, E46,
// E49, E52, E55, E58, E61).
export function computeProductionCurrentLevel(answers: ProductionAnswers) {
  return avg(
    answers.q11,
    answers.q12,
    answers.q13,
    answers.q14,
    answers.q15,
    answers.q16,
    answers.q17,
    answers.q18,
  );
}

// The trade show version doesn't collect interactive questionnaire answers —
// `defaultEngineeringAnswers`/`defaultProductionAnswers` above feed the
// estimate as-is, so the original report builder's per-question
// section/prompt/option definitions aren't needed here.
