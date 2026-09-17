import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Activity,
  ArrowRight,
  Boxes,
  Building2,
  ChartNoAxesCombined,
  Download,
  Eye,
  EyeOff,
  Layers,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Monitor,
  Mouse,
  Network,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  UsersRound,
  LockKeyhole,
  X,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { gpuModels } from "./gpu-models";
import { DataTable, capacity, storageLabel, type Column } from "./asset-table";

type User = {
  id: string;
  firstName?: string;
  lastName?: string | null;
  email: string;
  employeeId?: string | null;
  jobTitle?: string | null;
  status?: string;
  isSuperAdmin?: boolean;
  roles?: string[];
  permissions?: string[];
  companyId?: string | null;
  departmentId?: string | null;
  locationId?: string | null;
};
type Row = {
  id: string;
  is_active?: boolean;
  is_super_admin?: boolean;
  ram_gb?: number;
  graphics_memory_gb?: number;
  storage_capacity_gb?: number;
  setting_value?: unknown;
} & Partial<
  Record<
    | "antivirus"
    | "device_type_name"
    | "category_base_name"
    | "ram_unit"
    | "storage_unit"
    | "asset_id"
    | "user_first_name"
    | "user_last_name"
    | "assigned_at"
    | "returned_at"
    | "expected_return_at"
    | "account_status"
    | "assetTag"
    | "asset_tag"
    | "assigned_date"
    | "autodesk_email"
    | "category"
    | "categoryName"
    | "category_id"
    | "category_name"
    | "city"
    | "companyId"
    | "companyName"
    | "company_id"
    | "company_name"
    | "condition"
    | "country"
    | "cpu"
    | "credential_secret_ref"
    | "departmentId"
    | "department_id"
    | "description"
    | "disabled_date"
    | "email"
    | "employeeId"
    | "employee_id"
    | "employee_name"
    | "expiry_date"
    | "firstName"
    | "first_name"
    | "gpu"
    | "hostname"
    | "invoice_number"
    | "jobTitle"
    | "job_title"
    | "lastName"
    | "last_name"
    | "legal_name"
    | "license_identifier"
    | "license_status"
    | "license_type"
    | "locationName"
    | "location_id"
    | "location_name"
    | "location"
    | "company"
    | "device_type"
    | "warranty_expiry"
    | "managerName"
    | "manager_name"
    | "manufacturer"
    | "model"
    | "name"
    | "notes"
    | "operating_system"
    | "phone"
    | "purchase_date"
    | "serialNumber"
    | "serial_number"
    | "setting_key"
    | "state"
    | "status"
    | "statusName"
    | "status_id"
    | "status_name"
    | "storage_type"
    | "teams_email"
    | "updated_at"
    | "user_id"
    | "vendor"
    | "warranty_end_date"
    | "warranty_start_date",
    string | null
  >
>;
type ListResult = {
  data?: Row[];
  rows?: Row[];
  total?: number;
  pagination?: { total: number };
};
type DashboardSummary = {
  totals: Record<string, number>;
  byType: { name: string; count: number }[];
  recentActivity: {
    id: string;
    action: string;
    entity_type: string;
    created_at: string;
  }[];
};
type Page =
  | "Dashboard"
  | "Peripherals"
  | "Assets Management"
  | "Company"
  | "Department"
  | "User Management"
  | "AUTODESK"
  | "Teams"
  | "Reports"
  | "Settings";

