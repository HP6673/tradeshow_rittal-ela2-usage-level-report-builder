import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the ELA2 quick ROI calculator with workbook defaults applied", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>ELA2 Quick ROI Calculator<\/title>/i);
  assert.match(html, /ELA2 Quick ROI Calculator/i);
  assert.match(html, /Quick inputs/i);
  assert.match(html, /Results\s*(&|&amp;)\s*savings/i);
  assert.match(html, /Recommended offering/i);
  assert.match(html, />Export report</i);
  assert.match(html, /Improvements to engineering/i);
  assert.match(html, /Improvements to production/i);
  assert.match(html, /rittal-logo\.png/);

  // The 5 quick-entry fields must be present.
  assert.match(html, /Company name/i);
  assert.match(html, /What software do you use\?/i);
  assert.match(html, />AutoCAD Electrical</);
  assert.match(html, />SolidWorks Electrical</);
  assert.match(html, />Microstation \(for E(&|&amp;)P\)</);
  assert.match(html, />Other</);
  assert.match(html, /Quantity of engineers/i);
  assert.match(html, /Quantity of panel builders/i);
  assert.match(html, /Quantity of panels per year/i);

  // The old multi-step wizard's detailed questionnaires must be gone — the
  // quick-entry version uses workbook defaults for these instead of asking.
  assert.doesNotMatch(html, /Engineering questionnaire/i);
  assert.doesNotMatch(html, /Panel production questionnaire/i);
  assert.doesNotMatch(html, /Segment \/ industry/i);
  assert.doesNotMatch(html, /External engineering/i);
  assert.doesNotMatch(html, /General rating on ECAD usage/i);

  // Workbook defaults must be applied on load, not a static, misleading
  // $0.00 total — this quick-entry version still needs an instant estimate.
  assert.match(html, /\$137,813\.21/);
  assert.doesNotMatch(html, /\$0\.00/);

  // The reset action must exist (renamed from "Clear assessment" — there's
  // no interactive assessment to clear anymore, just quick-entry fields).
  assert.match(html, />Reset</i);
  assert.doesNotMatch(html, /Clear assessment/i);

  // The export/print report modal is client-state-gated (starts closed, to
  // match the SSR markup and avoid a hydration mismatch) — its content must
  // not leak into the default page render. It's checked directly against
  // app/components/PrintReport.tsx in the "export report" test below.
  assert.doesNotMatch(html, /Back to editor/i);
  assert.doesNotMatch(html, /Print \/ Save as PDF/i);
  assert.doesNotMatch(html, /Export preview/i);
});

test("export report: dedicated preview covers every required section and hides raw form controls", async () => {
  const printReport = await readFile(
    new URL("../app/components/PrintReport.tsx", import.meta.url),
    "utf8",
  );

  // An explicit "Export report" trigger, not window.print() firing
  // automatically; Print/Back actions inside the preview itself.
  assert.match(printReport, /Print \/ Save as PDF/);
  assert.match(printReport, /Back to editor/);
  assert.match(printReport, /onClick=\{\(\) => window\.print\(\)\}/);

  // Cover/header content.
  assert.match(printReport, /rittal-logo\.png/);
  assert.match(printReport, /ELA2 Usage Level Report/);
  assert.match(printReport, /input\.companyName/);
  assert.match(printReport, /input\.ecadTool/);
  assert.match(printReport, /generatedAt/);
  assert.match(printReport, /moneyWithCents\(totalSaving/);
  assert.match(printReport, /engineeringCurrentLevel.*engineeringTargetLevel|engineeringTargetLevel.*engineeringCurrentLevel/s);
  assert.match(printReport, /productionCurrentLevel.*productionTargetLevel|productionTargetLevel.*productionCurrentLevel/s);

  // Executive summary.
  assert.match(printReport, /Executive summary/);
  assert.match(printReport, /Main maturity gap/);
  assert.match(printReport, /Recommendations to be offered/);

  // Key assumptions / input summary.
  assert.match(printReport, /Key assumptions/);
  assert.match(printReport, /Projects \/ year/);
  assert.match(printReport, /Pages \/ project/);
  assert.match(printReport, /Panels \/ year/);
  assert.match(printReport, /ETO current \/ future/);
  assert.match(printReport, /Working hours \/ day/);
  assert.match(printReport, /Working days \/ year/);

  // Results section (engineering/production/total).
  assert.match(printReport, /Engineering results/);
  assert.match(printReport, /Production results/);
  assert.match(printReport, /Total result/);

  // Chart summaries with clear As-is/Target labeling.
  assert.match(printReport, /Usage level charts/);
  assert.match(printReport, /"As-is"/);
  assert.match(printReport, /"Target"/);

  // Recommendations default to "to be offered" only, with "possible future
  // improvement" as a separate appendix; "should already be available" is
  // excluded from the client-facing report entirely.
  assert.match(printReport, /Recommended offering/);
  assert.match(printReport, /Appendix: possible future improvements/);
  assert.match(printReport, /toBeOffered/);
  assert.match(printReport, /futureImprovements/);
  assert.doesNotMatch(printReport, /Should already be available/);

  // The export view must not render the interactive questionnaire (no radio
  // inputs / score selectors).
  assert.doesNotMatch(printReport, /type="radio"/);
  assert.doesNotMatch(printReport, /QuestionnaireSection/);

  // Print CSS: colors preserved, sensible PDF margins.
  const globalsCss = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  assert.match(globalsCss, /@media print/);
  assert.match(globalsCss, /@page/);
  assert.match(globalsCss, /print-color-adjust:\s*exact/);

  // Printing hides the interactive dashboard (nav, header, form controls)
  // and the preview's own on-screen-only chrome.
  const calculator = await readFile(
    new URL("../app/Calculator.tsx", import.meta.url),
    "utf8",
  );
  assert.match(calculator, /<header className="[^"]*print:hidden/);
  assert.match(calculator, /aria-label="Report sections"[\s\S]{0,160}print:hidden/);
  assert.match(printReport, /sticky top-0 z-10[\s\S]{0,160}print:hidden/);
});

