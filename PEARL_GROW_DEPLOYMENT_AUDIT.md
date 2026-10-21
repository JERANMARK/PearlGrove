# Pearl Grow — Pre-Deployment Technical Audit

Audit date: 2026-10-20  
Project: C:\Users\HP\Desktop\pearl grow  
Scope: source/configuration review and safe build, syntax, and schema checks. No production service, database, migration, seed, provisioning, deployment, or remote repository was contacted.

## 1. Executive Summary

Pearl Grow is **not safe to deploy publicly yet**. The frontend typecheck and production Vite build passed, all 20 backend JavaScript files passed syntax checks, and Prisma validates the schema. These checks do not prove database or hosting behavior.

Release blockers: database/key files remain in two local Git commits despite staged deletion from the next tree; the authoritative MySQL instance, schema compatibility, and backup are unverified; and the frontend API variable is unset locally, leaving a localhost fallback unless Vercel supplies VITE_API_URL. Inventory integrity, API validation, login throttling, and image storage also need work.

## 2. Deployment Verdict: NOT READY

Do not push or connect the app to a live customer DB until P0 findings are resolved and staging checks pass. No production deployment was attempted.

## 3. Critical Blockers (P0)

### P0-1 — Sensitive database and key material in Git history

- **Severity:** P0. **Files/lines:** .gitignore:36-54; Git metadata shows 187 mysql-local/data/** paths staged as deletions. HEAD contains 187 paths and two local commits contain that path family.
- **Evidence:** mysql-local/data remains present with 188 files. HEAD includes database/InnoDB files and key/certificate paths, including mysql-local/data/private_key.pem, server-key.pem, client-key.pem, and ca-key.pem. Ignore rules and staged deletion do not purge old commits.
- **Impact:** Pushing existing history can publish database files and private keys even if a new commit deletes them. Contents and database rows were not read or reproduced.
- **Recommended fix:** Block pushes. Under an approved plan, preserve/verify local data, assess key exposure, and remove sensitive blobs from publishable history before pushing. Reissue keys if shared elsewhere. Do not rewrite history without an approved recovery plan.
- **Blocks deployment:** Yes; blocks publication of this repository history.
- **Verification:** Path/history counts verified; no push occurred.

### P0-2 — Database authority, compatibility, and backup are unknown

- **Severity:** P0. **Files/lines:** mysql-local/my.ini; backend/prisma/schema.prisma:5-8; no backend/prisma/migrations directory.
- **Evidence:** Service and project configs use different ports/data directories. Both reportedly contain a pearl_grow directory, but the intended instance is unconfirmed. A prior read-only Prisma SELECT 1 to the backend-configured endpoint failed as unreachable; Prisma exposed no usable error code. No table/schema comparison or verified backup exists. Root login error 1045 does not establish whether an application DB account can connect.
- **Impact:** The app may use the wrong/empty DB or fail; guessed schema changes could damage data.
- **Recommended fix:** With authorized local credentials, identify each instance using read-only metadata and table/schema checks. Verify source and backup/restore path; restore to isolated staging and compare with Prisma. Prepare a reviewed migration; do not use db push or invent a baseline.
- **Blocks deployment:** Yes, for any data-backed launch.
- **Verification:** Not verified; no successful connection/table checks in this audit.

### P0-3 — Production frontend API URL is not established

- **Severity:** P0. **Files/lines:** src/services/api.ts:3; .env.example:2; vercel.json:1-8.
- **Evidence:** API_BASE falls back to http://localhost:5000/api. No root .env, .env.local, .env.production, or process VITE_API_URL was present. The example is a placeholder; Vercel settings and an actual Render URL were not inspected.
- **Impact:** A production build without Vercel VITE_API_URL calls localhost in each visitor’s browser.
- **Recommended fix:** Set VITE_API_URL=https://<actual-render-host>/api in Vercel before building, then set backend FRONTEND_URL to the exact deployed Vercel origin. No URL is invented here.
- **Blocks deployment:** Yes until configured and verified from the deployed frontend.
- **Verification:** Source fallback/missing local value verified; Vercel settings unverified.

## 4. High-Priority Issues (P1)

### P1-1 — Stock can be overstated in saved orders

- **Severity:** P1. **Files/lines:** backend/src/controllers/orderController.js:142-166; backend/prisma/schema.prisma:33-35,49-75.
- **Evidence:** Each order line is checked against the same fetched stock; duplicate product IDs are not rejected or aggregated. Orders are created after the read, and stock is not reserved/decremented. Product, order, and line amounts are Float.
- **Impact:** Duplicate lines or repeated/concurrent requests can exceed displayed stock; floating-point storage can introduce rounding.
- **Recommended fix:** Reject duplicate IDs or sum by product before checking. Decide whether stock is advisory or reserved; use an atomic transaction if reserved. Store money as Decimal or integer minor units; add regression tests.
- **Blocks deployment:** Yes if displayed stock is guaranteed; otherwise disclose advisory stock and still reject duplicate lines.
- **Verification:** Code review only; no order DB tests.

### P1-2 — Product/category mutation validation is permissive

- **Severity:** P1. **Files/lines:** backend/src/controllers/productController.js:104-123,138-151,197-249; backend/src/controllers/categoryController.js:52-79,92-135.
- **Evidence:** parseFloat/parseInt accept numeric prefixes; Boolean("false") is true; discount price lacks finite/range validation. Names/descriptions use string methods without consistent type/length checks.
- **Impact:** Malformed admin requests can silently corrupt price, stock, availability, or produce 500 errors.
- **Recommended fix:** Strict schemas for create/update: types, finite/range checks, integer stock, booleans, text limits, discount-price relationship.
- **Blocks deployment:** High priority; fix before relying on product/order data.
- **Verification:** Code review only.

### P1-3 — Admin login has no visible brute-force control

- **Severity:** P1. **Files/lines:** backend/src/routes/authRoutes.js:7; backend/src/controllers/authController.js:6-35; backend/package.json:22-33.
- **Evidence:** Login is public and has no visible rate limiter, lockout, or delay; express-rate-limit is not referenced.
- **Impact:** Automated guessing can target the admin account.
- **Recommended fix:** Add account/IP-aware throttling and monitoring; consider MFA.
- **Blocks deployment:** Yes for public admin access until throttling exists.
- **Verification:** Code review only.

### P1-4 — Image upload durability and URL routing are unsafe for split hosting

- **Severity:** P1. **Files/lines:** backend/src/app.js:25-46,82,94-112; src/pages/admin/AdminProductForm.tsx:187-195,500-506; render.yaml:1-23.
- **Evidence:** Multer writes to the backend filesystem; API returns root-relative /images/uploads paths; frontend/API are separate Vercel/Render services. Render declares no durable storage. MIME type is trusted without content inspection.
- **Impact:** Image URLs resolve against frontend origin, files may disappear on redeploy, and non-image bytes may be accepted as images.
- **Recommended fix:** Use durable object/persistent storage, return a correct public/API URL, verify signatures and extension/content agreement.
- **Blocks deployment:** Yes if uploads are relied on; otherwise disable uploads until ready.
- **Verification:** Code/config review only; no browser/storage test.

## 5. Medium/Low-Priority Issues (P2/P3)

### P2-1 — JWT length does not prove entropy

- **Severity:** P2. **Files/lines:** backend/src/config/jwt.js:1-9; backend/src/controllers/authController.js:38-42; backend/src/middleware/authMiddleware.js:15-17.
- **Evidence:** Signing and verification share the helper and HS256; startup rejects missing, short, whitespace-padded, and obvious placeholders. A predictable 32-byte value can pass. Production secret was not inspected.
- **Impact:** A guessable secret permits token forgery.
- **Recommended fix:** Supply a newly generated random 256-bit value through the host secret store; do not reuse a local value.
- **Blocks deployment:** Yes until production secret is provisioned and verified.
- **Verification:** Code reviewed; actual secret not verified.

### P2-2 — Admin token is in localStorage and logout does not revoke it

- **Severity:** P2. **Files/lines:** src/context/AdminAuthContext.tsx:27-29,68-88; src/services/api.ts:6-11; backend/src/controllers/authController.js:38-42,58-63.
- **Evidence:** Browser stores bearer token in localStorage; token expires in seven days; server logout only returns success.
- **Impact:** Same-origin XSS can steal tokens; copied tokens remain valid until expiry.
- **Recommended fix:** Prefer HttpOnly/Secure/SameSite sessions with CSRF protections or add short-lived/revocable tokens; use CSP/security headers.
- **Blocks deployment:** Risk mitigation/acceptance required before public admin use.
- **Verification:** Code review only.

### P2-3 — Health/settings can mask database failure

- **Severity:** P2. **Files/lines:** backend/src/app.js:84-92; backend/src/controllers/settingsController.js:15-59; render.yaml:1-23.
- **Evidence:** /api/health returns OK without DB checks; Render healthCheckPath is absent. Public settings suppress DB errors and return fallback data with success=true.
- **Impact:** A DB failure can look healthy while products/orders/admin fail.
- **Recommended fix:** Add a separate readiness check, host health configuration, and observable sanitized failure status.
- **Blocks deployment:** Reliable operations require readiness/alerts.
- **Verification:** Code/config review only.

### P2-4 — Password-change validation differs between UI and API

- **Severity:** P2. **Files/lines:** src/pages/admin/AdminSettings.tsx:102-120; backend/src/controllers/authController.js:92-107.
- **Evidence:** UI accepts six characters; API requires 12-72 bytes.
- **Impact:** A value accepted by UI is rejected by server.
- **Recommended fix:** Align UI/help text and test byte-length boundaries.
- **Blocks deployment:** No; fix before handover.
- **Verification:** Code review only.

### P2-5 — WhatsApp popup may be blocked

- **Severity:** P2. **Files/lines:** src/components/Contact.tsx:54-88; src/components/Collection.tsx:77-121.
- **Evidence:** window.open runs after awaiting API persistence.
- **Impact:** Browsers may block the new tab outside the original user gesture.
- **Recommended fix:** Open a blank tab synchronously and navigate after persistence, or provide a follow-up link.
- **Blocks deployment:** No; verify in target browsers.
- **Verification:** Code review only.

### P2-6 — Operational reproducibility/visibility need improvement

- **Severity:** P2. **Files/lines:** render.yaml:5-10; package.json:6-11; tsconfig.json:1-24.
- **Evidence:** Render uses free plan/Oregon and npm install; no vite.config, lint/test script, or strict TypeScript mode. Build emits a 552.90 kB minified JS chunk and dependency “use client” warnings.
- **Impact:** Availability/latency and reproducible installs may not meet client needs; initial JS may be slow.
- **Recommended fix:** Confirm hosting plan/region requirements; use lockfile-based install; add lint/tests and tighten TS incrementally; split routes if measurements warrant.
- **Blocks deployment:** Confirm hosting plan; other items follow unless performance fails.
- **Verification:** Config/build warning verified; provider behavior unverified.

### P2-7 — Error objects are logged without sanitization

- **Severity:** P2. **Files/lines:** backend/src/middleware/errorHandler.js:1-30.
- **Evidence:** Entire errors go to console; client 500 response is generic in production.
- **Impact:** Logs may retain unnecessary Prisma metadata or request-derived details.
- **Recommended fix:** Log correlation ID, error class/code, sanitized metadata; set access/retention; never log bodies/credentials.
- **Blocks deployment:** Review logging policy before public traffic.
- **Verification:** Code review only.

## 6. Git and Secret Safety

- **Status:** 187 MySQL data paths are staged deletions; no staged non-data paths/additions. There are 16 unstaged modified paths: .env.example, .gitignore, DEPLOY.md, backend/package.json, backend/prisma/seed.js, backend/src/app.js, backend/src/controllers/authController.js, backend/src/controllers/dashboardController.js, backend/src/controllers/orderController.js, backend/src/middleware/authMiddleware.js, backend/src/middleware/errorHandler.js, backend/src/server.js, render.yaml, src/components/Collection.tsx, src/components/Contact.tsx, src/services/api.ts. Two untracked source paths: backend/prisma/provision-admin.js and backend/src/config/jwt.js. This report adds one untracked file.
- HEAD contains 187 mysql-local/data paths; two local commits contain that path family. Staged deletion only changes the next tree; history still contains blobs.
- .gitignore covers local env files, mysql-local/data, backup folders/suffixes, targeted private-key/container patterns. It does not broadly ignore .sql, preserving Prisma migration SQL. Ignore rules do not purge history.
- No tracked real .env was found. Actual backend/.env was not read or printed. Tracked env files are examples. Static scan found no matching literal private-key header, credentialed DB URL, or common token/password assignment in scanned text; heuristic only and did not inspect binary DB files.
- Not safe to push. No commit/push occurred. Remote URL/visibility were not inspected or reported.

## 7. Frontend Audit

Root package build is tsc && vite build. tsconfig covers src, noEmit and unused checks are enabled, but strict mode is not. No vite.config exists. API fallback is in P0-3. Admin UI routes use ProtectedRoute and backend endpoints independently authenticate. Token storage is P2-2. Contact/order flows surface save failure, but browser/popup behavior is untested. Collection falls back to bundled products on API error/empty response; IDs may not exist in DB, so persistence can fail (UI indicates failure). discountPrice is stored/edited but customer card does not use it; verify intended behavior. Responsive/loading/error/empty states were reviewed, not visually tested.

## 8. Backend and API Security

Reviewed admin product/category writes, admin order reads/status/deletes, dashboard, settings, image upload, current-admin, and password endpoints use authMiddleware. Login/logout are public as expected. No missing unauthenticated admin mutation was found in reviewed routes. JWT, bcrypt, provisioning, and CORS were reviewed. CORS uses exact production FRONTEND_URL and development DEV_ALLOWED_ORIGINS; unlisted origins are rejected and no-Origin clients are allowed. JSON/form bodies are limited to 32 KB. Login/public-order throttling and Helmet/security headers were not found. No live unauthorized-request test ran.

## 9. Database and Prisma

MySQL schema has Admin, Category, Product, Order, OrderItem, Setting. Admin email/category name are unique; Product has category index/nullable relation with SetNull; OrderItem has relation indexes. Product/order money are Float; order status is String, not enum/check constrained. No migration files exist. Schema validation passed, but local schema/data/recoverability were not checked. Database file presence is not proof of health; no rows were read and no backup was created.

Safe future path: read-only metadata on each candidate (hostname, port, datadir, server UUID, selected DB); compare table names, exact counts, columns, indexes, constraints; make a logical dump to a separate path; verify hash and restore to isolated staging; compare schema/counts; have a DBA review an explicit migration/baseline plan. Do not apply changes to source DB until approved.

## 10. Render + Vercel Deployment Configuration

- Render: render.yaml defines Node web service, free plan, Oregon; build is cd backend && npm install && npx prisma generate; start is cd backend && npm start. Build does not run migrations, seeds, provisioning. Variables: NODE_ENV, PORT, JWT_SECRET, DATABASE_URL, FRONTEND_URL, WHATSAPP_NUMBER. No durable disk or health-check path.
- Vercel: vercel.json has SPA rewrite. Account root/build/output settings, env panel, domain, and deployment state were not inspected.
- Production values: NODE_ENV=production; host-compatible PORT; managed MySQL DATABASE_URL; newly generated random JWT_SECRET; exact FRONTEND_URL origin; public WhatsApp number. Vercel needs VITE_API_URL=https://<actual-render-host>/api; actual URL unknown.
- Configure durable image storage/URL handling before relying on uploads. Provision admin only after confirming and backing up target DB. App rollback does not reverse DB migration; document tested DB restore.
- Render, Vercel, DB, HTTPS/domains, real CORS, startup, backup, rollback unexercised.

## 11. Functional Test Results

| Journey | Result | Limitation |
|---|---|---|
| Admin login/logout | CODE REVIEW ONLY | DB unverified; logout does not revoke JWT; no brute-force test. |
| Dashboard | CODE REVIEW ONLY | Protected route; no DB runtime test. |
| Product/category CRUD | CODE REVIEW ONLY | Authenticated; validation gaps; no write tests. |
| Customer enquiry/order + WhatsApp | CODE REVIEW ONLY | Save failures surfaced; browser popup untested. |
| Admin order view/status | CODE REVIEW ONLY | Auth middleware present; no DB/HTTP test. |
| Settings/password | CODE REVIEW ONLY | Protected; UI/API minimum mismatch. |
| Unauthorized requests | CODE REVIEW ONLY | Middleware reviewed; no HTTP test. |
| Health/readiness | CODE REVIEW ONLY | Liveness does not check DB; no deployment test. |

No functional runtime test ran because intended DB is unknown. No database command, migration, seed, provisioning, or production test ran.

## 12. Client Handover Checklist

- Client-owned Vercel, Render, domain/DNS, managed DB, durable image storage accounts with least-privilege owners.
- Secrets only in hosting secret stores.
- Confirmed DB authority, backup cadence/retention, restore steps, responsible owner.
- Initial admin provisioned only to verified target; credentials delivered securely and changed.
- Staging-tested login, password change, product/category CRUD, order capture, WhatsApp handoff, backup/restore.
- Support contacts, limitations, log retention/access, uptime expectations, rollback documented.
- Client understands WhatsApp is handoff; no payment gateway.

## 13. Prioritized Remediation Plan

1. Block Git publication; approve history remediation and preserve/verify local data.
2. Identify source DB and create/restore-verify backup in isolation.
3. Compare schema and prepare reviewed migration; no db push or invented baseline.
4. Set actual Render/Vercel URLs and durable image storage.
5. Fix duplicate/concurrent stock validation, money representation, admin validation, login throttling.
6. Verify production secrets, readiness/alerts, token/log risks, rollback, and handover in staging.

## 14. Exact Safe Next Steps

1. Do not push; staged deletion is not history removal.
2. Preserve local files; separately approve Git-history work and a verified local backup plan.
3. Use authorized local credentials for read-only instance/schema/count checks.
4. Restore verified dump only to isolated staging.
5. Review migration on staging; keep original local DB untouched until approved.
6. Configure actual host variables and durable uploads; test staging flows.
7. Obtain client cutover/rollback sign-off after blockers close.

## 15. Files Inspected and Tests Executed

Inspected .gitignore, .env.example, backend/.env.example (not backend/.env values), root/backend package.json, tsconfig.json, vercel.json, render.yaml, DEPLOY.md, Prisma schema/seed/provision script, backend server/app/config/routes/controllers/middleware, frontend API/auth context/pages/components, and Git path/status/history metadata. No remote URL was read or reported.

- tsc --noEmit --pretty false — PASS, exit 0.
- Vite production build to unique temporary directory outside project — PASS, exit 0; output removed. Warnings: dependency module-level “use client” directives and 552.90 kB JS (158.22 kB gzip).
- node --check across 20 backend JS files — PASS, zero syntax failures.
- Prisma schema validation — PASS; no DB connection.
- Static source secret-pattern scan — no matching candidates in scanned text; heuristic only.
- Git checks — 187 staged deletions; 187 paths in HEAD; two local commits with those paths; 188 local data files present.

No lint/test script exists. No unit/integration/HTTP/browser/DB/Render/Vercel/migration/backup-restore/production test ran.

## 16. Assumptions and Items Not Verified

- Production URLs/accounts/provider settings, DB credentials, and production secret quality are unknown.
- Local MySQL health, rows, customer information, schema compatibility, and recovery are unverified. Binary DB files were not inspected.
- No backup was created or verified.
- No migration history exists; no baseline inferred.
- No claim that customer data/secrets are absent from binary files in Git history.
- No dependency vulnerability/network audit was run.
- Existing source changes, two untracked source files, staged DB deletions, and .gitignore edit were preserved. This report is the only additional project file created.

### Must fix before public deployment

- [ ] Remove sensitive blobs from publishable Git history under an approved preservation plan.
- [ ] Confirm authoritative MySQL and verified backup/isolated restore.
- [ ] Review schema compatibility and explicit migration; no db push.
- [ ] Set and verify VITE_API_URL, FRONTEND_URL, DATABASE_URL, and random production JWT secret.
- [ ] Fix/disable uploads until durable storage and validation are ready.
- [ ] Fix duplicate/concurrent stock checks, strict admin validation, and login throttling.

### Must verify before client handover

- [ ] Test login, dashboard, CRUD, order/WhatsApp, settings/password, unauthorized routes in staging.
- [ ] Verify restore, restart, health/readiness, monitoring, and rollback.
- [ ] Confirm client accounts, domains, access, backup retention, support owner, contact settings.

### Can fix after initial deployment

- [ ] Split bundle if performance measurements justify it.
- [ ] Add lint/unit coverage and tighten TypeScript strictness.
- [ ] Improve fallback catalog and popup UX after core staging flows pass.

## 17. Local remediation pass — 2026-10-20

This section records code changes made after the audit above. It does not change the deployment verdict: **not ready for public deployment**.

### Implemented locally

- Admin product and category create/update handlers now reject unknown fields, wrong types, invalid IDs, oversized strings, invalid booleans, malformed currency values, and invalid discount relationships.
- Order creation now checks prices from the database, rejects duplicate product IDs, reserves stock with conditional updates in a serializable transaction, and rolls back the order if reservation fails. Cancelling/deleting a non-cancelled order returns reserved stock; reopening a cancelled order reserves stock again.
- Admin login now has per-process IP and account throttling. Admin bearer tokens were replaced with one-hour HttpOnly cookies; password changes invalidate existing sessions, and logout clears the browser cookie. Cookie-authenticated mutations require the configured frontend Origin.
- The API uses sanitized diagnostic logs and generic production 500 responses. Public settings errors now propagate instead of reporting successful fallback data. `/api/ready` checks the database and Render is configured to use it.
- Uploads check MIME and JPEG/PNG/WebP signatures, have a 5 MB limit, use generated filenames, and create absolute API image URLs. Production upload returns 503 unless a persistent upload path and HTTPS API origin are configured. No Render disk or object store was configured.
- Production frontend builds now require `VITE_API_URL` to be HTTPS, non-local, and end in `/api`; the generated bundle was checked for the localhost fallback. Existing uploaded-image paths resolve against the API origin.
- WhatsApp flows open a tab during the user gesture and provide a follow-up link if the browser blocks it. Password UI validation matches the backend's 12–72 byte rule.
- Backend `.env.example` now contains placeholders rather than local credentials. Added local unit tests for secret-strength rejection, validation helpers, image signatures, and login throttling.

### Checks run after the code changes

- Frontend TypeScript check: PASS.
- Frontend Vite production build: PASS using a temporary non-production API URL solely for the build check; temporary output was removed. Bundle had no localhost fallback. Existing dependency `use client` warnings and the greater-than-500-kB chunk warning remain.
- Backend unit tests: PASS, 4 tests.
- Backend JavaScript syntax: PASS, 23 files.
- Prisma schema validation: PASS; Prisma loaded its local environment file but made no database connection.
- `git diff --check`: PASS.
- No migration, seed, administrator provisioning, database connection, service start/stop, commit, push, or deployment was performed.

### Still blocked / partial

- The current audit runtime could not see the Windows `MySQL80` service or listeners on ports 3306/3307. The configured project error log was absent in this runtime. The project data directory exists and contains 188 files, but that does not prove its integrity. No backup or restore was created or verified, and no table/schema comparison was possible.
- 187 MySQL data paths remain in `HEAD` and two local commits even though the current index has zero such paths staged for tracking. Local files remain present. Git history was not rewritten; no remote URL or visibility was inspected; no push occurred. Rotate any exposed MySQL credentials/keys after the database is safely identified.
- No migration directory exists. The Prisma schema still stores money as `Float`; converting existing values needs a reviewed migration based on the verified database and a restored staging copy.
- The actual Render/Vercel URLs, hosting secrets, production JWT entropy, CORS origin, persistent storage, and managed database were not available. Set `VITE_API_URL` to the real Render API `/api` URL in Vercel; set exact `FRONTEND_URL`, strong random `JWT_SECRET`, and `DATABASE_URL` in Render. Add durable storage and set `UPLOADS_DIR` and `PUBLIC_API_URL` before enabling uploads.
- Login throttling is process-local and needs a shared store if the backend runs multiple instances. Logout clears this browser's cookie but does not revoke a copied cookie before its one-hour expiry. The Prisma `Float` money fields remain. No HTTP, browser, concurrent-database, restore, staging, Render, or Vercel runtime tests were possible.

Do not publish the current Git history or connect the application to a live customer database. First identify the MySQL instance, create a logical backup outside the repository, verify its hash, restore it into an isolated staging database, and review a migration plan. Then complete credential/key rotation and Git-history cleanup from a recovery copy, coordinate rewritten history with collaborators, configure real hosting values and durable storage, and run staging journeys before handover.

## 18. Follow-up remediation — 2026-10-20

This pass preserves the existing staged MySQL deletions and all local data. No database, service, hosting account, remote, commit, or history was changed.

### Additional code changes

- Fixed an order-controller block/scope defect that left the amount total unavailable where the order is created. Order amounts now use a decimal-string-to-integer-cents helper; prices with fractions of a cent and unsafe totals are rejected. Repeated status updates to the same state no longer repeat stock side effects.
- Logout now requires a valid session and advances the existing Admin `updatedAt` session version, invalidating copied tokens for that admin. It still clears the browser cookie if the revocation write fails. This affects all admin sessions when any session logs out.
- Production startup now rejects missing/malformed/local MySQL connection URLs and non-HTTPS or non-origin `FRONTEND_URL` values. Error messages contain no connection details. `VITE_API_URL` remains validated at production build time.
- Production image upload requires an absolute `UPLOADS_DIR`, exact HTTPS API origin, and explicit `UPLOADS_PERSISTENT=true`; the Render blueprint declares the opt-in variable but does not enable it or configure a disk. A failed file write attempts cleanup of its generated destination.
- Added unit coverage for product/category payload validation, currency totals, production configuration, upload opt-in, and logout session-version advancement.

### Checks run in this pass

- Backend unit tests: PASS, 8 tests.
- Backend Node syntax: PASS, 20 JavaScript files.
- Frontend TypeScript check: PASS.
- Frontend production Vite build: PASS to a unique temporary directory with a non-production sentinel API URL; temporary output removed. Bundle did not contain the localhost API fallback. Existing dependency `use client` warnings and the >500 kB bundle warning remain; JS output was 553.91 kB (158.68 kB gzip).
- Prisma schema validation: PASS; it loaded its local env file but did not connect to MySQL.
- `git diff --check`: PASS; Git emitted only line-ending conversion warnings.

### Verified Git/data state

- Current index contains zero `mysql-local/data/` paths; 187 such paths remain in `HEAD` and two commits touch that family.
- The local `mysql-local/data/` directory still contains 188 files. No file contents were inspected or changed by this pass.
- `.gitignore` already excludes `/mysql-local/data/`, backup locations/suffixes, and private-key patterns. No additional ignore rule was needed. No history cleanup, commit, push, or remote inspection occurred. The working copy remains unsafe to publish because sensitive blobs are reachable in local history.
- A path-name-only query found no tracked `.env` or `backend/.env` history path; this is not a secret scan and does not prove that secrets are absent from other tracked files or binary blobs.

### Safe recovery-copy workflow (not executed)

1. Before history work, make a protected offline copy of the entire project and database files; verify copied file counts and hashes without opening or printing contents. Do not use that protected copy as the publishable repository.
2. Create a separate mirror from the local repository into an access-controlled location outside the project: `git clone --mirror --no-hardlinks "C:\Users\HP\Desktop\pearl grow" "D:\Protected\pearl-grow-history.git"`. Choose an existing protected drive/path; do not put the mirror under this project or a synced/public folder.
3. In that mirror only, use `git filter-repo --path mysql-local/data --invert-paths` (install the reviewed `git-filter-repo` tool first if needed). Scan every ref for sensitive paths and secret patterns, then expire mirror reflogs and garbage-collect the mirror. Do not run these commands in the current working copy.
4. Create a fresh checkout from the sanitized mirror and manually reapply reviewed source changes/untracked source files from the original working copy. Do not copy `.env` files or `mysql-local/data/` into the sanitized checkout. Verify that no sensitive paths/blobs are reachable before any separately approved publication. Do not force-push or publish as part of this workflow without explicit authorization.

### Database recovery and migration blockers

- Current runtime cannot establish which MySQL instance is authoritative or authenticate to it. No backup, hash, restore, table comparison, or staging database exists based on this work. The single essential manual action is for an authorized MySQL administrator to identify the intended instance and restore authorized application-account access; provide any replacement credentials only through a secure secret channel. Do not guess a password or switch ports as a workaround.
- After access is restored, identify the server UUID/data directory and schema with read-only metadata such as `SELECT @@hostname, @@port, @@datadir, @@server_uuid, DATABASE();`, then inspect table names, columns, indexes, and counts only. Export `pearl_grow` to a protected path outside the repository using `mysqldump --defaults-extra-file="<protected-client-options-file>" --host=<verified-host> --port=<verified-port> --single-transaction --routines --triggers --events --hex-blob --databases pearl_grow --result-file="<protected-backup-path>"` (confirm all tables are InnoDB first). Keep credentials in the protected client options file, never on the command line. Check exit code and `Get-FileHash -Algorithm SHA256`; restore only into an isolated staging MySQL instance, then compare schema/table counts. No backup is claimed until that restore succeeds.
- Rotate the database application password if it was present in any reachable Git blob; replace any active server/client/CA private keys that were committed, after confirming the target instance and arranging client trust updates. The history path check did not inspect blob contents, so secret exposure is not ruled out. Do not rotate the unknown instance before an administrator identifies it and the recovery copy/backup is verified.
- No migration history exists, and no baseline was created. Do not run `db push` or migrations on the local/production database. The current schema still uses `Float` for product price/discount and order/item amounts. A reviewed staging migration should first compare existing decimal values and maximum ranges, then convert those fields to fixed-precision `Decimal` with an explicit rounding/reconciliation report. A nullable unique request idempotency key plus request-payload hash on `Order` is also needed for durable retry safety; it requires a schema migration and is not implemented against the unknown database. Until then, clients should not automatically retry order creation after an ambiguous network timeout.

### Remaining external and runtime blockers

- Render must receive the real managed-MySQL `DATABASE_URL`, newly generated random 256-bit `JWT_SECRET`, exact HTTPS `FRONTEND_URL` origin, and public `WHATSAPP_NUMBER`. The process validates `DATABASE_URL`, `FRONTEND_URL`, and JWT format at startup but cannot verify secret randomness or database access without connecting.
- Vercel must receive the actual Render API URL as `VITE_API_URL=https://<actual-render-origin>/api` before building. No provider settings or URLs were accessed.
- Do not enable uploads until a durable Render disk/object store actually exists. For the filesystem implementation, set `UPLOADS_DIR` to its mounted absolute path, `PUBLIC_API_URL` to the exact HTTPS API origin, and `UPLOADS_PERSISTENT=true`. Cross-site cookie use may still be blocked by browser third-party-cookie policy; same-site custom domains should be evaluated in staging.
- Login throttling is still per-process. A shared store (for example, managed Redis) is required before running multiple backend instances or relying on rate limits across restarts; no store/service credentials are configured.
- No database-backed concurrency, idempotency, HTTP, browser, cookie revocation, image persistence, backup/restore, Render, or Vercel test ran. The application is **not ready for public deployment**.

## 19. Final local blocker pass — 2026-10-20

### History recovery and sanitization

- Created a separate ACL-restricted recovery copy of Git metadata at `C:\Users\HP\AppData\Local\Temp\PearlGrow-history-recovery-99866aaae1564776ad7a6a5a10ec7137\repository.git`. It has five refs, 365 objects matching the source, and `git fsck --full` passed. The raw recovery copy remains unmodified. It includes the historical sensitive objects and must remain protected; temporary storage is not a long-term archival backup.
- Before sanitizing, exported the tracked source diff without `mysql-local/data/` and copied six untracked source files to that protected recovery area. Copy hashes matched. The original working copy, index, staged deletions, source files, and database directory were not rewritten.
- Sanitized a second mirror only. Removed `mysql-local/data/`, the historical `backend/.env.example`, and historical `DEPLOY.md`; the latter paths had credential-looking configuration examples and were removed conservatively. Pruned internal Codex refs and the remote-tracking ref from the sanitized mirror; it retains one publishable `main` ref and has no configured remote. `git fsck --full` passed, no `refs/original` remain, and scans found zero MySQL/key/env/document paths in the publishable ref tree.
- Prepared a separate sanitized checkout at `C:\Users\HP\AppData\Local\Temp\PearlGrow-history-recovery-99866aaae1564776ad7a6a5a10ec7137\sanitized-checkout` by applying the current tracked source changes and copying the current untracked source files plus current sanitized docs/examples. Hashes matched for 37 copied source/document files. It contains no `mysql-local/data/` directory and no real `backend/.env`. The current working copy remains unchanged by this history operation.
- A heuristic text scan found no non-placeholder credential assignments or private-key headers in the sanitized history or 69 text files in the prepared checkout. Binary database/key objects were not content-scanned. The raw protected mirror still contains the old history by design; never publish it. The original working repository still has 187 database paths in `HEAD` and is not safe to push.
- Rotate committed MySQL TLS private keys if any are still used by an active instance, and rotate any database/admin/JWT credentials found to be real or reused. No live credentials were read or printed; their active status is unknown.

### Additional code and configuration work

- Extracted stock reservation/release and status reconciliation into tested helpers. Conditional reservations reject competing oversells; cancellation/reopening/deletion side effects are guarded against repeats. Unit tests use in-memory transaction mocks and do not prove MySQL isolation or rollback behavior.
- Added production `numInstances: 1` to Render configuration because login throttling remains process-local. The service remains set to the Free plan, which [Render documents as limited to one instance](https://render.com/docs/scaling). No Render account setting was inspected or changed; do not scale above one instance until a shared rate-limit store is configured.
- Added tests for conditional stock contention, mocked transaction rollback, status transition repeats, password byte boundaries, and cookie attributes. This does not implement durable order idempotency.

### Final checks

- Backend unit tests: PASS, 11 tests.
- JavaScript syntax: PASS, 22 backend source/test files.
- Frontend TypeScript: PASS.
- Vite production build: PASS to a unique temporary directory with a non-production sentinel API URL; output removed. One JS file was inspected and had no localhost API fallback. Bundle size is 553.91 kB (158.68 kB gzip); dependency directive and large-chunk warnings remain.
- Prisma schema validation: PASS; local environment file loaded, no database connection.
- `git diff --check`: PASS.
- Final original-copy counts: 187 MySQL paths in `HEAD`, zero in the index, and 188 local MySQL files. No database file was modified by this pass.

### Still blocks deployment

- MySQL access and authority are unavailable. The next essential manual action is for an authorized MySQL administrator to identify the intended local instance and restore authorized application-account access. Then perform read-only identity/schema checks, create an outside-repository logical dump, hash it, and restore it to isolated staging. No backup or compatibility claim is made.
- No migration history or baseline exists. Do not change Prisma money fields or add idempotency columns until the verified staging database has been reviewed. Then plan `Float` to fixed-precision `Decimal` conversion with explicit rounding/range reconciliation, and add a unique nullable idempotency key plus canonical payload hash. No reliable request-level replay protection exists until that migration is tested and deployed.
- Provider values remain unset/unverified: Vercel `VITE_API_URL=https://<actual-render-origin>/api`; Render `DATABASE_URL`, newly generated random `JWT_SECRET`, exact HTTPS `FRONTEND_URL`, and `WHATSAPP_NUMBER`. Render image uploads must stay disabled until an actual durable mount/object store exists and `UPLOADS_DIR`, `UPLOADS_PERSISTENT=true`, and exact HTTPS `PUBLIC_API_URL` are configured.
- No MySQL, database concurrency, durable idempotency, real HTTP/browser, backup/restore, staging, Render, or Vercel test ran. Final verdict: **NOT READY for public deployment**.

## 20. Safe local order and money remediation — 2026-10-20

This pass continues the local source work above. It did not connect to MySQL, create or apply a migration, alter the original repository history/index, touch local MySQL files, contact hosting, or deploy.

### Implemented locally

- Changed Prisma product price/discount, order total, and order-item price/subtotal fields from `Float` to `Decimal(12,2)`. Money validation now works in integer cents, rejects fractional cents, and enforces the representable Decimal range. Product/order writes pass fixed two-place decimal strings to Prisma. Frontend API responses normalize decimal strings back to numbers for the current UI contract.
- Added nullable unique `Order.idempotencyKey` and `Order.payloadHash` fields. Public order requests now require a validated `Idempotency-Key`; a canonical SHA-256 payload hash is recorded with the order. Replays with the same key and payload return the saved order without reserving stock again; reusing a key for a different payload returns 409. Public responses omit the internal key/hash fields.
- Both customer order/enquiry forms reuse a key for the same payload in memory and keep the pending random key in `sessionStorage` across page reloads without storing customer details. A changed draft that conflicts with the saved key rotates the key only after the server explicitly reports a payload-hash conflict.
- Added unit tests for decimal bounds/formatting, key validation and payload matching, and concurrent identical retries using a serialized in-memory transaction mock.

### Checks

- `npm test` in `backend`: PASS, 13 tests.
- Backend Node syntax: PASS, 23 source/test JavaScript files after adding the order idempotency helper.
- Frontend TypeScript check: PASS after schema/controller/UI changes.
- Frontend production build: PASS to a unique temporary directory with a sentinel HTTPS API URL; one generated JS file was scanned and contained no localhost API fallback. Final build size 554.81 kB (159.07 kB gzip). Vite still reports dependency `use client` directive warnings and the >500 kB chunk warning. Temporary output was removed. An initial rerun exposed missing `customerApi` imports after the order-helper refactor (`TS2304` in Collection.tsx and Contact.tsx); the imports were restored and the subsequent full build passed.
- Prisma client generation and schema validation: PASS. Prisma reported loading local environment configuration; neither command connected to MySQL. Generation changed only the generated client in `backend/node_modules`.
- `git diff --check`: PASS, with existing LF-to-CRLF working-copy warnings.
- Final syntax/data-preservation check: Node syntax PASS for 23 backend source/test files; `git diff --check` PASS; original copy still has 187 MySQL data paths in `HEAD`, zero in the index, and 188 local data files. The existing staged deletion state was preserved.
- Synced the nine newly changed schema/order/frontend/test files and the later import/audit corrections into the sanitized checkout; SHA-256 matched for each copied file. The sanitized checkout still has no `mysql-local/data/` directory. No change was made to the protected raw recovery mirror.

### Still blocked

- **Do not run this schema against the existing local or production database yet.** Existing data has not been inspected for fractional-cent values or range compatibility, and there is no migration history/baseline. The new Prisma client expects the new columns/types. An explicit reviewed migration must be designed only after an authorized administrator identifies the source instance, a logical backup is created and checksum-verified, and a copy is restored to isolated staging. That migration must report any `Float` values that cannot be represented at two decimal places before rounding or conversion. No migration SQL has been invented or applied here.
- No MySQL-backed concurrency, actual unique-key race, endpoint/HTTP, browser, restore, staging, or hosting test ran. The concurrent retry test is an in-memory serialization mock, not proof of MySQL behavior.
- The original repository still has sensitive historical objects and remains unsafe to push. The separately sanitized mirror/checkout described in Section 19 was not published. Protected recovery material must be moved from temporary storage to a durable protected location before that temporary folder is cleaned up.
- Database authority/backup and key or credential rotation, provider URLs/secrets, persistent upload storage, and real staging journeys remain external blockers. Final verdict remains **NOT READY for public deployment**.

## 21. Local follow-up — 2026-10-21

This section supersedes earlier status statements in Sections 17–20 where they conflict with work completed later. It does not change the verdict: **NOT READY for public deployment**.

- Route-level lazy loading splits the customer home page and admin pages. The latest production build passed; the largest initial chunk is 282.48 kB and no chunk exceeds 500 kB. Dependency `use client` directive warnings remain.
- Customer catalog no longer falls back to bundled demo products when the API is empty or unavailable. It shows loading, empty, retryable error, or database-backed products. The order action is disabled for unavailable/out-of-stock products.
- `discountPrice` is displayed to customers and used by the order controller for server-calculated totals. The controller comment was corrected to describe Decimal money.
- Production database URL validation now rejects IPv6 loopback and the full `127.0.0.0/8` range in addition to localhost aliases.
- `DEPLOY.md` was rewritten to describe the current migration chain, staging-only migration review, current money/idempotency behavior, hosting requirements, and remaining limits. The earlier statement that no migration history exists is superseded by the three migrations now present in `backend/prisma/migrations`.
- The backend sends a one-year HSTS header only in production, alongside its existing no-sniff, frame, referrer, and permissions headers. Frontend security headers/CSP still need a staging/browser compatibility review.
- Admin product form validation now matches the API for currency precision/range, discount relationships, and whole-number stock; category inputs are capped at the API's text limits. Product price loading preserves valid zero values.
- Vercel static responses now configure HSTS, no-sniff, frame, referrer, and permissions headers. A restrictive CSP remains pending confirmation of production API and image origins.
- Latest frontend TypeScript/production build passed using only a temporary example HTTPS API URL. Changed backend JavaScript syntax checks passed. Existing backend unit suite previously passed 13/13; it was not rerun in this follow-up. No MySQL, staging CRUD, production service, commit, push, or deployment was performed in this follow-up.
- The original working repository still contains 187 `mysql-local/data` paths in `HEAD`; its staged deletions and all other existing Git state were left unchanged. No production provider URL/secret, durable image store, production database, backup/restore, admin CRUD, or full browser journey was verified.

