import { adapter } from "@/lib/data/adapter";
import { getInstance } from "@/lib/fixtures/record-instances";
import { pairingTypeAllowed, stampPairingData } from "@/lib/public/driver-pairings";

export async function stampPairingFromDriver(
  incoming: Record<string, string>,
): Promise<{ ok: true; data: Record<string, string> } | { ok: false; message: string }> {
  const driverId = String(incoming.driver_id ?? "").trim();
  if (!driverId) return { ok: false, message: "Pick a Rendering Driver." };
  const row = adapter.getRecord ? await adapter.getRecord(driverId) : getInstance(driverId);
  const codeKey = String((row?.data as Record<string, unknown> | undefined)?.code_key ?? "").trim();
  if (!codeKey) return { ok: false, message: "That driver has no code key." };
  const targetType = String(incoming.target_record_type ?? "").trim();
  if (targetType && !pairingTypeAllowed(codeKey, targetType)) {
    return { ok: false, message: "That record type is not compatible with this driver." };
  }
  return { ok: true, data: stampPairingData(incoming, codeKey) };
}
