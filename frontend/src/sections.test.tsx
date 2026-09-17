// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import App from "./App";

let root: Root;
let host: HTMLDivElement;
const id = "00000000-0000-4000-8000-000000000001";
const assignmentAssets = [
  { id: `${id.slice(0, -1)}3`, asset_tag: "PC-1", hostname: "charlie", serial_number: "SN-3", category_name: "Laptop", manufacturer: "Dell", model: "Latitude" },
  { id: `${id.slice(0, -1)}2`, asset_tag: "PC-2", hostname: "bravo", serial_number: "SN-2", category_name: "Desktop" },
  { id, asset_tag: "PC-3", hostname: "alpha", serial_number: "SN-1", category_name: "Laptop" },
  ...Array.from({ length: 98 }, (_, index) => ({
    id: `00000000-0000-4000-8000-${String(index + 100).padStart(12, "0")}`,
    asset_tag: `PC-${index + 4}`,
    hostname: `workstation-${String(index + 1).padStart(3, "0")}`,
    serial_number: `SN-${index + 4}`,
  })),
];
const posts: { path: string; body: Record<string, unknown> }[] = [];
let assignment: { user_id: string; user_first_name: string; user_last_name: string } | null = null;
let assignmentFails = false;
let preferences = { appName: "Inventory Management", pageSize: 25 };
const user = { id, email: "admin@example.test", firstName: "Admin", isSuperAdmin: true, permissions: [] as string[] };

beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  posts.length = 0;
  assignment = null;
  assignmentFails = false;
  preferences = { appName: "Inventory Management", pageSize: 25 };
  user.isSuperAdmin = true;
  user.permissions = [];
  localStorage.setItem("inventory_access_token", "test-token");
  vi.stubGlobal("fetch", vi.fn(async (url: string, options?: RequestInit) => {
    const path = url.split("?")[0];
    let data: unknown = [];
    if (options?.method === "POST" || options?.method === "PATCH") {
      posts.push({ path: path!, body: JSON.parse(options.body as string) });
      if (posts.at(-1)?.body.settingKey === "app.name") preferences.appName = String(posts.at(-1)!.body.settingValue);
      if (posts.at(-1)?.body.settingKey === "app.default_page_size") preferences.pageSize = Number(posts.at(-1)!.body.settingValue);
      data = { id };
    } else if (path === "/api/auth/me") data = user;
    else if (path?.endsWith("/assignment")) {
      if (assignmentFails) return { ok: false, status: 500, text: async () => JSON.stringify({ message: "Lookup unavailable" }) };
      data = assignment;
    }
    else if (path === "/api/preferences") data = preferences;
    else if (path === "/api/dashboard/summary") data = { totals: {}, byType: [], recentActivity: [] };
    else if (path?.startsWith("/api/reports/")) {
      if (path.endsWith("/export")) return { ok: true, status: 200, blob: async () => new Blob(["workbook"]) };
      data = path === "/api/reports/assets" ? [{ asset_tag: "REPORT-PC", gpu: "NVIDIA GeForce RTX 4090", graphics_memory_gb: 24, notes: "Report remarks", warranty_expiry: "2027-01-01" }] : [{ employee_name: "Report Employee", assigned_date: "2026-01-01" }];
    }
    else if (path === "/api/users" && url.includes("status=active")) {
      const employees = [{ id, firstName: "Employee", email: "employee@example.test", status: "active" }, ...Array.from({ length: 100 }, (_, index) => ({ id: `employee-${index}`, firstName: `Employee ${index}`, email: `employee-${index}@example.test`, status: "active" }))];
      const page = Number(new URL(url, "http://localhost").searchParams.get("page"));
      data = { data: employees.slice((page - 1) * 100, page * 100), pagination: { total: employees.length } };
    }
    else if (["/api/companies", "/api/departments", "/api/locations", "/api/users"].includes(path!)) data = { data: [{ id, name: "Test record", firstName: "Employee", email: "employee@example.test", website: "https://example.test", company_id: id, status: "active" }] };
    else if (["/api/assets/categories", "/api/assets/statuses", "/api/roles"].includes(path!)) data = [{ id, name: "Available" }];
    else if (path === "/api/settings") data = [{ id, setting_key: "test.value", category: "general", setting_value: false }];
    else if (["/api/assets", "/api/autodesk", "/api/teams"].includes(path!)) {
      if (url.includes("sortBy=hostname")) {
        const page = Number(new URL(url, "http://localhost").searchParams.get("page"));
        data = { rows: assignmentAssets.slice((page - 1) * 100, page * 100), total: assignmentAssets.length };
      } else data = { rows: [{ id, asset_tag: "PC-1", serial_number: "SN-1" }], total: 1 };
    }
    return { ok: true, status: 200, text: async () => JSON.stringify(data) };
  }));
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<App />));
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  localStorage.clear();
  vi.unstubAllGlobals();
});

