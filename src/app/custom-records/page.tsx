import { DynamicZonePage } from "@/components/zones/dynamic-zone-page";
import { customRecordsZone } from "@/lib/zones/zone-definitions";

export default function CustomRecordsPage() {
  return <DynamicZonePage config={customRecordsZone} parentKind="environment" />;
}
