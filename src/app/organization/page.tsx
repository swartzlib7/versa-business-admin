import { DynamicZonePage } from "@/components/zones/dynamic-zone-page";
import { organizationZone } from "@/lib/zones/zone-definitions";
export default function OrganizationZonePage() { return <DynamicZonePage config={organizationZone} parentKind="faculty" />; }
