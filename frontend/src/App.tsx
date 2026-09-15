import { FormEvent, useEffect, useMemo, useState } from "react";

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
  storage_type?: string;
  storage_capacity_gb?: number | null;
};

type Lookup = { id: string; name: string };

type Page = "Dashboard" | "Peripherals" | "Assets Management" | "Company" | "Department" | "User Management" | "AUTODESK" | "Teams" | "Reports" | "Settings";

const navigationItems: { label: Page; icon: string }[] = [
  { label: "Dashboard", icon: "▦" },
  { label: "Peripherals", icon: "◉" },
  { label: "Assets Management", icon: "▣" },
  { label: "Company", icon: "⌂" },
  { label: "Department", icon: "▤" },
  { label: "User Management", icon: "♙" },
  { label: "AUTODESK", icon: "◈" },
  { label: "Teams", icon: "◎" },
  { label: "Reports", icon: "▥" },
  { label: "Settings", icon: "⚙" },
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
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }

  if (!response.ok) {
    if (response.status === 401) localStorage.removeItem(TOKEN_KEY);
    throw new Error(body?.error?.message || body?.message || `Request failed (${response.status})`);
  }

  return body?.success === true && Object.prototype.hasOwnProperty.call(body, "data") ? body.data : body;
}

function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await api<{ accessToken: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem(TOKEN_KEY, result.accessToken);
      onLogin(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="brand-logo login-logo">IM</div>
        <h1>Inventory Management</h1>
        <p>Sign in to manage your IT assets.</p>
        <form onSubmit={submit} className="form-stack">
          <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></label>
          {error && <div className="form-error">{error}</div>}
          <button className="primary-button" disabled={busy}>{busy ? "Signing in..." : "Sign In"}</button>
        </form>
      </div>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header"><h2>{title}</h2><button className="icon-button" onClick={onClose}>×</button></div>
        {children}
      </div>
    </div>
  );
}

function CompanyPage() {
  const [rows, setRows] = useState<Company[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try { const result = await api<{ data: Company[] }>(`/companies?page=1&pageSize=100&search=${encodeURIComponent(search)}`); setRows(result.data || []); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load companies"); }
  }
  useEffect(() => { void load(); }, [search]);

  async function remove(id: string) {
    if (!confirm("Deactivate this company?")) return;
    try { await api(`/companies/${id}`, { method: "DELETE" }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Delete failed"); }
  }

  return <>
    <PageHeader title="Company" subtitle="Manage company master data" action={<button className="primary-button" onClick={() => { setEditing(null); setOpen(true); }}>＋ Add Company</button>} />
    <div className="toolbar"><input placeholder="Search company..." value={search} onChange={(e) => setSearch(e.target.value)} /><button className="secondary-button" onClick={() => void load()}>Refresh</button></div>
    {error && <div className="form-error page-error">{error}</div>}
    <DataTable headers={["Company", "Email", "Phone", "Location", "Status", "Actions"]}>
      {rows.map((row) => <tr key={row.id}><td><strong>{row.name}</strong></td><td>{row.email || "—"}</td><td>{row.phone || "—"}</td><td>{[row.city, row.state, row.country].filter(Boolean).join(", ") || "—"}</td><td><Status active={row.is_active !== false} /></td><td><button className="link-button" onClick={() => { setEditing(row); setOpen(true); }}>Edit</button><button className="danger-link" onClick={() => void remove(row.id)}>Deactivate</button></td></tr>)}
    </DataTable>
    {rows.length === 0 && <Empty text="No companies found. Add your first company." />}
    {open && <CompanyForm company={editing} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); void load(); }} />}
  </>;
}

