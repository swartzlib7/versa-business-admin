import { redirect } from "next/navigation";

/** S-5: Statistics lives under Environment → Custom → Statistics. */
export default function StatsPage() {
  redirect("/environment");
}
