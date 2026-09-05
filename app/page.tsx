import type { Metadata } from "next";
import { Calculator } from "./Calculator";

export const metadata: Metadata = {
  title: "Trade Show ROI Calculator",
  description:
    "A quick-entry ROI calculator for trade show booths — company, software, and staffing in, instant savings estimate out.",
};

export default function Home() {
  return <Calculator />;
}