function CompanyForm({ company, onClose, onSaved }: { company: Company | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(company?.name || "");
  const [legalName, setLegalName] = useState(company?.legal_name || "");
  const [email, setEmail] = useState(company?.email || "");
  const [phone, setPhone] = useState(company?.phone || "");
  const [city, setCity] = useState(company?.city || "");
  const [state, setState] = useState(company?.state || "");
  const [country, setCountry] = useState(company?.country || "India");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: FormEvent) { e.preventDefault(); setBusy(true); setError(""); try { const body = { name, legalName: legalName || null, email: email || null, phone: phone || null, city: city || null, state: state || null, country: country || null, isActive: true }; await api(company ? `/companies/${company.id}` : "/companies", { method: company ? "PATCH" : "POST", body: JSON.stringify(body) }); onSaved(); } catch (err) { setError(err instanceof Error ? err.message : "Save failed"); } finally { setBusy(false); } }
  return <Modal title={company ? "Edit Company" : "Add Company"} onClose={onClose}><form onSubmit={submit} className="form-grid"><label>Company Name*<input value={name} onChange={(e) => setName(e.target.value)} required /></label><label>Legal Name<input value={legalName} onChange={(e) => setLegalName(e.target.value)} /></label><label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label><label>Phone<input value={phone} onChange={(e) => setPhone(e.target.value)} /></label><label>City<input value={city} onChange={(e) => setCity(e.target.value)} /></label><label>State<input value={state} onChange={(e) => setState(e.target.value)} /></label><label>Country<input value={country} onChange={(e) => setCountry(e.target.value)} /></label>{error && <div className="form-error full-width">{error}</div>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={busy}>{busy ? "Saving..." : "Save Company"}</button></div></form></Modal>;
}

function DepartmentPage() {
  const [rows, setRows] = useState<Department[]>([]); const [companies, setCompanies] = useState<Company[]>([]); const [open, setOpen] = useState(false); const [editing, setEditing] = useState<Department | null>(null); const [error, setError] = useState("");
  async function load() { try { const [d, c] = await Promise.all([api<{ data: Department[] }>("/departments?page=1&pageSize=100"), api<{ data: Company[] }>("/companies?page=1&pageSize=100")]); setRows(d.data || []); setCompanies(c.data || []); setError(""); } catch (e) { setError(e instanceof Error ? e.message : "Unable to load departments"); } }
  useEffect(() => { void load(); }, []);
  const companyName = (id: string) => companies.find((c) => c.id === id)?.name || "—";
  async function remove(id: string) { if (!confirm("Deactivate this department?")) return; try { await api(`/departments/${id}`, { method: "DELETE" }); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Delete failed"); } }
  return <><PageHeader title="Department" subtitle="Manage departments by company" action={<button className="primary-button" onClick={() => { setEditing(null); setOpen(true); }}>＋ Add Department</button>} />{error && <div className="form-error page-error">{error}</div>}<DataTable headers={["Department", "Company", "Manager", "Email", "Status", "Actions"]}>{rows.map((r) => <tr key={r.id}><td><strong>{r.name}</strong></td><td>{companyName(r.company_id)}</td><td>{r.manager_name || "—"}</td><td>{r.email || "—"}</td><td><Status active={r.is_active !== false} /></td><td><button className="link-button" onClick={() => { setEditing(r); setOpen(true); }}>Edit</button><button className="danger-link" onClick={() => void remove(r.id)}>Deactivate</button></td></tr>)}</DataTable>{rows.length === 0 && <Empty text="No departments found. Add your first department." />}{open && <DepartmentForm department={editing} companies={companies} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); void load(); }} />}</>;
}

