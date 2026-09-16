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
const user = { id, email: "admin@example.test", firstName: "Admin", isSuperAdmin: true, permissions: [] as string[] };

beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  posts.length = 0;
  user.isSuperAdmin = true;
  user.permissions = [];
  localStorage.setItem("inventory_access_token", "test-token");
  vi.stubGlobal("fetch", vi.fn(async (url: string, options?: RequestInit) => {
    const path = url.split("?")[0];
    let data: unknown = [];
    if (options?.method === "POST" || options?.method === "PATCH") {
      posts.push({ path: path!, body: JSON.parse(options.body as string) });
      data = { id };
    } else if (path === "/api/auth/me") data = user;
    else if (path?.endsWith("/assignment")) data = null;
    else if (path === "/api/dashboard/summary") data = { totals: {}, byType: [], recentActivity: [] };
    else if (["/api/companies", "/api/departments", "/api/locations", "/api/users"].includes(path!)) data = { data: [{ id, name: "Test record", firstName: "Employee", email: "employee@example.test", company_id: id, status: "active" }] };
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
  ["Company", "Add Company", "/api/companies", { "Company Name": "New Company" }],
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
  const form = host.querySelector("form")!;
  expect(form.checkValidity()).toBe(true);
  await act(async () => form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  expect(posts.at(-1)?.path).toBe(path);
  if (section === "Peripherals") expect(posts.at(-1)?.body.hostname).toBe("PC-2");
  expect(host.querySelector('[role="dialog"]')).toBeNull();
});

it("returns to login when the session expires", async () => {
  await act(async () => window.dispatchEvent(new Event("inventory-session-expired")));
  expect(host.textContent).toContain("Sign in to workspace");
});

it.each([
  ["Company", "/api/companies", { "Company Name": "Edited Company" }],
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
  const form = host.querySelector("form")!;
  expect(form.checkValidity()).toBe(true);
  await act(async () => form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  expect(posts.at(-1)?.path).toBe(`${path}/${id}`);
  expect(host.querySelector('[role="dialog"]')).toBeNull();
});

it("submits an asset assignment", async () => {
  await click("Assets Management");
  const options = [...host.querySelectorAll('select[required]')[0]!.querySelectorAll("option")].slice(1);
  expect(options.map((option) => option.textContent?.split(" · ")[0])).toEqual(["alpha", "bravo", "charlie"]);
  expect(options).toHaveLength(101);
  expect(options.at(-1)?.textContent).toContain("workstation-098");
  expect(options[0]!.textContent).toContain("PC-3");
  expect(options[2]!.textContent).toContain("Dell Latitude");
  expect(options[2]!.textContent).toContain("SN-3");
  expect(host.textContent).toContain("Employee · employee@example.test");
  await fill("Asset", id);
  await fill("Employee", id);
  await act(async () => host.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  expect(posts.at(-1)).toEqual({ path: `/api/assets/${id}/assign`, body: { userId: id } });
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
  const form = host.querySelector("form")!;
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
