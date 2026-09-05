// "To be offered" sheet — recommended engineering/production offerings and
// the status rule that places each one relative to the customer's current
// and target usage levels.

import { formatCount, type Inputs } from "../lib/calculations.ts";

export type RecommendationQuantity =
  | { kind: "fixed"; value: number }
  | { kind: "engineeringFte" }
  | { kind: "productionFte" }
  | { kind: "tbd" };

export type RecommendationItem = {
  item: string;
  type: string;
  quantity: RecommendationQuantity;
  neededFromLevel: number;
};

export type RecommendationStatus =
  | "Should already be available/implemented"
  | "Possible future improvement"
  | "To be offered/implemented";

export const recommendationStatuses: RecommendationStatus[] = [
  "To be offered/implemented",
  "Possible future improvement",
  "Should already be available/implemented",
];

// "To be offered" sheet, "Improvements to engineering" table (A2:E16).
export const engineeringRecommendations: RecommendationItem[] = [
  { item: "Electric P8 Professional", type: "Software", quantity: { kind: "engineeringFte" }, neededFromLevel: 1.5 },
  { item: "Electric P8 basic training 5/8 days", type: "Training", quantity: { kind: "engineeringFte" }, neededFromLevel: 1.5 },
  { item: "IT implementation", type: "Consultancy", quantity: { kind: "fixed", value: 1 }, neededFromLevel: 1.5 },
  { item: "Setting up the EPLAN Project environment", type: "Consultancy", quantity: { kind: "fixed", value: 3 }, neededFromLevel: 1.5 },
  { item: "Product workshop Electric P8", type: "Consultancy", quantity: { kind: "fixed", value: 4 }, neededFromLevel: 2 },
  { item: "Creation of design data", type: "Consultancy", quantity: { kind: "fixed", value: 2 }, neededFromLevel: 2 },
  { item: "Macro training", type: "Training", quantity: { kind: "fixed", value: 2 }, neededFromLevel: 2.5 },
  { item: "Creation of design data", type: "Consultancy", quantity: { kind: "fixed", value: 2 }, neededFromLevel: 2.5 },
  { item: "Cogineer/eBUILD or EEC", type: "Software", quantity: { kind: "engineeringFte" }, neededFromLevel: 3 },
  { item: "Cogineer/eBUILD or EEC training", type: "Training", quantity: { kind: "engineeringFte" }, neededFromLevel: 3 },
  { item: "Automated schematic creation with eBuild / Cogineer", type: "Consultancy", quantity: { kind: "fixed", value: 4 }, neededFromLevel: 3 },
  { item: "Product structuring", type: "Consultancy", quantity: { kind: "fixed", value: 3 }, neededFromLevel: 3.5 },
  { item: "Optimizing workflows", type: "Consultancy", quantity: { kind: "fixed", value: 2 }, neededFromLevel: 4 },
  { item: "EPIS interface", type: "Software", quantity: { kind: "engineeringFte" }, neededFromLevel: 4.5 },
  { item: "EPIS requirement workshop", type: "Consultancy", quantity: { kind: "fixed", value: 3 }, neededFromLevel: 4.5 },
];

// "To be offered" sheet, "Improvements to production" table (A19:E37).
export const productionRecommendations: RecommendationItem[] = [
  { item: "Schematic derivations for production optimization", type: "Consultancy", quantity: { kind: "fixed", value: 2 }, neededFromLevel: 1.5 },
  { item: "Pro Panel Professional", type: "Software", quantity: { kind: "engineeringFte" }, neededFromLevel: 2 },
  { item: "Pro Panel Basic training 4 days", type: "Training", quantity: { kind: "engineeringFte" }, neededFromLevel: 2 },
  { item: "Setting up the EPLAN Project environment 3D", type: "Consultancy", quantity: { kind: "fixed", value: 2 }, neededFromLevel: 2 },
  { item: "Product workshop Pro Panel", type: "Consultancy", quantity: { kind: "fixed", value: 3 }, neededFromLevel: 2 },
  { item: "Creation of design data 3D", type: "Consultancy", quantity: { kind: "fixed", value: 3 }, neededFromLevel: 2 },
  { item: "Label printing machine", type: "Machine", quantity: { kind: "tbd" }, neededFromLevel: 2.5 },
  { item: "Routing & Production Elements", type: "Software", quantity: { kind: "engineeringFte" }, neededFromLevel: 3.5 },
  { item: "Wire Production Elements", type: "Software", quantity: { kind: "engineeringFte" }, neededFromLevel: 3.5 },
  { item: "EPLAN Smart Wiring", type: "Software", quantity: { kind: "productionFte" }, neededFromLevel: 3.5 },
  { item: "Semi automatic wire fabrication machine", type: "Machine", quantity: { kind: "tbd" }, neededFromLevel: 3.5 },
  { item: "Wiring training 1 day", type: "Training", quantity: { kind: "engineeringFte" }, neededFromLevel: 3.5 },
  { item: "EPLAN Pro Panel Production NC-DXF", type: "Software", quantity: { kind: "tbd" }, neededFromLevel: 4 },
  { item: "Perforex NC machine", type: "Machine", quantity: { kind: "tbd" }, neededFromLevel: 4 },
  { item: "Commissioning EPLAN interface to RSS machines", type: "Consultancy", quantity: { kind: "fixed", value: 1 }, neededFromLevel: 4 },
  { item: "Copper Design Elements", type: "Software", quantity: { kind: "engineeringFte" }, neededFromLevel: 4.5 },
  { item: "Secarex cutting machine", type: "Machine", quantity: { kind: "tbd" }, neededFromLevel: 4.5 },
  { item: "Wire Terminal wire fabrication or external supplier", type: "Machine", quantity: { kind: "tbd" }, neededFromLevel: 4.5 },
  { item: "Athex terminal strip machine", type: "Machine", quantity: { kind: "tbd" }, neededFromLevel: 5 },
];

// "To be offered" sheet status formula, e.g. D2:
// =IF(E2<CALC1!$T$3,"Should already be available/implemented",
//   IF(CALC1!$U$3<E2,"Possible future improvement","To be offered/implemented"))
export function recommendationStatus(
  neededFromLevel: number,
  currentLevel: number,
  targetLevel: number,
): RecommendationStatus {
  if (neededFromLevel < currentLevel) {
    return "Should already be available/implemented";
  }

  if (targetLevel < neededFromLevel) {
    return "Possible future improvement";
  }

  return "To be offered/implemented";
}

export function formatQuantity(quantity: RecommendationQuantity, input: Inputs) {
  switch (quantity.kind) {
    case "fixed":
      return formatCount(quantity.value);
    case "tbd":
      return "TBD";
    case "engineeringFte":
      return formatCount(input.engineeringFte);
    case "productionFte":
      return formatCount(input.productionFte);
    default:
      return "";
  }
}