function DepartmentForm({ department, companies, onClose, onSaved }: { department: Department | null; companies: Company[]; onClose: () => void; onSaved: () => void }) {
  const [companyId, setCompanyId] = useState(department?.company_id || companies[0]?.id || ""); const [name, setName] = useState(department?.name || ""); const [managerName, setManagerName] = useState(department?.manager_name || ""); const [email, setEmail] = useState(department?.email || ""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) { e.preventDefault(); setBusy(true); setError(""); try { const body = { ...(department ? {} : { companyId }), name, managerName: managerName || null, email: email || null, isActive: true }; await api(department ? `/departments/${department.id}` : "/departments", { method: department ? "PATCH" : "POST", body: JSON.stringify(body) }); onSaved(); } catch (err) { setError(err instanceof Error ? err.message : "Save failed"); } finally { setBusy(false); } }
  return <Modal title={department ? "Edit Department" : "Add Department"} onClose={onClose}><form onSubmit={submit} className="form-grid">{!department && <label>Company*<select value={companyId} onChange={(e) => setCompanyId(e.target.value)} required><option value="">Select company</option>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}<label>Department Name*<input value={name} onChange={(e) => setName(e.target.value)} required /></label><label>Manager Name<input value={managerName} onChange={(e) => setManagerName(e.target.value)} /></label><label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>{error && <div className="form-error full-width">{error}</div>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={busy || (!department && !companyId)}>{busy ? "Saving..." : "Save Department"}</button></div></form></Modal>;
}

function AssetsPage({ peripherals = false }: { peripherals?: boolean }) {
  const [rows, setRows] = useState<Asset[]>([]); const [categories, setCategories] = useState<Lookup[]>([]); const [statuses, setStatuses] = useState<Lookup[]>([]); const [companies, setCompanies] = useState<Company[]>([]); const [open, setOpen] = useState(false); const [error, setError] = useState("");
  async function load() { try { const [a, c, s, co] = await Promise.all([api<{ data: Asset[] }>("/assets?page=1&pageSize=100"), api<Lookup[]>("/assets/categories"), api<Lookup[]>("/assets/statuses"), api<{ data: Company[] }>("/companies?page=1&pageSize=100")]); setRows(a.data || []); setCategories(c || []); setStatuses(s || []); setCompanies(co.data || []); setError(""); } catch (e) { setError(e instanceof Error ? e.message : "Unable to load assets"); } }
  useEffect(() => { void load(); }, []);
  return <><PageHeader title={peripherals ? "Peripherals" : "Assets Management"} subtitle={peripherals ? "Manage monitors and other IT peripherals" : "Manage laptops, desktops and IT assets"} action={<button className="primary-button" onClick={() => setOpen(true)}>＋ Add Asset</button>} />{error && <div className="form-error page-error">{error}</div>}<DataTable headers={["Asset Tag", "Serial Number", "Manufacturer / Model", "Hostname", "Condition", "CPU / RAM", "Actions"]}>{rows.map((r) => <tr key={r.id}><td><strong>{r.asset_tag}</strong></td><td>{r.serial_number}</td><td>{[r.manufacturer, r.model].filter(Boolean).join(" ") || "—"}</td><td>{r.hostname || "—"}</td><td>{r.condition || "—"}</td><td>{[r.cpu, r.ram_gb ? `${r.ram_gb} GB` : ""].filter(Boolean).join(" / ") || "—"}</td><td><span className="muted">View/Edit coming next</span></td></tr>)}</DataTable>{rows.length === 0 && <Empty text="No assets found. Add your first asset." />}{open && <AssetForm categories={categories} statuses={statuses} companies={companies} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); void load(); }} />}</>;
}

