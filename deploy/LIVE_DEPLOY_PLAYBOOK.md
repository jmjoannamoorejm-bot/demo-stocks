# Live Deploy Playbook

## 1) Data durability now and managed DB migration path

Current runtime uses JSON DB at DB_PATH. For immediate reliability:
- Keep DB_PATH on mounted persistent disk.
- Run backup before each deploy: npm run backup-db

Managed DB migration plan (supported now):
1. Create Postgres on Neon or Supabase.
2. Add DATABASE_URL as secret in host environment.
3. Backup JSON DB: npm run backup-db
4. Migrate JSON snapshot into Postgres: npm run migrate-db
5. Redeploy with DATABASE_URL set.
6. Verify /api/health and create/login/deposit/withdraw flow.
7. Keep JSON backup snapshots for rollback.

## 2) KYC file persistence

KYC uploads now support two modes:
- local persistent disk (default)
- S3-compatible object storage

Environment values:
- KYC_STORAGE_PROVIDER=s3 (or leave empty for local)
- KYC_LOCAL_DIR=/var/data/kyc_docs
- KYC_S3_REGION
- KYC_S3_ENDPOINT (required for R2/MinIO, optional for AWS S3)
- KYC_S3_BUCKET
- KYC_S3_ACCESS_KEY_ID
- KYC_S3_SECRET_ACCESS_KEY

## 3) API rate limiting enabled on sensitive routes

Applied to:
- /api/register
- /api/login
- /api/admin/login
- /api/email-verification/request
- /api/withdrawal-access/request-review
- /api/withdrawals/code/request

## Resend setup (email codes)

1. Create account at https://resend.com.
2. In Resend dashboard, add and verify your sending domain.
3. Create API key with send permissions.
4. Create sender address on verified domain, for example no-reply@yourdomain.com.
5. Set in host environment:
   - RESEND_API_KEY
   - RESEND_FROM_EMAIL
6. Redeploy and test:
   - Register a new user
   - Request email verification code
   - Request withdrawal code after destination details

If RESEND_FROM_EMAIL is not on a verified domain, delivery fails.
