import type { Metadata } from "next";
import { Calculator } from "./Calculator";

export const metadata: Metadata = {
  title: "ELA2 Quick ROI Calculator",
  description:
    "A quick-entry ROI calculator — company, software, and staffing in, instant savings estimate out.",
};

export default function Home() {
  return <Calculator />;
}