function AssetForm({ categories, statuses, companies, onClose, onSaved }: { categories: Lookup[]; statuses: Lookup[]; companies: Company[]; onClose: () => void; onSaved: () => void }) {
  const [assetTag, setAssetTag] = useState(""); const [serialNumber, setSerialNumber] = useState(""); const [categoryId, setCategoryId] = useState(categories[0]?.id || ""); const [statusId, setStatusId] = useState(statuses[0]?.id || ""); const [companyId, setCompanyId] = useState(companies[0]?.id || ""); const [manufacturer, setManufacturer] = useState(""); const [model, setModel] = useState(""); const [hostname, setHostname] = useState(""); const [cpu, setCpu] = useState(""); const [ramGb, setRamGb] = useState(""); const [storageType, setStorageType] = useState("none"); const [storageCapacityGb, setStorageCapacityGb] = useState(""); const [condition, setCondition] = useState("new"); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) { e.preventDefault(); setBusy(true); setError(""); try { await api("/assets", { method: "POST", body: JSON.stringify({ assetTag, serialNumber, categoryId, statusId, companyId, manufacturer: manufacturer || null, model: model || null, hostname: hostname || null, cpu: cpu || null, ramGb: ramGb ? Number(ramGb) : null, storageType, storageCapacityGb: storageCapacityGb ? Number(storageCapacityGb) : null, condition }) }); onSaved(); } catch (err) { setError(err instanceof Error ? err.message : "Save failed"); } finally { setBusy(false); } }
  return <Modal title="Add Asset" onClose={onClose}><form onSubmit={submit} className="form-grid"><label>Asset Tag*<input value={assetTag} onChange={(e) => setAssetTag(e.target.value)} required /></label><label>Serial Number*<input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} required /></label><label>Category*<select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>{categories.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>Status*<select value={statusId} onChange={(e) => setStatusId(e.target.value)} required>{statuses.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>Company*<select value={companyId} onChange={(e) => setCompanyId(e.target.value)} required>{companies.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>Manufacturer<input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} /></label><label>Model<input value={model} onChange={(e) => setModel(e.target.value)} /></label><label>Hostname<input value={hostname} onChange={(e) => setHostname(e.target.value)} /></label><label>CPU<input value={cpu} onChange={(e) => setCpu(e.target.value)} /></label><label>RAM (GB)<input type="number" min="1" value={ramGb} onChange={(e) => setRamGb(e.target.value)} /></label><label>Storage Type<select value={storageType} onChange={(e) => setStorageType(e.target.value)}><option value="none">None</option><option value="hdd">HDD</option><option value="ssd">SSD</option><option value="nvme">NVMe</option><option value="hybrid">Hybrid</option></select></label><label>Storage (GB)<input type="number" min="1" value={storageCapacityGb} onChange={(e) => setStorageCapacityGb(e.target.value)} /></label><label>Condition<select value={condition} onChange={(e) => setCondition(e.target.value)}><option value="new">New</option><option value="good">Good</option><option value="fair">Fair</option><option value="poor">Poor</option><option value="damaged">Damaged</option></select></label>{error && <div className="form-error full-width">{error}</div>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={busy}>{busy ? "Saving..." : "Save Asset"}</button></div></form></Modal>;
}

function UsersPage() {
  const [rows, setRows] = useState<User[]>([]); const [open, setOpen] = useState(false); const [error, setError] = useState("");
  async function load() { try { const result = await api<{ data: User[] }>("/users?page=1&pageSize=100"); setRows(result.data || []); setError(""); } catch (e) { setError(e instanceof Error ? e.message : "Unable to load users"); } }
  useEffect(() => { void load(); }, []);
  return <><PageHeader title="User Management" subtitle="Manage employees and application users" action={<button className="primary-button" onClick={() => setOpen(true)}>＋ Add User</button>} />{error && <div className="form-error page-error">{error}</div>}<DataTable headers={["Employee", "Email", "Job Title", "Status", "Admin"]}>{rows.map((u) => <tr key={u.id}><td><strong>{u.first_name || u.firstName} {u.last_name || u.lastName || ""}</strong></td><td>{u.email}</td><td>{u.job_title || u.jobTitle || "—"}</td><td><Status active /></td><td>{u.is_super_admin || u.isSuperAdmin ? "Yes" : "No"}</td></tr>)}</DataTable>{rows.length === 0 && <Empty text="No users found." />}{open && <UserForm onClose={() => setOpen(false)} onSaved={() => { setOpen(false); void load(); }} />}</>;
}

function UserForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [firstName, setFirstName] = useState(""); const [lastName, setLastName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [jobTitle, setJobTitle] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) { e.preventDefault(); setBusy(true); setError(""); try { await api("/users", { method: "POST", body: JSON.stringify({ firstName, lastName: lastName || null, email, password, jobTitle: jobTitle || null, status: "active", isSuperAdmin: false, roleIds: [] }) }); onSaved(); } catch (err) { setError(err instanceof Error ? err.message : "Save failed"); } finally { setBusy(false); } }
  return <Modal title="Add User" onClose={onClose}><form onSubmit={submit} className="form-grid"><label>First Name*<input value={firstName} onChange={(e) => setFirstName(e.target.value)} required /></label><label>Last Name<input value={lastName} onChange={(e) => setLastName(e.target.value)} /></label><label>Email*<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label><label>Password*<input type="password" minLength={12} value={password} onChange={(e) => setPassword(e.target.value)} required /><small>Minimum 12 characters</small></label><label>Job Title<input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} /></label>{error && <div className="form-error full-width">{error}</div>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={busy}>{busy ? "Saving..." : "Create User"}</button></div></form></Modal>;
}

function Dashboard({ user, go }: { user: User; go: (page: Page) => void }) {
  const [count, setCount] = useState(0); const [companies, setCompanies] = useState(0); const [departments, setDepartments] = useState(0);
  useEffect(() => { void Promise.all([api<{ pagination?: { total?: number }; data?: Asset[] }>("/assets?page=1&pageSize=1"), api<{ pagination?: { total?: number }; data?: Company[] }>("/companies?page=1&pageSize=1"), api<{ pagination?: { total?: number }; data?: Department[] }>("/departments?page=1&pageSize=1")]).then(([a,c,d]) => { setCount(a.pagination?.total ?? a.data?.length ?? 0); setCompanies(c.pagination?.total ?? c.data?.length ?? 0); setDepartments(d.pagination?.total ?? d.data?.length ?? 0); }).catch(() => undefined); }, []);
  const name = user.first_name || user.firstName || "Administrator";
  return <><div className="page-introduction"><div><h2>Welcome, {name}</h2><p>Manage your organization's IT inventory from one centralized platform.</p></div><div className="dashboard-date">Live Dashboard</div></div><div className="statistics-grid"><Stat label="Total Assets" value={count} /><Stat label="Companies" value={companies} /><Stat label="Departments" value={departments} /><Stat label="System Status" value="Online" /></div><div className="dashboard-grid"><section className="panel"><div className="panel-header"><div><h3>Inventory Management</h3><p>Start managing your master data and assets.</p></div></div><div className="quick-actions"><button onClick={() => go("Assets Management")}>＋ Add Asset</button><button onClick={() => go("Company")}>⌂ Manage Company</button><button onClick={() => go("Department")}>▤ Manage Department</button><button onClick={() => go("User Management")}>♙ Manage Users</button></div></section></div></>;
}

function Stat({ label, value }: { label: string; value: string | number }) { return <div className="stat-card"><div className="stat-header"><span className="stat-label">{label}</span><span className="stat-icon">◫</span></div><div className="stat-value">{value}</div><div className="stat-description">Live from backend</div></div>; }
function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) { return <div className="page-header-row"><div><div className="breadcrumb">Inventory Management</div><h2>{title}</h2><p>{subtitle}</p></div>{action}</div>; }
function DataTable({ headers, children }: { headers: string[]; children: React.ReactNode }) { return <div className="table-wrap"><table><thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>; }
function Empty({ text }: { text: string }) { return <div className="empty-state"><div className="empty-state-icon">▣</div><h4>{text}</h4></div>; }
function Status({ active }: { active: boolean }) { return <span className={`status-badge ${active ? "active" : "inactive"}`}>{active ? "Active" : "Inactive"}</span>; }
function Placeholder({ page }: { page: Page }) { return <section className="module-placeholder"><div className="module-placeholder-icon">▣</div><h2>{page}</h2><p>This module is planned for the next implementation phase.</p><span className="development-badge">Module in development</span></section>; }