const UserContext = createContext<User | null>(null);
function Can({
  permission,
  children,
}: {
  permission: string;
  children: ReactNode;
}) {
  const user = useContext(UserContext);
  return user && allowed(user, permission) ? children : null;
}
function lookup(
  user: User | null,
  path: string,
  permission: string,
): Promise<ListResult> {
  return user && allowed(user, permission)
    ? listAll(path)
    : Promise.resolve({ data: [] });
}
async function listAll(path: string, pageSize = 100): Promise<ListResult> {
  const url = new URL(path, "http://localhost");
  url.searchParams.set("pageSize", String(pageSize));
  const rows: Row[] = [];
  for (let page = 1; ; page++) {
    url.searchParams.set("page", String(page));
    const result = await api<ListResult>(url.pathname + url.search);
    const batch = result.rows || result.data || [];
    rows.push(...batch);
    if (!batch.length || rows.length >= (result.total ?? result.pagination?.total ?? rows.length)) break;
  }
  return { rows, data: rows, total: rows.length };
}
const TOKEN_KEY = "inventory_access_token";
const nav = [
  ["Dashboard", LayoutDashboard],
  ["Peripherals", Mouse],
  ["Assets Management", Monitor],
  ["Company", Building2],
  ["Department", Network],
  ["User Management", Users],
  ["AUTODESK", Layers],
  ["Teams", UsersRound],
  ["Reports", ChartNoAxesCombined],
  ["Settings", Settings],
] as const;
function nameOf(u: Row) {
  const first = u.firstName ?? u.first_name;
  const last = u.lastName ?? u.last_name;
  const full = [first, last].filter(Boolean).join(" ");
  return (
    full ||
    u.email ||
    u.autodesk_email ||
    u.teams_email ||
    u.employeeId ||
    u.employee_id ||
    "Unknown"
  );
}
const settingCategories = [
  "general",
  "security",
  "notification",
  "email",
  "asset",
  "license",
  "system",
  "appearance",
  "maintenance",
  "other",
];
function optionLabel(value: string) {
  const officialNames: Record<string, string> = {
    aec: "Autodesk AEC Collection",
    forma: "Autodesk Forma",
    autocad: "AutoCAD",
    revit: "Revit",
    maya: "Maya",
    "3ds_max": "3ds Max",
    civil_3d: "Civil 3D",
    fusion: "Autodesk Fusion",
  };
  return (
    officialNames[value] ||
    value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}
function userOptionLabel(user: Row) {
  return [user.firstName || user.first_name, user.lastName || user.last_name]
    .filter(Boolean).join(" ") || user.employee_name || user.name || "Unnamed employee";
}
export function storageToGb(value: number | null, unit: string): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  const multiplier = ({ MB: 1 / 1024, GB: 1, TB: 1024 } as Record<string, number>)[unit] ?? 1;
  return Math.max(1, Math.round(value * multiplier));
}
function allowed(u: User, p: string) {
  const isSuper = u.isSuperAdmin;
  const perms = u.permissions;
  return Boolean(isSuper || (Array.isArray(perms) && perms.includes(p)));
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
function unwrap<T>(body: unknown): T {
  return (
    isRecord(body) &&
    body.success &&
    Object.prototype.hasOwnProperty.call(body, "data")
      ? body.data
      : body
  ) as T;
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`/api${path}`, { ...options, headers });
  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event("inventory-session-expired"));
    }
    const error = isRecord(body) && isRecord(body.error) ? body.error : null;
    const details = Array.isArray(error?.details)
      ? error.details
          .filter(isRecord)
          .map(
            (issue) =>
              `${Array.isArray(issue.path) ? issue.path.join(".") : "Field"}: ${issue.message}`,
          )
          .join("; ")
      : "";
    const message =
      details || (error ? error.message : isRecord(body) ? body.message : null);
    throw new Error(
      typeof message === "string" && message
        ? message
        : `Request failed (${res.status})`,
    );
  }
  return unwrap<T>(body);
}
async function exportReport(type: string) {
  const token = localStorage.getItem(TOKEN_KEY);
  const r = await fetch(`/api/reports/${type}/export`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!r.ok) {
    if (r.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event("inventory-session-expired"));
    }
    throw new Error("Excel export failed. Please retry.");
  }
  const b = await r.blob();
  const url = URL.createObjectURL(b);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inventory-${type}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button
            type="button"
            className="icon-button"
            aria-label="Close dialog"
            onClick={close}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Header({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  const { appName } = useContext(PreferencesContext);
  return (
    <div className="page-header-row">
      <div>
        <div className="breadcrumb">{appName}</div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
function Toolbar({
  search,
  setSearch,
  refresh,
}: {
  search: string;
  setSearch: (v: string) => void;
  refresh: () => void;
}) {
  return (
    <div className="toolbar">
      <div className="search-box">
        <Search size={16} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
        />
      </div>
      <button className="secondary-button" onClick={refresh}>
        <RefreshCw size={15} /> Refresh
      </button>
    </div>
  );
}
export function Badge({ value }: { value: string }) {
  return (
    <span
      className={`status-badge ${/^(active|assigned|good|in stock|available)$/i.test(value) ? "active" : "inactive"}`}
    >
      {value}
    </span>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="empty-state">
      <Boxes size={24} />
      <h4>{text}</h4>
    </div>
  );
}
function Table({
  headers,
  children,
}: {
  headers: string[];
  children: ReactNode;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
function Actions({
  busy,
  close,
  text,
}: {
  busy: boolean;
  close: () => void;
  text: string;
}) {
  return (
    <div className="form-actions">
      <button type="button" className="secondary-button" onClick={close}>
        Cancel
      </button>
      <button className="primary-button" disabled={busy}>
        {busy ? "Saving..." : text}
      </button>
    </div>
  );
}

function Login({ onLogin }: { onLogin: (u: User) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await api<{ accessToken: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem(TOKEN_KEY, r.accessToken);
      onLogin(r.user);
      toast.success("Signed in successfully");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid email or password",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-story">
        <div className="brand">
          <div className="brand-logo">
            <Boxes />
          </div>
          <div>
            <div className="brand-title">
              Inventory<span className="brand-period">.</span>
            </div>
            <div className="brand-subtitle">ASSET MANAGEMENT WORKSPACE</div>
          </div>
        </div>
        <div className="story-content">
          <span className="eyebrow">
            <span className="status-dot" /> EVERYTHING IN ITS PLACE
          </span>
          <h1>
            Less searching.
            <br />
            More <em>possibilities.</em>
          </h1>
          <p>
            Your assets, people, and operations.
            <br />
            One connected workspace.
          </p>
          <div className="story-features">
            <span>
              <Monitor size={17} /> Track every asset
            </span>
            <span>
              <Network size={17} /> Connect your teams
            </span>
            <span>
              <ShieldCheck size={17} /> Stay in control
            </span>
          </div>
        </div>
      </section>
      <section className="login-form-side">
        <div className="login-topnote">
          <ShieldCheck size={16} /> Secure workspace
        </div>
        <div className="login-card">
          <div className="login-welcome-icon">
            <Boxes size={28} />
          </div>
          <span className="eyebrow">WELCOME BACK</span>
          <h2>Good to see you again.</h2>
          <p>Sign in to keep everything moving.</p>
          <form onSubmit={submit} className="form-stack">
            <Field label="Work email">
              <div className="input-with-icon">
                <Mail size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="username"
                />
              </div>
            </Field>
            <Field label="Password">
              <div className="input-with-icon">
                <LockKeyhole size={18} />
                <input
                  type={show ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  aria-label={show ? "Hide password" : "Show password"}
                  className="password-toggle"
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>
            {error && <div className="form-error">{error}</div>}
            <button className="primary-button login-submit" disabled={busy}>
              {busy ? "Signing in..." : "Sign in to workspace"}
              <ArrowRight size={18} />
            </button>
          </form>
          <p className="login-help">
            Need access? Contact your workspace administrator.
          </p>
        </div>
      </section>
    </main>
  );
}
export { Login };

function Dashboard({ user }: { user: User }) {
  const [d, setD] = useState<DashboardSummary | null>(null);
  useEffect(() => {
    api<DashboardSummary>("/dashboard/summary")
      .then(setD)
      .catch((e) => toast.error(e.message));
  }, []);
  const t = d?.totals || {};
  const cards = [
    ["Total Assets", t.total_assets],
    ["Assigned Assets", t.assigned_assets],
    ["In Stock", t.stock_assets],
    ["Faulty / Repair", t.faulty_assets],
    ["Companies", t.total_companies],
    ["Departments", t.total_departments],
    ["Employees", t.total_users],
    ["Unassigned", t.unassigned_assets],
  ];
  return (
    <>
      <Header
        title={`Good to see you, ${nameOf(user).split(" ")[0]}`}
        subtitle="Operational overview of your connected inventory."
      />
      <div className="statistics-grid">
        {cards.map(([label, value]) => (
          <div className="stat-card tone-purple" key={label}>
            <div className="stat-icon">
              <Activity size={19} />
            </div>
            <div className="stat-value">{value ?? "—"}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>
      <div className="dashboard-two-col">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h3>Assets by Device Type</h3>
              <p>Active inventory by category.</p>
            </div>
          </div>
          {(d?.byType || []).map((x) => (
            <div className="bar-row" key={x.name}>
              <span>{x.name}</span>
              <div>
                <i
                  style={{ width: `${Math.min(100, Number(x.count) * 8)}%` }}
                />
              </div>
              <b>{x.count}</b>
            </div>
          ))}
          {!d?.byType?.length && <Empty text="No asset data yet." />}
        </section>
        <section className="panel">
          <div className="panel-header">
            <div>
              <h3>Recent Activity</h3>
              <p>Latest audited changes.</p>
            </div>
          </div>
          {(d?.recentActivity || []).map((x) => (
            <div className="activity-row" key={x.id}>
              <span className="activity-dot" />
              <div>
                <strong>{x.action}</strong>
                <small>
                  {x.entity_type} · {new Date(x.created_at).toLocaleString()}
                </small>
              </div>
            </div>
          ))}
          {!d?.recentActivity?.length && (
            <Empty text="No activity recorded yet." />
          )}
        </section>
      </div>
    </>
  );
}

function CompanyPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [edit, setEdit] = useState<Row | null>(null);
  async function load() {
    try {
      const r = await listAll(
        `/companies?page=1&pageSize=100&search=${encodeURIComponent(search)}`,
      );
      setRows(r.data || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to load companies");
    }
  }
  useEffect(() => {
    void load();
  }, [search]);
  async function del(id: string) {
    if (!confirm("Deactivate this company?")) return;
    try {
      await api(`/companies/${id}`, { method: "DELETE" });
      toast.success("Company deactivated");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }
  return (
    <>
      <Header
        title="Company"
        subtitle="Manage company master data."
        action={
          <Can permission="COMPANY_CREATE">
            <button
              className="primary-button"
              onClick={() => setEdit({ id: "" })}
            >
              <Plus size={16} /> Add Company
            </button>
          </Can>
        }
      />
      <Toolbar
        search={search}
        setSearch={setSearch}
        refresh={() => void load()}
      />
      <Table
        headers={["Company", "Email", "Phone", "Location", "Status", "Actions"]}
      >
        {rows.map((r) => (
          <tr key={r.id}>
            <td>
              <strong>{r.name}</strong>
            </td>
            <td>{r.email || "—"}</td>
            <td>{r.phone || "—"}</td>
            <td>
              {[r.city, r.state, r.country].filter(Boolean).join(", ") || "—"}
            </td>
            <td>
              <Badge value={r.is_active === false ? "Inactive" : "Active"} />
            </td>
            <td>
              <Can permission="COMPANY_UPDATE">
                <button className="link-button" onClick={() => setEdit(r)}>
                  <Pencil size={14} /> Edit
                </button>
              </Can>
              <Can permission="COMPANY_DELETE">
                <button
                  aria-label="Deactivate record"
                  className="danger-link"
                  onClick={() => void del(r.id)}
                >
                  <Trash2 size={14} />
                </button>
              </Can>
            </td>
          </tr>
        ))}
      </Table>
      {!rows.length && <Empty text="No companies found." />}
      {edit && (
        <CompanyForm
          item={edit.id ? edit : null}
          close={() => setEdit(null)}
          saved={() => {
            setEdit(null);
            void load();
          }}
        />
      )}
    </>
  );
}
function CompanyForm({
  item,
  close,
  saved,
}: {
  item: Row | null;
  close: () => void;
  saved: () => void;
}) {
  const [f, setF] = useState({
    name: item?.name || "",
    legalName: item?.legal_name || "",
    email: item?.email || "",
    phone: item?.phone || "",
    city: item?.city || "",
    state: item?.state || "",
    country: item?.country || "India",
  });
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api(item ? `/companies/${item.id}` : "/companies", {
        method: item ? "PATCH" : "POST",
        body: JSON.stringify({ ...f, isActive: item?.is_active ?? true }),
      });
      toast.success(item ? "Company updated" : "Company created");
      saved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={item ? "Edit Company" : "Add Company"} close={close}>
      <form className="form-grid" onSubmit={submit}>
        <Field label="Company Name">
          <input
            required
            value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
          />
        </Field>
        <Field label="Legal Name">
          <input
            value={f.legalName}
            onChange={(e) => setF({ ...f, legalName: e.target.value })}
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            value={f.email}
            onChange={(e) => setF({ ...f, email: e.target.value })}
          />
        </Field>
        <Field label="Phone">
          <input
            value={f.phone}
            onChange={(e) => setF({ ...f, phone: e.target.value })}
          />
        </Field>
        <Field label="City">
          <input
            value={f.city}
            onChange={(e) => setF({ ...f, city: e.target.value })}
          />
        </Field>
        <Field label="State">
          <input
            value={f.state}
            onChange={(e) => setF({ ...f, state: e.target.value })}
          />
        </Field>
        <Field label="Country">
          <input
            value={f.country}
            onChange={(e) => setF({ ...f, country: e.target.value })}
          />
        </Field>
        <Actions busy={busy} close={close} text="Save Company" />
      </form>
    </Modal>
  );
}

function DepartmentPage() {
  const currentUser = useContext(UserContext);
  const [rows, setRows] = useState<Row[]>([]);
  const [companies, setCompanies] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [edit, setEdit] = useState<Row | null>(null);
  async function load() {
    try {
      const [r, c] = await Promise.all([
        listAll(
          `/departments?page=1&pageSize=100&search=${encodeURIComponent(search)}`,
        ),
        lookup(currentUser, "/companies?page=1&pageSize=100", "COMPANY_VIEW"),
      ]);
      setRows(r.data || []);
      setCompanies(c.data || []);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Unable to load departments",
      );
    }
  }
  useEffect(() => {
    void load();
  }, [search]);
  async function del(id: string) {
    if (!confirm("Deactivate this department?")) return;
    try {
      await api(`/departments/${id}`, { method: "DELETE" });
      toast.success("Department deactivated");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }
  return (
    <>
      <Header
        title="Department"
        subtitle="Manage department master data."
        action={
          <Can permission="DEPARTMENT_CREATE">
            <button
              className="primary-button"
              onClick={() => setEdit({ id: "" })}
            >
              <Plus size={16} /> Add Department
            </button>
          </Can>
        }
      />
      <Toolbar
        search={search}
        setSearch={setSearch}
        refresh={() => void load()}
      />
      <Table
        headers={[
          "Department",
          "Company",
          "Manager",
          "Email",
          "Status",
          "Actions",
        ]}
      >
        {rows.map((r) => (
          <tr key={r.id}>
            <td>
              <strong>{r.name}</strong>
            </td>
            <td>
              {companies.find((c) => c.id === (r.company_id || r.companyId))
                ?.name || "—"}
            </td>
            <td>{r.manager_name || r.managerName || "—"}</td>
            <td>{r.email || "—"}</td>
            <td>
              <Badge value={r.is_active === false ? "Inactive" : "Active"} />
            </td>
            <td>
              <Can permission="DEPARTMENT_UPDATE">
                <button className="link-button" onClick={() => setEdit(r)}>
                  <Pencil size={14} /> Edit
                </button>
              </Can>
              <Can permission="DEPARTMENT_DELETE">
                <button
                  aria-label="Deactivate record"
                  className="danger-link"
                  onClick={() => void del(r.id)}
                >
                  <Trash2 size={14} />
                </button>
              </Can>
            </td>
          </tr>
        ))}
      </Table>
      {!rows.length && <Empty text="No departments found." />}
      {edit && (
        <DepartmentForm
          item={edit.id ? edit : null}
          companies={companies}
          close={() => setEdit(null)}
          saved={() => {
            setEdit(null);
            void load();
          }}
        />
      )}
    </>
  );
}
function DepartmentForm({
  item,
  companies,
  close,
  saved,
}: {
  item: Row | null;
  companies: Row[];
  close: () => void;
  saved: () => void;
}) {
  const [f, setF] = useState({
    companyId: item?.company_id || item?.companyId || "",
    name: item?.name || "",
    managerName: item?.manager_name || item?.managerName || "",
    email: item?.email || "",
  });
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api(item ? `/departments/${item.id}` : "/departments", {
        method: item ? "PATCH" : "POST",
        body: JSON.stringify({ ...f, isActive: item?.is_active ?? true }),
      });
      toast.success(item ? "Department updated" : "Department created");
      saved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={item ? "Edit Department" : "Add Department"} close={close}>
      <form className="form-grid" onSubmit={submit}>
        <Field label="Company">
          <select
            required
            disabled={Boolean(item)}
            value={f.companyId}
            onChange={(e) => setF({ ...f, companyId: e.target.value })}
          >
            <option value="">Select company</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Department Name">
          <input
            required
            value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
          />
        </Field>
        <Field label="Manager">
          <input
            value={f.managerName}
            onChange={(e) => setF({ ...f, managerName: e.target.value })}
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            value={f.email}
            onChange={(e) => setF({ ...f, email: e.target.value })}
          />
        </Field>
        <Actions busy={busy} close={close} text="Save Department" />
      </form>
    </Modal>
  );
}

function assetReference(row: Row) {
  return [...new Set([row.asset_tag || row.assetTag, row.hostname].filter(Boolean))].join(" / ") || "\u2014";
}
const peripheralColumns: Column<Row>[] = [
  { label: "Asset Tag / Hostname", value: assetReference },
  { label: "Device Type", value: row => row.device_type_name || row.category_name || row.categoryName || "\u2014" },
  { label: "Company", value: row => row.company_name || row.companyName || "\u2014" },
  { label: "Location", value: row => row.location_name || row.locationName || "\u2014" },
  { label: "Manufacturer", value: row => row.manufacturer || "\u2014" },
  { label: "Model", value: row => row.model || "\u2014" },
  { label: "Serial Number", value: row => row.serial_number || row.serialNumber || "\u2014" },
  { label: "CPU", value: row => row.cpu || "\u2014" },
  { label: "RAM", value: row => capacity(row.ram_gb, row.ram_unit), sortValue: row => Number(row.ram_gb || 0) },
  { label: "Storage", value: row => [storageLabel(row.storage_type), capacity(row.storage_capacity_gb, row.storage_unit)].filter(value => value !== "\u2014").join(" / ") || "\u2014", sortValue: row => Number(row.storage_capacity_gb || 0) },
  { label: "GPU", value: row => row.gpu || "\u2014" },
  { label: "GPU Memory", value: row => capacity(row.graphics_memory_gb), sortValue: row => Number(row.graphics_memory_gb || 0) },
  { label: "Antivirus", value: row => row.antivirus || "\u2014" },
  { label: "Status", value: row => row.status_name || row.statusName || "\u2014", render: row => <Badge value={row.status_name || row.statusName || "Unknown"} /> },
];
function PeripheralDetails({ asset }: { asset: Row }) {
  return <dl className="asset-details">{peripheralColumns.filter(column => column.label !== "Status").map(column => <div key={column.label}><dt>{column.label}</dt><dd>{column.value(asset)}</dd></div>)}</dl>;
}
function AssetsPage({ assignment = false, initialAssetId = "", onAssign }: { assignment?: boolean; initialAssetId?: string; onAssign?: (id: string) => void }) {
  const currentUser = useContext(UserContext);
  const { pageSize } = useContext(PreferencesContext);
  const [rows, setRows] = useState<Row[]>([]);
  const [users, setUsers] = useState<Row[]>([]);
  const [companies, setCompanies] = useState<Row[]>([]);
  const [departments, setDepartments] = useState<Row[]>([]);
  const [locations, setLocations] = useState<Row[]>([]);
  const [categories, setCategories] = useState<Row[]>([]);
  const [statuses, setStatuses] = useState<Row[]>([]);
  const [edit, setEdit] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestId = useRef(0);
  async function load() {
    const id = ++requestId.current;
    setLoading(true); setError("");
    try {
      const result = await listAll("/assets?sortBy=hostname&sortOrder=asc", pageSize);
      if (id === requestId.current) setRows((result.rows || []).sort((a, b) => String(a.hostname || a.asset_tag || "").localeCompare(String(b.hostname || b.asset_tag || ""), undefined, { numeric: true, sensitivity: "base" })));
    } catch (e) { if (id === requestId.current) setError(e instanceof Error ? e.message : "Unable to load assets"); }
    finally { if (id === requestId.current) setLoading(false); }
  }
  useEffect(() => { void load(); return () => { requestId.current++; }; }, []);
  useEffect(() => {
    let active = true;
    lookup(currentUser, "/users?status=active", "USER_VIEW").then(result => { if (active) setUsers(result.data || []); }).catch(e => toast.error(e.message));
    Promise.all([
      lookup(currentUser, "/companies", "COMPANY_VIEW"),
      lookup(currentUser, "/departments", "DEPARTMENT_VIEW"),
      lookup(currentUser, "/locations", "LOCATION_VIEW"),
      api<Row[]>("/assets/categories"), api<Row[]>("/assets/statuses"),
    ]).then(([c, d, l, cat, st]) => {
      if (!active) return;
      setCompanies(c.data || []); setDepartments(d.data || []); setLocations(l.data || []); setCategories(cat); setStatuses(st);
    }).catch(e => toast.error(e.message));
    return () => { active = false; };
  }, [currentUser]);
  async function deactivate(id: string) {
    if (!confirm("Deactivate this asset?")) return;
    try { await api(`/assets/${id}`, { method: "DELETE" }); toast.success("Asset deactivated"); await load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Deactivation failed"); }
  }
  if (assignment) return <>
    {error && <p role="alert">{error}</p>}
    {loading && <p role="status">Loading peripherals...</p>}
    <Assignment assets={rows} users={users} refresh={load} initialAssetId={initialAssetId} />
  </>;
  const columns: Column<Row>[] = [...peripheralColumns, { label: "Actions", value: () => "", render: row => <div className="row-actions">
    <Can permission="ASSET_ASSIGN"><button className="link-button" aria-label={`Assign ${assetReference(row)}`} onClick={() => onAssign?.(row.id)}><Users size={14} /> Assign</button></Can>
    <Can permission="ASSET_UPDATE"><button aria-label="Edit asset" className="link-button" onClick={() => setEdit(row)}><Pencil size={14} /></button></Can>
    <Can permission="ASSET_DELETE"><button aria-label="Deactivate record" className="danger-link" onClick={() => void deactivate(row.id)}><Trash2 size={14} /></button></Can>
  </div> }];
  return <>
    <Header title="Peripherals" subtitle="Manage physical inventory and assign an existing device to an employee." action={<Can permission="ASSET_CREATE"><button className="primary-button" onClick={() => setEdit({ id: "" })}><Plus size={16} /> Add Asset</button></Can>} />
    <button className="secondary-button no-print" onClick={() => void load()} disabled={loading}><RefreshCw size={16} /> Refresh inventory</button>
    {error && <p role="alert">{error}</p>}
    {loading ? <p role="status">Loading peripherals...</p> : !error && <DataTable title="Peripherals" rows={rows} columns={columns} rowKey={row => row.id} defaultPageSize={pageSize} filters={["Device Type", "Company", "Location", "Status"]} />}
    {edit && <AssetForm item={edit.id ? edit : null} companies={companies} departments={departments} locations={locations} categories={categories} statuses={statuses} close={() => setEdit(null)} saved={() => { setEdit(null); void load(); }} />}
  </>;
}
function AssetForm({
  item,
  companies,
  departments,
  locations,
  categories,
  statuses,
  close,
  saved,
}: {
  item: Row | null;
  companies: Row[];
  departments: Row[];
  locations: Row[];
  categories: Row[];
  statuses: Row[];
  close: () => void;
  saved: () => void;
}) {
  const [f, setF] = useState({
    assetTag: item?.asset_tag || "",
    serialNumber: item?.serial_number || "",
    categoryId: item?.category_id || "",
    statusId: item?.status_id || statuses.find(status => /^(available|in stock)$/i.test(status.name || ""))?.id || statuses[0]?.id || "",
    companyId: item?.company_id || "",
    departmentId: item?.department_id || "",
    locationId: item?.location_id || "",
    manufacturer: item?.manufacturer || "",
    model: item?.model || "",
    operatingSystem: item?.operating_system || "",
    cpu: item?.cpu || "",
    ramGb: item?.ram_gb ? item.ram_gb / (item.ram_unit === "TB" ? 1024 : 1) : "",
    storageType: item?.storage_type || "none",
    storageCapacityGb: item?.storage_capacity_gb ? item.storage_capacity_gb / (item.storage_unit === "TB" ? 1024 : 1) : "",
    gpu: item?.gpu || "",
    antivirus: item?.antivirus || "",
    deviceTypeName: item?.device_type_name || "",
    graphicsMemoryGb: item?.graphics_memory_gb ?? "",
    purchaseDate: item?.purchase_date || "",
    warrantyStartDate: item?.warranty_start_date || "",
    warrantyEndDate: item?.warranty_end_date || "",
    vendor: item?.vendor || "",
    invoiceNumber: item?.invoice_number || "",
    condition: item?.condition || "good",
    notes: item?.notes || "",
  });
  const [busy, setBusy] = useState(false);
  const [storageUnit, setStorageUnit] = useState(item?.storage_unit || "GB");
  const [ramUnit, setRamUnit] = useState(item?.ram_unit || "GB");
  const [customAntivirus, setCustomAntivirus] = useState(!!item?.antivirus && item.antivirus !== "Windows Defender");
  const isOther = /^others?$/i.test(categories.find(category => category.id === f.categoryId)?.name || "");
  const [graphicsUnit, setGraphicsUnit] = useState("GB");
  const [customGpu, setCustomGpu] = useState(!!item?.gpu && !gpuModels.includes(item.gpu));
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const payload = {
        ...f,
        assetTag: f.assetTag.trim() || undefined,
        serialNumber: f.serialNumber.trim() || null,
        companyId: f.companyId || null,
        deviceTypeName: isOther ? f.deviceTypeName.trim() : null,
        antivirus: f.antivirus.trim() || null,
        ramUnit, storageUnit,
        hostname: f.assetTag.trim() || null,
        ramGb: f.ramGb === "" ? null : Number(f.ramGb) * (ramUnit === "TB" ? 1024 : 1),
        storageCapacityGb: f.storageCapacityGb === "" ? null : Number(f.storageCapacityGb) * (storageUnit === "TB" ? 1024 : 1),
        graphicsMemoryGb: f.graphicsMemoryGb === "" ? null : Number(f.graphicsMemoryGb) * (graphicsUnit === "TB" ? 1024 : 1),
        departmentId: f.departmentId || null,
        locationId: f.locationId || null,
        purchaseDate: f.purchaseDate || null,
        warrantyStartDate: f.warrantyStartDate || null,
        warrantyEndDate: f.warrantyEndDate || null,
        vendor: f.vendor || null,
        invoiceNumber: f.invoiceNumber || null,
        notes: f.notes || null,
      };
      await api(item ? `/assets/${item.id}` : "/assets", {
        method: item ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      toast.success(item ? "Asset updated" : "Asset created");
      saved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Asset save failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={item ? "Edit Asset" : "Add Asset"} close={close}>
      <form className="form-grid" onSubmit={submit}>
        <Field label="Asset Tag / Hostname">
          <input
            required={!isOther}
            aria-label="Asset Tag / Hostname"
            placeholder={isOther ? "Optional - reference generated if blank" : "Asset tag or hostname"}
            value={f.assetTag}
            onChange={(e) => setF({ ...f, assetTag: e.target.value })}
          />
        </Field>
        <Field label="Serial Number">
          <input
            required={!isOther}
            value={f.serialNumber}
            onChange={(e) => setF({ ...f, serialNumber: e.target.value })}
          />
        </Field>
        <Field label="Device Type">
          <select
            required
            value={f.categoryId}
            onChange={(e) => setF({ ...f, categoryId: e.target.value })}
          >
            <option value="">Select type</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        {isOther && <Field label="Other Device Type"><input required maxLength={100} placeholder="For example: Drawing tablet" value={f.deviceTypeName} onChange={e => setF({ ...f, deviceTypeName: e.target.value })} /></Field>}
        <Field label="Status">
          <select
            required
            value={f.statusId}
            onChange={(e) => setF({ ...f, statusId: e.target.value })}
          >
            <option value="">Select status</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Company">
          <select
            required={!isOther}
            value={f.companyId}
            onChange={(e) => setF({ ...f, companyId: e.target.value, departmentId: "", locationId: "" })}
          >
            <option value="">Select company</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Department">
          <select
            value={f.departmentId}
            onChange={(e) => setF({ ...f, departmentId: e.target.value })}
          >
            <option value="">No department</option>
            {departments
              .filter((d) => (d.company_id || d.companyId) === f.companyId)
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Location">
          <select
            value={f.locationId}
            onChange={(e) => setF({ ...f, locationId: e.target.value })}
          >
            <option value="">No location</option>
            {locations
              .filter((l) => (l.company_id || l.companyId) === f.companyId)
              .map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Manufacturer">
          <input
            value={f.manufacturer}
            onChange={(e) => setF({ ...f, manufacturer: e.target.value })}
          />
        </Field>
        <Field label="Model">
          <input
            value={f.model}
            onChange={(e) => setF({ ...f, model: e.target.value })}
          />
        </Field>
        <Field label="CPU">
          <input
            value={f.cpu}
            onChange={(e) => setF({ ...f, cpu: e.target.value })}
          />
        </Field>
        <Field label="RAM"><div className="storage-input">
          <input type="number" min={ramUnit === "TB" ? 1 / 1024 : 1} step={ramUnit === "TB" ? 1 / 1024 : 1} value={f.ramGb} onChange={e => setF({ ...f, ramGb: e.target.value })} />
          <select aria-label="RAM unit" value={ramUnit} onChange={e => setRamUnit(e.target.value)}><option>GB</option><option>TB</option></select>
        </div></Field>
        <Field label="Storage Type">
          <select
            value={f.storageType}
            onChange={(e) => setF({ ...f, storageType: e.target.value })}
          >
            {["hdd", "sata_ssd", "ssd", "nvme", "hybrid", "none"].map((v) => (
              <option key={v} value={v}>
                {v === "none" ? "Not specified" : storageLabel(v)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Storage Capacity">
          <div className="storage-input">
            <input type="number" min={storageUnit === "TB" ? 1 / 1024 : 1} step={storageUnit === "TB" ? 1 / 1024 : 1} value={f.storageCapacityGb} onChange={(e) => setF({ ...f, storageCapacityGb: e.target.value })} />
            <select value={storageUnit} onChange={(e) => setStorageUnit(e.target.value)} aria-label="Storage unit">
              <option>GB</option><option>TB</option>
            </select>
          </div>
          <small>Saved as GB automatically.</small>
        </Field>
        <Field label="GPU">
          <select value={customGpu ? "other" : f.gpu} onChange={(e) => {
            setCustomGpu(e.target.value === "other");
            setF({ ...f, gpu: e.target.value === "other" ? "" : e.target.value });
          }}>
            <option value="">No GPU specified</option>
            {["NVIDIA", "AMD", "Intel", "Apple"].map(brand => <optgroup key={brand} label={brand}>
              {gpuModels.filter(model => model.startsWith(brand)).map(model => <option key={model}>{model}</option>)}
            </optgroup>)}
            <option value="other">Other / unlisted model</option>
          </select>
        </Field>
        {customGpu && <Field label="Other GPU name"><input required value={f.gpu} onChange={(e) => setF({ ...f, gpu: e.target.value })} /></Field>}
        <Field label="Graphics Memory">
          <div className="storage-input">
            <input type="number" min={graphicsUnit === "TB" ? 1 / 1024 : 1} step={graphicsUnit === "TB" ? 1 / 1024 : 1} max={2147483647 / (graphicsUnit === "TB" ? 1024 : 1)} value={f.graphicsMemoryGb} onChange={(e) => setF({ ...f, graphicsMemoryGb: e.target.value })} />
            <select aria-label="Graphics memory unit" value={graphicsUnit} onChange={(e) => setGraphicsUnit(e.target.value)}><option>GB</option><option>TB</option></select>
          </div>
          <small>Leave blank for shared or unknown graphics memory.</small>
        </Field>
        <Field label="Antivirus"><select value={customAntivirus ? "other" : f.antivirus} onChange={e => { setCustomAntivirus(e.target.value === "other"); setF({ ...f, antivirus: e.target.value === "other" ? "" : e.target.value }); }}>
          <option value="">Not specified</option><option>Windows Defender</option><option value="other">Other</option>
        </select></Field>
        {customAntivirus && <Field label="Other Antivirus"><input required maxLength={150} value={f.antivirus} onChange={e => setF({ ...f, antivirus: e.target.value })} /></Field>}
        <Field label="Purchase Date">
          <input
            type="date"
            value={f.purchaseDate}
            onChange={(e) => setF({ ...f, purchaseDate: e.target.value })}
          />
        </Field>
        <Field label="Warranty Start">
          <input
            type="date"
            value={f.warrantyStartDate}
            onChange={(e) => setF({ ...f, warrantyStartDate: e.target.value })}
          />
        </Field>
        <Field label="Warranty Expiry">
          <input
            type="date"
            value={f.warrantyEndDate}
            onChange={(e) => setF({ ...f, warrantyEndDate: e.target.value })}
          />
        </Field>
        <Field label="Vendor">
          <input
            value={f.vendor}
            onChange={(e) => setF({ ...f, vendor: e.target.value })}
          />
        </Field>
        <Field label="Invoice Number">
          <input
            value={f.invoiceNumber}
            onChange={(e) => setF({ ...f, invoiceNumber: e.target.value })}
          />
        </Field>
        <Field label="Condition">
          <select
            value={f.condition}
            onChange={(e) => setF({ ...f, condition: e.target.value })}
          >
            {["new", "good", "fair", "poor", "damaged"].map((v) => (
              <option key={v} value={v}>
                {optionLabel(v)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Operating System">
          <input
            value={f.operatingSystem}
            onChange={(e) => setF({ ...f, operatingSystem: e.target.value })}
          />
        </Field>
        <Field label="Remarks">
          <textarea
            value={f.notes}
            onChange={(e) => setF({ ...f, notes: e.target.value })}
          />
        </Field>
        <Actions busy={busy} close={close} text="Save Asset" />
      </form>
    </Modal>
  );
}
function Assignment({
  assets,
  users,
  refresh,
  initialAssetId = "",
}: {
  assets: Row[];
  users: Row[];
  refresh: () => Promise<void>;
  initialAssetId?: string;
}) {
  const [assetId, setAssetId] = useState(initialAssetId);
  const [userId, setUserId] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assignmentError, setAssignmentError] = useState("");
  const [current, setCurrent] = useState<{
    user_id: string;
    user_first_name: string;
    user_last_name: string;
  } | null>(null);
  const [assignments, setAssignments] = useState<Row[]>([]);
  const [historyError, setHistoryError] = useState("");
  const [historyLoading, setHistoryLoading] = useState(true);
  const selectedAsset = assets.find(asset => asset.id === assetId);
  const selectedUser = users.find(user => user.id === userId);
  async function loadAssignments() {
    setHistoryLoading(true); setHistoryError("");
    try { setAssignments((await listAll("/assets/assignments?status=assigned")).rows || []); }
    catch (e) { setHistoryError(e instanceof Error ? e.message : "Unable to load assignments"); }
    finally { setHistoryLoading(false); }
  }
  useEffect(() => { void loadAssignments(); }, []);
  useEffect(() => {
    let active = true;
    setCurrent(null);
    setAssignmentError("");
    setUserId("");
    if (!assetId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api<typeof current>(`/assets/${assetId}/assignment`)
      .then((value) => {
        if (active) setCurrent(value);
      })
      .catch((error) => {
        if (active) setAssignmentError(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [assetId]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (
      busy || loading || assignmentError || !assetId || !userId ||
      userId === current?.user_id
    ) return;
    setBusy(true);
    try {
      await api(`/assets/${assetId}/${current ? "reassign" : "assign"}`, {
        method: "POST",
        body: JSON.stringify(current ? { newUserId: userId } : { userId }),
      });
      toast.success(current ? "Asset reassigned" : "Asset assigned");
      setAssetId("");
      setUserId("");
      await Promise.all([refresh(), loadAssignments()]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Assignment failed");
    } finally {
      setBusy(false);
    }
  }
  async function returnAsset() {
    if (busy || loading || assignmentError || !assetId || !current) return;
    setBusy(true);
    try {
      await api(`/assets/${assetId}/return`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      toast.success("Asset returned");
      setAssetId("");
      setUserId("");
      await Promise.all([refresh(), loadAssignments()]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Return failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Header
        title="Assets Management"
        subtitle="Assign, reassign and return physical inventory."
      />
      <section className="panel">
        <form className="form-grid assignment-form" onSubmit={submit}>
          <section className="assignment-box">
            <h3><Monitor size={19} /> Asset</h3>
            <Field label="Asset"><select required value={assetId} disabled={busy} onChange={e => setAssetId(e.target.value)}>
              <option value="">Select hostname / asset tag</option>
              {assets.map(asset => <option key={asset.id} value={asset.id}>{[asset.hostname, asset.asset_tag || asset.assetTag, asset.device_type_name || asset.category_name, [asset.manufacturer, asset.model].filter(Boolean).join(" "), asset.serial_number || asset.serialNumber].filter(Boolean).join(" · ")}</option>)}
            </select></Field>
            {selectedAsset && <PeripheralDetails asset={selectedAsset} />}
          </section>
          {loading && <p role="status">Loading assignment...</p>}
          {assignmentError && (
            <p role="alert">
              Unable to load assignment: {assignmentError}. Clear the asset selection and select it again to retry.
            </p>
          )}
          {current && (
            <p>
              Assigned to {current.user_first_name} {current.user_last_name}
            </p>
          )}
          <Can permission="ASSET_ASSIGN">
            <section className="assignment-box"><h3><UserRound size={19} /> Assign User</h3>
            <Field label="Employee">
              <select
                required
                value={userId}
                disabled={busy || loading || !!assignmentError || !assetId}
                onChange={(e) => setUserId(e.target.value)}
              >
                <option value="">Select employee</option>
                {users
                  .filter(
                    (u) => u.status === "active" && u.id !== current?.user_id,
                  )
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {userOptionLabel(u)}
                    </option>
                  ))}
              </select>
            </Field>
            {selectedUser && <dl className="asset-details"><div><dt>Name</dt><dd>{userOptionLabel(selectedUser)}</dd></div><div><dt>Employee ID</dt><dd>{selectedUser.employee_id || selectedUser.employeeId || "\u2014"}</dd></div><div><dt>Company</dt><dd>{selectedUser.company_name || selectedUser.companyName || "\u2014"}</dd></div><div><dt>Job Title</dt><dd>{selectedUser.job_title || selectedUser.jobTitle || "\u2014"}</dd></div></dl>}
            </section>
            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                disabled={busy}
                onClick={() => { setAssetId(""); setUserId(""); }}
              >
                Cancel
              </button>
              <button
                className="primary-button"
                disabled={busy || loading || !!assignmentError || !assetId || !userId || userId === current?.user_id}
              >
                {busy ? "Saving..." : current ? "Reassign Asset" : "Assign Asset"}
              </button>
            </div>
          </Can>
          {current && (
            <Can permission="ASSET_RETURN">
              <button
                type="button"
                className="secondary-button"
                disabled={busy || loading}
                onClick={() => void returnAsset()}
              >
                Return Asset
              </button>
            </Can>
          )}
        </form>
      </section>
      <h3 className="settings-heading"><Users size={18} /> Assigned Assets</h3>
      {historyError && <p role="alert">{historyError} <button className="link-button" onClick={() => void loadAssignments()}>Retry</button></p>}
      {historyLoading ? <p role="status">Loading assigned assets...</p> : !historyError && <DataTable title="Assigned Assets" rows={assignments} rowKey={row => row.id} columns={[
        { label: "Hostname", value: row => { const asset = assets.find(asset => asset.id === row.asset_id); return asset ? assetReference(asset) : row.asset_tag || "\u2014"; } },
        { label: "Username", value: row => [row.user_first_name, row.user_last_name].filter(Boolean).join(" ") || "\u2014" },
        { label: "Peripheral Details", value: row => { const asset = assets.find(asset => asset.id === row.asset_id); return asset ? peripheralColumns.slice(1, 12).map(column => `${column.label}: ${column.value(asset)}`).join("; ") : "\u2014"; }, render: row => { const asset = assets.find(asset => asset.id === row.asset_id); return asset ? <details><summary>{asset.device_type_name || asset.category_name || "View details"} - {asset.manufacturer} {asset.model}</summary><PeripheralDetails asset={asset} /></details> : "\u2014"; } },
        { label: "Assigned Date", value: row => row.assigned_at?.slice(0, 10) || "\u2014" },
        { label: "Expected Return", value: row => row.expected_return_at?.slice(0, 10) || "\u2014" },
        { label: "Status", value: row => optionLabel(row.status || "assigned") },
      ]} />}
    </>
  );
}

function UserPage() {
  const currentUser = useContext(UserContext);
  const [rows, setRows] = useState<Row[]>([]);
  const [companies, setCompanies] = useState<Row[]>([]);
  const [departments, setDepartments] = useState<Row[]>([]);
  const [roles, setRoles] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [edit, setEdit] = useState<Row | null>(null);
  async function load() {
    try {
      const [r, c, d, rs] = await Promise.all([
        listAll(
          `/users?page=1&pageSize=100&search=${encodeURIComponent(search)}`,
        ),
        lookup(currentUser, "/companies?page=1&pageSize=100", "COMPANY_VIEW"),
        lookup(
          currentUser,
          "/departments?page=1&pageSize=100",
          "DEPARTMENT_VIEW",
        ),
        currentUser && allowed(currentUser, "USER_ROLE_MANAGE")
          ? api<Row[]>("/roles")
          : Promise.resolve([]),
      ]);
      setRows(r.data || []);
      setCompanies(c.data || []);
      setDepartments(d.data || []);
      setRoles(rs);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to load users");
    }
  }
  useEffect(() => {
    void load();
  }, [search]);
  return (
    <>
      <Header
        title="User Management"
        subtitle="Employees, roles and access control."
        action={
          <Can permission="USER_CREATE">
            <button
              className="primary-button"
              onClick={() => setEdit({ id: "" })}
            >
              <Plus size={16} /> Add User
            </button>
          </Can>
        }
      />
      <Toolbar
        search={search}
        setSearch={setSearch}
        refresh={() => void load()}
      />
      <Table
        headers={[
          "Employee",
          "Employee ID",
          "Email",
          "Job Title",
          "Status",
          "Actions",
        ]}
      >
        {rows.map((u) => (
          <tr key={u.id}>
            <td>
              <strong>
                {u.first_name
                  ? `${u.first_name} ${u.last_name || ""}`
                  : nameOf(u)}
              </strong>
            </td>
            <td>{u.employee_id || u.employeeId || "—"}</td>
            <td>{u.email}</td>
            <td>{u.job_title || u.jobTitle || "—"}</td>
            <td>
              <Badge value={u.status || "active"} />
            </td>
            <td>
              <Can permission="USER_UPDATE">
                <button className="link-button" onClick={() => setEdit(u)}>
                  <Pencil size={14} /> Edit
                </button>
              </Can>
            </td>
          </tr>
        ))}
      </Table>
      {!rows.length && <Empty text="No users found." />}
      {edit && (
        <UserForm
          item={edit.id ? edit : null}
          companies={companies}
          departments={departments}
          roles={roles}
          close={() => setEdit(null)}
          saved={() => {
            setEdit(null);
            void load();
          }}
        />
      )}
    </>
  );
}
function UserForm({
  item,
  companies,
  departments,
  roles,
  close,
  saved,
}: {
  item: Row | null;
  companies: Row[];
  departments: Row[];
  roles: Row[];
  close: () => void;
  saved: () => void;
}) {
  const [f, setF] = useState({
    companyId: item?.company_id || item?.companyId || "",
    departmentId: item?.department_id || item?.departmentId || "",
    employeeId: item?.employee_id || item?.employeeId || "",
    firstName: item?.first_name || item?.firstName || "",
    lastName: item?.last_name || item?.lastName || "",
    email: item?.email || "",
    password: "",
    jobTitle: item?.job_title || item?.jobTitle || "",
    status: item?.status || "active",
    roleId: "",
  });
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (!item && !f.password) throw new Error("Password is required");
      const p = {
        ...f,
        roleId: undefined,
        password: f.password || undefined,
        companyId: f.companyId || null,
        departmentId: f.departmentId || null,
        roleIds: f.roleId ? [f.roleId] : undefined,
      };
      await api(item ? `/users/${item.id}` : "/users", {
        method: item ? "PATCH" : "POST",
        body: JSON.stringify(p),
      });
      toast.success(item ? "User updated" : "User created");
      saved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={item ? "Edit User" : "Add User"} close={close}>
      <form className="form-grid" onSubmit={submit}>
        <Field label="Employee ID">
          <input
            required
            value={f.employeeId}
            onChange={(e) => setF({ ...f, employeeId: e.target.value })}
          />
        </Field>
        <Field label="First Name">
          <input
            required
            value={f.firstName}
            onChange={(e) => setF({ ...f, firstName: e.target.value })}
          />
        </Field>
        <Field label="Last Name">
          <input
            value={f.lastName}
            onChange={(e) => setF({ ...f, lastName: e.target.value })}
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            required
            value={f.email}
            onChange={(e) => setF({ ...f, email: e.target.value })}
          />
        </Field>
        {!item && (
          <Field label="Password">
            <input
              type="password"
              minLength={12}
              required
              value={f.password}
              onChange={(e) => setF({ ...f, password: e.target.value })}
            />
          </Field>
        )}
        <Field label="Company">
          <select
            value={f.companyId}
            onChange={(e) =>
              setF({ ...f, companyId: e.target.value, departmentId: "" })
            }
          >
            <option value="">Select company</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Department">
          <select
            value={f.departmentId}
            onChange={(e) => setF({ ...f, departmentId: e.target.value })}
          >
            <option value="">Select department</option>
            {departments
              .filter((d) => (d.company_id || d.companyId) === f.companyId)
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Job Title">
          <input
            value={f.jobTitle}
            onChange={(e) => setF({ ...f, jobTitle: e.target.value })}
          />
        </Field>
        <Can permission="USER_ROLE_MANAGE">
          <Field label="Role">
            <select
              value={f.roleId}
              onChange={(e) => setF({ ...f, roleId: e.target.value })}
            >
              <option value="">Select role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </Field>
        </Can>
        <Field label="Status">
          <select
            value={f.status}
            onChange={(e) => setF({ ...f, status: e.target.value })}
          >
            {["active", "inactive", "suspended", "locked"].map((v) => (
              <option key={v} value={v}>
                {optionLabel(v)}
              </option>
            ))}
          </select>
        </Field>
        <Actions busy={busy} close={close} text="Save User" />
      </form>
    </Modal>
  );
}

function AutodeskPage() {
  const currentUser = useContext(UserContext);
  const [rows, setRows] = useState<Row[]>([]);
  const [users, setUsers] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [edit, setEdit] = useState<Row | null>(null);
  async function load() {
    try {
      const [r, u] = await Promise.all([
        listAll(
          `/autodesk?page=1&pageSize=100&search=${encodeURIComponent(search)}`,
        ),
        lookup(currentUser, "/users?page=1&pageSize=100", "USER_VIEW"),
      ]);
      setRows(r.rows || []);
      setUsers(u.data || []);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Unable to load Autodesk licenses",
      );
    }
  }
  useEffect(() => {
    void load();
  }, [search]);
  return (
    <>
      <Header
        title="AUTODESK"
        subtitle="Manage Autodesk licenses and assignment lifecycle."
        action={
          <Can permission="AUTODESK_MANAGE">
            <button
              className="primary-button"
              onClick={() => setEdit({ id: "" })}
            >
              <Plus size={16} /> Add License
            </button>
          </Can>
        }
      />
      <Toolbar
        search={search}
        setSearch={setSearch}
        refresh={() => void load()}
      />
      <Table
        headers={[
          "Employee",
          "Autodesk Email",
          "Type",
          "Status",
          "Identifier",
          "Expiry",
          "Actions",
        ]}
      >
        {rows.map((r) => (
          <tr key={r.id}>
            <td>{r.employee_name || "Unassigned"}</td>
            <td>{r.autodesk_email || "—"}</td>
            <td>{r.license_type}</td>
            <td>
              <Badge value={r.license_status || "Unknown"} />
            </td>
            <td>{r.license_identifier || "—"}</td>
            <td>{r.expiry_date || "—"}</td>
            <td>
              <Can permission="AUTODESK_MANAGE">
                <button className="link-button" onClick={() => setEdit(r)}>
                  <Pencil size={14} /> Edit
                </button>
              </Can>
            </td>
          </tr>
        ))}
      </Table>
      {!rows.length && <Empty text="No Autodesk licenses found." />}
      {edit && (
        <AutodeskForm
          item={edit.id ? edit : null}
          users={users}
          close={() => setEdit(null)}
          saved={() => {
            setEdit(null);
            void load();
          }}
        />
      )}
    </>
  );
}
function AutodeskForm({
  item,
  users,
  close,
  saved,
}: {
  item: Row | null;
  users: Row[];
  close: () => void;
  saved: () => void;
}) {
  const [f, setF] = useState({
    userId: item?.user_id || "",
    autodeskEmail: item?.autodesk_email || "",
    licenseType: item?.license_type || "other",
    licenseStatus: item?.license_status || "unassigned",
    licenseIdentifier: item?.license_identifier || "",
    assignedDate: item?.assigned_date || "",
    expiryDate: item?.expiry_date || "",
    credentialSecretRef: item?.credential_secret_ref || "",
    notes: item?.notes || "",
  });
  const [otherLicenseType, setOtherLicenseType] = useState("");
  const [otherLicenseStatus, setOtherLicenseStatus] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await api(item ? `/autodesk/${item.id}` : "/autodesk", {
        method: item ? "PATCH" : "POST",
        body: JSON.stringify({
          ...f,
          userId: f.userId || null,
          licenseIdentifier: f.licenseIdentifier || null,
          assignedDate: f.assignedDate || null,
          expiryDate: f.expiryDate || null,
          credentialSecretRef: f.credentialSecretRef || null,
          notes:
            [
              f.notes,
              otherLicenseType && `Other license type: ${otherLicenseType}`,
              otherLicenseStatus &&
                `Other license status: ${otherLicenseStatus}`,
            ]
              .filter(Boolean)
              .join("\n") || null,
        }),
      });
      toast.success(item ? "License updated" : "License created");
      saved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={item ? "Edit Autodesk License" : "Add Autodesk License"}
      close={close}
    >
      <form className="form-grid" onSubmit={submit}>
        <Field label="Employee">
          <select
            value={f.userId}
            onChange={(e) => setF({ ...f, userId: e.target.value })}
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {userOptionLabel(u)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Autodesk Email">
          <input
            type="email"
            value={f.autodeskEmail}
            onChange={(e) => setF({ ...f, autodeskEmail: e.target.value })}
          />
        </Field>
        <Field label="License Type">
          <select
            value={f.licenseType}
            onChange={(e) => setF({ ...f, licenseType: e.target.value })}
          >
            {[
              "aec",
              "forma",
              "autocad",
              "revit",
              "maya",
              "3ds_max",
              "civil_3d",
              "fusion",
              "collaboration",
              "other",
            ].map((v) => (
              <option key={v} value={v}>
                {optionLabel(v)}
              </option>
            ))}
          </select>
        </Field>
        {f.licenseType === "other" && (
          <Field label="Other License Type">
            <input
              value={otherLicenseType}
              onChange={(e) => setOtherLicenseType(e.target.value)}
              placeholder="Specify license type"
            />
          </Field>
        )}
        <Field label="License Status">
          <select
            value={f.licenseStatus}
            onChange={(e) => setF({ ...f, licenseStatus: e.target.value })}
          >
            {[
              "assigned",
              "unassigned",
              "expired",
              "suspended",
              "pending",
              "cancelled",
              "other",
            ].map((v) => (
              <option key={v} value={v}>
                {optionLabel(v)}
              </option>
            ))}
          </select>
        </Field>
        {f.licenseStatus === "other" && (
          <Field label="Other License Status">
            <input
              value={otherLicenseStatus}
              onChange={(e) => setOtherLicenseStatus(e.target.value)}
              placeholder="Specify license status"
            />
          </Field>
        )}
        <Field label="License Identifier">
          <input
            value={f.licenseIdentifier}
            onChange={(e) => setF({ ...f, licenseIdentifier: e.target.value })}
          />
        </Field>
        <Field label="Assigned Date">
          <input
            type="date"
            value={f.assignedDate}
            onChange={(e) => setF({ ...f, assignedDate: e.target.value })}
          />
        </Field>
        <Field label="Expiry Date">
          <input
            type="date"
            value={f.expiryDate}
            onChange={(e) => setF({ ...f, expiryDate: e.target.value })}
          />
        </Field>
        <Field label="Notes">
          <textarea
            value={f.notes}
            onChange={(e) => setF({ ...f, notes: e.target.value })}
          />
        </Field>
        <Actions busy={busy} close={close} text="Save License" />
      </form>
    </Modal>
  );
}

function TeamsPage() {
  const currentUser = useContext(UserContext);
  const [rows, setRows] = useState<Row[]>([]);
  const [users, setUsers] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [edit, setEdit] = useState<Row | null>(null);
  async function load() {
    try {
      const [r, u] = await Promise.all([
        listAll(
          `/teams?page=1&pageSize=100&search=${encodeURIComponent(search)}`,
        ),
        lookup(currentUser, "/users?page=1&pageSize=100", "USER_VIEW"),
      ]);
      setRows(r.rows || []);
      setUsers(u.data || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to load Teams");
    }
  }
  useEffect(() => {
    void load();
  }, [search]);
  return (
    <>
      <Header
        title="Teams"
        subtitle="Microsoft Teams account information and lifecycle."
        action={
          <Can permission="TEAMS_MANAGE">
            <button
              className="primary-button"
              onClick={() => setEdit({ id: "" })}
            >
              <Plus size={16} /> Add Teams Account
            </button>
          </Can>
        }
      />
      <Toolbar
        search={search}
        setSearch={setSearch}
        refresh={() => void load()}
      />
      <Table
        headers={[
          "Employee",
          "Teams Email",
          "Status",
          "Assigned",
          "Disabled",
          "Actions",
        ]}
      >
        {rows.map((r) => (
          <tr key={r.id}>
            <td>{r.employee_name}</td>
            <td>{r.teams_email}</td>
            <td>
              <Badge value={r.account_status || "Unknown"} />
            </td>
            <td>{r.assigned_date || "—"}</td>
            <td>{r.disabled_date || "—"}</td>
            <td>
              <Can permission="TEAMS_MANAGE">
                <button className="link-button" onClick={() => setEdit(r)}>
                  <Pencil size={14} /> Edit
                </button>
              </Can>
            </td>
          </tr>
        ))}
      </Table>
      {!rows.length && <Empty text="No Teams accounts found." />}
      {edit && (
        <TeamsForm
          item={edit.id ? edit : null}
          users={users}
          close={() => setEdit(null)}
          saved={() => {
            setEdit(null);
            void load();
          }}
        />
      )}
    </>
  );
}
function TeamsForm({
  item,
  users,
  close,
  saved,
}: {
  item: Row | null;
  users: Row[];
  close: () => void;
  saved: () => void;
}) {
  const [f, setF] = useState({
    userId: item?.user_id || "",
    teamsEmail: item?.teams_email || "",
    accountStatus: item?.account_status || "active",
    assignedDate: item?.assigned_date || "",
    disabledDate: item?.disabled_date || "",
    notes: item?.notes || "",
  });
  const [otherAccountStatus, setOtherAccountStatus] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await api(item ? `/teams/${item.id}` : "/teams", {
        method: item ? "PATCH" : "POST",
        body: JSON.stringify({
          ...f,
          assignedDate: f.assignedDate || null,
          disabledDate: f.disabledDate || null,
          notes:
            [
              f.notes,
              otherAccountStatus &&
                `Other account status: ${otherAccountStatus}`,
            ]
              .filter(Boolean)
              .join("\n") || null,
        }),
      });
      toast.success(item ? "Teams account updated" : "Teams account created");
      saved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={item ? "Edit Teams Account" : "Add Teams Account"}
      close={close}
    >
      <form className="form-grid" onSubmit={submit}>
        <Field label="Employee">
          <select
            required
            value={f.userId}
            onChange={(e) => setF({ ...f, userId: e.target.value })}
          >
            <option value="">Select employee</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {userOptionLabel(u)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Teams Email">
          <input
            type="email"
            required
            value={f.teamsEmail}
            onChange={(e) => setF({ ...f, teamsEmail: e.target.value })}
          />
        </Field>
        <Field label="Account Status">
          <select
            value={f.accountStatus}
            onChange={(e) => setF({ ...f, accountStatus: e.target.value })}
          >
            {[
              "active",
              "inactive",
              "disabled",
              "pending",
              "blocked",
              "other",
            ].map((v) => (
              <option key={v} value={v}>
                {optionLabel(v)}
              </option>
            ))}
          </select>
        </Field>
        {f.accountStatus === "other" && (
          <Field label="Other Account Status">
            <input
              value={otherAccountStatus}
              onChange={(e) => setOtherAccountStatus(e.target.value)}
              placeholder="Specify account status"
            />
          </Field>
        )}
        <Field label="Assigned Date">
          <input
            type="date"
            value={f.assignedDate}
            onChange={(e) => setF({ ...f, assignedDate: e.target.value })}
          />
        </Field>
        <Field label="Disabled Date">
          <input
            type="date"
            value={f.disabledDate}
            onChange={(e) => setF({ ...f, disabledDate: e.target.value })}
          />
        </Field>
        <Field label="Notes">
          <textarea
            value={f.notes}
            onChange={(e) => setF({ ...f, notes: e.target.value })}
          />
        </Field>
        <Actions busy={busy} close={close} text="Save Account" />
      </form>
    </Modal>
  );
}

const reportColumns: Record<string, string[]> = {
  assets: ["asset_tag", "hostname", "device_type", "manufacturer", "model", "serial_number", "cpu", "ram_gb", "storage_type", "storage_capacity_gb", "gpu", "graphics_memory_gb", "antivirus", "status", "company", "location", "purchase_date", "assigned_date", "warranty_expiry", "vendor", "notes"],
  users: ["employee_id", "employee_name", "company", "department", "email", "job_title", "status"],
  licenses: ["license_identifier", "autodesk_email", "license_type", "license_status", "employee_name", "assigned_date", "expiry_date"],
  teams: ["employee_id", "employee_name", "teams_email", "account_status", "assigned_date", "disabled_date", "notes"],
};
function reportLabel(key: string) {
  return ({ cpu: "CPU", gpu: "GPU", ram_gb: "RAM (GB)", storage_capacity_gb: "Storage (GB)", graphics_memory_gb: "Graphics Memory (GB)" } as Record<string, string>)[key] || optionLabel(key);
}
function normalizeReportRows(type: string, data: Row[]): Row[] {
  return data.map((r) => {
    const out: Row = { ...r };
    const aliases = out as Record<string, unknown>;
    // common aliases
    if (r.asset_tag) out.asset_tag = r.asset_tag;
    if (r.assetTag) out.asset_tag = out.asset_tag ?? r.assetTag;
    if (r.hostname) out.hostname = r.hostname;
    if (r.device_type) out.device_type = r.device_type;
    if (r.device_type_name) out.device_type_name = r.device_type_name;
    if (r.category_name) out.device_type_name = out.device_type_name ?? r.category_name;
    // camelCase helpers
    if (r.asset_tag && !r.assetTag) out.assetTag = r.asset_tag;
    if (r.serial_number && !r.serialNumber) out.serialNumber = r.serial_number;
    if (r.storage_capacity_gb && !aliases.storageCapacityGb) aliases.storageCapacityGb = r.storage_capacity_gb;
    if (r.ram_gb && !aliases.ramGb) aliases.ramGb = r.ram_gb;
    if (r.graphics_memory_gb && !aliases.graphicsMemoryGb) aliases.graphicsMemoryGb = r.graphics_memory_gb;
    if (r.warranty_expiry && !aliases.warrantyEndDate) aliases.warrantyEndDate = r.warranty_expiry;
    if (r.warranty_end_date && !aliases.warrantyEndDate) aliases.warrantyEndDate = r.warranty_end_date;
    if (r.assigned_date && !out.assigned_date) out.assigned_date = r.assigned_date;
    if (r.assigned_at && !out.assigned_date) out.assigned_date = r.assigned_at;
    if (r.company_name && !out.company) out.company = r.company_name;
    if (r.company && !out.company_name) out.company_name = r.company;
    if (r.location_name && !out.location) out.location = r.location_name;
    if (r.location && !out.location_name) out.location_name = r.location;
    // ensure units exist
    if (!out.storage_unit && r.storage_unit) out.storage_unit = r.storage_unit;
    if (!out.ram_unit && r.ram_unit) out.ram_unit = r.ram_unit;
    return out as Row;
  });
}
function ReportsPage() {
  const [type, setType] = useState("assets");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const requestId = useRef(0);
  async function load() {
    const id = ++requestId.current;
    setLoading(true);
    setError("");
    setRows([]);
    try {
      const result = await api<Row[]>(`/reports/${type}`);
      if (id === requestId.current) setRows(normalizeReportRows(type, result || []));
    } catch (e) {
      if (id === requestId.current) setError(e instanceof Error ? e.message : "Unable to load report");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }
  useEffect(() => {
    void load();
    return () => { requestId.current++; };
  }, [type]);
  const columns = reportColumns[type]!;
  const visible = rows.filter(row => columns.some(key => String((row as Record<string, unknown>)[key] ?? "").toLowerCase().includes(search.toLowerCase())));
  return (
    <>
      <Header title="Reports" subtitle="Review inventory, employees, licenses and Teams accounts. Export the complete selected report to Excel." />
      <div className="report-actions">
        <select aria-label="Report type" value={type} onChange={e => { setType(e.target.value); setSearch(""); }}>
          <option value="assets">Assets</option><option value="users">Employees</option><option value="licenses">Autodesk Licenses</option><option value="teams">Teams Accounts</option>
        </select>
        <button className="primary-button" disabled={loading} onClick={() => void load()}><ChartNoAxesCombined size={16} /> {loading ? "Loading..." : "Generate"}</button>
        <Can permission="REPORT_EXPORT">
          <button className="secondary-button" disabled={exporting || loading || !!error} onClick={async () => {
            setExporting(true);
            try { await exportReport(type); toast.success("Excel export downloaded"); }
            catch (e) { toast.error(e instanceof Error ? e.message : "Export failed"); }
            finally { setExporting(false); }
          }}><Download size={16} /> {exporting ? "Exporting..." : `Export ${optionLabel(type)}`}</button>
        </Can>
      </div>
      <Toolbar search={search} setSearch={setSearch} refresh={() => void load()} />
      {error && <p role="alert" className="page-error">{error}</p>}
      {loading ? <p role="status">Loading report...</p> : !error && <>
        <p>{visible.length} of {rows.length} records. Excel includes all records.</p>
        {type === "assets" ? (() => {
          const headers = [
            "Asset Tag / Hostname",
            "Device Type",
            "Manufacturer",
            "Model",
            "Serial Number",
            "CPU",
            "RAM",
            "Storage Type",
            "Storage",
            "GPU",
            "Graphics Memory (GB)",
            "Antivirus",
            "Company",
            "Location",
            "Purchase Date",
            "Assigned Date",
            "Warranty Expiry",
            "Vendor",
            "Notes",
          ];
          function cell(value: unknown) { return value == null || value === "" ? "—" : String(value); }
          async function exportCsv() {
            try {
              setExporting(true);
              const all = rows;
              const csvRows = [headers.join(",")];
              for (const r of all) {
                const assetTag = (r['asset_tag'] || r['assetTag']) || r['hostname'] || "";
                const deviceType = r['device_type'] || r['device_type_name'] || r['category_name'] || "";
                const storageType = storageLabel(r['storage_type']);
                const storageValue = capacity(r['storage_capacity_gb'], r['storage_unit']);
                const ramValue = capacity(r['ram_gb'], r['ram_unit']);
                const graphics = capacity(r['graphics_memory_gb']);
                const assigned = r['assigned_date'] || r['assigned_at'] || "Not Assigned";
                const rowValues = [assetTag, deviceType, r['manufacturer'] || "", r['model'] || "", r['serial_number'] || "", r['cpu'] || "", ramValue, storageType, storageValue, r['gpu'] || "", graphics, r['antivirus'] || "", r['company'] || "", r['location'] || "", r['purchase_date'] || "", assigned, r['warranty_expiry'] || r['warranty_end_date'] || "", r['vendor'] || "", r['notes'] || ""].map(v => `"${String(v).replace(/"/g, '""')}"`);
                csvRows.push(rowValues.join(","));
              }
              const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `inventory-assets-${new Date().toISOString().slice(0,10)}.csv`;
              document.body.append(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
              toast.success("CSV export downloaded");
            } catch (e) { toast.error(e instanceof Error ? e.message : "CSV export failed"); }
            finally { setExporting(false); }
          }
          return <>
            <div className="report-export-controls no-print">
              <Can permission="REPORT_EXPORT"><button className="secondary-button" disabled={exporting} onClick={() => void exportCsv()}><Download size={16} /> {exporting ? "Exporting..." : "Export CSV"}</button></Can>
              <button className="secondary-button" onClick={() => window.print()}><Download size={16} /> Print / PDF</button>
            </div>
            <Table headers={headers}>{visible.map((r, i) => <tr key={i}>
              <td>{cell(r['asset_tag'] || r['assetTag'] || r['hostname'])}</td>
              <td>{cell(r['device_type'] || r['device_type_name'] || r['category_name'])}</td>
              <td>{cell(r['manufacturer'])}</td>
              <td>{cell(r['model'])}</td>
              <td>{cell(r['serial_number'])}</td>
              <td>{cell(r['cpu'])}</td>
              <td>{cell(capacity(r['ram_gb'], r['ram_unit']))}</td>
              <td>{cell(storageLabel(r['storage_type']))}</td>
              <td>{cell(capacity(r['storage_capacity_gb'], r['storage_unit']))}</td>
              <td>{cell(r['gpu'])}</td>
              <td>{cell(capacity(r['graphics_memory_gb']))}</td>
              <td>{cell(r['antivirus'])}</td>
              <td>{cell(r['company'])}</td>
              <td>{cell(r['location'])}</td>
              <td>{cell(r['purchase_date'] ? String(r['purchase_date']).slice(0,10) : "—")}</td>
              <td>{r['assigned_date'] || r['assigned_at'] ? String(r['assigned_date'] || r['assigned_at']).slice(0,10) : "Not Assigned"}</td>
              <td>{cell(r['warranty_expiry'] || r['warranty_end_date'])}</td>
              <td>{cell(r['vendor'])}</td>
              <td>{cell(r['notes'])}</td>
            </tr>)}</Table>
          </>;
        })() : <Table headers={columns.map(reportLabel)}>{visible.map((row, index) => <tr key={index}>{columns.map(key => <td key={key}>{key === "license_type" ? optionLabel(String(row[key] || "")) : String(row[key as keyof Row] ?? "—")}</td>)}</tr>)}</Table>}
        {!visible.length && <Empty text="No records match this report." />}
      </>}
    </>
  );
}

const preferenceDefaults = { appName: "Inventory Management", pageSize: 25 };
const PreferencesContext = createContext(preferenceDefaults);
const settingControls = [
  { key: "app.name", title: "Application name", category: "general", value: "Inventory Management", description: "Name displayed in the workspace header and browser title.", icon: Building2 },
  { key: "app.default_page_size", title: "Inventory page size", category: "general", value: 25, min: 5, max: 100, description: "Number of peripherals shown on each inventory page.", icon: Layers },
  { key: "asset.warranty_warning_days", title: "Warranty warning days", category: "asset", value: 30, min: 1, max: 365, description: "Days before warranty expiry included in dashboard warnings.", icon: Monitor },
  { key: "license.expiry_warning_days", title: "License warning days", category: "license", value: 30, min: 1, max: 365, description: "Days before Autodesk license expiry included in dashboard warnings.", icon: ShieldCheck },
  { key: "security.max_login_attempts", title: "Failed login limit", category: "security", value: 5, min: 3, max: 20, description: "Failed attempts before an account is temporarily locked.", icon: LockKeyhole },
  { key: "security.lockout_minutes", title: "Lockout duration", category: "security", value: 15, min: 1, max: 1440, description: "Minutes an account remains locked after failed attempts.", icon: ShieldCheck },
];
function SettingControl({ definition, row, saved }: { definition: typeof settingControls[number]; row?: Row; saved: () => void }) {
  const currentUser = useContext(UserContext);
  const [value, setValue] = useState(String(row?.is_active !== false ? row?.setting_value ?? definition.value : definition.value));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const editable = !!currentUser && allowed(currentUser, "SETTING_MANAGE");
  const Icon = definition.icon;
  return <form className="setting-card" onSubmit={async e => {
    e.preventDefault();
    if (busy || !editable) return;
    setBusy(true); setError("");
    try {
      const settingValue = typeof definition.value === "number" ? Number(value) : value.trim();
      await api(row ? `/settings/${row.id}` : "/settings", { method: row ? "PATCH" : "POST", body: JSON.stringify({ settingKey: definition.key, category: definition.category, settingValue, description: definition.description, isActive: true }) });
      toast.success(`${definition.title} saved`);
      window.dispatchEvent(new CustomEvent("inventory-preferences-updated", { detail: { key: definition.key, value: settingValue } }));
      saved();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save setting"); }
    finally { setBusy(false); }
  }}>
    <div className="setting-card-heading"><Icon size={21} /><h3>{definition.title}</h3></div>
    <p>{definition.description}</p>
    <label className="form-field"><span>{definition.title}</span><input required aria-label={definition.title} type={typeof definition.value === "number" ? "number" : "text"} min={definition.min} max={definition.max} maxLength={80} step="1" disabled={!editable || busy} value={value} onChange={e => setValue(e.target.value)} /></label>
    {error && <p role="alert">{error}</p>}
    {editable && <button className="secondary-button" disabled={busy}>{busy ? "Saving..." : `Save ${definition.title.toLowerCase()}`}</button>}
  </form>;
}

function SettingsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [edit, setEdit] = useState<Row | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  async function load() {
    setError("");
    try {
      setRows(await api<Row[]>("/settings"));
      setLoaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load settings");
    }
  }
  useEffect(() => {
    void load();
  }, []);
  return (
    <>
      <Header
        title="Settings"
        subtitle="Application, security, notification and inventory configuration."
        action={
          <Can permission="SETTING_MANAGE">
            <button
              className="primary-button"
              onClick={() => setEdit({ id: "" })}
            >
              <Plus size={16} /> Add Setting
            </button>
          </Can>
        }
      />
      {error && <p role="alert">{error}</p>}
      {!loaded && !error && <p role="status">Loading settings...</p>}
      {loaded && <div className="settings-grid">{settingControls.map(definition => {
        const row = rows.find(row => row.setting_key === definition.key);
        return <SettingControl key={`${definition.key}:${row?.updated_at}:${JSON.stringify(row?.setting_value)}:${row?.is_active}`} definition={definition} row={row} saved={() => void load()} />;
      })}</div>}
      <h3 className="settings-heading"><Settings size={18} /> Configuration records</h3>
      <p>Manage stored values and custom configuration. The controls above describe the settings applied by this application.</p>
      <Toolbar search={search} setSearch={setSearch} refresh={() => void load()} />
      <select className="settings-filter" aria-label="Setting category filter" value={category} onChange={e => setCategory(e.target.value)}>
        <option value="all">All categories</option>
        {[...new Set(rows.map(row => row.category || "general"))].sort().map(value => <option key={value} value={value}>{optionLabel(value)}</option>)}
      </select>
      <Table
        headers={[
          "Setting",
          "Category",
          "Value",
          "Description",
          "Status",
          "Updated",
          "Actions",
        ]}
      >
        {rows.filter(row => (category === "all" || row.category === category) && `${row.setting_key} ${row.description}`.toLowerCase().includes(search.toLowerCase())).map((r) => (
          <tr key={r.id}>
            <td>
              <strong>{r.setting_key}</strong>
            </td>
            <td>{r.category}</td>
            <td>
              <code>
                {typeof r.setting_value === "object"
                  ? JSON.stringify(r.setting_value)
                  : String(r.setting_value)}
              </code>
            </td>
            <td>{r.description || "—"}</td>
            <td>
              <Badge value={r.is_active ? "Active" : "Inactive"} />
            </td>
            <td>
              {r.updated_at ? new Date(r.updated_at).toLocaleString() : "—"}
            </td>
            <td>
              <Can permission="SETTING_MANAGE">
                <button className="link-button" onClick={() => setEdit(r)}>
                  <Pencil size={14} /> Edit
                </button>
              </Can>
            </td>
          </tr>
        ))}
      </Table>
      {!rows.length && <Empty text="No settings configured." />}
      {edit && (
        <SettingForm
          item={edit.id ? edit : null}
          close={() => setEdit(null)}
          saved={() => {
            setEdit(null);
            window.dispatchEvent(new Event("inventory-preferences-updated"));
            void load();
          }}
        />
      )}
    </>
  );
}
export function SettingForm({
  item,
  close,
  saved,
}: {
  item: Row | null;
  close: () => void;
  saved: () => void;
}) {
  const [f, setF] = useState({
    settingKey: item?.setting_key || "",
    category: item?.category && settingCategories.includes(item.category) ? item.category : "other",
    settingValue:
      item?.setting_value !== undefined
        ? JSON.stringify(item.setting_value)
        : "",
    description: item?.description || "",
    isActive: item?.is_active !== false,
  });
  const [otherCategory, setOtherCategory] = useState(
    item?.category && !settingCategories.includes(item.category)
      ? item.category
      : "",
  );
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      let v: unknown = f.settingValue;
      try {
        v = JSON.parse(f.settingValue);
      } catch {
        /* Plain text is also a valid setting value. */
      }
      await api(item ? `/settings/${item.id}` : "/settings", {
        method: item ? "PATCH" : "POST",
        body: JSON.stringify({
          settingKey: f.settingKey,
          category:
            f.category === "other" && otherCategory.trim()
              ? otherCategory.trim()
              : f.category,
          settingValue: v,
          description: f.description || null,
          isActive: f.isActive,
        }),
      });
      toast.success(item ? "Setting updated" : "Setting created");
      saved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={item ? "Edit Setting" : "Add Setting"} close={close}>
      <form className="form-grid" onSubmit={submit}>
        <Field label="Setting Key">
          <input
            required
            value={f.settingKey}
            onChange={(e) => setF({ ...f, settingKey: e.target.value })}
          />
        </Field>
        <Field label="Category">
          <select
            value={f.category}
            onChange={(e) => setF({ ...f, category: e.target.value })}
          >
            {settingCategories.map((v) => (
              <option key={v} value={v}>
                {optionLabel(v)}
              </option>
            ))}
          </select>
        </Field>
        {f.category === "other" && (
          <Field label="Other Category">
            <input
              value={otherCategory}
              onChange={(e) => setOtherCategory(e.target.value)}
              placeholder="Enter a category"
            />
          </Field>
        )}
        <Field label="Value">
          <textarea
            required
            value={f.settingValue}
            onChange={(e) => setF({ ...f, settingValue: e.target.value })}
          />
        </Field>
        <Field label="Description">
          <textarea
            value={f.description}
            onChange={(e) => setF({ ...f, description: e.target.value })}
          />
        </Field>
        <Field label="Setting status"><select value={f.isActive ? "active" : "inactive"} onChange={e => setF({ ...f, isActive: e.target.value === "active" })}><option value="active">Active</option><option value="inactive">Inactive (use application default)</option></select></Field>
        <Actions busy={busy} close={close} text="Save Setting" />
      </form>
    </Modal>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [assignmentAssetId, setAssignmentAssetId] = useState("");
  const [selectedPage, setPage] = useState<Page>("Dashboard");
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [preferences, setPreferences] = useState(preferenceDefaults);
  useEffect(() => {
    if (!user) { setPreferences(preferenceDefaults); return; }
    let active = true;
    const load = (event?: Event) => {
      const change = event instanceof CustomEvent && isRecord(event.detail) ? event.detail : null;
      if (change?.key === "app.name" && typeof change.value === "string") {
        const appName = change.value;
        setPreferences(value => ({ ...value, appName }));
        return;
      }
      if (change?.key === "app.default_page_size" && typeof change.value === "number") {
        const pageSize = change.value;
        setPreferences(value => ({ ...value, pageSize }));
        return;
      }
      void api<typeof preferenceDefaults>("/preferences").then(value => {
      if (active) setPreferences({ appName: typeof value.appName === "string" ? value.appName : preferenceDefaults.appName, pageSize: Number.isInteger(value.pageSize) && value.pageSize >= 5 && value.pageSize <= 100 ? value.pageSize : 25 });
      }).catch(() => { /* Keep the current display preferences if the request fails. */ });
    };
    load();
    window.addEventListener("inventory-preferences-updated", load);
    return () => { active = false; window.removeEventListener("inventory-preferences-updated", load); };
  }, [user]);
  useEffect(() => { document.title = preferences.appName; }, [preferences.appName]);
  useEffect(() => {
    const expire = () => setUser(null);
    window.addEventListener("inventory-session-expired", expire);
    return () =>
      window.removeEventListener("inventory-session-expired", expire);
  }, []);
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    api<User>("/auth/me")
      .then(setUser)
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);
  if (loading)
    return (
      <div className="loading-screen">
        <Boxes size={30} /> Loading Inventory Management...
      </div>
    );
  if (!user)
    return (
      <>
        <Toaster position="top-right" richColors />
        <Login onLogin={setUser} />
      </>
    );
  const visible = nav.filter(([label]) => {
    if (label === "Dashboard") return allowed(user, "DASHBOARD_VIEW");
    if (label === "Peripherals" || label === "Assets Management")
      return allowed(user, "ASSET_VIEW");
    if (label === "Company") return allowed(user, "COMPANY_VIEW");
    if (label === "Department") return allowed(user, "DEPARTMENT_VIEW");
    if (label === "User Management") return allowed(user, "USER_VIEW");
    if (label === "AUTODESK") return allowed(user, "AUTODESK_VIEW");
    if (label === "Teams") return allowed(user, "TEAMS_VIEW");
    if (label === "Reports") return allowed(user, "REPORT_VIEW");
    return allowed(user, "SETTING_VIEW");
  });
  const page = visible.some(([label]) => label === selectedPage)
    ? selectedPage
    : visible[0]?.[0];
  async function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    toast.success("Signed out");
  }
  return (
    <UserContext.Provider value={user}><PreferencesContext.Provider value={preferences}>
      <Toaster position="top-right" richColors />
      <div className="app-shell">
        <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
          <div className="brand">
            <div className="brand-logo">
              <Boxes size={20} />
            </div>
            <div>
              <div className="brand-title">
                {preferences.appName}
              </div>
              <div className="brand-subtitle">ASSET MANAGEMENT</div>
            </div>
          </div>
          <div className="sidebar-section-title">NAVIGATION</div>
          <nav className="navigation">
            {visible.map(([label, Icon]) => (
              <button
                key={label}
                className={`navigation-item ${page === label ? "active" : ""}`}
                onClick={() => { setAssignmentAssetId(""); setPage(label); }}
              >
                <span className="navigation-icon">
                  <Icon size={17} />
                </span>
                {label}
              </button>
            ))}
          </nav>
          <div className="sidebar-footer">
            <div className="system-status">
              <span className="status-dot" /> Signed in
            </div>
          </div>
        </aside>
        <main className="main-content">
          <header className="topbar">
            <button
              className="icon-button"
              onClick={() => setCollapsed(!collapsed)}
              title="Toggle navigation"
            >
              <Menu size={20} />
            </button>
            <div>
              <div className="breadcrumb">
                {preferences.appName.toUpperCase()} / {(page || "No access").toUpperCase()}
              </div>
              <h1>{page}</h1>
            </div>
            <div className="user-area">
              <div className="user-info">
                <div className="user-name">{nameOf(user)}</div>
                <div className="user-role">
                  {user.isSuperAdmin
                    ? "Super Admin"
                    : user.roles?.[0] || "User"}
                </div>
              </div>
              <div className="user-avatar">
                <UserRound size={18} />
              </div>
              <button
                className="logout-button"
                onClick={() => void logout()}
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </header>
          <section className="content">
            {!page && (
              <Empty text="No sections are available for your account. Contact your administrator." />
            )}
            {page === "Dashboard" && <Dashboard user={user} />}{" "}
            {page === "Peripherals" && <AssetsPage onAssign={id => { setAssignmentAssetId(id); setPage("Assets Management"); }} />}{" "}
            {page === "Assets Management" && <AssetsPage assignment initialAssetId={assignmentAssetId} />}{" "}
            {page === "Company" && <CompanyPage />}{" "}
            {page === "Department" && <DepartmentPage />}{" "}
            {page === "User Management" && <UserPage />}{" "}
            {page === "AUTODESK" && <AutodeskPage />}{" "}
            {page === "Teams" && <TeamsPage />}{" "}
            {page === "Reports" && <ReportsPage />}{" "}
            {page === "Settings" && <SettingsPage />}
          </section>
        </main>
      </div>
    </PreferencesContext.Provider></UserContext.Provider>
  );
}
