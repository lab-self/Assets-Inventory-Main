import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api, Badge, SettingForm } from "./App";

afterEach(() => vi.unstubAllGlobals());

it.each([false, 0, null])("preserves the setting value %j when editing", (value) => {
  const html = renderToStaticMarkup(<SettingForm item={{ id: "setting-1", setting_value: value }} close={() => {}} saved={() => {}} />);
  expect(html).toContain(`>${JSON.stringify(value)}</textarea>`);
});

it("unwraps API responses and sends the saved access token", async () => {
  vi.stubGlobal("localStorage", { getItem: () => "test-token" });
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: { id: "asset-1" } })));
  vi.stubGlobal("fetch", fetchMock);
  await expect(api("/assets/asset-1")).resolves.toEqual({ id: "asset-1" });
  expect(fetchMock.mock.calls[0]?.[1].headers.get("Authorization")).toBe("Bearer test-token");
});

it.each([
  ['{"error":{"message":"Session expired"}}', 401, "Session expired"],
  ["<html>Bad gateway</html>", 502, "Request failed (502)"],
  ['{"message":"Forbidden"}', 403, "Forbidden"],
])("handles unsuccessful API responses", async (body, status, message) => {
  const removeItem = vi.fn();
  vi.stubGlobal("localStorage", { getItem: () => "test-token", removeItem });
  vi.stubGlobal("window", { dispatchEvent: vi.fn() });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { status })));
  await expect(api("/assets")).rejects.toThrow(message);
  expect(removeItem).toHaveBeenCalledTimes(status === 401 ? 1 : 0);
});

describe("status badges", () => {
  it.each(["Inactive", "Unassigned", "Unavailable", "Disabled"])(
    "does not show %s as active",
    (value) => {
      expect(renderToStaticMarkup(<Badge value={value} />)).toContain('class="status-badge inactive"');
    },
  );
  it.each(["Active", "Assigned", "Good", "In Stock", "Available"])(
    "shows %s as active",
    (value) => {
      expect(renderToStaticMarkup(<Badge value={value} />)).toContain('class="status-badge active"');
    },
  );
});
