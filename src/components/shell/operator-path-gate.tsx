import { gateOperatorPath } from "@/lib/nav-server";

export function OperatorPathGate({
  path,
  children,
}: {
  path: string;
  children: React.ReactNode;
}) {
  gateOperatorPath(path);
  return children;
}
