import { redirect } from "next/navigation";

/** Gallery lives on Glossary, after Org Board. */
export default function UIComponentsPage() {
  redirect("/glossary?tab=ui-components");
}
