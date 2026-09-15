import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  Boxes,
  LayoutDashboard,
  Mouse,
  Monitor,
  Building2,
  Network,
  Users,
  Layers,
  UsersRound,
  ChartNoAxesCombined,
  Settings,
  ArrowUpRight,
  ArrowRight,
  ShieldCheck,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  LogOut,
  X,
  Package,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";

type User = {
  id: string;
  first_name?: string;
  last_name?: string | null;
  firstName?: string;
  lastName?: string | null;
  email: string;
  job_title?: string | null;
  jobTitle?: string | null;
  is_super_admin?: boolean;
  isSuperAdmin?: boolean;
};
type Company = {
  id: string;
  name: string;
  legal_name?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  is_active?: boolean;
};
type Department = {
  id: string;
  company_id: string;
  name: string;
  manager_name?: string | null;
  email?: string | null;
  is_active?: boolean;
};
type Asset = {
  id: string;
  asset_tag: string;
  serial_number: string;
  manufacturer?: string | null;
  model?: string | null;
  condition?: string;
  hostname?: string | null;
  cpu?: string | null;
  ram_gb?: number | null;
};
type Lookup = { id: string; name: string };
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

const navigationItems: { label: Page; icon: LucideIcon }[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Peripherals", icon: Mouse },
  { label: "Assets Management", icon: Monitor },
  { label: "Company", icon: Building2 },
  { label: "Department", icon: Network },
  { label: "User Management", icon: Users },
  { label: "AUTODESK", icon: Layers },
  { label: "Teams", icon: UsersRound },
  { label: "Reports", icon: ChartNoAxesCombined },
  { label: "Settings", icon: Settings },
];
const TOKEN_KEY = "inventory_access_token";

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`/api${path}`, { ...options, headers });
  const text = await response.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!response.ok) {
    if (response.status === 401) localStorage.removeItem(TOKEN_KEY);
    throw new Error(
      body?.error?.message ||
        body?.message ||
        `Request failed (${response.status})`,
    );
  }
  return body?.success === true &&
    Object.prototype.hasOwnProperty.call(body, "data")
    ? body.data
    : body;
}

export function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await api<{ accessToken: string; user: User }>(
        "/auth/login",
        { method: "POST", body: JSON.stringify({ email, password }) },
      );
      localStorage.setItem(TOKEN_KEY, result.accessToken);
      onLogin(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
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
            One beautifully connected workspace.
          </p>
          <img
            className="inventory-art"
            src="/inventory-scene.svg"
            alt="Isometric illustration of a connected inventory workspace with a laptop, storage boxes, and asset labels"
          />
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
        <div className="story-footer">
          A clearer view. A smarter workplace.<span>INVENTORY / 01</span>
        </div>
      </section>
      <section className="login-form-side">
        <div className="login-topnote">
          <ShieldCheck size={16} /> Your secure workspace
        </div>
        <div className="login-card">
          <div className="login-welcome-icon">
            <Boxes size={28} />
          </div>
          <span className="eyebrow">WELCOME BACK</span>
          <h2>Good to see you again.</h2>
          <p>Sign in to keep everything moving.</p>
          <form onSubmit={submit} className="form-stack">
            <label htmlFor="login-email">
              Work email
              <div className="input-with-icon">
                <Mail size={18} />
                <input
                  id="login-email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
            </label>
            <label htmlFor="login-password">
              Password
              <div className="input-with-icon">
                <LockKeyhole size={18} />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            {error && (
              <div role="alert" className="form-error">
                {error}
              </div>
            )}
            <button className="primary-button login-submit" disabled={busy}>
              {busy ? "Signing in..." : "Sign in to workspace"}
              <ArrowRight size={18} />
            </button>
          </form>
          <p className="login-help">
            Need access or help signing in?
            <br />
            <strong>Contact your workspace administrator.</strong>
          </p>
          <div className="login-security">
            <ShieldCheck size={16} /> Built for your team. Protected by design.
          </div>
        </div>
        <footer className="login-footer">
          {"\u00a9"} {new Date().getFullYear()} Inventory Management
          <span>Organized for what's next.</span>
        </footer>
      </section>
    </main>
  );
}
function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="modal-card"
      aria-label={title}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-header">
        <h2>{title}</h2>
        <button
          type="button"
          aria-label="Close dialog"
          className="icon-button"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-header-row">
      <div>
        <div className="breadcrumb">Inventory Management</div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
