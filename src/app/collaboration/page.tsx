import { DynamicZonePage } from "@/components/zones/dynamic-zone-page";
import { collaborationZone } from "@/lib/zones/zone-definitions";
export default function CollaborationZonePage() { return <DynamicZonePage config={collaborationZone} parentKind="collaboration" />; }
