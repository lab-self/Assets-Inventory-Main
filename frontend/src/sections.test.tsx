// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import App from "./App";

let root: Root;
let host: HTMLDivElement;
const id = "00000000-0000-4000-8000-000000000001";
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
    else if (["/api/assets", "/api/autodesk", "/api/teams"].includes(path!)) data = { rows: [{ id, asset_tag: "PC-1", serial_number: "SN-1" }], total: 1 };
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
  const field = [...host.querySelectorAll("label")].find((item) => item.querySelector("span")?.textContent === label)?.querySelector("input,select,textarea");
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
  ["Peripherals", "Add Asset", "/api/assets", { "Asset Tag": "PC-2", "Serial Number": "SN-2", "Device Type": id, Status: id, Company: id }],
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
  await fill("Asset", id);
  await fill("Employee", id);
  await act(async () => host.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  expect(posts.at(-1)).toEqual({ path: `/api/assets/${id}/assign`, body: { userId: id } });
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
