# Backup and Recovery Procedures

This document outlines backup configurations and recovery procedures for the Turbocat backend.

## Table of Contents

1. [Database Backups (Supabase)](#database-backups-supabase)
2. [Manual Backup Procedures](#manual-backup-procedures)
3. [Recovery Procedures](#recovery-procedures)
4. [Backup Verification](#backup-verification)
5. [Disaster Recovery Plan](#disaster-recovery-plan)

---

## Database Backups (Supabase)

Supabase provides automated daily backups for all projects. The backup configuration depends on your plan:

### Supabase Backup Tiers

| Plan | Backup Frequency | Retention | Point-in-Time Recovery |
|------|------------------|-----------|------------------------|
| Free | Daily | 7 days | No |
| Pro | Daily | 7 days | Yes (7 days) |
| Team | Daily | 14 days | Yes (14 days) |
| Enterprise | Configurable | Configurable | Yes |

### Accessing Supabase Backups

1. **Via Dashboard**
   - Navigate to your Supabase project
   - Go to **Settings > Database > Backups**
   - View available backups and restore points

2. **Backup Schedule**
   - Backups run daily at approximately 00:00 UTC
   - Backups include all tables, indexes, and data
   - Schema and RLS policies are included

### Point-in-Time Recovery (Pro+ Plans)

For Pro and higher plans, you can restore to any point in time within the retention window:

1. Go to **Settings > Database > Point in Time Recovery**
2. Select the target date and time
3. Click "Restore"
4. A new database will be provisioned with data from that point

**Note:** Point-in-time recovery creates a new database instance. Update your `DATABASE_URL` after restoration.

---

## Manual Backup Procedures

For additional safety or specific backup needs, you can perform manual backups.

### Using pg_dump (Recommended)

Create a full database dump:

```bash
# Set your database URL
export DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Create backup
pg_dump $DATABASE_URL \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file=backup_$(date +%Y%m%d_%H%M%S).dump

# For larger databases, add compression
pg_dump $DATABASE_URL \
  --format=custom \
  --compress=9 \
  --no-owner \
  --no-privileges \
  --file=backup_$(date +%Y%m%d_%H%M%S).dump
```

### PowerShell Version

```powershell
# Set your database URL
$env:DATABASE_URL = "postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Create backup
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
pg_dump $env:DATABASE_URL `
  --format=custom `
  --no-owner `
  --no-privileges `
  --file="backup_$timestamp.dump"
```

### Schema-Only Backup

For version control of database schema:

```bash
pg_dump $DATABASE_URL \
  --schema-only \
  --no-owner \
  --no-privileges \
  --file=schema_$(date +%Y%m%d).sql
```

### Automated Backup Script

Create a scheduled backup script (`scripts/backup-database.sh`):

```bash
#!/bin/bash
set -e

# Configuration
BACKUP_DIR="/var/backups/turbocat"
RETENTION_DAYS=30
S3_BUCKET="your-backup-bucket"  # Optional: for S3 upload

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/turbocat_$TIMESTAMP.dump"

echo "Creating backup: $BACKUP_FILE"
pg_dump "$DATABASE_URL" \
  --format=custom \
  --compress=9 \
  --no-owner \
  --file="$BACKUP_FILE"

# Upload to S3 (optional)
if [ -n "$S3_BUCKET" ]; then
  aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/database/"
fi

# Clean old backups
find "$BACKUP_DIR" -name "turbocat_*.dump" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $BACKUP_FILE"
```

---

## Recovery Procedures

### Restoring from Supabase Dashboard

1. Go to your Supabase project **Settings > Database > Backups**
2. Find the desired backup date
3. Click "Restore"
4. Wait for restoration (may take several minutes for large databases)
5. Verify the restoration by checking your application

### Restoring from pg_dump Backup

**WARNING:** This will overwrite all existing data!

```bash
# Restore to the same database
pg_restore \
  --dbname=$DATABASE_URL \
  --clean \
  --no-owner \
  --no-privileges \
  backup_file.dump

# Or restore to a new database first (safer)
createdb -h localhost -U postgres turbocat_restored
pg_restore \
  --dbname="postgresql://postgres:password@localhost/turbocat_restored" \
  --no-owner \
  --no-privileges \
  backup_file.dump
```

### Restoring Specific Tables

To restore only specific tables:

```bash
# List contents of backup
pg_restore --list backup_file.dump

# Restore specific table
pg_restore \
  --dbname=$DATABASE_URL \
  --table=users \
  --clean \
  --no-owner \
  backup_file.dump
```

### Post-Restoration Steps

After restoring a backup:

1. **Verify Data Integrity**
   ```bash
   # Check table counts
   psql $DATABASE_URL -c "SELECT 'users' as table, COUNT(*) FROM users UNION ALL SELECT 'agents', COUNT(*) FROM agents;"
   ```

2. **Run Prisma Migrations**
   ```bash
   # Ensure schema is up to date
   npx prisma migrate deploy
   ```

3. **Test Application**
   ```bash
   # Run health check
   ./scripts/health-check.sh
   ```

4. **Verify Authentication**
   - Test user login
   - Verify JWT tokens work

---

## Backup Verification

Regularly verify that backups are valid and can be restored.

### Monthly Verification Checklist

- [ ] Download latest backup from Supabase or S3
- [ ] Restore to a test database
- [ ] Run application against test database
- [ ] Verify data integrity (row counts, sample queries)
- [ ] Document verification results
- [ ] Delete test database

### Automated Verification Script

```bash
#!/bin/bash
# backup-verify.sh

set -e

TEST_DB="turbocat_backup_test"
BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./backup-verify.sh <backup_file>"
  exit 1
fi

echo "Creating test database..."
createdb -h localhost -U postgres "$TEST_DB" || true

echo "Restoring backup..."
pg_restore \
  --dbname="postgresql://postgres:password@localhost/$TEST_DB" \
  --clean \
  --no-owner \
  "$BACKUP_FILE"

echo "Verifying data..."
psql "postgresql://postgres:password@localhost/$TEST_DB" << EOF
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL SELECT 'agents', COUNT(*) FROM agents
UNION ALL SELECT 'workflows', COUNT(*) FROM workflows
UNION ALL SELECT 'executions', COUNT(*) FROM executions;
EOF

echo "Cleaning up..."
dropdb -h localhost -U postgres "$TEST_DB"

echo "Backup verification complete!"
```

---

## Disaster Recovery Plan

### Recovery Time Objectives (RTO)

| Scenario | Target RTO | Procedure |
|----------|------------|-----------|
| Application crash | < 5 min | Auto-restart via platform |
| Database corruption | < 1 hour | Restore from Supabase backup |
| Complete data loss | < 4 hours | Restore from off-site backup |
| Region outage | < 24 hours | Deploy to alternate region |

### Recovery Point Objectives (RPO)

| Data Type | Target RPO | Backup Frequency |
|-----------|------------|------------------|
| User data | < 24 hours | Daily Supabase backup |
| Transaction data | < 1 hour | Enable WAL archiving (Pro+) |
| Configuration | < 1 week | Git version control |

### Disaster Recovery Procedures

#### Scenario 1: Application Server Failure

1. Platform auto-restarts the service
2. If persistent, check deployment logs
3. Rollback to previous version if needed
4. Verify with health checks

#### Scenario 2: Database Connection Issues

1. Check Supabase status page
2. Verify DATABASE_URL is correct
3. Check connection pooling limits
4. Contact Supabase support if needed

#### Scenario 3: Data Corruption

1. Identify affected tables
2. Stop application to prevent further damage
3. Restore from latest known good backup
4. Apply any necessary migrations
5. Verify data integrity
6. Resume application

#### Scenario 4: Complete Infrastructure Loss

1. **Immediate (0-1 hour)**
   - Notify stakeholders
   - Assess extent of damage
   - Begin infrastructure provisioning

2. **Short-term (1-4 hours)**
   - Deploy application to new environment
   - Restore database from off-site backup
   - Update DNS records
   - Verify functionality

3. **Follow-up (24-72 hours)**
   - Conduct post-mortem
   - Update disaster recovery procedures
   - Implement additional safeguards

---

## Backup Storage Recommendations

### For Production

1. **Primary**: Supabase automated backups
2. **Secondary**: Weekly pg_dump to cloud storage (S3, GCS, Azure Blob)
3. **Offsite**: Monthly backup to different cloud provider

### Cloud Storage Options (Cost-Effective)

| Provider | Free Tier | Cost After |
|----------|-----------|------------|
| Cloudflare R2 | 10GB | $0.015/GB/month |
| Backblaze B2 | 10GB | $0.005/GB/month |
| AWS S3 (Glacier) | None | $0.004/GB/month |
| Wasabi | None | $0.0059/GB/month |

### Backup Encryption

Always encrypt backups at rest:

```bash
# Encrypt backup with GPG
pg_dump $DATABASE_URL --format=custom | \
  gpg --symmetric --cipher-algo AES256 > backup_encrypted.dump.gpg

# Decrypt for restoration
gpg --decrypt backup_encrypted.dump.gpg | \
  pg_restore --dbname=$TARGET_DATABASE
```

---

## Contact Information

### Supabase Support

- Dashboard: https://supabase.com/dashboard
- Status: https://status.supabase.com
- Support: support@supabase.com (Pro+ plans)

### Emergency Contacts

Document your team's emergency contacts here:

- Primary On-Call: [Name] - [Phone/Email]
- Secondary On-Call: [Name] - [Phone/Email]
- Database Admin: [Name] - [Phone/Email]

---

## Quick Reference

### Backup Commands

```bash
# Create backup
pg_dump $DATABASE_URL --format=custom --file=backup.dump

# Restore backup
pg_restore --dbname=$DATABASE_URL --clean backup.dump

# Check migration status
npx prisma migrate status

# Run health check
./scripts/health-check.sh
```

### Important URLs

- Supabase Dashboard: https://supabase.com/dashboard
- Supabase Status: https://status.supabase.com
- Backup Storage: [Your S3/GCS bucket URL]