async function click(text: string) {
  const button = [...host.querySelectorAll("button")].find((item) => item.textContent?.trim() === text);
  expect(button, `Missing button: ${text}`).toBeTruthy();
  await act(async () => button!.click());
}

async function fill(label: string, value: string) {
  const field = host.querySelector(`[aria-label="${label}"]`) || [...host.querySelectorAll("label")].find((item) => item.querySelector("span")?.textContent === label)?.querySelector("input,select,textarea");
  expect(field, `Missing field: ${label}`).toBeTruthy();
  await act(async () => {
    const prototype = field instanceof HTMLSelectElement ? HTMLSelectElement.prototype : field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(field, value);
    field!.dispatchEvent(new Event(field instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }));
  });
}

it.each(["Dashboard", "Peripherals", "Assets Management", "Company", "Department", "User Management", "AUTODESK", "Teams", "Reports", "Settings"])("renders the %s section and its icons", async (section) => {
  await click(section);
  expect(host.querySelector("h1")?.textContent).toBe(section);
  expect(host.querySelectorAll("nav button svg").length).toBe(10);
  for (const button of host.querySelectorAll("button")) {
    if (!button.textContent?.trim()) expect(button.getAttribute("aria-label") || button.getAttribute("title")).toBeTruthy();
  }
});

