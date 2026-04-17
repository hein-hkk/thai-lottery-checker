# Production Security Runbook

Use this checklist before exposing the API publicly.

## Secrets and bootstrap access

- Store `DATABASE_URL`, `ADMIN_SESSION_SECRET`, bootstrap admin credentials, and any `BLOG_BANNER_STORAGE_*` keys in a real secret manager.
- If you enable email delivery, store `RESEND_API_KEY` and the sender/reply-to addresses in the same secret manager.
- Do not deploy with the `.env.example` defaults. The API now fails startup in production if the admin secret, bootstrap password, or bootstrap email still use development defaults.
- Sign in with the bootstrap super admin once, rotate the password immediately, and treat that account as break-glass access only.

## Network and proxy

- Terminate TLS at the reverse proxy or load balancer and serve the app over HTTPS only.
- Set `APP_URL` and/or `NEXT_PUBLIC_APP_URL` to the exact deployed HTTPS origin.
- Set `API_TRUST_PROXY` to match the production proxy chain so request IPs and secure-cookie behavior reflect the real client.
- Keep the admin UI on the same trusted origin set used by the API, because admin write routes reject untrusted `Origin` headers.

## Session and abuse controls

- Set `ADMIN_SESSION_TTL_HOURS` to a value appropriate for your admin team and risk tolerance.
- Review the login, invitation, password-reset, and admin-write rate-limit env values before launch.
- Review the public-read and checker-check rate-limit env values before launch so public traffic and abuse resistance are balanced for your deployment.
- Expect logout and password reset to revoke active sessions server-side; verify that behavior in staging before go-live.
- For production invitation/reset flows, prefer `EMAIL_PROVIDER=resend` and verify that the sender domain is configured before launch.

## Email delivery

- Set `APP_URL` to the real HTTPS web origin used in invitation and password-reset links.
- Configure `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_NAME`, and optional `EMAIL_REPLY_TO_ADDRESS`.
- Verify the sender domain in Resend and publish the required DNS records:
  - SPF
  - DKIM
  - DMARC recommended
- Send a real invitation and password-reset email from staging before production cutover.
- Monitor delivery failures in application logs. Invitation send failures now reject the invite request; password-reset send failures keep the generic success response but do not leave a live reset token behind.

## Database and storage

- Use a least-privileged PostgreSQL user for the application.
- Require TLS for managed PostgreSQL and object storage when the platform supports it.
- Enable automated backups and verify restores on a fresh environment.
- Restrict object-storage bucket policy and CORS to the deployed admin/web origin only.

## Monitoring and response

- Collect API logs with request IDs so security events can be traced across the proxy and application.
- Redact or suppress query strings in proxy, CDN, APM, and access logs for token-bearing routes such as `/admin/invitations/accept` and `/admin/reset-password/confirm`.
- Alert on repeated login failures, repeated password-reset traffic, repeated invitation-accept failures, and unusual bursts of admin writes.
- Keep a rollback and secret-rotation procedure ready before each release.

## Release verification

- Run `pnpm typecheck`
- Run `pnpm test`
- Run `pnpm test:security`
- Run `pnpm audit --prod`
- Apply migrations on a fresh database and verify the app boots cleanly