test("keeps deployment metadata and source aligned", async () => {
  const [page, layout, calculator, packageJson, wrangler] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/Calculator.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../wrangler.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /export const metadata:\s*Metadata/);
  assert.match(page, /<Calculator \/>/);
  assert.match(layout, /title:\s*"ELA2 Quick ROI Calculator"/);
  assert.match(calculator, /src="\/rittal-logo\.png"/);
  assert.match(packageJson, /"packageManager": "pnpm@11\.9\.0"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(wrangler, /"compatibility_flags": \["nodejs_compat"\]/);
  assert.doesNotMatch(layout, /codex-preview|_sites-preview|themeColor|\bViewport\b/);
});

test("Calculator.tsx delegates to a component/data/lib file structure", async () => {
  const [dataFiles, libFiles, componentFiles] = await Promise.all([
    readdir(new URL("../app/data/", import.meta.url)),
    readdir(new URL("../app/lib/", import.meta.url)),
    readdir(new URL("../app/components/", import.meta.url)),
  ]);

  assert.ok(dataFiles.includes("questionnaire.ts"));
  assert.ok(dataFiles.includes("offers.ts"));
  assert.ok(libFiles.includes("calculations.ts"));
  assert.ok(componentFiles.includes("InputSection.tsx"));
  assert.ok(componentFiles.includes("Charts.tsx"));
  assert.ok(componentFiles.includes("ReportSummary.tsx"));
  assert.ok(componentFiles.includes("Recommendations.tsx"));
  assert.ok(componentFiles.includes("PrintReport.tsx"));

  const calculator = await readFile(new URL("../app/Calculator.tsx", import.meta.url), "utf8");
  assert.ok(
    calculator.split("\n").length < 420,
    "Calculator.tsx should stay a thin orchestrator, not a monolith",
  );
});

test("fixed oversized min-widths are confined to intentionally scrollable table/chart containers", async () => {
  const componentDir = new URL("../app/components/", import.meta.url);
  const files = await readdir(componentDir);
  const fixedWidthPattern = /min-w-\[\d+px\]/g;
  // These three render their own `overflow-x-auto` wrapper (contained
  // horizontal scroll for a data-dense desktop table/chart) and are hidden
  // below their responsive breakpoint in favor of stacked cards — this is
  // the deliberate exception, not the input controls.
  const allowed = new Set(["Charts.tsx", "Recommendations.tsx", "ReportSummary.tsx"]);

  for (const file of files) {
    const contents = await readFile(new URL(file, componentDir), "utf8");
    const matches = contents.match(fixedWidthPattern) ?? [];

    if (allowed.has(file)) {
      assert.ok(matches.length > 0, `${file} should keep its scrollable min-width`);
    } else {
      assert.equal(
        matches.length,
        0,
        `${file} should not rely on a fixed oversized min-width (found: ${matches.join(", ")})`,
      );
    }
  }
});
