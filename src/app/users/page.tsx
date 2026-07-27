import { redirect } from "next/navigation";

/** I5.6.41 — /users deep-links to Settings Users tab. */
export default function UsersPage() {
  redirect("/settings?tab=users");
}
