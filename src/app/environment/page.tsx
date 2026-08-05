import { DynamicZonePage } from "@/components/zones/dynamic-zone-page";
import { environmentZone } from "@/lib/zones/zone-definitions";
export default function EnvironmentZonePage() { return <DynamicZonePage config={environmentZone} parentKind="environment" />; }
