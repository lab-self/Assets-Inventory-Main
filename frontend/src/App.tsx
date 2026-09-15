import { useState } from "react";

type NavigationItem = {
  label: string;
  icon: string;
};

const navigationItems: NavigationItem[] = [
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

const statistics = [
  {
    label: "Total Assets",
    value: "0",
    description: "All registered assets",
  },
  {
    label: "Assigned",
    value: "0",
    description: "Currently assigned",
  },
  {
    label: "Available",
    value: "0",
    description: "Ready for assignment",
  },
  {
    label: "Repair",
    value: "0",
    description: "Assets under repair",
  },
];

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">IM</div>

          <div>
            <div className="brand-title">
              Inventory
            </div>

            <div className="brand-subtitle">
              Management
            </div>
          </div>
        </div>

        <div className="sidebar-section-title">
          MAIN MENU
        </div>

        <nav className="navigation">
          {navigationItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`navigation-item ${
                activePage === item.label
                  ? "active"
                  : ""
              }`}
              onClick={() => setActivePage(item.label)}
            >
              <span className="navigation-icon">
                {item.icon}
              </span>

              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="system-status">
            <span className="status-dot" />
            System Online
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="breadcrumb">
              Inventory Management
            </div>

            <h1>{activePage}</h1>
          </div>

          <div className="user-area">
            <div className="user-info">
              <div className="user-name">
                Administrator
              </div>

              <div className="user-role">
                System Administrator
              </div>
            </div>

            <div className="user-avatar">
              A
            </div>

            <button
              type="button"
              className="logout-button"
              title="Logout"
            >
              ↪
            </button>
          </div>
        </header>

        <section className="content">
          {activePage === "Dashboard" ? (
            <>
              <div className="page-introduction">
                <div>
                  <h2>
                    Welcome to Inventory Management
                  </h2>

                  <p>
                    Monitor and manage your organization's
                    IT assets from one centralized platform.
                  </p>
                </div>

                <div className="dashboard-date">
                  System Dashboard
                </div>
              </div>

              <div className="statistics-grid">
                {statistics.map((statistic) => (
                  <div
                    className="stat-card"
                    key={statistic.label}
                  >
                    <div className="stat-header">
                      <span className="stat-label">
                        {statistic.label}
                      </span>

                      <span className="stat-icon">
                        ◫
                      </span>
                    </div>

                    <div className="stat-value">
                      {statistic.value}
                    </div>

                    <div className="stat-description">
                      {statistic.description}
                    </div>
                  </div>
                ))}
              </div>

              <div className="dashboard-grid">
                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h3>Asset Overview</h3>
                      <p>
                        Current inventory status
                      </p>
                    </div>
                  </div>

                  <div className="empty-state">
                    <div className="empty-state-icon">
                      ▣
                    </div>

                    <h4>
                      No assets registered
                    </h4>

                    <p>
                      Assets will appear here after they
                      are added to the inventory.
                    </p>
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-header">
                    <div>
                      <h3>Quick Actions</h3>
                      <p>
                        Frequently used operations
                      </p>
                    </div>
                  </div>

                  <div className="quick-actions">
                    <button
                      type="button"
                      onClick={() =>
                        setActivePage(
                          "Assets Management",
                        )
                      }
                    >
                      <span>＋</span>
                      Add Asset
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setActivePage("Company")
                      }
                    >
                      <span>⌂</span>
                      Manage Company
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setActivePage(
                          "User Management",
                        )
                      }
                    >
                      <span>♙</span>
                      Manage Users
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setActivePage("Reports")
                      }
                    >
                      <span>▥</span>
                      Generate Report
                    </button>
                  </div>
                </section>
              </div>
            </>
          ) : (
            <section className="module-placeholder">
              <div className="module-placeholder-icon">
                {navigationItems.find(
                  (item) =>
                    item.label === activePage,
                )?.icon ?? "▣"}
              </div>

              <h2>{activePage}</h2>

              <p>
                This module is part of the Inventory
                Management system and will be connected
                to the backend API.
              </p>

              <span className="development-badge">
                Module in development
              </span>
            </section>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;