function DataTable({
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
function Empty({ text }: { text: string }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Package size={26} />
      </div>
      <h4>{text}</h4>
    </div>
  );
}
function Status({ active }: { active: boolean }) {
  return (
    <span className={`status-badge ${active ? "active" : "inactive"}`}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function CompanyPage() {
  const [rows, setRows] = useState<Company[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  async function load() {
    try {
      const result = await api<{ data: Company[] }>(
        `/companies?page=1&pageSize=100&search=${encodeURIComponent(search)}`,
      );
      setRows(result.data || []);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load companies");
    }
  }
  useEffect(() => {
    void load();
  }, [search]);
  async function remove(id: string) {
    if (!confirm("Deactivate this company?")) return;
    try {
      await api(`/companies/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }
  return (
    <>
      <PageHeader
        title="Company"
        subtitle="Manage company master data"
        action={
          <button
            className="primary-button"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            ＋ Add Company
          </button>
        }
      />
      <div className="toolbar">
        <input
          aria-label="Search companies"
          placeholder="Search company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="secondary-button" onClick={() => void load()}>
          Refresh
        </button>
      </div>
      {error && <div className="form-error page-error">{error}</div>}
      <DataTable
        headers={["Company", "Email", "Phone", "Location", "Status", "Actions"]}
      >
        {rows.map((row) => (
          <tr key={row.id}>
            <td>
              <strong>{row.name}</strong>
            </td>
            <td>{row.email || "—"}</td>
            <td>{row.phone || "—"}</td>
            <td>
              {[row.city, row.state, row.country].filter(Boolean).join(", ") ||
                "—"}
            </td>
            <td>
              <Status active={row.is_active !== false} />
            </td>
            <td>
              <button
                className="link-button"
                onClick={() => {
                  setEditing(row);
                  setOpen(true);
                }}
              >
                Edit
              </button>
              <button
                className="danger-link"
                onClick={() => void remove(row.id)}
              >
                Deactivate
              </button>
            </td>
          </tr>
        ))}
      </DataTable>
      {rows.length === 0 && (
        <Empty text="No companies found. Add your first company." />
      )}
      {open && (
        <CompanyForm
          company={editing}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            void load();
          }}
        />
      )}
    </>
  );
}
function CompanyForm({
  company,
  onClose,
  onSaved,
}: {
  company: Company | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(company?.name || "");
  const [legalName, setLegalName] = useState(company?.legal_name || "");
  const [email, setEmail] = useState(company?.email || "");
  const [phone, setPhone] = useState(company?.phone || "");
  const [city, setCity] = useState(company?.city || "");
  const [state, setState] = useState(company?.state || "");
  const [country, setCountry] = useState(company?.country || "India");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(company ? `/companies/${company.id}` : "/companies", {
        method: company ? "PATCH" : "POST",
        body: JSON.stringify({
          name,
          legalName: legalName || null,
          email: email || null,
          phone: phone || null,
          city: city || null,
          state: state || null,
          country: country || null,
          isActive: true,
        }),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={company ? "Edit Company" : "Add Company"} onClose={onClose}>
      <form onSubmit={submit} className="form-grid">
        <label>
          Company Name*
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label>
          Legal Name
          <input
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Phone
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label>
          City
          <input value={city} onChange={(e) => setCity(e.target.value)} />
        </label>
        <label>
          State
          <input value={state} onChange={(e) => setState(e.target.value)} />
        </label>
        <label>
          Country
          <input value={country} onChange={(e) => setCountry(e.target.value)} />
        </label>
        {error && <div className="form-error full-width">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" disabled={busy}>
            {busy ? "Saving..." : "Save Company"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function DepartmentPage() {
  const [rows, setRows] = useState<Department[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [error, setError] = useState("");
  async function load() {
    try {
      const [d, c] = await Promise.all([
        api<{ data: Department[] }>("/departments?page=1&pageSize=100"),
        api<{ data: Company[] }>("/companies?page=1&pageSize=100"),
      ]);
      setRows(d.data || []);
      setCompanies(c.data || []);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load departments");
    }
  }
  useEffect(() => {
    void load();
  }, []);
  const companyName = (id: string) =>
    companies.find((c) => c.id === id)?.name || "—";
  async function remove(id: string) {
    if (!confirm("Deactivate this department?")) return;
    try {
      await api(`/departments/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }
  return (
    <>
      <PageHeader
        title="Department"
        subtitle="Manage departments by company"
        action={
          <button
            className="primary-button"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            ＋ Add Department
          </button>
        }
      />
      {error && <div className="form-error page-error">{error}</div>}
      <DataTable
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
            <td>{companyName(r.company_id)}</td>
            <td>{r.manager_name || "—"}</td>
            <td>{r.email || "—"}</td>
            <td>
              <Status active={r.is_active !== false} />
            </td>
            <td>
              <button
                className="link-button"
                onClick={() => {
                  setEditing(r);
                  setOpen(true);
                }}
              >
                Edit
              </button>
              <button className="danger-link" onClick={() => void remove(r.id)}>
                Deactivate
              </button>
            </td>
          </tr>
        ))}
      </DataTable>
      {rows.length === 0 && (
        <Empty text="No departments found. Add your first department." />
      )}
      {open && (
        <DepartmentForm
          department={editing}
          companies={companies}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            void load();
          }}
        />
      )}
    </>
  );
}
function DepartmentForm({
  department,
  companies,
  onClose,
  onSaved,
}: {
  department: Department | null;
  companies: Company[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [companyId, setCompanyId] = useState(
    department?.company_id || companies[0]?.id || "",
  );
  const [name, setName] = useState(department?.name || "");
  const [managerName, setManagerName] = useState(
    department?.manager_name || "",
  );
  const [email, setEmail] = useState(department?.email || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = department
        ? {
            name,
            managerName: managerName || null,
            email: email || null,
            isActive: true,
          }
        : {
            companyId,
            name,
            managerName: managerName || null,
            email: email || null,
            isActive: true,
          };
      await api(department ? `/departments/${department.id}` : "/departments", {
        method: department ? "PATCH" : "POST",
        body: JSON.stringify(body),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={department ? "Edit Department" : "Add Department"}
      onClose={onClose}
    >
      <form onSubmit={submit} className="form-grid">
        {!department && (
          <label>
            Company*
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              required
            >
              <option value="">Select company</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          Department Name*
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label>
          Manager Name
          <input
            value={managerName}
            onChange={(e) => setManagerName(e.target.value)}
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        {error && <div className="form-error full-width">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="primary-button"
            disabled={busy || (!department && !companyId)}
          >
            {busy ? "Saving..." : "Save Department"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function AssetsPage() {
  const [rows, setRows] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<Lookup[]>([]);
  const [statuses, setStatuses] = useState<Lookup[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  async function load() {
    try {
      const [a, c, s, co] = await Promise.all([
        api<{ data: Asset[] }>("/assets?page=1&pageSize=100"),
        api<Lookup[]>("/assets/categories"),
        api<Lookup[]>("/assets/statuses"),
        api<{ data: Company[] }>("/companies?page=1&pageSize=100"),
      ]);
      setRows(a.data || []);
      setCategories(c || []);
      setStatuses(s || []);
      setCompanies(co.data || []);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load assets");
    }
  }
  useEffect(() => {
    void load();
  }, []);
  return (
    <>
      <PageHeader
        title="Assets Management"
        subtitle="Manage laptops, desktops, monitors and IT assets"
        action={
          <button className="primary-button" onClick={() => setOpen(true)}>
            ＋ Add Asset
          </button>
        }
      />
      {error && <div className="form-error page-error">{error}</div>}
      <DataTable
        headers={[
          "Asset Tag",
          "Serial Number",
          "Manufacturer / Model",
          "Hostname",
          "Condition",
          "CPU / RAM",
        ]}
      >
        {rows.map((r) => (
          <tr key={r.id}>
            <td>
              <strong>{r.asset_tag}</strong>
            </td>
            <td>{r.serial_number}</td>
            <td>
              {[r.manufacturer, r.model].filter(Boolean).join(" ") || "—"}
            </td>
            <td>{r.hostname || "—"}</td>
            <td>{r.condition || "—"}</td>
            <td>
              {[r.cpu, r.ram_gb ? `${r.ram_gb} GB` : ""]
                .filter(Boolean)
                .join(" / ") || "—"}
            </td>
          </tr>
        ))}
      </DataTable>
      {rows.length === 0 && (
        <Empty text="No assets found. Add your first asset." />
      )}
      {open && (
        <AssetForm
          categories={categories}
          statuses={statuses}
          companies={companies}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            void load();
          }}
        />
      )}
    </>
  );
}
function AssetForm({
  categories,
  statuses,
  companies,
  onClose,
  onSaved,
}: {
  categories: Lookup[];
  statuses: Lookup[];
  companies: Company[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [assetTag, setAssetTag] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [statusId, setStatusId] = useState(statuses[0]?.id || "");
  const [companyId, setCompanyId] = useState(companies[0]?.id || "");
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [hostname, setHostname] = useState("");
  const [cpu, setCpu] = useState("");
  const [ramGb, setRamGb] = useState("");
  const [storageType, setStorageType] = useState("none");
  const [storageCapacityGb, setStorageCapacityGb] = useState("");
  const [condition, setCondition] = useState("new");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/assets", {
        method: "POST",
        body: JSON.stringify({
          assetTag,
          serialNumber,
          categoryId,
          statusId,
          companyId,
          manufacturer: manufacturer || null,
          model: model || null,
          hostname: hostname || null,
          cpu: cpu || null,
          ramGb: ramGb ? Number(ramGb) : null,
          storageType,
          storageCapacityGb: storageCapacityGb
            ? Number(storageCapacityGb)
            : null,
          condition,
        }),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Add Asset" onClose={onClose}>
      <form onSubmit={submit} className="form-grid">
        <label>
          Asset Tag*
          <input
            value={assetTag}
            onChange={(e) => setAssetTag(e.target.value)}
            required
          />
        </label>
        <label>
          Serial Number*
          <input
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            required
          />
        </label>
        <label>
          Category*
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            {categories.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status*
          <select
            value={statusId}
            onChange={(e) => setStatusId(e.target.value)}
            required
          >
            {statuses.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Company*
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            required
          >
            {companies.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Manufacturer
          <input
            value={manufacturer}
            onChange={(e) => setManufacturer(e.target.value)}
          />
        </label>
        <label>
          Model
          <input value={model} onChange={(e) => setModel(e.target.value)} />
        </label>
        <label>
          Hostname
          <input
            value={hostname}
            onChange={(e) => setHostname(e.target.value)}
          />
        </label>
        <label>
          CPU
          <input value={cpu} onChange={(e) => setCpu(e.target.value)} />
        </label>
        <label>
          RAM (GB)
          <input
            type="number"
            min="1"
            value={ramGb}
            onChange={(e) => setRamGb(e.target.value)}
          />
        </label>
        <label>
          Storage Type
          <select
            value={storageType}
            onChange={(e) => setStorageType(e.target.value)}
          >
            <option value="none">None</option>
            <option value="hdd">HDD</option>
            <option value="ssd">SSD</option>
            <option value="nvme">NVMe</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </label>
        <label>
          Storage (GB)
          <input
            type="number"
            min="1"
            value={storageCapacityGb}
            onChange={(e) => setStorageCapacityGb(e.target.value)}
          />
        </label>
        <label>
          Condition
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
          >
            <option value="new">New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
            <option value="damaged">Damaged</option>
          </select>
        </label>
        {error && <div className="form-error full-width">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" disabled={busy}>
            {busy ? "Saving..." : "Save Asset"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function UsersPage() {
  const [rows, setRows] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  async function load() {
    try {
      const result = await api<{ data: User[] }>("/users?page=1&pageSize=100");
      setRows(result.data || []);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load users");
    }
  }
  useEffect(() => {
    void load();
  }, []);
  return (
    <>
      <PageHeader
        title="User Management"
        subtitle="Manage employees and application users"
        action={
          <button className="primary-button" onClick={() => setOpen(true)}>
            ＋ Add User
          </button>
        }
      />
      {error && <div className="form-error page-error">{error}</div>}
      <DataTable headers={["Employee", "Email", "Job Title", "Admin"]}>
        {rows.map((u) => (
          <tr key={u.id}>
            <td>
              <strong>
                {u.first_name || u.firstName} {u.last_name || u.lastName || ""}
              </strong>
            </td>
            <td>{u.email}</td>
            <td>{u.job_title || u.jobTitle || "—"}</td>
            <td>{u.is_super_admin || u.isSuperAdmin ? "Yes" : "No"}</td>
          </tr>
        ))}
      </DataTable>
      {rows.length === 0 && <Empty text="No users found." />}
      {open && (
        <UserForm
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            void load();
          }}
        />
      )}
    </>
  );
}
function UserForm({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/users", {
        method: "POST",
        body: JSON.stringify({
          firstName,
          lastName: lastName || null,
          email,
          password,
          jobTitle: jobTitle || null,
          status: "active",
          isSuperAdmin: false,
          roleIds: [],
        }),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Add User" onClose={onClose}>
      <form onSubmit={submit} className="form-grid">
        <label>
          First Name*
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </label>
        <label>
          Last Name
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </label>
        <label>
          Email*
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password*
          <input
            type="password"
            minLength={12}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <small>Minimum 12 characters</small>
        </label>
        <label>
          Job Title
          <input
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
          />
        </label>
        {error && <div className="form-error full-width">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" disabled={busy}>
            {busy ? "Saving..." : "Create User"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function Dashboard({ user, go }: { user: User; go: (page: Page) => void }) {
  const [summary, setSummary] = useState<{
    assets: number;
    companies: number;
    departments: number;
    users: number;
  } | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let ignore = false;
    void Promise.all([
      api<{ pagination: { total: number }; data: Asset[] }>(
        "/assets?page=1&pageSize=5&sortBy=createdAt&sortOrder=desc",
      ),
      api<{ pagination: { total: number } }>("/companies?page=1&pageSize=1"),
      api<{ pagination: { total: number } }>("/departments?page=1&pageSize=1"),
      api<{ pagination: { total: number } }>("/users?page=1&pageSize=1"),
    ])
      .then(([a, c, d, u]) => {
        if (!ignore) {
          setSummary({
            assets: a.pagination.total,
            companies: c.pagination.total,
            departments: d.pagination.total,
            users: u.pagination.total,
          });
          setAssets(a.data);
        }
      })
      .catch((e: unknown) => {
        if (!ignore)
          setError(e instanceof Error ? e.message : "Unable to load overview");
      });
    return () => {
      ignore = true;
    };
  }, []);
  const name = user.first_name || user.firstName || "Administrator";
  return (
    <>
      <div className="page-introduction">
        <div>
          <span className="eyebrow">YOUR WORKSPACE, AT A GLANCE</span>
          <h2>
            Welcome back, {name}
            <span className="brand-period">.</span>
          </h2>
          <p>Here's what's happening with your inventory today.</p>
        </div>
        <div className="dashboard-date">
          <CalendarDays size={16} />
          {new Date().toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      </div>
      <section className="dashboard-hero">
        <div>
          <span className="eyebrow">CONNECTED. ORGANIZED. IN CONTROL.</span>
          <h2>
            Every asset.
            <br />A little more clarity.
          </h2>
          <p>
            Give your equipment a home and your team
            <br className="desktop-break" /> the tools to do their best work.
          </p>
          <button
            className="primary-button"
            onClick={() => go("Assets Management")}
          >
            Explore your inventory <ArrowRight size={17} />
          </button>
        </div>
        <img
          src="/inventory-scene.svg"
          alt="Connected IT equipment and inventory boxes"
        />
      </section>
      {error && (
        <div className="form-error page-error" role="alert">
          Overview unavailable: {error}
        </div>
      )}
      <div className="statistics-grid">
        <Stat
          label="Total assets"
          value={summary?.assets}
          icon={Monitor}
          tone="purple"
          go={() => go("Assets Management")}
        />
        <Stat
          label="Companies"
          value={summary?.companies}
          icon={Building2}
          tone="blue"
          go={() => go("Company")}
        />
        <Stat
          label="Departments"
          value={summary?.departments}
          icon={Network}
          tone="orange"
          go={() => go("Department")}
        />
        <Stat
          label="Team members"
          value={summary?.users}
          icon={Users}
          tone="green"
          go={() => go("User Management")}
        />
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h3>Latest assets</h3>
              <p>Your most recently added equipment</p>
            </div>
            <button
              className="link-button"
              onClick={() => go("Assets Management")}
            >
              View all <ArrowUpRight size={15} />
            </button>
          </div>
          {assets.length > 0 ? (
            <DataTable headers={["Asset", "Serial number", "Condition"]}>
              {assets.map((asset) => (
                <tr key={asset.id}>
                  <td>
                    <div className="asset-cell">
                      <span className="asset-mini">
                        <Monitor size={18} />
                      </span>
                      <div>
                        <strong>{asset.asset_tag}</strong>
                        <small>
                          {[asset.manufacturer, asset.model]
                            .filter(Boolean)
                            .join(" ") || "IT equipment"}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>{asset.serial_number}</td>
                  <td>
                    <span className="status-badge">
                      {asset.condition || "Not specified"}
                    </span>
                  </td>
                </tr>
              ))}
            </DataTable>
          ) : (
            <Empty
              text={
                error
                  ? "Asset overview is unavailable."
                  : summary
                    ? "Your inventory starts here. Add your first asset."
                    : "Loading your inventory..."
              }
            />
          )}
        </section>
        <section className="panel">
          <div className="panel-header">
            <div>
              <h3>Make your next move</h3>
              <p>Shortcuts to your everyday essentials</p>
            </div>
            <Layers size={19} />
          </div>
          <div className="quick-actions">
            {navigationItems
              .filter((item) =>
                [
                  "Assets Management",
                  "Company",
                  "Department",
                  "User Management",
                ].includes(item.label),
              )
              .map((item, i) => (
                <button key={item.label} onClick={() => go(item.label)}>
                  <span
                    className={`action-icon tone-${["purple", "blue", "orange", "green"][i]}`}
                  >
                    <item.icon size={20} />
                  </span>
                  <span>
                    {item.label}
                    <small>
                      {
                        [
                          "Keep equipment organized",
                          "Manage your organizations",
                          "Bring your teams together",
                          "Manage people and access",
                        ][i]
                      }
                    </small>
                  </span>
                  <ArrowUpRight size={17} />
                </button>
              ))}
          </div>
        </section>
      </div>
      <div className="workspace-footer">
        <Boxes size={15} /> One workspace. Everything connected.
        <span>Inventory Management</span>
      </div>
    </>
  );
}
function Stat({
  label,
  value,
  icon: Icon,
  tone,
  go,
}: {
  label: string;
  value?: number;
  icon: LucideIcon;
  tone: string;
  go: () => void;
}) {
  return (
    <button onClick={go} className={`stat-card tone-${tone}`}>
      <div className="stat-header">
        <span className="stat-icon">
          <Icon size={22} />
        </span>
        <ArrowUpRight size={18} />
      </div>
      <div className="stat-value">
        {value === undefined ? "\u2014" : value.toLocaleString()}
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-description">
        View details <ArrowRight size={13} />
      </div>
    </button>
  );
}
function Placeholder({ page }: { page: Page }) {
  const Icon =
    navigationItems.find((item) => item.label === page)?.icon || Boxes;
  return (
    <>
      <PageHeader title={page} subtitle="Your connected inventory workspace" />
      <section className="module-placeholder">
        <span className="eyebrow">ROOM TO GROW</span>
        <div className="module-placeholder-icon">
          <Icon size={36} />
        </div>
        <h2>A new space for {page.toLowerCase()}.</h2>
        <p>
          This section is being prepared. Your assets, companies, departments,
          and users are ready to manage from the sidebar.
        </p>
        <span className="development-badge">Coming soon</span>
      </section>
    </>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activePage, setActivePage] = useState<Page>("Dashboard");
  const [loading, setLoading] = useState(true);
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
      <div className="loading-screen">Loading Inventory Management...</div>
    );
  if (!user) return <Login onLogin={setUser} />;
  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setActivePage("Dashboard");
  };
  const displayName =
    `${user.first_name || user.firstName || "Administrator"} ${user.last_name || user.lastName || ""}`.trim();
  const role =
    user.is_super_admin || user.isSuperAdmin
      ? "System Administrator"
      : user.job_title || user.jobTitle || "IT User";
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">
            <Boxes />
          </div>
          <div>
            <div className="brand-title">Inventory</div>
            <div className="brand-subtitle">Management</div>
          </div>
        </div>
        <div className="sidebar-section-title">MAIN MENU</div>
        <nav className="navigation">
          {navigationItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`navigation-item ${activePage === item.label ? "active" : ""}`}
              aria-current={activePage === item.label ? "page" : undefined}
              onClick={() => setActivePage(item.label)}
            >
              <span className="navigation-icon">
                <item.icon size={19} />
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="system-status">
            <span className="status-dot" />
            Workspace connected
          </div>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="breadcrumb">Inventory Management</div>
            <h1>{activePage}</h1>
          </div>
          <div className="user-area">
            <div className="user-info">
              <div className="user-name">{displayName}</div>
              <div className="user-role">{role}</div>
            </div>
            <div className="user-avatar">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <button
              type="button"
              className="logout-button"
              title="Logout"
              aria-label="Sign out"
              onClick={logout}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <section className="content">
          {activePage === "Dashboard" && (
            <Dashboard user={user} go={setActivePage} />
          )}
          {activePage === "Company" && <CompanyPage />}
          {activePage === "Department" && <DepartmentPage />}
          {activePage === "Assets Management" && <AssetsPage />}
          {activePage === "Peripherals" && <AssetsPage />}
          {activePage === "User Management" && <UsersPage />}
          {![
            "Dashboard",
            "Company",
            "Department",
            "Assets Management",
            "Peripherals",
            "User Management",
          ].includes(activePage) && <Placeholder page={activePage} />}
        </section>
      </main>
    </div>
  );
}
export default App;
