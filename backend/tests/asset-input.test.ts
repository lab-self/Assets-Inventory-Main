import { expect, it } from "vitest";
import { createAssetSchema, updateAssetSchema } from "../src/models/assets/asset.schemas.js";

it("accepts blank optional text fields submitted by the asset form", () => {
  const optionalFields = {
    manufacturer: "", model: "", hostname: "", operatingSystem: "",
    cpu: "", gpu: "", vendor: " ", invoiceNumber: "", notes: "",
  };
  const id = "00000000-0000-4000-8000-000000000001";
  const created = createAssetSchema.parse({
    assetTag: "PC-1", serialNumber: "SN-1",
    categoryId: id, statusId: id, companyId: id, ...optionalFields,
  });
  const updated = updateAssetSchema.parse(optionalFields);
  for (const field of Object.keys(optionalFields)) {
    expect(Reflect.get(created, field)).toBeNull();
    expect(Reflect.get(updated, field)).toBeNull();
  }
  expect(updateAssetSchema.parse({ model: " Model A " }).model).toBe("Model A");
  expect(createAssetSchema.safeParse({ ...created, assetTag: " " }).success).toBe(false);
});
