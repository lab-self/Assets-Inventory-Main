import { beforeEach, expect, it, vi } from "vitest";
import { getAssetById, updateAssetById } from "../src/models/assets/asset.repository.js";
import { updateExistingAsset } from "../src/models/assets/asset.service.js";

vi.mock("../src/models/assets/asset.repository.js", () => ({
  getAssetById: vi.fn(),
  updateAssetById: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getAssetById).mockResolvedValue({
    id: "asset-1",
    purchase_date: "2026-01-01",
    warranty_start_date: "2026-02-01",
    warranty_end_date: "2026-03-01",
  } as NonNullable<Awaited<ReturnType<typeof getAssetById>>>);
});

it.each([
  { purchaseDate: null, warrantyStartDate: "2025-12-01" },
  { warrantyStartDate: null, purchaseDate: "2026-02-15" },
  { warrantyEndDate: null, warrantyStartDate: "2026-04-01" },
])("allows explicitly clearing a date: %j", async (input) => {
  await updateExistingAsset("asset-1", input);
  expect(updateAssetById).toHaveBeenCalledWith("asset-1", input);
});

it.each([
  { purchaseDate: "2026-02-15" },
  { warrantyStartDate: "2025-12-01" },
  { warrantyEndDate: "2026-01-15" },
])("still validates dates omitted from a patch: %j", async (input) => {
  await expect(updateExistingAsset("asset-1", input)).rejects.toMatchObject({ statusCode: 400 });
  expect(updateAssetById).not.toHaveBeenCalled();
});
