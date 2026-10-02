import { redirect } from "next/navigation";

/** Statistics lives under Custom Records → Statistics. */
export default function StatsPage() {
  redirect("/custom-records");
}