it.each([
  ["Company", "Add Company", "/api/companies", { "Company Name": "New Company", Website: "https://new-company.test" }],
  ["Department", "Add Department", "/api/departments", { Company: id, "Department Name": "IT" }],
  ["Peripherals", "Add Asset", "/api/assets", { "Asset Tag / Hostname": "PC-2", "Serial Number": "SN-2", "Device Type": id, Status: id, Company: id }],
  ["User Management", "Add User", "/api/users", { "Employee ID": "E-2", "First Name": "Employee", Email: "new@example.test", Password: "test-password-123" }],
  ["AUTODESK", "Add License", "/api/autodesk", {}],
  ["Teams", "Add Teams Account", "/api/teams", { Employee: id, "Teams Email": "teams@example.test" }],
  ["Settings", "Add Setting", "/api/settings", { "Setting Key": "test.value", Value: "false" }],
] as const)("submits the %s add form", async (section, action, path, values) => {
  await click(section);
  await click(action);
  expect(host.querySelector('[aria-label="Close dialog"] svg')).toBeTruthy();
  for (const [label, value] of Object.entries(values)) await fill(label, value);
  const form = (host.querySelector<HTMLFormElement>('[role="dialog"] form') || host.querySelector("form"))!;
  expect(form.checkValidity()).toBe(true);
  await act(async () => form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  expect(posts.at(-1)?.path).toBe(path);
  if (section === "Peripherals") expect(posts.at(-1)?.body.hostname).toBe("PC-2");
  if (section === "Company") expect(posts.at(-1)?.body.website).toBe("https://new-company.test");
  expect(host.querySelector('[role="dialog"]')).toBeNull();
});

it("returns to login when the session expires", async () => {
  await act(async () => window.dispatchEvent(new Event("inventory-session-expired")));
  expect(host.textContent).toContain("Sign in to workspace");
});

it.each([
  ["Company", "/api/companies", { "Company Name": "Edited Company", Website: "https://edited-company.test" }],
  ["Department", "/api/departments", { "Department Name": "Edited Department" }],
  ["Peripherals", "/api/assets", { "Device Type": id, Status: id, Company: id, Model: "Edited Model" }],
  ["User Management", "/api/users", { "Employee ID": "E-1", "First Name": "Edited Employee" }],
  ["AUTODESK", "/api/autodesk", { "License Type": "revit" }],
  ["Teams", "/api/teams", { Employee: id, "Teams Email": "edited@example.test" }],
  ["Settings", "/api/settings", { Value: "0" }],
] as const)("submits the %s edit form", async (section, path, values) => {
  await click(section);
  const edit = [...host.querySelectorAll("button")].find(button => button.textContent?.trim() === "Edit" || button.getAttribute("aria-label") === "Edit asset");
  expect(edit).toBeTruthy();
  await act(async () => edit!.click());
  for (const [label, value] of Object.entries(values)) await fill(label, value);
  const form = (host.querySelector<HTMLFormElement>('[role="dialog"] form') || host.querySelector("form"))!;
  expect(form.checkValidity()).toBe(true);
  await act(async () => form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  expect(posts.at(-1)?.path).toBe(`${path}/${id}`);
  expect(host.querySelector('[role="dialog"]')).toBeNull();
});

it("submits an asset assignment", async () => {
  await click("Assets Management");
  const options = [...host.querySelectorAll('select[required]')[0]!.querySelectorAll("option")].slice(1);
  expect(options.slice(0, 3).map((option) => option.textContent)).toEqual(["alpha", "bravo", "charlie"]);
  expect(options).toHaveLength(101);
  expect(options.at(-1)?.textContent).toBe("workstation-098");
  expect(options.every((option) => !option.textContent?.includes("PC-"))).toBe(true);
  expect(options.every((option) => !option.textContent?.includes("SN-"))).toBe(true);
  expect(options.every((option) => !option.textContent?.includes("Dell"))).toBe(true);
  expect(host.querySelectorAll("select")[1]!.options[1]!.textContent).toBe("Employee");
  expect(host.querySelectorAll("select")[1]!.disabled).toBe(false);
  expect(host.querySelectorAll("select")[1]!.options).toHaveLength(102);
  expect(host.querySelectorAll("select")[1]!.options[101]!.textContent).toBe("Employee 99");
  await fill("Employee", id);
  await fill("Asset", id);
  expect(host.querySelector('[aria-label="alpha peripheral details"]')).toBeTruthy();
  await act(async () => (host.querySelector<HTMLFormElement>('[role="dialog"] form') || host.querySelector("form"))!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  expect(posts.at(-1)).toEqual({ path: `/api/assets/${id}/assign`, body: { userId: id } });
});

it.each(["reassign", "return"])("submits an asset %s and clears the selection", async (action) => {
  assignment = { user_id: "other-user", user_first_name: "Current", user_last_name: "Employee" };
  await click("Assets Management");
  await fill("Asset", id);
  expect(host.textContent).toContain("Assigned to Current Employee");
  expect(host.textContent).toContain("already assigned to Current Employee");
  if (action === "reassign") {
    await fill("Employee", id);
    await click("Reassign Asset");
  } else await click("Return Asset");
  expect(posts.at(-1)).toEqual({ path: `/api/assets/${id}/${action}`, body: action === "reassign" ? { newUserId: id } : {} });
  expect(host.querySelector("select")!.value).toBe("");
});

it("blocks assignment after a lookup failure and recovers after reselection", async () => {
  assignmentFails = true;
  await click("Assets Management");
  await fill("Asset", id);
  expect(host.querySelector('[role="alert"]')?.textContent).toContain("Lookup unavailable");
  expect(host.querySelector<HTMLButtonElement>('button.primary-button')!.disabled).toBe(true);
  await act(async () => (host.querySelector<HTMLFormElement>('[role="dialog"] form') || host.querySelector("form"))!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  expect(posts).toHaveLength(0);
  assignmentFails = false;
  await fill("Asset", "");
  await fill("Asset", id);
  await fill("Employee", id);
  await click("Assign Asset");
  expect(posts.at(-1)?.path).toBe(`/api/assets/${id}/assign`);
});

it("uses official Autodesk product labels while preserving API values", async () => {
  await click("AUTODESK");
  await click("Add License");
  const licenseType = [...host.querySelectorAll("select")].find((select) =>
    [...select.options].some((option) => option.value === "3ds_max"),
  )!;
  expect([...licenseType.options].find((option) => option.value === "aec")?.textContent).toBe("Autodesk AEC Collection");
  expect([...licenseType.options].find((option) => option.value === "3ds_max")?.textContent).toBe("3ds Max");
  await fill("License Type", "other");
  expect([...host.querySelectorAll("label")].some((label) => label.textContent?.includes("Other License Type"))).toBe(true);
});

it("shows a text field for a custom setting category", async () => {
  await click("Settings");
  await click("Add Setting");
  await fill("Setting Key", "custom.setting");
  await fill("Value", "enabled");
  await fill("Category", "other");
  expect([...host.querySelectorAll("label")].some((label) => label.textContent?.includes("Other Category"))).toBe(true);
  await fill("Other Category", "Operations");
  const form = (host.querySelector<HTMLFormElement>('[role="dialog"] form') || host.querySelector("form"))!;
  await act(async () => form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  expect(posts.at(-1)?.body.category).toBe("Operations");
});

it("shows a restricted user's first permitted section without edit controls", async () => {
  await act(async () => root.unmount());
  user.isSuperAdmin = false;
  user.permissions = ["ASSET_VIEW"];
  root = createRoot(host);
  await act(async () => root.render(<App />));
  expect(host.querySelector("h1")?.textContent).toBe("Peripherals");
  expect(host.textContent).not.toContain("Add Asset");
  expect(host.querySelector('[aria-label="Edit asset"]')).toBeNull();
});

it.each([["Assets Management", ""], ["AUTODESK", "Add License"], ["Teams", "Add Teams Account"]])("shows employee names without email in %s", async (section, action) => {
  await click(section);
  if (action) await click(action);
  const employee = [...host.querySelectorAll("label")].find(label => label.querySelector("span")?.textContent === "Employee")!.querySelector("select")!;
  expect(employee.options[1]!.textContent).toBe("Employee");
  expect([...employee.options].every(option => !option.textContent?.includes("@"))).toBe(true);
});

it.each([["NVIDIA GeForce RTX 4090", "GB", "24", 24], ["other", "TB", "1", 1024]])("saves GPU %s and graphics memory in %s", async (gpu, unit, memory, expected) => {
  await click("Peripherals");
  await click("Add Asset");
  for (const [label, value] of Object.entries({ "Asset Tag / Hostname": "GPU-PC", "Serial Number": "GPU-SN", "Device Type": id, Status: id, Company: id, GPU: gpu, "Graphics memory unit": unit, "Graphics Memory": memory })) await fill(label, String(value));
  if (gpu === "other") await fill("Other GPU name", "Legacy GPU Model");
  const form = host.querySelector<HTMLFormElement>('[role="dialog"] form')!;
  expect(form.checkValidity()).toBe(true);
  await act(async () => form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  expect(posts.at(-1)?.body.graphicsMemoryGb).toBe(expected);
  expect(posts.at(-1)?.body.gpu).toBe(gpu === "other" ? "Legacy GPU Model" : gpu);
});

it("shows all asset report columns and exports the selected report", async () => {
  const createObjectURL = vi.fn(() => "blob:report");
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectURL });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
  const download = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  await click("Reports");
  expect(host.querySelectorAll("th")).toHaveLength(19);
  expect(host.textContent).toContain("Graphics Memory (GB)");
  expect(host.textContent).toContain("Report remarks");
  for (const type of ["assets", "users", "licenses", "teams"]) {
    await fill("Report type", type);
    await click(`Export ${type[0]!.toUpperCase() + type.slice(1)}`);
    expect(vi.mocked(fetch).mock.calls.some(([url]) => url === `/api/reports/${type}/export`)).toBe(true);
  }
  expect(download).toHaveBeenCalledTimes(4);
  download.mockRestore();
});

it("renders working setting controls and saves typed numeric values", async () => {
  await click("Settings");
  expect(host.querySelectorAll(".setting-card")).toHaveLength(6);
  expect(host.querySelectorAll(".setting-card svg")).toHaveLength(6);
  await fill("Warranty warning days", "60");
  await click("Save warranty warning days");
  expect(posts.at(-1)?.body).toMatchObject({ settingKey: "asset.warranty_warning_days", settingValue: 60, isActive: true });
  await fill("Application name", "Studio Inventory");
  await click("Save application name");
  expect(document.title).toBe("Studio Inventory");
  expect(host.querySelector(".brand-title")?.textContent).toBe("Studio Inventory");
  await fill("Inventory page size", "50");
  await click("Save inventory page size");
  await click("Peripherals");
  expect(vi.mocked(fetch).mock.calls.some(([url]) => String(url).includes("/api/assets?page=1&pageSize=50"))).toBe(true);
  await click("Settings");
  await click("Add Setting");
  await fill("Setting Key", "disabled.setting");
  await fill("Value", "false");
  await fill("Setting status", "inactive");
  await click("Save Setting");
  expect(posts.at(-1)?.body).toMatchObject({ settingValue: false, isActive: false });
});

it("ignores an old report response after changing report type", async () => {
  const originalFetch = fetch;
  let resolveAssets: (value: Response) => void = () => {};
  vi.stubGlobal("fetch", vi.fn((url: string, options?: RequestInit) => url === "/api/reports/assets"
    ? new Promise<Response>(resolve => { resolveAssets = resolve; })
    : originalFetch(url, options)));
  await click("Reports");
  await fill("Report type", "users");
  expect(host.textContent).toContain("Report Employee");
  await act(async () => resolveAssets(new Response(JSON.stringify([{ asset_tag: "STALE-ASSET" }]))));
  expect(host.textContent).toContain("Report Employee");
  expect(host.textContent).not.toContain("STALE-ASSET");
});

it("shows report failures without displaying a misleading empty report", async () => {
  const originalFetch = fetch;
  vi.stubGlobal("fetch", vi.fn((url: string, options?: RequestInit) => url === "/api/reports/assets"
    ? Promise.resolve(new Response(JSON.stringify({ message: "Report unavailable" }), { status: 500 }))
    : originalFetch(url, options)));
  await click("Reports");
  expect(host.querySelector('[role="alert"]')?.textContent).toBe("Report unavailable");
  expect(host.textContent).not.toContain("No records match this report.");
});
