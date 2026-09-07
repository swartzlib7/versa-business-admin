import { OperatorPathGate } from "@/components/shell/operator-path-gate";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <OperatorPathGate path="/records-editor">{children}</OperatorPathGate>;
}
