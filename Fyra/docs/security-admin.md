# Admin API security

- **JWT:** On login, admin users receive an `adminToken` (JWT) signed with `JWT_SECRET`. All `/api/admin/*` routes require `Authorization: Bearer <token>`.
- **Verification:** Each admin handler calls `requireAdmin`, which verifies the JWT and reloads the user from the database to ensure `isAdmin` is still true.
- **Environment:** Set `JWT_SECRET` to a long random string in production. The fallback in code is for development only.
- **Rotation:** Change `JWT_SECRET` to invalidate all admin tokens (users must log in again).
