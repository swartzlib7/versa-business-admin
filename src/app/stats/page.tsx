import { DynamicZonePage } from "@/components/zones/dynamic-zone-page";
import { statsZone } from "@/lib/zones/zone-definitions";

export default function StatsPage() {
  return <DynamicZonePage config={statsZone} parentKind="environment" />;
}
