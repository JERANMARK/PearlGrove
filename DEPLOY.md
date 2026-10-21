# Pearl Grow deployment guide

## Current status

The application code has passed its local backend unit suite and frontend production build. The backend has an explicit Prisma migration history, fixed-precision money fields, transaction-based stock reservation, order idempotency, login/order throttling, and database readiness endpoint. These checks do not verify Render, Vercel, a managed database, persistent storage, or a production backup/restore.

**Do not push the original repository history or connect the app to a customer database yet.** The original Git history still contains local MySQL database/key paths. A separate sanitized recovery checkout exists only in temporary storage and is not the same as a cleaned, durable publish checkout. Keep the original data and Git state intact until a verified recovery copy and coordinated history-cleanup plan are ready.

## Hosting configuration

Set secrets through provider secret stores; never commit `.env` files or print secret values.

Render backend variables:

- `NODE_ENV=production` and the host-provided `PORT`.
- `DATABASE_URL`: the actual managed MySQL URL, with a least-privilege application account.
- `JWT_SECRET`: a newly generated random secret of at least 32 bytes. Startup checks length and character diversity but cannot prove randomness.
- `FRONTEND_URL`: exact HTTPS frontend origin, without a path or trailing slash. Multiple exact origins may be comma-separated.
- `WHATSAPP_NUMBER`: public business contact number.
- `UPLOADS_DIR`: absolute path on a persistent mount, `UPLOADS_PERSISTENT=true`, and `PUBLIC_API_URL`: exact HTTPS API origin. Until all three are valid, production uploads return HTTP 503 by design.

Vercel frontend variable:

- `VITE_API_URL`: actual HTTPS Render API origin ending in `/api`, set before the production build. Production builds reject missing, local, malformed, or non-HTTPS values.

Use same-site custom frontend/API domains where possible and verify cookie behavior in supported browsers. The admin cookie is HttpOnly and short-lived; password changes and logout advance the session version. Cross-site cookie restrictions can still differ by browser.

## Database and migrations

Prisma migrations in this project are:

1. `0_init` — baseline schema derived from the verified restored database structure.
2. `20261020120000_add_order_idempotency` — nullable unique order idempotency key and payload hash.
3. `20261021100000_decimal_money` — converts product/order monetary columns to `DECIMAL(12,2)`.

The baseline is not permission to apply migrations blindly. For a new empty database, first restore/test the complete migration chain on an isolated staging database. For a pre-existing database without Prisma migration records, `migrate deploy` may refuse the non-empty schema; only a DBA-reviewed baseline resolution is appropriate after confirming every table, column, index, and constraint matches `0_init` and a verified backup has been restored to staging. Never run `db push`, `migrate reset`, or baseline resolution against production as a shortcut.

The checked local and staging databases were compared after migration; they had matching table counts and product money values at that time. This does not establish which database is authoritative or prove production compatibility. Before cutover, identify the intended source, create a logical backup outside the repository, verify its hash, restore it into isolated staging, compare schema/data, and exercise migration/restore/rollback there. Render's build command only installs dependencies and generates Prisma Client; it intentionally does not migrate or seed production.

Money is represented as Prisma `Decimal(12,2)`. The API normalizes Decimal JSON strings back to numbers for the current frontend contract. Order writes calculate prices on the server from the database; discount price is used when configured. Stock is reserved transactionally and restored on cancellation/deletion transitions. Customer retries require an `Idempotency-Key`; repeating the same key and payload reuses the saved order.

## Administrator provisioning

There is no public admin-registration endpoint. Provision only after confirming the target database is empty of admins and backed up. Use the hosting provider's secure one-off command mechanism to set `ADMIN_EMAIL` and `ADMIN_PASSWORD` for `npm run admin:provision` in `backend`. The command requires a 12–72 byte password, hashes it with bcrypt, refuses if an admin already exists, and does not print credentials. Do not put these one-time variables in the normal service configuration.

## Safe release sequence

1. Preserve and verify a full recovery copy, then prepare a cleaned publish checkout that omits `mysql-local/data` and any historical secrets. Do not publish the original Git history.
2. Identify the authoritative database with an authorized administrator. Create and restore-verify a logical backup in isolated staging.
3. Review migration status and the complete migration chain on staging; test backup restore and rollback before production cutover.
4. Configure Render secrets, actual managed MySQL, exact CORS origin, and the chosen persistent image storage. Keep uploads disabled until storage is mounted and tested.
5. Configure Vercel `VITE_API_URL` to the actual Render API URL before building. Confirm the built app contains no localhost API address.
6. In staging, verify admin login/logout/password change, product/category CRUD, order creation/idempotent retry, stock reservation/cancellation, WhatsApp handoff, image upload/retrieval, unauthorized routes, readiness, restart, and backup restore.
7. Only after all staging checks pass, perform the client-approved cutover and verify HTTPS, domains, logs/alerts, backups, and rollback ownership.

## Operational limits

- Login and public-order throttling use process memory. Render is configured for one instance; do not scale horizontally until a shared rate-limit store is configured. In-memory throttles also reset on process restart.
- `/api/health` is liveness only. Render uses database-aware `/api/ready` for readiness.
- The API and Vercel frontend configure HSTS, no-sniff, frame, referrer, and permissions headers. A restrictive Content-Security-Policy is not set because actual API/image origins still need to be confirmed and tested in staging.
- Production image uploads are deliberately unavailable until durable storage values are configured.
- The bundle is split by route; the latest build has no chunk over 500 KB. Dependency `use client` directive warnings remain.
- Render/Vercel accounts, production variables, domain/DNS, managed database, persistent storage, backup restore, and public deployment have not been verified.
