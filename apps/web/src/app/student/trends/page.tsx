// Trend Analysis temporarily disabled.
// import TrendAnalysis from "@/features/reports/components/TrendAnalysis";
import { redirect } from "next/navigation";

export default function StudentTrendsPage() {
  // return <TrendAnalysis />;
  redirect("/student/dashboard");
}