function App() {
  const [user, setUser] = useState<User | null>(null); const [activePage, setActivePage] = useState<Page>("Dashboard"); const [loading, setLoading] = useState(true);
  useEffect(() => { const token = localStorage.getItem(TOKEN_KEY); if (!token) { setLoading(false); return; } api<User>("/auth/me").then(setUser).catch(() => localStorage.removeItem(TOKEN_KEY)).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="loading-screen">Loading Inventory Management...</div>;
  if (!user) return <Login onLogin={setUser} />;
  const logout = () => { localStorage.removeItem(TOKEN_KEY); setUser(null); setActivePage("Dashboard"); };
  const displayName = `${user.first_name || user.firstName || "Administrator"} ${user.last_name || user.lastName || ""}`.trim();
  const role = user.is_super_admin || user.isSuperAdmin ? "System Administrator" : user.job_title || user.jobTitle || "IT User";
  return <div className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-logo">IM</div><div><div className="brand-title">Inventory</div><div className="brand-subtitle">Management</div></div></div><div className="sidebar-section-title">MAIN MENU</div><nav className="navigation">{navigationItems.map((item) => <button key={item.label} type="button" className={`navigation-item ${activePage === item.label ? "active" : ""}`} onClick={() => setActivePage(item.label)}><span className="navigation-icon">{item.icon}</span><span>{item.label}</span></button>)}</nav><div className="sidebar-footer"><div className="system-status"><span className="status-dot" />System Online</div></div></aside><main className="main-content"><header className="topbar"><div><div className="breadcrumb">Inventory Management</div><h1>{activePage}</h1></div><div className="user-area"><div className="user-info"><div className="user-name">{displayName}</div><div className="user-role">{role}</div></div><div className="user-avatar">{displayName.charAt(0).toUpperCase()}</div><button type="button" className="logout-button" title="Logout" onClick={logout}>↪</button></div></header><section className="content">{activePage === "Dashboard" && <Dashboard user={user} go={setActivePage} />}{activePage === "Company" && <CompanyPage />}{activePage === "Department" && <DepartmentPage />}{activePage === "Assets Management" && <AssetsPage />}{activePage === "Peripherals" && <AssetsPage peripherals />}{activePage === "User Management" && <UsersPage />}{!["Dashboard","Company","Department","Assets Management","Peripherals","User Management"].includes(activePage) && <Placeholder page={activePage} />}</section></main></div>;
}

export default App;
