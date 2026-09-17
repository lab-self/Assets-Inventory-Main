# Fixes and verification

## Current section review

- Employee selectors show names only in Assets Management, Autodesk and Teams.
- Company, department, user, Autodesk and Teams lists and permission-aware
  lookups load all API pages instead of silently stopping at 100 records.
- Peripherals saves and edits GPU names and graphics memory, including custom
  GPU names. GB/TB values persist as whole GB; blanks clear the optional value.
- Assets, employees, Autodesk licenses and Teams reports have matching Excel
  exports. All columns are visible, dates retain their calendar values, empty
  workbooks contain headers, and exports require REPORT_EXPORT permission.
- Report loading errors remain visible; older requests cannot overwrite a
  newly selected report. Search filters the screen; Excel exports the complete
  selected report, as stated beside the table.
- Six icon-based settings controls now affect actual application behavior:
  application name, peripherals page size, warranty/license warning windows,
  failed login limit and lockout duration. Server validation enforces their
  types and limits. Inactive operational settings use built-in defaults.
- Settings supports search, category filtering, custom categories and activation.
  Additional configuration records remain available; settings without a runtime
  consumer are stored configuration, not newly implemented background services.
- Dashboard repair totals include In Repair and Damaged assets.

Validation: **80 tests passed** (20 backend, 60 frontend), TypeScript and lint
passed, and backend/frontend production builds passed. Coverage includes all ten
navigation sections, add/edit workflows, assignments, GPU memory create/update/
clear, report exports including empty reports, settings validation, live display
preferences, warning windows, changed lockout limits and permission denials.

Apply migration **021** with `npm.cmd run db:migrate` after building and configuring
the backend database, then restart the application. It permits custom setting
categories without deleting records. Graphics memory uses the existing column.
No `backend/.env`, DATABASE_URL or PGHOST was available here, so no live database
was migrated and no live browser workflow is claimed. Tests use disposable
PGlite and a jsdom-rendered frontend with mocked HTTP responses.

See [GPU catalog scope and manufacturer references](gpu-catalog.md).

## Earlier fixes

The main post-login failure was in authentication middleware: it passed the JWT
user ID to the email lookup. Protected requests now use the existing ID lookup.

Other corrected failures:

- Company/location queries referenced `address_line1` and `address_line2`, but
  the schema uses `address_line_1` and `address_line_2`.
- Asset status queries referenced a missing `is_assignable` column. Migration
  020 adds it; repair/lost/damaged/retired statuses are not assignable.
- Category/status creation omitted their required `code` columns.
- Company, department and Autodesk forms rejected blank optional email fields.
- Optional user last names were inserted as NULL into a NOT NULL column.
- Report/export queries still used the renamed `processor` column.
- Settings strings/arrays/null were passed to PostgreSQL without JSON encoding,
  and setting updates silently dropped `updated_by`.
- Route plugins were registered before the shared error handler, causing
  validation failures to appear as server errors.
- Duplicate values, invalid references and database constraint failures now
  return useful 400/409 responses rather than generic 500 errors.
- Assignment/return now updates asset status; damaged returns cannot be
  reassigned. Assigned assets must be returned before deactivation.
- The assignment screen supports reassign/return and asset pagination/search.
- Account lockout now checks the actual lock expiry; database failures are no
  longer mislabeled as invalid login sessions.
- Restricted users cannot grant themselves super-admin access or change roles
  without permission. The UI selects an allowed landing section and hides
  unauthorized editing controls.
- Session expiry returns the UI to login. Optional lookup permissions no longer
  prevent the primary list from loading.
- The close icon and labels for icon-only buttons are corrected; pending
  Autodesk/Teams/settings saves disable their submit buttons.
- The JWT dependency is updated to address the reported critical advisories.

## Apply to an existing installation

With the backend's database environment configured, run from the repository:

```powershell
npm.cmd install
npm.cmd run build
npm.cmd run db:migrate
```

Restart the backend and frontend/deployed services, then sign in again. Do not
reset or reseed an existing database just to apply these fixes. Migration 020
preserves existing records. For local npm workspace commands, dotenv reads
`backend/.env`; Docker supplies environment variables through Compose.

## Repeat verification

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

`backend/tests/workflows.test.ts` starts disposable PostgreSQL-compatible PGlite,
applies the repository migrations/seeds and exercises real Fastify handlers,
authentication, services and SQL. It covers login, every section's list API,
create/edit operations, categories/statuses, assignment/reassignment/return,
deactivation, reports/export, invalid inputs, duplicates, lockout and permissions.
Only the database connection is replaced. PGlite provides `gen_random_uuid`
directly, so the test omits the unavailable pgcrypto extension declaration.

`frontend/src/sections.test.tsx` renders all ten sections in jsdom, submits all
seven add/edit forms, checks icon button labels, assignment submission,
restricted navigation and session expiry. These UI tests mock HTTP responses;
the separate backend suite checks actual database behavior.

No running application URL or local database credentials were available during
this verification. The live database migration and a visual browser check still
need to run in the deployed environment. Tests create only disposable records.

Earlier checks: 61 tests passed, TypeScript checks passed, lint passed, and both
production builds passed. The dependency audit's two critical JWT findings were
resolved; five moderate findings remain in other dependencies. No forced major
dependency upgrades were applied to hide those findings.
