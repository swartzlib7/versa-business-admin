import assert from "node:assert/strict";
import test from "node:test";
(globalThis as Record<string, unknown>).__versaSampleDataHydrated__ = true;
const load = async () => ({ ...(await import("../fixtures/catalog")), ...(await import("./layout-storage")), ...(await import("./documents-objects")) });

test("every business type has Documents & Photos (Attachments); system types do not", async () => {
  const { DOCUMENTS_OBJECTS, listFieldDefinitions } = await load();
  for (const object of DOCUMENTS_OBJECTS) {
    const field = listFieldDefinitions(object).find((f) => f.api_name === "documents");
    assert.equal(field?.data_type, "attachments", object);
  }
  for (const object of ["vendor", "customer", "page", "render_driver", "vendor_credential", "vendor_integration", "vendor_exchange", "statistics"]) {
    assert.equal(listFieldDefinitions(object).some((f) => f.data_type === "attachments"), false, object);
  }
});

test("a layout saved before 1.0.23 gets a Documents section; a placed field is left alone", async () => {
  const { applyLayoutOverlay, getLayoutConfig } = await load();
  applyLayoutOverlay({
    layoutConfigs: [
      { objectApiName: "contact", layoutType: "edit", sections: [{ id: "main", label: "Main", columns: 2, fields: [{ api_name: "name", label: "Name", visible: true, span: 1 }] }] },
      { objectApiName: "event", layoutType: "edit", sections: [{ id: "main", label: "Main", columns: 2, fields: [{ api_name: "documents", label: "Docs", visible: false, span: 1 }] }] },
      { objectApiName: "page", layoutType: "edit", sections: [{ id: "main", label: "Main", columns: 1, fields: [{ api_name: "name", label: "Name", visible: true, span: 1 }] }] },
    ],
  });
  assert.deepEqual(getLayoutConfig("contact", "edit")?.sections.map((s) => s.id), ["main", "sec-documents"]);
  assert.deepEqual(getLayoutConfig("event", "edit")?.sections.map((s) => s.id), ["main"]);
  assert.deepEqual(getLayoutConfig("page", "edit")?.sections.map((s) => s.id), ["main"]);
});
