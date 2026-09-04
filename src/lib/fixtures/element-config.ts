/**
 * Fixture-mode element_config (division head + deputy).
 * Beta :3200 runs DATA_SOURCE=fixture; the postgres store must not be called.
 */

export interface ElementConfigShape {
  element_api_name: string;
  head_user_id: string | null;
  deputy_user_id: string | null;
  config: Record<string, unknown>;
}

export interface UpsertElementConfigInput {
  head_user_id?: string | null;
  deputy_user_id?: string | null;
  config?: Record<string, unknown>;
}

const store = new Map<string, ElementConfigShape>();

export function getElementConfigFixture(elementApiName: string): ElementConfigShape | null {
  return store.get(elementApiName) ?? null;
}

export function upsertElementConfigFixture(
  elementApiName: string,
  input: UpsertElementConfigInput,
): ElementConfigShape {
  const existing = store.get(elementApiName);
  const next: ElementConfigShape = {
    element_api_name: elementApiName,
    head_user_id: input.head_user_id !== undefined ? input.head_user_id : (existing?.head_user_id ?? null),
    deputy_user_id: input.deputy_user_id !== undefined ? input.deputy_user_id : (existing?.deputy_user_id ?? null),
    config: input.config ?? existing?.config ?? {},
  };
  store.set(elementApiName, next);
  return next;
}
